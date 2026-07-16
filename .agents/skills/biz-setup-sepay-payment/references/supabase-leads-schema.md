# Supabase Leads Schema — Rationale + Design Decisions

DDL file: [`../templates/supabase-migration.sql`](../templates/supabase-migration.sql)

## Tables (4)

### `leads` — primary record

| Column | Type | Notes |
|---|---|---|
| `order_id` | TEXT PRIMARY KEY | Format `DH000123` (6-digit zero-padded). Short, dễ dán nội dung CK |
| `name` | TEXT NOT NULL | Tên khách |
| `phone` | TEXT NOT NULL | VN format `0901234567` (validated qua API checkout) |
| `email` | TEXT NOT NULL | Lowercased khi save |
| `product_name` | TEXT NOT NULL | Tên sản phẩm/khoá học |
| `amount` | BIGINT NOT NULL | VND integer (vd 499000 — KHÔNG store decimal) |
| `status` | TEXT | `pending` / `paid` / `expired`. CHECK constraint enforce |
| `created_at` | TIMESTAMPTZ | Auto `NOW()` |
| `paid_at` | TIMESTAMPTZ NULL | Set khi webhook process xong |
| `payment_record` | JSONB NULL | Sepay payload subset (sepay_id, reference_code, gateway, amount, transaction_date, match_method) |
| `expire_at` | TIMESTAMPTZ NOT NULL | TTL target. pg_cron daily job xóa rows `WHERE expire_at < NOW()` |

**Indexes:**
- `leads_phone_idx` (phone) — lookup fallback
- `leads_status_idx` (status) — admin filter
- `leads_expire_at_idx` (expire_at) — cron cleanup efficient
- `leads_amount_status_idx` (amount, status) WHERE status = 'pending' — Strategy 3 lookup

### `phone_index` — secondary lookup

| Column | Type | Notes |
|---|---|---|
| `phone` | TEXT PRIMARY KEY | VN format |
| `order_id` | TEXT FK ON DELETE CASCADE | Tham chiếu leads.order_id. Auto-cleanup khi parent lead bị TTL delete |
| `created_at` | TIMESTAMPTZ | Audit |

**Tại sao tách bảng?**
- KV pattern dùng key `phone:0901234567 → DH000123` — đơn giản
- Postgres làm tương tự nhưng dùng bảng riêng để CASCADE delete khi lead expire
- Alternative: index `leads(phone)` cũng work — nhưng phone_index cho phép upsert independently (override khi same phone tạo lead lần 2)

### `order_counter` — atomic ID generator

| Column | Type | Notes |
|---|---|---|
| `id` | SMALLINT PRIMARY KEY DEFAULT 1 | Singleton check (CHECK id = 1) |
| `current_value` | BIGINT NOT NULL DEFAULT 0 | Increment qua function `next_order_id()` |

`next_order_id()` function dùng `UPDATE ... RETURNING` — atomic trong Postgres (1 transaction, không lock table).

### `webhook_dedup` — chống Sepay retry duplicate

| Column | Type | Notes |
|---|---|---|
| `sepay_id` | TEXT PRIMARY KEY | Sepay payload.id (number cast to TEXT) |
| `processed_at` | TIMESTAMPTZ | Khi webhook đầu tiên xử lý |
| `expire_at` | TIMESTAMPTZ DEFAULT NOW() + 7d | TTL — Sepay retry tối đa 7 ngày |

**Tại sao TTL 7 ngày?** Sepay retry với Fibonacci backoff tối đa ~7 ngày sau initial. Sau đó không retry → dedup record không còn cần.

---

## TTL strategy

| Record type | TTL | Reason |
|---|---|---|
| Pending lead (chưa pay) | 7 ngày | Khách chưa quyết trong 7 ngày → coi như churn, giải phóng order_id |
| Paid lead | 90 ngày | Audit log + dispute resolution window (Sepay refund window ~30 ngày) |
| webhook_dedup | 7 ngày | Sepay retry window |
| phone_index | Khớp với leads (CASCADE) | Auto-cleanup |

