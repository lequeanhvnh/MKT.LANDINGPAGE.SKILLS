# Integration patches — 4 file có sẵn + test plan

Skill scaffold file mới thì đơn giản. Phần khéo là **patch 4 file đã tồn tại**.
Mỗi file dưới đây mô tả: patch làm gì → tìm anchor nào → áp như thế nào.

> Đường dẫn file thật có thể khác (có/không thư mục `src/`). Patch theo **anchor
> ngữ nghĩa** (tên hàm, tên biến) chứ không theo số dòng. Đọc file thật trước khi sửa.

---

## Patch 1 — `lib/leads-supabase.ts` (lead store nhận thêm `aff_code`)

**Mục tiêu**: `createLead()` lưu được `aff_code` vào bảng `leads`.

> Schema chuẩn của `/biz-setup-sepay-payment`: input là `LeadInput`
> (name/phone/email/**productName**/amount — `orderId` do `next_order_id()` tự
> sinh trong `createLead`), row được khai báo `const row: LeadRow = {...}` nên
> phải thêm `aff_code` vào CẢ type `LeadRow` mới biên dịch được.

**1a. Thêm field vào `LeadInput`** — tìm `export type LeadInput =` và nối thêm:

```ts
export type LeadInput = Omit<Lead, 'orderId' | 'status' | 'createdAt' | 'paidAt' | 'payment'> & {
  affCode?: string;        // ← THÊM: mã affiliate (nếu khách qua link aff)
};
```

**1b. Thêm cột vào type `LeadRow`** — tìm `type LeadRow = {`, thêm:

```ts
  expire_at: string;
  aff_code: string | null;   // ← THÊM
```

**1c. Ghi `aff_code` vào row insert** — trong `createLead`, tìm `const row: LeadRow = {`,
thêm 1 dòng vào object:

```ts
  const row: LeadRow = {
    order_id: orderId,
    /* …các field cũ… */
    expire_at: expireAt,
    aff_code: input.affCode ?? null,   // ← THÊM
  };
```

Không cần đụng `rowToLead` — `recordCommissionForOrder()` tự query bảng `leads`
để đọc `aff_code`, không đi qua type `Lead`.

---

## Patch 2 — route tạo lead (đọc cookie aff, gắn vào lead)

> **File nào?** Tìm route gọi `createLead(`:
> ```bash
> grep -rln "createLead(" app/api pages/api 2>/dev/null
> ```
> Với pipeline `/biz-setup-sepay-payment` mặc định, đó là **`app/api/checkout/route.ts`**
> (KHÔNG phải `api/register`). Áp patch vào đúng file đó.

**Mục tiêu**: lấy mã aff từ cookie `aff_ref` (do `AffiliateTracker` ghi) rồi
truyền vào `createLead()`. **Server-side đọc cookie** → không cần sửa form nào.

**2a. Thêm helper** đọc cookie — đặt cạnh các helper khác trong file:

```ts
/** Lấy mã affiliate từ cookie `aff_ref` (do AffiliateTracker ghi client-side). */
function readAffCookie(request: Request): string | undefined {
  const cookie = request.headers.get("cookie");
  if (!cookie) return undefined;
  const match = cookie.match(/(?:^|;\s*)aff_ref=([^;]+)/);
  if (!match) return undefined;
  const code = decodeURIComponent(match[1]).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return code || undefined;
}
```

**2b. Truyền `affCode` vào `createLead()`** — tìm lời gọi `createLead({` trong
handler `POST`, thêm field. Đọc cookie 1 lần ở đầu handler:

```ts
// Trong app/api/checkout/route.ts (App Router), tham số handler tên là `req`.
export async function POST(req: Request) {
  /* …validate body (name, phone, email, productName, amount)… */
  const affCode = readAffCookie(req);              // ← THÊM (gần đầu handler)
  /* … */
  const { orderId, lead } = await createLead({
    name: name.trim(),
    phone,
    email: email.toLowerCase().trim(),
    productName,
    amount,
    affCode,                                       // ← THÊM vào lời gọi createLead
  });
```

Nếu file có nhiều nhánh tạo lead, thêm `affCode` vào **mọi** lời gọi `createLead`.

---

## Patch 3 — `api/sepay-webhook/route.ts` (tạo hoa hồng khi đơn paid)

**Mục tiêu**: sau khi đánh dấu đơn `paid` thành công → tạo bản ghi hoa hồng.

> Webhook của `/biz-setup-sepay-payment` dùng `markLeadPaid(orderId, payment)`
> (trả về `updatedLead`), rồi gọi `runSideEffects(updatedLead, payload)`. Đặt
> lời gọi hoa hồng ngay sau `markLeadPaid` thành công (hoặc thêm vào trong
> `runSideEffects` như một side-effect).

**3a. Import** — thêm cạnh các import khác:

