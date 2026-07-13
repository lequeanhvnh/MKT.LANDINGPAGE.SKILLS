# Module 07 — Email Engine (4 loại)

**Mục tiêu:** (A) email auth do Supabase tự gửi; (B) email nghiệp vụ + marketing do API route (Next.js) gửi qua provider.

**Phụ thuộc:** Module 01 (email tables), Module 03 (webhook → email mua), Module 09 (cron mailer).

**Deliverables (Next.js API routes — tái dùng skill `/biz-email-setup` cho nodemailer/Resend & `/biz-admin-leads-dashboard` cho tab campaign):**
```
lib/
  mailer.ts                // wrapper Resend/Brevo/nodemailer + render template
app/api/
  send-campaign/route.ts   // runtime='nodejs'
  unsubscribe/route.ts
templates/email/           // HTML template tiếng Việt
  purchase-confirm.html
  expiry-reminder.html
  campaign-base.html
```
Auth templates: cấu hình trong Supabase Dashboard (không phải file repo).

## Phân loại (xem doc gốc mục 11)

| Loại | Nhóm | Nguồn |
|---|---|---|
| Xác nhận đăng ký | A | Supabase Auth `/signup` |
| Reset mật khẩu | A | Supabase Auth `/recover` |
| Xác nhận mua thành công | B | `app/api/sepay-webhook` (module 03) |
| Nhắc license sắp hết hạn | B | Supabase Cron (HTTP) → `app/api/cron/expiry-mailer` (module 09) |
| Campaign khuyến mãi | B | admin `app/api/send-campaign` |

## Setup (việc của user)

- [ ] Chọn provider: **Resend** (khuyến nghị) / Brevo / SendGrid SMTP.
- [ ] Verify domain (SPF + DKIM) để vào inbox.
- [ ] Supabase Auth → Email → **Custom SMTP** + sửa template VN (confirm + recover).
- [ ] Vercel env: `RESEND_API_KEY`, `MAIL_FROM` (vd `License <no-reply@domain>`).

## Task checklist

### mailer.ts
- [ ] `sendEmail({to, subject, html})` → gọi provider, trả {ok, error}.
- [ ] `renderTemplate(name, vars)` chèn `{{name}}`, `{{plan}}`, `{{expires_at}}`, `{{renew_url}}`, `{{unsubscribe_url}}`.
- [ ] Mọi gửi → INSERT `email_logs (type, to_email, status, error)`.

### Email mua thành công (trong webhook)
- [ ] Sau khi renew → render `purchase-confirm` (tên KH, gói, hạn dùng, hướng dẫn cài) → gửi → log.

### Email nhắc hết hạn (cron — chi tiết module 09)
- [ ] Tìm sub active hết hạn trong 7/3/1 ngày, dedupe theo `email_logs` cùng mốc → gửi `expiry-reminder` + link gia hạn.

### send-campaign
- [ ] Auth admin. Nhận `{ campaign_id }`.
- [ ] Lấy audience theo segment (`all/trial/paid/expired/expiring_7d`) − loại `email_unsubscribes`.
- [ ] Gửi theo batch (rate-limit provider), chèn `{{name}}` + link unsubscribe, log từng recipient.
- [ ] Cập nhật `email_campaigns.status='sent'`, trả thống kê gửi/ thất bại.

### unsubscribe
- [ ] Public, nhận token (HMAC email) → INSERT `email_unsubscribes` → trang xác nhận.

## Quy tắc

- Email marketing **bắt buộc** có unsubscribe; transactional (mua/nhắc hạn/auth) **không** cần.
- Template responsive, charm pricing VND, xưng anh/chị, không emoji-spam.
- Tái dùng được pattern skill `/biz-email-setup` + tab Email marketing `/biz-admin-leads-dashboard`.

## Acceptance criteria

- [ ] Đăng ký → nhận email xác nhận VN; quên MK → nhận email reset VN.
- [ ] Webhook paid → KH nhận email xác nhận mua đúng gói + hạn dùng.
- [ ] Sub còn 7 ngày → nhận đúng 1 email nhắc (không gửi trùng).
- [ ] Campaign gửi → người đã unsubscribe không nhận; `email_logs` đủ số.
- [ ] Bấm unsubscribe → lần campaign sau không nhận nữa.
