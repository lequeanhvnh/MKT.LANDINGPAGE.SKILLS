# Module 12 — Deploy lên Vercel + Cấu hình & Secrets

**Mục tiêu:** Đưa Next.js app (web + toàn bộ API routes) lên production trên Vercel, cấu hình env, region, cron, custom domain. Tập trung mọi thông tin kết nối tại một chỗ.

**Phụ thuộc:** Module 01–09 (code), Module 10 (hardening). Có thể scaffold/deploy bằng skill `/biz-deploy-vercel`.

## 1. Thông tin do USER cung cấp (điền trước khi deploy)

> Anh điền các giá trị này; em wire vào env. **Không commit** các giá trị thật vào git.

### Supabase (anh cung cấp)
| Biến | Mô tả | Giá trị |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase | _(chờ anh)_ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/publishable key (client) | _(chờ anh)_ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (chỉ server route) | _(chờ anh)_ |
| Region | Region project (nên Singapore để gần VN) | _(chờ anh)_ |
| Tier | Free / **Pro** (khuyến nghị Pro cho telemetry) | _(chờ anh)_ |

### Email server (anh cung cấp)
| Biến | Mô tả | Giá trị |
|---|---|---|
| Provider | Resend / Brevo / SendGrid / SMTP custom | _(chờ anh)_ |
| `RESEND_API_KEY` *hoặc* `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` | Khóa/SMTP gửi mail | _(chờ anh)_ |
| `MAIL_FROM` | Tên + email người gửi (vd `License <no-reply@domain>`) | _(chờ anh)_ |
| Domain đã verify SPF/DKIM | Để email vào inbox | _(chờ anh)_ |
| SMTP cho Supabase Auth | Cấu hình Custom SMTP trong Supabase Dashboard (confirm + recover) | _(chờ anh)_ |

### Thanh toán Sepay (anh cung cấp khi tới Module 03)
`SEPAY_WEBHOOK_SECRET`, `SEPAY_BANK_ACCOUNT`, `SEPAY_BANK_CODE`.

## 2. Secrets do hệ thống tự sinh

| Biến | Mô tả |
|---|---|
| `ED25519_PRIVATE_KEY` | Private key ký entitlement token (server route) |
| `ED25519_PUBLIC_KEY_ID` | kid; public key tương ứng nhúng trong add-in |
| `CRON_SECRET` | Bảo vệ route cron mailer (Supabase Cron gửi kèm header) |

## 3. Các bước deploy

- [ ] Tạo project Vercel, import repo Next.js.
- [ ] **Đặt region** = region Supabase (vd `sin1` Singapore) trong Project Settings → Functions.
- [ ] Nhập toàn bộ env (mục 1 + 2) vào Vercel → Environment Variables (Production + Preview).
- [ ] Khai lịch cron bằng **Supabase Cron** (Dashboard → Integrations → Cron, hoặc `cron.schedule`): 3 job SQL + 1 job HTTP gọi `/api/cron/expiry-mailer` kèm header `CRON_SECRET` (01:00 UTC ≈ 08:00 VN). Chi tiết module 09.
  *(Phương án thay thế — Vercel Cron trong `vercel.json`:* `{ "crons": [{ "path": "/api/cron/expiry-mailer", "schedule": "0 1 * * *" }] }`*)*
- [ ] `vercel --prod` (hoặc auto-deploy khi push `main`).
- [ ] Gắn **custom domain** (vd `app.tencuaanh.com`) + HTTPS.
- [ ] Cập nhật **webhook URL Sepay** trỏ về `https://<domain>/api/sepay-webhook`.
- [ ] Cập nhật **endpoint base URL** trong add-in Revit = domain production.
- [ ] Cấu hình **Custom SMTP** trong Supabase Auth (dùng thông tin email server) + sửa template VN.

## 4. Checklist sau deploy (smoke test production)

- [ ] `/api/activate`, `/api/issue-trial`, `/api/telemetry` trả đúng (test bằng token thật).
- [ ] Webhook Sepay test 1 đơn → sub active + email xác nhận tới inbox.
- [ ] Supabase Cron chạy thử → email nhắc hạn gửi đúng, không trùng (kiểm tra `net._http_response`).
- [ ] Add-in trỏ domain production → đăng nhập → activate → CanRun OK.
- [ ] Region latency: thời gian phản hồi API < ~300ms từ VN.
- [ ] Không có secret nào lộ trong client bundle (`NEXT_PUBLIC_` chỉ chứa URL + anon key).

## 5. Vận hành & chi phí dự kiến

- Vercel **Pro ~$20/tháng** (function invocations + cron dày + region).
- Supabase **Pro ~$25/tháng** (8GB cho telemetry).
- Email provider theo lượng gửi (Resend free 3k/tháng, trả phí khi campaign lớn).
- Theo dõi: Vercel Analytics/Logs + Supabase `get_advisors` định kỳ.