```ts
import { recordCommissionForOrder } from "@/lib/affiliate";
```

**3b. Gọi sau khi mark paid thành công** — tìm `const updatedLead = await markLeadPaid(...)`,
chèn ngay sau:

```ts
  // Tạo hoa hồng affiliate — best-effort, KHÔNG để lỗi làm fail webhook.
  try {
    await recordCommissionForOrder(lead.orderId);
  } catch (err) {
    console.error("[sepay-webhook] recordCommission failed", err);
  }
```

**Vì sao bọc try/catch**: webhook phải luôn trả `200` để Sepay không retry vô
hạn. `recordCommissionForOrder` đã tự nuốt lỗi bên trong, try/catch này là lớp
phòng thủ thứ hai. Đặt nó **trước hoặc sau** `runSideEffects()` đều được —
miễn là sau khi xác nhận đơn đã paid.

`recordCommissionForOrder` tự xử lý: đơn không có `aff_code` → bỏ qua; mã sai
hoặc đối tác `paused` → bỏ qua; đã có hoa hồng cho `order_id` đó → bỏ qua
(idempotent). Nên gọi vô điều kiện là an toàn.

---

## Patch 4 — `app/layout.tsx` (mount AffiliateTracker)

**Mục tiêu**: nạp `AffiliateTracker` toàn site để bắt `?aff=` trên mọi trang.

**4a. Import**:

```ts
import AffiliateTracker from "@/components/AffiliateTracker";
```

**4b. Mount trong `<body>`** — đặt cạnh `{children}`:

```tsx
      <body /* …className… */>
        {/* …script/pixel cũ… */}
        {children}
        <AffiliateTracker />        {/* ← THÊM */}
        {/* …Chatbot cũ nếu có… */}
      </body>
```

`AffiliateTracker` là client component (`"use client"`) render `null` — không
ảnh hưởng layout. Layout là server component vẫn render được client component.

---

## Test plan — 4 cấp

### 1. Build sạch
```bash
npm run build
```
Không lỗi TypeScript. Lỗi thường gặp: sai đường dẫn import `@/lib/affiliate`,
quên một patch.

### 2. Migration đã áp
Trong Supabase SQL Editor:
```sql
SELECT count(*) FROM affiliates;          -- chạy được = bảng đã tạo
SELECT column_name FROM information_schema.columns
  WHERE table_name='leads' AND column_name='aff_code';   -- trả 1 row
```

### 3. Luồng gán đơn (local `npm run dev`)
1. `/admin/affiliates` → nhập `ADMIN_PASSWORD` → "+ Thêm đối tác" (tên + email +
   tier) → nhận `aff_code`, vd `LINH7K2`.
2. Mở `http://localhost:3000/?aff=LINH7K2` → DevTools → Application → Cookies →
   thấy `aff_ref=LINH7K2`. Bảng `affiliate_clicks` có 1 row mới.
3. Điền form đăng ký 1 gói **paid** → bảng `leads` có row mới, cột `aff_code` =
   `LINH7K2`.
4. Giả lập Sepay webhook (curl, payload + header `Authorization: Apikey <KEY>`
   như test của `/biz-setup-sepay-payment`, `content` chứa đúng `order_id`):
   ```bash
   curl -X POST http://localhost:3000/api/sepay-webhook \
     -H "Authorization: Apikey $SEPAY_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"id":999001,"transferType":"in","transferAmount":<amount>,"content":"<order_id>"}'
   ```
   → bảng `affiliate_commissions` có 1 row `status='pending'`,
   `commission_amount = order_amount × rate / 100`.
5. Gọi lại đúng webhook đó → **không** sinh hoa hồng thứ 2 (idempotent).

### 4. Portal đối tác
Mở `/affiliate` → đăng nhập bằng `aff_code` + email của đối tác test → thấy
đúng: link giới thiệu, số click, đơn vừa tạo, hoa hồng `Chờ duyệt`.
Sai email → báo "không khớp".

---

## Hướng dẫn vận hành (gửi cho user sau khi xong)

- **Thêm đối tác**: `/admin/affiliates` → "+ Thêm đối tác". Hệ thống tự sinh mã.
- **Gửi cho đối tác**: link giới thiệu `https://<domain>/?aff=<MÃ>` (nút "Chép
  link" có sẵn) + link portal `https://<domain>/affiliate` để họ tự xem số liệu
  (đăng nhập bằng mã + email).
- **Chi trả hàng kỳ**: vào `/admin/affiliates` mục Hoa hồng → lọc `Chờ duyệt` →
  đối soát → "Duyệt" → khi chuyển tiền xong bấm "Đánh dấu đã trả" (ghi chú CK).
- **Tạm dừng đối tác**: sửa đối tác → trạng thái `Tạm dừng`. Đơn mới của họ sẽ
  không sinh hoa hồng nữa; hoa hồng cũ giữ nguyên.
