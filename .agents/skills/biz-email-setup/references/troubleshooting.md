# Troubleshooting — SMTP Form Autoresponder

5 vấn đề thường gặp nhất + fix. Áp dụng cho `nodemailer` + bất kỳ SMTP provider nào (Gmail / Resend / SendGrid / Mailgun / Brevo / Zoho / custom).

---

## 1. Email vào spam folder

**Triệu chứng**: Test ok, email gửi đi nhưng Gmail/Outlook đẩy vào Spam/Promotions.

**Nguyên nhân + fix theo thứ tự xác suất**:

1. **Domain chưa verify** (provider 2-7) → đang gửi từ địa chỉ sandbox của provider (`onboarding@resend.dev`, `noreply@em.sendgrid.net`, ...). Fix: verify domain (xem `domain-verification.md`).
2. **Đang dùng Gmail SMTP cho production traffic cao** → Gmail SMTP không tối ưu cho transactional, rate-limit + bị flag dễ. Migrate sang Brevo/Resend nếu >50 lead/ngày.
3. **Thiếu SPF/DKIM** dù đã add domain → re-check DNS bằng `dig`. Cả hai phải có.
4. **Subject spam-y**: ALL CAPS, "FREE!!!", "$$$", "Act now", "100% guarantee". Fix: rewrite subject natural hơn.
5. **Body có nhiều link / chỉ 1 image full-width** → spam filter nghi ngờ. Fix: < 3 links, có cả text giải thích.
6. **Sending từ generic alias** `noreply@` → tốt hơn dùng `hello@` hoặc tên người thật `tony@`.
7. **Reply-to khác from**: nếu set reply-to khác domain → fail DMARC. Fix: reply-to cùng domain với from.
8. **`MAIL_FROM` mismatch với DKIM verified subdomain**: vd verify `mg.brand.vn` nhưng `from=hello@brand.vn` → fail SPF. Fix: match subdomain hoặc verify root.
9. **Lead mark spam lần đầu** → ISP nhớ ngữ cảnh "brand này không welcome" → kéo cả pool xuống. Khó fix, chỉ phòng ngừa bằng content tốt.

