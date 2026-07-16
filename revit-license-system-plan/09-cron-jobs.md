# Module 09 — Cron Jobs (Hết hạn + Mailer + Rollup)

**Mục tiêu:** Tác vụ định kỳ: đánh dấu sub hết hạn, gửi email nhắc gia hạn, refresh rollup thống kê, dọn dữ liệu cũ.

**Phụ thuộc:** Module 01 (pg_cron, mv_tool_daily), Module 07 (mailer).

**Cơ chế:** Dùng **Supabase Cron** (UI wrapper của `pg_cron` + `pg_net`) cho **TẤT CẢ** lịch — gom một chỗ, có UI + log, không vướng giới hạn cron Vercel Hobby.
- Job SQL (expire/rollup/cleanup): Supabase Cron chạy SQL trực tiếp trong DB.
- Job mailer: Supabase Cron gọi **HTTP POST** (qua `pg_net`) tới route Next.js trên Vercel, kèm header `CRON_SECRET`.
- *(Phương án thay thế: Vercel Cron khai trong `vercel.json` để trigger mailer — chọn 1 trong 2.)*

**Deliverables:**
- Supabase Cron jobs: `daily_expire`, `daily_rollup`, `daily_cleanup` (SQL) + `expiry_mailer` (HTTP).
- Next.js route `app/api/cron/expiry-mailer/route.ts` (logic render + gửi mail).

## Jobs

| Job | Cơ chế (Supabase Cron) | Lịch | Việc |
|---|---|---|---|
| `daily_expire` | SQL | 00:10 | `UPDATE subscriptions SET status='expired' WHERE current_period_end<now() AND status='active'` |
| `expiry_mailer` | HTTP (`pg_net`) → API | 08:00 | POST `/api/cron/expiry-mailer` → gửi email nhắc sub hết hạn 7/3/1 ngày |
| `daily_rollup` | SQL | 00:20 | `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tool_daily` |
| `daily_cleanup` | SQL | 03:00 | Xoá usage_events>180d (hoặc drop partition), check_logs>90d, orders pending>7d |

> **Job mailer (HTTP):** Supabase Cron gọi `net.http_post('https://<domain>/api/cron/expiry-mailer', headers => '{"Authorization":"Bearer <CRON_SECRET>"}')`. Route Next.js verify `CRON_SECRET` rồi mới chạy. Lịch khai bằng cron expr (UTC) — `0 1 * * *` ≈ 08:00 VN.

## expiry-mailer (chi tiết)

```
1. Verify CRON_SECRET (chỉ Supabase Cron gọi được).
2. Cho mỗi mốc D ∈ {7,3,1}:
     SELECT user_id, email, product_code, current_period_end
     FROM subscriptions JOIN profiles
     WHERE status='active' AND current_period_end::date = (now()+ D days)::date
3. Dedupe: bỏ qua nếu email_logs đã có (type='expiry', cùng user+product+mốc).
4. Render expiry-reminder (gói, ngày hết hạn, renew_url) → gửi → log email_logs.
```

## Lưu ý kỹ thuật

- **Supabase Cron** cần bật extension `pg_cron` + `pg_net` (Supabase bật sẵn). Quản lý job trong Dashboard → Integrations → Cron, hoặc bằng SQL `cron.schedule(...)`.
- `pg_net` là async fire-and-forget; kiểm tra kết quả HTTP ở bảng `net._http_response` để debug.
- Route mailer phải nhanh; nếu danh sách lớn, xử lý theo batch / chia trang để không quá timeout function.
- Idempotent: chạy 2 lần/ngày không gửi trùng (nhờ dedupe `email_logs`).
- *(Nếu chọn Vercel Cron thay thế:* khai `crons` trong `vercel.json`, lưu ý Hobby giới hạn 1 lần/ngày.*)*

## Acceptance criteria

- [ ] Sub đặt hết hạn sau 7 ngày → sáng hôm chạy nhận đúng 1 email nhắc.
- [ ] Chạy mailer 2 lần cùng ngày → không gửi trùng.
- [ ] Sub quá hạn → status chuyển 'expired' → token refresh loại bộ môn đó.
- [ ] `mv_tool_daily` cập nhật sau rollup.
- [ ] Dữ liệu telemetry cũ > 180 ngày bị dọn.
