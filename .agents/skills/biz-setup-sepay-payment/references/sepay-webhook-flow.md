# Sepay Webhook Flow — payload + auth + dedup

Reference cho Phase 5 (`/api/sepay-webhook`). Đọc khi cần hiểu shape payload, auth methods, retry behavior.

---

## Payload schema

POST từ Sepay gửi JSON body:

```json
{
  "id": "9999999",
  "gateway": "Vietcombank",
  "transactionDate": "2026-05-14 14:32:01",
  "accountNumber": "1023456789",
  "code": null,
  "content": "DH000123",
  "transferType": "in",
  "transferAmount": 499000,
  "accumulated": 12500000,
  "subAccount": null,
  "referenceCode": "FT26134567890",
  "description": "BankAPINotify CT DEN:1023456789 ND:DH000123 SD:12500000"
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | **Dedup key chính** — unique per giao dịch trên Sepay |
| `gateway` | string | Bank name (Vietcombank, Techcombank, ...) |
| `transactionDate` | string | `YYYY-MM-DD HH:mm:ss` từ bank |
| `accountNumber` | string | Số TK shop (của user) |
| `code` | string\|null | Sepay auto-detected payment code (nếu enable) |
| `content` | string | **Nội dung CK khách dán** — chứa order ID |
| `transferType` | `'in'`\|`'out'` | **Filter — chỉ xử lý 'in'** |
| `transferAmount` | number | VND raw (vd 499000) |
| `accumulated` | number | Số dư TK sau giao dịch |
| `subAccount` | string\|null | Sepay Pro feature, ignore |
| `referenceCode` | string | Bank ref code (FT…) — secondary dedup |
| `description` | string | Full text từ bank notification |

---

## Auth methods (Sepay support 4)

### 1. Apikey (recommended cho landing page) ✓

Sepay gửi header:
```
Authorization: Apikey YOUR_API_KEY
```

Setup: Sepay dashboard → Webhook → chọn "API Key" → paste key.

Verify trong code:
```typescript
const auth = req.headers.get('authorization');
if (auth !== `Apikey ${process.env.SEPAY_API_KEY}`) {
  return Response.json({ error: 'unauthorized' }, { status: 401 });
}
```

Pros: simple, đủ secure cho landing page.
Cons: replay attack possible nếu key leak.

### 2. HMAC-SHA256 (production cao cấp)

Sepay gửi:
```
Authorization: Sha256 <hmac_signature>
```

Verify:
```typescript
import crypto from 'crypto';

const body = await req.text();
const expected = crypto.createHmac('sha256', process.env.SEPAY_HMAC_SECRET!)
  .update(body)
  .digest('hex');
const provided = req.headers.get('authorization')?.replace('Sha256 ', '');
if (provided !== expected) {
  return Response.json({ error: 'invalid signature' }, { status: 401 });
}
```

Pros: replay-safe (mỗi body có signature khác).
Cons: phức tạp hơn, cần lưu raw body trước parse JSON.

### 3. OAuth 2.0
Hiếm dùng. Skip.

### 4. None
Webhook public không auth. **CHỈ dùng dev/test**, KHÔNG production — attacker fake webhook → trigger fake "payment success".

---

## Retry behavior

Sepay retry webhook nếu nhận response:
- **non-200 status** (4xx, 5xx)
- **timeout >5 giây**
- **connection refused / DNS fail**

Schedule retry: 1m, 5m, 30m, 2h, 6h (5 retries total trên ~9 tiếng).

**Hệ quả**: nếu code throw exception → 500 → retry 5 lần → **5 lead duplicates** + 5 email + 5 Telegram alert. Cách phòng:

1. **Dedup theo `payload.id`** (xem `leads-kv-schema.md` — pattern `transactions:{id}`).
2. **Wrap-all try/catch** return 200 thay vì 500 nếu xử lý fail (xem `templates/api-sepay-webhook-app-router.ts`).
3. **Promise.allSettled** cho side effects → 1 fail không kéo throw.

---

## Response Sepay expect

OK formats:
```json
{ "success": true }
```
hoặc
```
200 OK
(empty body)
```

**Không OK** (Sepay sẽ retry):
- Status 4xx/5xx
- Body chứa `"success": false` (Sepay parse JSON nếu Content-Type: application/json)
- Timeout

→ **Luôn trả `200` + `{ success: true }`** kể cả khi internal error → log riêng để admin xử lý sau.

---

## Test webhook trên Sepay dashboard

Sepay dashboard → Webhooks → tab Logs. Mỗi delivery có:
- Status: ✓ delivered / ✗ failed
- Response code from server
- Response body
- Retry count
- Latency

**Button "Test"** trong webhook config → Sepay gửi mock payload với `id: "TEST_xxx"`, `transferType: "in"`, `transferAmount: 1000`. Endpoint phải trả 200 OK trong <5s.

---

## Common gotcha

| Issue | Cause | Fix |
|---|---|---|
| Webhook trả 200 nhưng Sepay vẫn retry | Response body sai format | Trả `{ success: true }` JSON, content-type `application/json` |
| Webhook timeout | Email Resend block 8s | Dùng `Promise.allSettled` không await ngoài, hoặc background job |
| Duplicate payment record | Quên dedup theo `id` | Always check `transactions:{id}` đầu handler |
| `content` rỗng/sai | Khách quên dán hoặc bank parse sai | Fallback parse `description` field, hoặc lookup theo phone secondary index |
| Unauthorized 401 trong production OK | Env var production khác local | Re-pull `vercel env pull`, restart dev |
