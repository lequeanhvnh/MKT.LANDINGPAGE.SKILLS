# Supabase Free setup — 6 bước cho user

Tổng thời gian: ~5-7 phút (gồm chờ project provision ~2 phút).

---

## Tại sao Supabase?

| Tiêu chí | Vercel KV (Upstash) | **Supabase Free (Postgres)** |
|---|---|---|
| Storage | 256MB | 500MB DB + 1GB files |
| Read/Write quota | 30K commands/tháng | Unlimited DB queries (≤ 5GB egress/tháng) |
| SQL queries | ❌ Key-value only | ✅ Postgres (joins, group-by, filter mạnh) |
| Admin UI có sẵn | ❌ | ✅ Supabase Studio |
| Native TTL | ✅ Per-key `ex:` | ⚠️ Qua pg_cron job daily (đã wire trong migration) |
| Project pause | ❌ | ⚠️ Sau 7 ngày silence — fix bằng Vercel Cron ping |
| Free tier ổn định | Stable | Stable từ 2022 đến nay (3+ năm) |
| Phù hợp landing page | < 500 đơn/tháng | < 2000 đơn/tháng |

Khuyến nghị Supabase khi:
- Lưu lượng kỳ vọng > 300 đơn/tháng
- Cần admin dashboard query nâng cao (filter theo nhiều field, group by ngày, search full-text)
- Đã/sẽ dùng Supabase cho project khác (consolidation)

---

## Bước 1 — Đăng ký Supabase account

1. Truy cập <https://supabase.com>
2. Click **Start your project**
3. Login với GitHub (recommended — 1-click) hoặc email/password
4. KHÔNG cần thẻ tín dụng

---

## Bước 2 — Tạo Project mới

Trong dashboard:

1. Click **New project**
2. Điền form:
   - **Organization**: chọn org (mặc định = personal)
   - **Name**: `sepay-leads-<brand>` (ví dụ `sepay-leads-caoxala`)
   - **Database Password**: bấm nút **Generate a password** → Supabase tạo random strong password. Copy + lưu trong password manager (sẽ KHÔNG cần dùng cho code, chỉ cần khi truy cập trực tiếp Postgres qua psql)
   - **Region**: ⚠️ **Southeast Asia (Singapore) — `ap-southeast-1`** (BẮT BUỘC — default `us-east-1` latency từ VN > 250ms)
   - **Pricing Plan**: **Free**
3. Click **Create new project**
4. Đợi ~2 phút Supabase provision project. Progress bar hiển thị real-time.

---

## Bước 3 — Chạy migration SQL

Đây là bước tạo bảng + index + RLS + pg_cron job cleanup.

1. Sidebar trái → **SQL Editor** (icon `<>`)
2. Click **New query** (góc trên phải)
3. Mở file `templates/supabase-migration.sql` (skill scaffold)
4. Copy TOÀN BỘ nội dung → paste vào SQL Editor
5. Click **Run** (Ctrl/Cmd + Enter)
6. Expect kết quả:
   ```
   Success. No rows returned
   ```
   Phía dưới có table verify 4 dòng:
   ```
   leads          | 0
   phone_index    | 0
   order_counter  | 1
   webhook_dedup  | 0
   ```
   Và 1 row pg_cron job, và `next_order_id()` trả "DH000001".

7. ⚠️ **Cleanup test row**: nếu `next_order_id()` đã chạy lúc verify, counter đã +1. Reset về 0:
   ```sql
   UPDATE order_counter SET current_value = 0 WHERE id = 1;
   DELETE FROM leads WHERE order_id = 'DH000001';
   ```
   Click **Run** lần nữa.

8. Verify pg_cron job đã active:
   ```sql
   SELECT jobname, schedule, active FROM cron.job;
   ```
   Expect:
   ```
   cleanup-expired-leads | 0 3 * * * | true
   ```

---

## Bước 4 — Lấy API credentials

1. Sidebar → **Project Settings** (icon ⚙️ góc trái dưới)
2. Click tab **API**
3. Copy 2 thứ:
   - **Project URL** (vùng "Project URL", dạng `https://xxxxx.supabase.co`)
   - **`service_role` secret** (vùng "Project API keys" → tab `service_role`)
     - ⚠️ KHÔNG copy `anon` key
     - ⚠️ `service_role` = god mode bypass RLS. KHÔNG bao giờ commit lên Git, không dùng trong client component, chỉ server backend.
     - Key dài ~250 chars, bắt đầu `eyJhbGciOiJIUzI1NiIs...`

