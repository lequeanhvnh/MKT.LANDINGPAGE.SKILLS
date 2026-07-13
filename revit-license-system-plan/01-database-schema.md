# Module 01 — Database Schema + RLS + pg_cron

**Mục tiêu:** Toàn bộ lược đồ Postgres trên Supabase làm nền cho mọi module. Deny-by-default RLS, index cho query nóng, pg_cron cho TTL/rollup.

**Phụ thuộc:** không. Là module nền — build trước tiên.

**Deliverables (migration files, dùng `apply_migration`):**
- `0001_core.sql` — products, plans, plan_products, profiles
- `0002_subscriptions.sql` — subscriptions, device_activations, trials
- `0003_orders.sql` — orders, payments, revoked_devices
- `0004_telemetry.sql` — usage_events, mv_tool_daily
- `0005_email.sql` — email_campaigns, email_logs, email_unsubscribes
- `0006_registry.sql` — command_registry, check_logs (audit)
- `0007_rls.sql` — bật RLS + policy cho tất cả bảng
- `0008_cron.sql` — pg_cron jobs + materialized view refresh

## Task checklist

- [ ] Bật extension: `pgcrypto`, `pg_cron`, `pg_net` (cho Supabase Cron gọi HTTP mailer).
- [ ] Tạo `profiles` trigger từ `auth.users` (on signup → insert profile).
- [ ] Tạo các bảng theo schema bên dưới + index.
- [ ] Seed `products` (ARC/STR/MEP) + `plans` (ARC_M 200k, ARC_Y 2tr, STR_*, MEP_*, COMBO_Y) + `plan_products`.
- [ ] Viết RLS policy (mục RLS bên dưới).
- [ ] Tạo materialized view `mv_tool_daily` + hàm refresh.
- [ ] Đăng ký pg_cron: expire subscriptions, refresh rollup, dọn dữ liệu cũ.
- [ ] Chạy `get_advisors` kiểm tra security/performance sau migration.

## Schema (tóm tắt — chi tiết cột xem doc gốc mục 3 & 10.1 & 11.1)

Bảng: `profiles, products, plans, plan_products, subscriptions, device_activations, trials, orders, payments, revoked_devices, command_registry, check_logs, usage_events, mv_tool_daily, email_campaigns, email_logs, email_unsubscribes`.

**Khóa nghiệp vụ cần nhớ:**
- `subscriptions`: 1 dòng / (user, product_code). Combo = 3 dòng. Quyền = `status='active' AND current_period_end > now()`.
- `trials`: unique theo `user_id`, có `device_fingerprint` để chặn lạm dụng.
- `device_activations`: unique `(user_id, device_id)`, `max_devices` enforce ở API route.
- `orders.id` = `DH######`; webhook idempotent theo `order_id`.
- `usage_events`: insert-only, RLS chỉ cho user ghi `user_id = auth.uid()`.

## RLS (deny-by-default)

| Bảng | SELECT | INSERT/UPDATE/DELETE |
|---|---|---|
| profiles | owner (`id = auth.uid()`) | owner update; insert qua trigger |
| products / plans / plan_products | public read (catalog) | service role only |
| subscriptions | owner read | service role only (Edge ghi) |
| device_activations | owner read | owner insert/update của mình; service role full |
| trials | owner read | service role only |
| orders / payments | owner read | service role only |
| usage_events | owner read | owner INSERT (`user_id=auth.uid()`); KHÔNG update/delete |
| email_* | admin only | service role only |
| command_registry | public read | service role only |
| check_logs / revoked_devices | service/admin only | service role only |

> Admin xác định qua bảng `admin_users` (allowlist) — tái dùng pattern skill `/biz-admin-google-auth`.

## Cron jobs (Supabase Cron = pg_cron + pg_net — chi tiết module 09)

- `daily_expire` (SQL): `UPDATE subscriptions SET status='expired' WHERE current_period_end < now() AND status='active'` — 00:10.
- `daily_rollup` (SQL): `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tool_daily` — 00:20.
- `daily_cleanup` (SQL): xoá `usage_events` > 180 ngày, `check_logs` > 90 ngày, `orders` pending > 7 ngày.
- `expiry_mailer` (HTTP qua `pg_net`): gọi route Next.js gửi email nhắc hạn — KHÔNG render mail trong SQL.

## Lưu ý kết nối từ Next.js/Vercel (serverless)

- Truy cập DB qua **`@supabase/supabase-js` (PostgREST)** — không giữ kết nối → an toàn cho serverless.
- Nếu cần SQL trực tiếp (vd `pg`/Prisma): dùng **connection string pooler port 6543 (Supavisor transaction mode)**, KHÔNG dùng port 5432 trực tiếp (sẽ cạn connection khi nhiều function instance).
- Đặt region Supabase = region Vercel (vd Singapore).

## Data contract cho module khác

- Hàm SQL `get_active_disciplines(uid)` → `text[]` các product_code active (Edge `activate` dùng).
- Hàm `is_admin(email)` SECURITY DEFINER → bool.

## Acceptance criteria

- [ ] `list_tables` thấy đủ bảng; `get_advisors` không còn cảnh báo "RLS disabled" / "exposed".
- [ ] Insert thử usage_event bằng anon token người khác → bị từ chối.
- [ ] `get_active_disciplines` trả đúng với sub trial + sub paid.
- [ ] pg_cron jobs xuất hiện trong `cron.job`.