**Cleanup mechanism:** pg_cron job daily 03:00 UTC (10:00 VN):

```sql
DELETE FROM leads          WHERE expire_at < NOW();
DELETE FROM webhook_dedup  WHERE expire_at < NOW();
```

pg_cron available trên Supabase Free từ ~2024-06. Verify qua `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`

Nếu pg_cron không available (edge case): fallback dùng Edge Function + Cron Hooks (cũng free, complex hơn 1 chút).

---

## Row-Level Security (RLS)

ALL 4 tables có `ENABLE ROW LEVEL SECURITY` nhưng KHÔNG có policy nào → default DENY ALL từ:
- `anon` clients (Supabase JS SDK với anon key — typical client side)
- `authenticated` clients (logged-in user qua Supabase Auth)

`service_role` JWT **bypass RLS** → backend server đọc/ghi bình thường.

**Hệ quả an toàn:**
- Ai đó tìm thấy `SUPABASE_URL` + `anon_key` của project (publicly visible in JS bundle nếu user dùng client-side queries) → KHÔNG đọc được lead data
- Chỉ server code chạy với `SUPABASE_SERVICE_ROLE_KEY` mới truy cập được

**Anti-pattern**:
- ❌ Dùng anon key trong server code → mọi query fail (RLS DENY)
- ❌ Add public policy `allow select for anon` → leak khách hàng

---

## Postgres vs KV trade-offs cho use case này

| Op | Vercel KV | Supabase Postgres | Winner |
|---|---|---|---|
| `getLeadByOrderId` | 1 GET | 1 SELECT pk | TIE (~5ms) |
| `getLeadByPhone` | 2 GETs (phone → id → lead) | 1 SELECT (qua FK + index) | Postgres |
| `findPendingLeadByAmount` (Strategy 3) | Loop SMEMBERS over time buckets, then MGET | 1 SELECT với composite index | Postgres |
| `listLeads` (admin all) | SCAN 'lead:DH*' + MGET batched | 1 SELECT ORDER BY | Postgres |
| `listLeads` (filter + search) | Fetch all + in-memory filter | SELECT WHERE + ILIKE | Postgres (server-side filter) |
| Stats `COUNT(status = 'paid')` | Fetch all + count | 1 SELECT COUNT GROUP BY | Postgres |
| `createLead` (atomic ID + insert) | INCR + SET + SADD = 3 ops | RPC `next_order_id()` + INSERT = 2 ops | TIE |
| `markLeadPaid` (update status + ttl) | SET với new ex | UPDATE single column | TIE |

**Phù hợp Postgres khi:**
- Admin dashboard cần filter/sort phức tạp (Postgres SQL > in-memory JS filter)
- Volume > 500 đơn (KV SCAN chậm dần với key count tăng)
- Cần audit query `WHERE created_at BETWEEN ... AND status = 'paid'` (KV không support)

---

## Migration sequence (idempotent)

File `supabase-migration.sql` chia 6 phần:
1. EXTENSIONS — `CREATE EXTENSION IF NOT EXISTS pg_cron;`
2. TABLES — 4 bảng + indexes + constraints với `IF NOT EXISTS`
3. FUNCTIONS — `next_order_id()` với `CREATE OR REPLACE`
4. RLS — `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (idempotent)
5. pg_cron — `UNSCHEDULE` cũ (nếu có) rồi `SCHEDULE` mới
6. VERIFY — query count + cron.job + `next_order_id()` test

User chạy lại migration KHÔNG corrupt data. Phù hợp cho khi update schema sau.

---

## Future migrations

Nếu sau cần thêm field (vd `referral_source`, `utm_campaign`):

```sql
-- Append vào cuối supabase-migration.sql, increment version
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referral_source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
```

Update `LeadRow` type trong `lib-leads-supabase.ts` để map field mới.

Down-migration: nếu cần rollback, dùng `ALTER TABLE leads DROP COLUMN IF EXISTS referral_source;` — Postgres hỗ trợ idempotent drop.
