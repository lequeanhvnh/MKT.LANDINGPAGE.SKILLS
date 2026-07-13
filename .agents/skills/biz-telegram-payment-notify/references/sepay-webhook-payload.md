# Sepay Webhook Payload — Schema + Auth + Dedup

Reference này nói chi tiết Sepay webhook gửi gì, authenticate thế nào, và pattern dedup tránh duplicate alert. Đọc khi user hỏi "Sepay gửi cái gì", "field nào nói amount", "lookup khách bằng cách nào".

---

## Sepay là gì

Sepay (sepay.vn) là cổng thanh toán Việt Nam dạng "VietQR + bank API". Cách hoạt động:

1. User chuyển khoản đến tài khoản ngân hàng đã link Sepay (Vietcombank, Techcombank, MB Bank, ACB, v.v.) bằng VietQR hoặc nhập tay.
2. Bank gửi notification cho Sepay (qua bank API hoặc SMS-like webhook).
3. Sepay normalize → POST webhook đến URL của bạn với payload chuẩn.
4. Bạn xử lý webhook, trả `{ success: true }` hoặc 200 OK → Sepay đánh dấu webhook delivered.
5. Nếu non-200, Sepay retry (default lên đến 3-5 lần với backoff).

---

## Payload schema

POST `https://yourdomain.vn/api/payment-success` với body JSON:

```json
{
  "id": "9999999",
  "gateway": "Vietcombank",
  "transactionDate": "2026-05-14 14:32:01",
  "accountNumber": "1023456789",
  "code": null,
  "content": "DH001 0901234567",
  "transferType": "in",
  "transferAmount": 499000,
  "accumulated": 12500000,
  "subAccount": null,
  "referenceCode": "FT26134567890",
  "description": "BankAPINotify CT DEN:1023456789 ND:DH001 0901234567 SD:12500000"
}
```

| Field | Type | Mô tả | Use case |
|---|---|---|---|
| `id` | string | ID giao dịch trên Sepay (duy nhất per giao dịch) | **Dedup key** — lưu vào DB để check retry |
| `gateway` | string | Tên ngân hàng (Vietcombank, Techcombank, …) | Hiển thị trong notification (optional) |
| `transactionDate` | string | Timestamp giao dịch từ bank, format `YYYY-MM-DD HH:mm:ss` | Hiển thị trong notification |
| `accountNumber` | string | Số tài khoản nhận (của shop/anh) | Confirm đúng account, audit |
| `code` | string \| null | Payment code Sepay tự detect (nếu enabled "auto code") | Optional dedup secondary |
| `content` | string | Nội dung chuyển khoản — **chứa order ID khách dán vào** | **Lookup key chính** để map → lead |
| `transferType` | `"in"` \| `"out"` | `in` = khách chuyển VÀO (= payment success). `out` = anh chuyển RA | **Filter**: chỉ xử lý `"in"` |
| `transferAmount` | number | Số tiền VND (raw, không có dấu chấm/comma) | **Amount field cho notification** |
| `accumulated` | number | Số dư tài khoản sau giao dịch | Audit, log |
| `subAccount` | string \| null | Sub-account/virtual account (Sepay Pro feature) | Multi-tenant routing |
| `referenceCode` | string | Mã tham chiếu của bank (FT…, TG…) | **Mã GD trong notification** + dedup secondary |
| `description` | string | Full text từ SMS/notification của bank (chứa nhiều info raw) | Debug nếu `content` không parse được |

---

## Pattern lookup lead theo `content`

`content` là field khách dán vào khi chuyển khoản. Convention phổ biến:

```
DH001 0901234567       ← Order ID + SĐT (khuyến nghị)
DH-001-Tony            ← Order ID + tên (kém vì tên có dấu)
NAP 0901234567         ← Top-up wallet pattern
PAY-INV-20260514-001   ← Invoice pattern
```

**Convention cho landing page bán khoá học/dịch vụ**:
```
DH<order_id> <phone>
```
ví dụ `DH001 0901234567`. Lý do:
- `DH<id>`: dedup nếu khách chuyển 2 lần cho 1 đơn (rare nhưng possible).
- `<phone>`: fallback lookup nếu order_id không match (vd: khách chuyển sai mã).

**Lookup logic**:

```typescript
async function lookupLeadByTransferContent(content: string) {
  // 1. Extract order ID pattern "DH\d+"
  const orderMatch = content.match(/DH\s*(\d+)/i);
  if (orderMatch) {
    const orderId = orderMatch[1];
    const lead = await db.leads.findOne({ orderId });
    if (lead) return lead;
  }
  // 2. Fallback: extract phone "0\d{9}"
  const phoneMatch = content.match(/0\d{9}/);
  if (phoneMatch) {
    const phone = phoneMatch[0];
    const lead = await db.leads.findOne({ phone });
    if (lead) return lead;
  }
  return null; // Không match — log để admin xử lý manual
}
```

