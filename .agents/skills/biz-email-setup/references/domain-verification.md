# Domain Verification cho SMTP Provider (SPF/DKIM/DMARC)

Mọi SMTP provider chuyên dụng (Resend / SendGrid / Mailgun / Brevo / Zoho) đều yêu cầu verify domain trước khi gửi email từ địa chỉ `@yourbrand.vn` của user. Mục đích: ISP (Gmail/Outlook/Yahoo) cần xác nhận provider được phép gửi thay user, nếu không sẽ đánh dấu spam.

**Ngoại lệ — Gmail SMTP**: KHÔNG cần verify domain nếu gửi từ chính địa chỉ Gmail (vd `you@gmail.com` hoặc Workspace `you@yourbrand.vn` nếu Gmail là provider chính cho domain đó). Skip toàn bộ section này, đi thẳng sang `troubleshooting.md`.

Quy trình chung: ~10 phút thao tác + 5-30 phút đợi DNS propagate.

---

## Phần A — Lấy DNS record từ provider

Mỗi provider có dashboard riêng để add domain + xem record cần thêm.

### Resend
1. Login [resend.com](https://resend.com) → sidebar **Domains** → **Add Domain**.
2. Nhập domain root (`yourbrand.vn`, không `www.yourbrand.vn`).
3. Chọn region: **Asia/Pacific** (Singapore) cho VN traffic.
4. Resend hiển thị 3-4 record (1 SPF TXT, 1 DKIM TXT/CNAME, 1 MX optional, 1 DMARC optional).

### SendGrid
1. Login [sendgrid.com](https://sendgrid.com) → Settings → **Sender Authentication** → Authenticate Your Domain.
2. Chọn DNS provider (giúp UI tốt hơn), domain root.
3. SendGrid trả 3 CNAME record (link tới SendGrid CDN cho DKIM) + optional 1 SPF TXT.

### Mailgun
1. Login [mailgun.com](https://mailgun.com) → Sending → Domains → Add New Domain.
2. Mailgun đề nghị subdomain `mg.yourbrand.vn` (best practice — không trộn với domain chính). Chấp nhận.
3. Mailgun trả 4-5 record: SPF TXT, DKIM TXT, MX (×2), CNAME tracking.

### Brevo / Sendinblue
1. Login [brevo.com](https://brevo.com) → Senders, Domains & Dedicated IPs → Domains → Add domain.
2. Brevo trả 2 record: DKIM TXT (brevo._domainkey) + Brevo code TXT (verification).
3. Optional: SPF nếu user chưa có.

### Zoho Mail
- Nếu đã host email qua Zoho → SPF/DKIM đã được setup khi onboard Zoho Mail (lúc add domain vào Zoho).
- Verify lại tại Admin Console → Domains → DKIM tab.

---

## Phần B — Add DNS record (chung cho mọi provider)

### Cloudflare (recommended — nhanh nhất, free)
1. Dashboard → chọn domain → tab **DNS** → **Add record**.
2. Type = TXT (hoặc CNAME/MX), Name = theo provider yêu cầu (vd `send`, `resend._domainkey`, `brevo._domainkey`), Content = paste từ provider.
3. TTL = Auto, Proxy status = **DNS only** (mây xám, không cam — nếu cam Cloudflare sẽ proxy email gây lỗi).
4. Save. Propagate ~1-5 phút.

### Namecheap
1. Dashboard → Domain List → Manage → tab **Advanced DNS**.
2. Add New Record → Type TXT/CNAME/MX → Host = subdomain ngắn (vd `send`, không gõ full `send.yourbrand.vn`), Value = paste.
3. TTL = Automatic. Propagate 5-30 phút.

### GoDaddy
1. My Products → DNS → Add → chọn Type.
2. Name = subdomain ngắn, Value = paste.
3. TTL = 1 hour. Propagate 10-30 phút.

### PA Vietnam / Mắt Bão / Nhân Hòa / iNet (registrar VN phổ biến)
1. Đăng nhập control panel → Quản lý DNS / DNS Management.
2. UI khác nhau, nhưng đều có "Thêm bản ghi" / "Add Record".
3. Chọn loại bản ghi (TXT, CNAME, MX), nhập Host + Value.
4. Một số provider VN không cho phép TTL thấp → propagate có thể lên 1-2h.

### Vercel DNS (nếu domain mua qua Vercel)
1. Vercel dashboard → Domains → chọn domain → **DNS Records**.
2. Add → Type TXT/CNAME/MX, Name = subdomain, Value = paste.
3. Propagate ~1 phút.

---

## Phần C — SPF, DKIM, DMARC là gì

| Loại | Mục đích | Format ví dụ |
|---|---|---|
| **SPF** (TXT) | ISP biết SMTP provider được phép gửi thay anh/chị | `v=spf1 include:_spf.brevo.com ~all` |
| **DKIM** (TXT/CNAME) | Chữ ký số chứng thực email không bị tamper trên đường truyền | `p=MIGfMA0GCS... (chuỗi dài)` hoặc CNAME tới provider |
| **DMARC** (TXT, optional nhưng nên có) | Policy báo cho ISP khi SPF/DKIM fail | `v=DMARC1; p=none; rua=mailto:you@brand.vn` |

**Lưu ý SPF**: Domain chỉ được có **1 SPF record duy nhất**. Nếu đã có SPF cho Google Workspace + giờ add Brevo → phải **merge** thành 1 record:
```
v=spf1 include:_spf.google.com include:_spf.brevo.com ~all
```
KHÔNG add 2 record TXT riêng — sẽ vô hiệu cả hai.

---

## Phần D — Verify

1. Sau khi add xong, quay lại dashboard của provider → click **Verify** / **Check DNS** / tương đương.
2. Provider check DNS bằng `dig`. Nếu thấy đủ record → status chuyển **Verified** ✓.
3. Nếu fail → đợi thêm 5-10 phút và retry. Most common: TTL chưa propagate.

**Kiểm tra manual** (nếu provider báo not found nhưng đã add):
```bash
# Check SPF
dig +short TXT yourbrand.vn | grep spf
dig +short TXT send.yourbrand.vn   # nếu provider yêu cầu subdomain

# Check DKIM — selector khác nhau theo provider:
dig +short TXT resend._domainkey.yourbrand.vn        # Resend
dig +short CNAME s1._domainkey.yourbrand.vn          # SendGrid
dig +short TXT k1._domainkey.yourbrand.vn            # Mailgun (default selector)
dig +short TXT brevo._domainkey.yourbrand.vn         # Brevo

# Phải trả về value khớp với provider setup page.
```

Nếu `dig` trả về rỗng = chưa propagate. Đợi thêm.
Nếu trả về giá trị khác = anh/chị paste sai value, vào DNS provider sửa lại.

---

## Phần E — Set MAIL_FROM sau verify

Sau khi verified, update env var:

```env
# Trước verify (chỉ dùng dev/test, deliverability kém):
MAIL_FROM=onboarding@resend.dev          # Resend sandbox
MAIL_FROM=noreply@em.sendgrid.net        # SendGrid sandbox
# hoặc dùng Gmail SMTP — không cần verify, MAIL_FROM = SMTP_USER

# Sau verify (production):
MAIL_FROM="Tên Brand <hello@yourbrand.vn>"
```

Format `"Tên Brand <email>"` cho phép custom display name trong inbox của lead — recommended cho B2C VN.

**Phải khớp `from` domain với DKIM domain đã verify**. Verify `mg.yourbrand.vn` (Mailgun subdomain) nhưng set `MAIL_FROM=hello@yourbrand.vn` (root) → vẫn fail SPF. Cách fix: verify cả root, hoặc dùng `hello@mg.yourbrand.vn`.

---

## Khi nào KHÔNG verify được

- **Domain mua trên Tencent/Aliyun (CN registrar)**: DNS propagation có thể bị block bởi GFW khi check từ AWS US. → Move DNS sang Cloudflare (free, fast).
- **Subdomain only (ví dụ `app.bigcorp.com`)**: Cần access DNS của parent domain. Nếu không có → dùng tracking subdomain provider gợi ý (Mailgun `mg.brand.vn` là pattern này).
- **Free hosting có DNS managed (Wix, Squarespace)**: Mỗi platform có UI khác, search "[platform] add TXT record". Đôi khi không cho phép subdomain custom — phải upgrade plan.

---

## Anti-pattern

- ❌ Add 2 SPF record riêng (1 cho Google, 1 cho Brevo) → cả 2 vô hiệu. Merge thành 1.
- ❌ Wrap value SPF/DKIM bằng dấu nháy đôi khi paste vào DNS panel → một số provider tự thêm nháy, gây value sai. Paste raw không nháy.
- ❌ Set proxied (orange cloud) cho MX/TXT trên Cloudflare → Cloudflare reverse-proxy không apply cho DNS records, nhưng UI cho phép → confusion. Luôn để **DNS only** (gray cloud) cho mail records.
- ❌ Delete DKIM record sau verify để "clean DNS" → provider re-check định kỳ, sẽ revoke verification.
- ❌ Đổi SMTP provider mà quên rebrand DKIM cũ → DKIM cũ vẫn còn, không ảnh hưởng provider mới, nhưng nên clean để debug dễ hơn.
- ❌ Verify subdomain (`mg.brand.vn`) nhưng `MAIL_FROM` root (`hello@brand.vn`) → SPF/DKIM mismatch → vào spam. Match cùng cấp.
