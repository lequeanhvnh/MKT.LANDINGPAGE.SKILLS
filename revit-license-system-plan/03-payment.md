# Module 03 — Thanh toán (Sepay VietQR) + Gia hạn

**Mục tiêu:** Tạo đơn, hiển thị VietQR, nhận webhook, kích hoạt/gia hạn subscription cộng dồn, idempotent.

**Phụ thuộc:** Module 01 (orders, plans, subscriptions). Đồng bộ với Module 07 (email xác nhận mua).

**Deliverables (Next.js API routes — có thể scaffold nhanh bằng skill `/biz-setup-sepay-payment`):**
```
app/api/
  create-order/route.ts
  sepay-webhook/route.ts     // runtime='nodejs'
lib/
  renew.ts                   // logic cộng dồn current_period_end
```

## Setup Sepay (việc của user, ghi hướng dẫn)

- [ ] Đăng ký my.sepay.vn + liên kết tài khoản ngân hàng VN.
- [ ] Lấy API key + cấu hình webhook URL trỏ tới `payment-webhook` + secret.
- [ ] Set Vercel env `SEPAY_WEBHOOK_SECRET`, `SEPAY_BANK_ACCOUNT`, `SEPAY_BANK_CODE`.

## create-order

- [ ] Verify user JWT; nhận `{ plan_id }`.
- [ ] Lấy plan → amount, period, is_combo, plan_products.
- [ ] Gen `order_id = DH + zeroPad(seq,6)` (dùng bảng `order_counter` hoặc sequence).
- [ ] Insert `orders (status='pending', amount, plan_id, user_id)`.
- [ ] Build VietQR URL (sepay img API) với nội dung CK = order_id.
- [ ] Trả `{ order_id, amount, qr_url, bank_info }`.

## payment-webhook (idempotent — CỐT LÕI)

```
1. Verify chữ ký/secret từ Sepay header.
2. Parse { amount, content (chứa order_id), gateway_txn_id }.
3. Tìm order pending khớp order_id + amount. Không thấy → vẫn trả 200, log.
4. Nếu order đã 'paid' (webhook trùng) → trả 200, KHÔNG cộng lại.
5. UPDATE order status='paid', paid_at=now. INSERT payments(raw).
6. Với mỗi product_code trong plan_products → renew (cộng dồn).
7. Fire email xác nhận mua (module 07) + Telegram (tuỳ chọn) qua Promise.allSettled.
8. LUÔN trả 200 (kể cả side-effect lỗi) để Sepay không retry trùng.
```

## renew.ts — logic cộng dồn

```
base = max(now(), sub.current_period_end nếu sub tồn tại)
add  = (period == 'year') ? 1 năm : 1 tháng
upsert subscription(user, product_code):
   current_period_end = base + add
   status = 'active'
   source = 'paid'
```
- Trial đang chạy mà mua → vẫn cộng từ `current_period_end` hiện tại (không mất ngày trial còn lại).
- Idempotency: vì chỉ chạy khi order chuyển pending→paid (bước 4 chặn), webhook trùng không cộng 2 lần.

## Acceptance criteria

- [ ] Tạo đơn ARC_Y → QR đúng số tiền 2.000.000đ, nội dung = order_id.
- [ ] Webhook hợp lệ → order paid + sub ARC active, period_end ≈ now+1 năm.
- [ ] Gửi webhook cùng order_id 2 lần → period_end KHÔNG bị cộng đôi.
- [ ] Mua COMBO_Y → cả 3 sub active.
- [ ] Mua khi trial còn 10 ngày → period_end = now + 10 ngày + 1 năm.
- [ ] Webhook side-effect (email) lỗi → vẫn trả 200.