---

## Bước 5 — Paste env vars

Skill sẽ tự append vào `.env.local`:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

Skill auto-verify khi anh/chị paste:
- URL match regex `^https://[a-z0-9]+\.supabase\.co$`
- Service role key decode JWT, check claim `role: "service_role"` (KHÔNG phải `anon`)

Nếu paste nhầm anon key → skill báo lỗi và xin paste lại.

---

## Bước 6 — Add vào Vercel production env

Sau khi test local OK, paste vào Vercel để production cũng dùng:

```bash
vercel env add SUPABASE_URL production
# Paste URL, save

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste service_role key, save
```

Hoặc qua Vercel dashboard:
1. Project Settings → Environment Variables
2. Add 2 vars trên cho `Production` + `Preview` (nếu test branch deploy)

Redeploy: `vercel --prod`.

---

## Verify connection (test local)

Sau khi env vars có sẵn trong `.env.local`, skill chạy test:

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('order_counter').select('current_value').eq('id', 1).single().then(r => {
  if (r.error) { console.error('FAIL:', r.error.message); process.exit(1); }
  console.log('Supabase OK. current_value =', r.data.current_value);
});
"
```

Expect: `Supabase OK. current_value = 0`.

---

## Vercel Cron ping setup (chống pause 7-day)

Supabase Free tự động pause project sau 7 ngày KHÔNG có query nào. Resume = next request đến, lag ~30s.

Workaround: Vercel Cron ping `/api/health` mỗi 6 ngày.

Skill auto add vào root `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/health", "schedule": "0 3 */6 * *" }
  ]
}
```

⚠️ **Vercel Cron Hobby plan giới hạn 2 cron/tháng**. Pattern `*/6 days` chạy ~5 lần/tháng → VƯỢT quota Hobby. 3 lựa chọn:

1. **Vercel Pro** ($20/tháng) — unlimited cron. Trade-off: tốn $20.
2. **GitHub Actions workflow** chạy daily ping qua `curl` — **FREE**, recommend nếu anh/chị stay Hobby.
3. **cron-job.org** miễn phí cron-as-a-service — đăng ký, add URL `/api/health`, lịch every 6 days. **FREE** + UI dễ hơn.

Skill mặc định scaffold theo option 2 (GitHub Actions) nếu detect repo trên GitHub. Otherwise printout hướng dẫn option 3 manual.

GitHub Actions workflow file `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Supabase Alive
on:
  schedule:
    - cron: '0 3 */6 * *'
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping health endpoint
        run: curl -fsSL "https://yourdomain.vn/api/health" | jq .
```

User chỉ cần replace `yourdomain.vn` thật + commit.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Error: Invalid API key` | Paste anon key thay vì service_role | Vào Settings → API → tab "Project API keys" → copy đúng `service_role` |
| `Error: relation "leads" does not exist` | Chưa chạy migration SQL | Chạy lại Phase 3 — SQL Editor → paste migration → Run |
| `Error: permission denied for table leads` | Dùng anon key + RLS enabled | Switch sang service_role (server only) |
| Query chậm 250ms+ | Region us-east default | KHÔNG fix được sau khi tạo. Phải tạo project mới với region `ap-southeast-1`. |
| `pg_cron` extension missing | Project tạo trước tháng 6/2024 hoặc rare edge case | SQL: `CREATE EXTENSION IF NOT EXISTS pg_cron;` (cần admin role) |
| `next_order_id()` race condition | 2 requests đồng thời | KHÔNG xảy ra — `UPDATE ... RETURNING` là atomic trong Postgres |
| Project paused sau 7 ngày | Free tier inactive | Open Supabase dashboard → restart project. Setup cron ping để tránh lần sau. |
| Cron `cleanup-expired-leads` không chạy | pg_cron service mới enable, đợi 24h activation | Verify `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;` |

---

## Tham khảo thêm

- Schema chi tiết: [`supabase-leads-schema.md`](supabase-leads-schema.md)
- Migration SQL: [`../templates/supabase-migration.sql`](../templates/supabase-migration.sql)
- Supabase docs: <https://supabase.com/docs>
- pg_cron docs: <https://github.com/citusdata/pg_cron>
