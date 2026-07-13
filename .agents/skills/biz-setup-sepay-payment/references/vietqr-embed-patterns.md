# VietQR Embed Patterns — UX cho checkout

Reference cho Phase 6. Đọc khi cần chọn pattern UX hoặc customize layout.

---

## QR URL format (recap)

```
https://qr.sepay.vn/img?acc=X&bank=Y&amount=Z&des=W&template=compact
```

| Param | Required | Description |
|---|---|---|
| `acc` | ✓ | Số TK (digits only) |
| `bank` | ✓ | Bank name exact (xem `sepay-account-setup.md`) |
| `amount` | optional | VND raw integer. Bỏ → khách tự nhập trên app banking |
| `des` | optional | Nội dung CK (URL-encode nếu có ký tự đặc biệt). **Phải là order_id** |
| `template` | optional | `''` (default branded) / `'compact'` (smaller, tighter) / `'qronly'` (chỉ QR, không branding) |

→ **Default skill dùng `template=compact`** — visual gọn, vẫn có Sepay branding nhẹ (trust signal).

---

## 3 patterns chi tiết

### Pattern A — Modal popup

**Flow**: Form trên landing page → submit → POST `/api/checkout` → modal popup với QR + bank info → user quét → status polling → success state.

**Pros**:
- Không rời landing page → giữ context offer
- Setup đơn giản (1 component)
- Mobile native (fullscreen modal)

**Cons**:
- URL không share được (modal là client state)
- Khách reload trang mất modal → mất order info → confusion
- Không có "back" navigation rõ ràng

**Use case**: Single product / impulse buy (vd 199K-499K), trafic chủ yếu mobile.

Template: `templates/checkout-modal-react.tsx`.

### Pattern B — Dedicated /checkout/[orderId] page (recommended)

**Flow**: Form submit → POST `/api/checkout` → client redirect `/checkout/DH000123` → server-side fetch lead → render full page có QR + bank info + order summary + status polling.

**Pros**:
- URL có thể share (vd: gửi Zalo cho người khác trả tiền hộ)
- Reload không mất state (vẫn `lead:DH000123` trong KV)
- SEO/social preview metadata
- Cleaner separation of concerns

**Cons**:
- Cần tạo thêm route + status endpoint
- Hơi nhiều code hơn

**Use case**: Mid-tier 1M-10M VND course/coaching, audience cẩn thận hơn (cần share link cho người trong gia đình duyệt).

Templates:
- `templates/checkout-page-app-router.tsx` — server component + UI
- `templates/checkout-status-poll.tsx` — client polling component
- `templates/api-checkout-status.ts` — GET /api/checkout/[orderId]/status

**Default skill recommend Pattern B** vì balance UX + code maintainability.

### Pattern C — Inline pricing card với QR hardcoded

**Flow**: Pricing card với QR amount fixed cho từng tier. Khách scan thẳng KHÔNG có form trước.

**Pros**:
- Không cần form (lower friction)
- Không cần KV write per click
- Hiển thị decoy pricing 3 tier dễ

**Cons**:
- **KHÔNG có lead store** → webhook về không lookup được khách → chỉ gửi alert "raw" cho owner
- Không có status polling per khách
- Owner phải manual reach out qua bank notification (slow)

**Use case**: Donation / tip / pricing comparison page chỉ cần show price, owner OK với manual follow-up.

Template: `templates/pricing-card-with-qr.tsx`.

---

## Status polling logic (Pattern A + B)

Client-side polling mỗi 4s gọi `GET /api/checkout/[orderId]/status` → return `{ status: 'pending' | 'paid' | 'expired' }`.

| Status | Trigger | UI behavior |
|---|---|---|
| `pending` | Lead còn trong KV, chưa pay | Show spinner "Đang chờ thanh toán..." |
| `paid` | Webhook đã `markLeadPaid` | ✓ Success state, redirect `/thanks?orderId=X` sau 1.5s |
| `expired` | Lead không còn trong KV (TTL hết hoặc bị xoá) | ⚠️ "Đơn hàng hết hạn, vui lòng tạo đơn mới" + button back to landing |

**Polling interval 4s**: balance giữa real-time UX (khách thấy success ~5s sau khi CK) và KV cost (Free tier 30K commands → 4s polling = 900 read/h/khách. Khách avg ngồi checkout 5 phút = 75 reads. 100 khách/tháng = 7500 reads. Acceptable).

**Stop polling khi**: `status !== 'pending'` (paid hoặc expired). UseEffect cleanup interval.

**Edge case**: khách rời tab → polling pause (browser throttle). Khi quay lại tab, polling resume → catch up.

---

## Mobile UX (mobile-first VN traffic)

| Element | Mobile recommended | Lý do |
|---|---|---|
| QR size | 256×256 — 320×320px | Đủ to để scan thoải mái dưới ánh sáng yếu |
| Form input | `inputMode="numeric"` cho phone | Mở numeric keyboard luôn |
| CTA button | `min-height: 48px` + sticky bottom | Thumb-reachable |
| Bank info text | Tap-to-copy hoặc copy icon | Khách tự nhập số TK nếu QR scan fail |
| Error state | Inline dưới input, không alert() | Native UX |

Template `checkout-page-app-router.tsx` đã apply mobile-first (Tailwind classes: `sm:`, `mx-auto max-w-md`, etc.).

---

## A11y considerations

- `<img alt="Payment QR Code">` cho screen reader
- Button `aria-label="Đóng modal"` cho close icon
- Focus management: modal mở → focus first input. Đóng → return focus to trigger.
- Keyboard: Esc đóng modal, Tab navigate giữa fields, Enter submit form.
- Color contrast: text bank info ≥ AAA contrast (đảm bảo nhìn rõ trên màn ngoài trời).

Template skill scaffold đã handle basics. Production hardening tuỳ user.

---

## Customization

User muốn customize 3 thứ phổ biến:

1. **Branding** trên modal/checkout page → edit gradient + logo trong template `.tsx` (Tailwind classes).
2. **Polling interval** → edit `POLL_INTERVAL_MS` trong `checkout-status-poll.tsx`.
3. **Order ID format** → edit `createLead()` trong `lib/leads-kv.ts` (vd đổi prefix `DH` → `HD` cho "Hoá đơn").

Skill **không** support deeply custom checkout flow (multi-step, coupon code, upsell modal). Đó là use case e-commerce chuyên — recommend hand-build hoặc dùng Shopify/WooCommerce.
