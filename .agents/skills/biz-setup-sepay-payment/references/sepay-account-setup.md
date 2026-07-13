# Sepay Account Setup — chi tiết step-by-step

Reference này expand Phase 1 trong SKILL.md. Đọc khi user hỏi "tạo tài khoản Sepay thế nào", "link bank ra sao", "lấy API key ở đâu", "bank nào support".

---

## Tổng quan Sepay

[Sepay](https://sepay.vn) là cổng thanh toán Việt Nam dạng "VietQR + bank API native":
- **Dùng**: Khách quét VietQR bằng app banking → chuyển thẳng vào tài khoản của shop. Không qua Sepay holding fund.
- **Phí**: Free 1 bank account đầu tiên (limit số transaction/tháng), nâng cấp Pro ~99K-499K/tháng cho unlimited.
- **Settlement**: T+0 — tiền vào account của shop ngay lập tức (vì không qua Sepay), Sepay chỉ NOTIFY qua webhook.
- **Bank support**: 40+ ngân hàng VN (full list tại https://qr.sepay.vn/banks.json).

**KHÁC với VNPay/MoMo/ZaloPay**: 3 cổng kia là e-wallet/payment processor, có holding fund, có refund flow, phí 1.5-3%. Sepay chỉ là VietQR generator + bank API listener.

---

## Bước 1 — Đăng ký account

1. Truy cập https://my.sepay.vn → **Đăng ký**
2. Điền form:
   - Số điện thoại VN (verify OTP)
   - Email
   - Mật khẩu (>=8 ký tự)
3. Verify email link
4. Hoàn tất profile:
   - Cá nhân: Họ tên + CCCD/CMND + ảnh CCCD 2 mặt
   - Doanh nghiệp: Tax code + Giấy phép kinh doanh + người đại diện

> Verify cá nhân nhanh hơn (1-3h working day). Doanh nghiệp 1-3 ngày.

---

## Bước 2 — Link bank account

Dashboard → **Tài khoản ngân hàng** → **Thêm tài khoản**:

### Form add bank
- **Ngân hàng**: chọn từ dropdown (xem table dưới)
- **Số tài khoản**: 8-15 số, nhập đúng format bank
- **Tên chủ TK**: phải khớp 100% với tên trên app banking (Sepay verify qua bank API)

### Bank list — 15 ngân hàng phổ biến VN

| Bank Display | Sepay value | Note |
|---|---|---|
| Vietcombank | `Vietcombank` | Auto-verify nhanh nhất |
| Techcombank | `Techcombank` | Auto-verify |
| MB Bank | `MB` | Auto-verify, phí 0đ chuyển tiền vào |
| ACB | `ACB` | Manual verify |
| VPBank | `VPBank` | Auto-verify |
| BIDV | `BIDV` | Auto-verify |
| VietinBank | `VietinBank` | Manual verify |
| TPBank | `TPBank` | Auto-verify |
| Sacombank | `Sacombank` | Auto-verify |
| OCB | `OCB` | Auto-verify |
| HDBank | `HDBank` | Manual verify |
| MSB | `MSB` | Auto-verify |
| SCB | `SCB` | Manual verify |
| VIB | `VIB` | Auto-verify |
| SHB | `SHB` | Manual verify |

Full list: https://qr.sepay.vn/banks.json (40+ banks).

**LƯU Ý**: Bank value (cột `Sepay value`) phải dùng EXACT name khi pass vào QR URL — case-sensitive. Sai 1 ký tự → QR không generate được.

### Verify methods
- **Auto-verify** (Vietcombank, Techcombank, MB, VPBank, BIDV, TPBank, Sacombank, OCB, MSB, VIB): Sepay query bank API → confirm tên chủ TK khớp → OK trong 1-5s.
- **Manual verify** (ACB, VietinBank, HDBank, SCB, SHB...): Sepay yêu cầu chuyển 1.000-10.000đ với nội dung mã xác minh (vd: `SEPAY-VERIFY-ABC123`) → confirm trong 1-5 phút.

---

## Bước 3 — Lấy API key

Dashboard → **Cài đặt** → **API & Webhook** → **Tạo API Key mới**

**Form**:
- Tên: vd "landing-page-prod" hoặc "biz-mkt-os-main"
- Permissions: chọn `webhook:read` (đủ cho use case Sepay → webhook → mình)
- Expiry: chọn "không hết hạn" hoặc set 1 năm

Copy API key ngay (chỉ hiện 1 lần). Format: `sk_xxxxxxxxxxxxxxxxxxxx` (20+ ký tự).

> ⚠️ Nếu lỡ leak: vào API Keys → revoke → tạo key mới. Update `SEPAY_API_KEY` trong env.

---

## Bước 4 — Setup webhook trên Sepay

Cùng trang **API & Webhook** → tab **Webhook** → **Thêm webhook**.

**Form**:
- **URL**: `https://yourdomain.vn/api/sepay-webhook` (chính xác — không trailing slash)
- **Authentication**: chọn **API Key** → paste API key bước 3
- **Events**: tick `transaction:incoming` (chỉ trigger khi có tiền vào)
- **Status**: Active
- Save

**Test webhook** (button "Test" trong dashboard): Sepay gửi 1 mock payload với `transferType: 'in'`, `transferAmount: 1000`. Endpoint phải trả `{ success: true }` 200 OK.

### Trước khi có production domain

3 cách test webhook ở local:

1. **ngrok** (recommended):
   ```bash
   npm i -g ngrok
   ngrok http 3000
   # Copy URL ngrok cho — paste vào Sepay webhook URL tạm
   ```

2. **smee.io**: tạo channel → forward về localhost.

3. **Vercel Preview deployments**: mỗi PR có URL preview — paste tạm vào Sepay để test, sau merge production thì update lại.

---

## Bước 5 — Paste cho skill

Skill cần 3 giá trị:

```env
SEPAY_API_KEY=sk_xxxxxxxxxxxxxxxxxxxx
SEPAY_BANK_ACCOUNT_NUMBER=1023456789
SEPAY_BANK_NAME=Vietcombank
```

Skill add vào `.env.local` + nhắc user thêm vào Vercel dashboard env vars trước deploy production.

---

## Pricing tier Sepay (snapshot 2026-05)

| Tier | Phí/tháng | Limits | Use case |
|---|---|---|---|
| **Free** | 0đ | 1 bank, 100 transaction/tháng | MVP, test |
| **Standard** | 99K | 1 bank, 1000 transaction/tháng | Landing page bán khoá học small |
| **Pro** | 499K | 3 banks, 10000 transaction/tháng | E-commerce, multi-product |
| **Enterprise** | Liên hệ | Unlimited | Marketplace |

Free tier đủ cho landing page bắt đầu. Upgrade khi vượt 100 đơn/tháng hoặc cần multi-bank.

(Pricing có thể đổi — verify trên https://sepay.vn/pricing).