**Edge cases**:
- Khách quên dán nội dung → `content` chỉ là default bank message → lookup fail. Admin phải reach out manual.
- Khách dán mã sai (typo) → fallback phone match. Nếu cả 2 fail, log + skip.
- Khách chuyển từ account của người khác → SĐT không match. Admin xử lý manual.

---

## Authentication — 4 method Sepay support

### 1. No auth (development only)

Webhook URL public, ai cũng POST được. **KHÔNG dùng cho production** — attacker có thể fake webhook để trigger fake "payment success".

### 2. API Key (recommended cho landing page)

Sepay gửi header:
```
Authorization: Apikey YOUR_API_KEY
```

Bạn cấu hình `YOUR_API_KEY` trên Sepay dashboard (Webhook settings → API Key). Trong code:

```typescript
const apiKey = req.headers.get('authorization');
if (apiKey !== `Apikey ${process.env.SEPAY_API_KEY}`) {
  return Response.json({ success: false, error: 'unauthorized' }, { status: 401 });
}
```

Thêm `SEPAY_API_KEY` vào `.env.local`.

### 3. HMAC-SHA256 (recommended cho production cao cấp)

Sepay gửi header:
```
Authorization: Sha256 <hmac_signature>
```

Bạn verify:
```typescript
import crypto from 'crypto';

const body = await req.text();
const expected = crypto
  .createHmac('sha256', process.env.SEPAY_HMAC_SECRET!)
  .update(body)
  .digest('hex');
const provided = req.headers.get('authorization')?.replace('Sha256 ', '');
if (provided !== expected) {
  return Response.json({ success: false }, { status: 401 });
}
```

HMAC tốt hơn API Key vì không bị replay attack — signature thay đổi mỗi request theo body.

### 4. OAuth 2.0

Hiếm dùng cho webhook. Skip.

---

## Dedup pattern (CRITICAL — đọc kỹ)

Sepay retry webhook nếu nhận non-200. Nếu code có bug → retry 3-5 lần → user nhận 5 email + 5 Telegram alert cho 1 đơn.

**Pattern an toàn**:

```typescript
export async function POST(req: Request) {
  // [auth check]
  const payload = await req.json();

  // 1. EARLY DEDUP — check trước khi xử lý
  const existing = await db.transactions.findOne({ sepayId: payload.id });
  if (existing) {
    // Đã xử lý rồi — trả 200 ngay, KHÔNG re-trigger side effects
    return Response.json({ success: true, status: 'already_processed' });
  }

  // 2. WRITE FIRST — lưu transaction trước khi gửi notification
  await db.transactions.insertOne({
    sepayId: payload.id,
    referenceCode: payload.referenceCode,
    amount: payload.transferAmount,
    content: payload.content,
    processedAt: new Date(),
  });

  // 3. SIDE EFFECTS — gửi email + Telegram
  if (payload.transferType !== 'in') {
    return Response.json({ success: true });
  }
  const lead = await lookupLeadByTransferContent(payload.content);
  if (lead) {
    await Promise.allSettled([
      sendCustomerEmail(lead),
      sendOwnerEmail(lead),
      sendTelegramNotification({ ... }),
    ]);
  }

  return Response.json({ success: true });
}
```

**Nếu user CHƯA có DB** (mock/early stage): dùng in-memory Set hoặc Vercel KV / Redis cheap. Skip dedup nếu user explicitly OK với risk (low traffic landing page) — nhưng cảnh báo rõ ràng.

---

## Common Sepay gotcha

| Issue | Nguyên nhân | Fix |
|---|---|---|
| Webhook không gọi vào endpoint | URL sai trong Sepay dashboard, hoặc deploy chưa live | Test bằng `curl https://yourdomain.vn/api/payment-success` xem có 401/405 không. Nếu 404 → URL sai. |
| Trả 200 nhưng vẫn retry | Response body không match Sepay expected format | Trả `{ "success": true }` (JSON, không plain text) hoặc 200 OK plain. Check Sepay dashboard config. |
| `transferType` luôn là `out` | Account anh setup là tài khoản nguồn (chuyển ra), không phải đích | Verify account trong Sepay dashboard — phải link bank account NHẬN tiền. |
| `content` rỗng hoặc không match | Khách quên dán nội dung, hoặc bank parse sai | Show note rõ trên landing page về cách dán content khi tạo VietQR. Sepay có VietQR generator embed sẵn `content` → dùng cái đó. |
| Webhook chậm (>5s) | API endpoint chậm vì email Resend block | Dùng `Promise.allSettled` không await, hoặc dùng background job (Vercel cron / queue). |

---

## Liên kết Sepay docs

- Dashboard: https://my.sepay.vn
- Webhook docs: https://docs.sepay.vn/tich-hop-webhooks.html
- Developer portal: https://developer.sepay.vn

(Skill không tự fetch URL — user mở browser tham khảo nếu cần thêm chi tiết.)