**Test deliverability**: gửi test tới 3 email khác nhau (Gmail, Outlook, Yahoo), check folder. Hoặc dùng [mail-tester.com](https://www.mail-tester.com) — gửi 1 email tới address họ cho, họ trả score 0-10. Mục tiêu > 8/10.

---

## 2. API endpoint trả 500

**Triệu chứng**: Form submit, browser hiện error "Có lỗi gửi form".

**Check theo thứ tự**:

1. **Console log Vercel**: Vercel dashboard → Project → Logs → filter `/api/submit`. Đọc error message. Nodemailer error rất verbose, đọc kỹ.

2. **SMTP auth fail** — error chứa `Invalid login` / `535 Authentication failed`:
   - **Gmail**: 99% là dùng password thường thay vì App Password. Tạo App Password tại [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), paste 16 ký tự **không có space**.
   - **Resend SMTP**: `SMTP_USER` phải = `resend` literal, không phải email. `SMTP_PASS` = API key bắt đầu `re_`.
   - **SendGrid**: `SMTP_USER` = `apikey` literal. `SMTP_PASS` = API key bắt đầu `SG.`.
   - **Brevo**: dùng SMTP key (xem SMTP & API tab), KHÔNG dùng API key v3.
   - **2FA chưa bật** (Gmail/Zoho): App Password không cho tạo nếu chưa bật 2FA.

3. **SMTP_HOST / SMTP_PORT sai**:
   - Lỗi `getaddrinfo ENOTFOUND` → host typo.
   - Lỗi `Connection refused` → port sai hoặc bị firewall block.
   - Lỗi `wrong version number` → port 465 cần `SMTP_SECURE=true`, port 587 cần `SMTP_SECURE=false`. Trộn ngược → TLS handshake fail.

4. **Env var không sync sau khi add**: Vercel cần **redeploy** sau khi thêm env var (không hot-reload). Trigger redeploy: push commit mới hoặc Vercel dashboard → Deployments → "..." → Redeploy.

5. **Domain not verified** (Resend/SendGrid/Mailgun/Brevo) → provider throw `Domain not verified, can't send from <email>`. Fix: verify hoặc tạm dùng sandbox address của provider.

6. **Rate limit**:
   - Gmail: 500/ngày personal, 2000/ngày Workspace. Reset 24h sau tin nhắn đầu.
   - Brevo free: 300/ngày, 5/giây.
   - SendGrid free: 100/ngày forever.
   - Burst test có thể trigger rate-limit ngắn hạn → đợi 60s rồi retry.

7. **Recipient blocked**: provider chuyên dụng có suppression list — nếu owner email từng bounce/complaint, tự suppress. Vào dashboard provider → Suppression / Blocked list → xoá.

8. **`runtime = "edge"` (Next.js App Router)** → nodemailer crash với `Module not found: node:net`. Fix: thêm `export const runtime = "nodejs";` ở đầu file route.

---

## 3. Form submit không trigger gì cả

**Triệu chứng**: Click submit, không có loading state, không có error, không có gì xảy ra.

**Check**:

1. **Browser console**: F12 → Console tab. Tìm error JS. Thường gặp `fetch is not defined` (browser quá cũ) hoặc CORS error.
2. **Network tab**: F12 → Network → Submit form → có request `/api/submit` không?
   - Nếu không có request → JS event listener fail. Check `<form onSubmit>` hoặc `addEventListener` syntax.
   - Nếu có request status 404 → API route chưa deploy. Run `vercel --prod` lại.
   - Nếu có request status 405 → method GET thay vì POST. Check fetch config.
3. **API route file location đúng chưa**:
   - Next.js App: `app/api/submit/route.ts` (folder tên `submit`, file tên `route.ts`)
   - Next.js Pages: `pages/api/submit.ts`
   - Vite/Static: `api/submit.js` ở root project (không trong `src/`)
4. **Vercel function config**: nếu deploy static + serverless, cần `vercel.json`:
```json
{ "functions": { "api/*.js": { "maxDuration": 15 } } }
```
5. **Function timeout** (Gmail SMTP chậm + maxDuration thấp): Gmail SMTP TLS handshake mất 2-5s, nếu maxDuration=5 sẽ timeout. Set 15.

---

## 4. Email gửi đi nhưng owner không nhận notification

**Triệu chứng**: Lead nhận email auto-responder OK, nhưng owner không thấy email mới.

**Check**:

1. **Env var `OWNER_EMAIL`** đúng chưa → typo phổ biến.
2. **Owner email là alias** (ví dụ `info@brand.vn` forward sang Gmail) → check folder Gmail "All Mail" hoặc spam.
3. **Owner email cùng domain với FROM** → một số ISP filter "self-sending" làm spam. Fix: `from=hello@brand.vn`, `to=hoang.tran@gmail.com` (Gmail cá nhân khác domain).
4. **Provider log** (Resend/SendGrid/Brevo): vào dashboard → Activity/Logs → search by recipient. Nếu thấy status `Delivered` nhưng owner không nhận → 99% là vào spam.
5. **Gmail SMTP self-send**: Gmail KHÔNG cho phép `from=you@gmail.com` `to=you@gmail.com` (cùng địa chỉ) — sẽ silent drop. Owner email phải khác `SMTP_USER`.
6. **`replyTo` set sai**: nếu set `replyTo: lead_email` cho email B → owner reply về sẽ về lead (đúng intent). Nhưng nếu set `replyTo: owner_email` cho email A → lead reply về owner (cũng OK). Confusion thường ở đây.

---

## 5. Tên/SĐT tiếng Việt hiển thị lỗi font (mojibake)

**Triệu chứng**: Email hiện "Nguy?n Vˆn A" thay vì "Nguyễn Văn A".

**Nguyên nhân**: charset encoding sai ở 1 trong các bước:
1. Form HTML thiếu `<meta charset="UTF-8">` → input bị mã hoá Latin-1.
2. API route không parse JSON đúng → body bị corrupt.
3. Email template thiếu `<meta charset="UTF-8">` trong `<head>`.

**Fix**:
- HTML form: `<meta charset="UTF-8" />` trong `<head>` của landing page.
- API route: dùng `await req.json()` (Next.js) hoặc `JSON.parse(req.body)` (Vercel function), không tự parse text.
- Email template: header `Content-Type: text/html; charset=UTF-8` — nodemailer tự set khi pass `html` field, nhưng nếu inline HTML phải có `<meta charset="UTF-8">`.
- Nodemailer subject với tiếng Việt → tự encode RFC 2047, không cần làm gì thêm. Nếu vẫn lỗi → check terminal nơi run `npm run dev` có set `LANG=en_US.UTF-8` chưa.

---

## 6. Gmail App Password expire / bị vô hiệu

**Triệu chứng**: Đã chạy ổn 1-2 tháng, đột nhiên email fail với `Invalid login`.

**Nguyên nhân**:
- Google revoke App Password nếu detect activity bất thường (đổi IP đột ngột, đăng nhập lạ).
- User đổi password Google → tất cả App Password reset.
- User tắt 2FA → tất cả App Password bị xoá.

**Fix**:
1. Vào [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) tạo App Password mới.
2. Update env var Vercel → redeploy.
3. Pin Resend / Brevo trong roadmap migrate khi traffic tăng — Gmail SMTP fragile cho production lâu dài.

---

## 7. Verify connection trước khi gửi (sanity check)

Nodemailer có method `verify()` test SMTP credentials không gửi email thật:

```ts
const transporter = nodemailer.createTransport({...});
try {
  await transporter.verify();
  console.log("SMTP ready");
} catch (err) {
  console.error("SMTP config sai:", err);
}
```

Add vào script test riêng (không production code), chạy local trước khi deploy:
```bash
node -e "require('./test-smtp.js')"
```

Pass = SMTP setup OK, lỗi 100% nằm ở app code (validation, template render, ...).

---

## Quick sanity check trước khi blame nodemailer

```bash
# Test SMTP trực tiếp với swaks (terminal tool)
# Cài: brew install swaks (macOS) hoặc apt install swaks (Ubuntu)

swaks --to hoang.tran@prediction3d.com \
      --from "$SMTP_USER" \
      --server "$SMTP_HOST" \
      --port 587 --tls \
      --auth-user "$SMTP_USER" --auth-password "$SMTP_PASS" \
      --header "Subject: SMTP sanity test" \
      --body "Hello from SMTP"

# Expect: log kết thúc bằng "250 OK" + Bye.
# Nếu fail tại "AUTH LOGIN" → user/pass sai.
# Nếu fail tại "STARTTLS" → port hoặc SMTP_SECURE setting sai.
# Nếu fail tại "Connection" → host typo hoặc firewall.
```

Pass step này = SMTP credentials đúng, vấn đề nằm ở nodemailer config hoặc app code.
