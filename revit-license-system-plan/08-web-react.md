# Module 08 — Web (Next.js + Supabase, deploy Vercel)

**Mục tiêu:** Web bán hàng + cổng người dùng (quản lý sub/thiết bị/mua) + trang admin (thống kê usage/lỗi, quản lý license, email campaign) + trang reset mật khẩu. **Chung 1 Next.js project với toàn bộ API routes** (module 02/03/06/07/09).

**Phụ thuộc:** Module 01 (RLS read), 02 (activate API), 03 (create-order/webhook), 06 (queries), 07 (campaign).

**Stack:** Next.js 15 App Router + TS + TailwindCSS + `@supabase/supabase-js` + `recharts`. Trang bán hàng có thể dựng bằng `/ui-ux-pro-max`; admin tái dùng `/biz-admin-leads-dashboard` + auth `/biz-admin-google-auth`.

**Cấu trúc đề xuất:**
```
app/
  page.tsx                 // Landing bán hàng (/ui-ux-pro-max)
  login/  register/  reset-password/   page.tsx
  dashboard/page.tsx       // sub + thiết bị + tải bản cài
  buy/page.tsx             // chọn gói + VietQR + poll trạng thái đơn
  admin/
    page.tsx               // Overview: KPI + charts usage
    tools/page.tsx         // top tool + tỷ lệ lỗi
    errors/page.tsx        // top lỗi + stack trace
    licenses/page.tsx      // quản lý user/sub/thiết bị
    campaigns/page.tsx     // soạn + gửi email campaign
  api/...                  // các route module 02/03/06/07/09
lib/
  supabase.ts              // browser client (anon key)
  supabase-admin.ts        // server-only (service role)
components/                // AuthGate, charts, tables...
```

## Trang người dùng

- [ ] **Login/Register**: Supabase Auth (email/password + Google). Lưu session.
- [ ] **ResetPassword**: nhận link recover từ email → `supabase.auth.updateUser({password})`.
- [ ] **Dashboard**:
  - [ ] Danh sách sub theo bộ môn + ngày hết hạn + badge trial/paid/expired.
  - [ ] Danh sách thiết bị (`device_activations`) + nút **gỡ máy** (revoke) khi vượt seat.
  - [ ] Nút tải bản cài (signed URL từ Storage) cho user có sub.
- [ ] **Buy**: chọn gói (ARC/STR/MEP tháng/năm + combo) → `create-order` → hiện VietQR → poll `orders.status` realtime (Supabase Realtime hoặc poll) → "đã thanh toán" → hướng dẫn mở Revit.

## Trang admin (allowlist `admin_users` — pattern `/biz-admin-google-auth`)

- [ ] **Overview**: KPI (tổng user, đang active, doanh thu, DAU) + line chart usage theo ngày (recharts).
- [ ] **Tools**: bar chart **top tool ưa thích nhất** + bảng tỷ lệ lỗi từng tool (query module 06).
- [ ] **Errors**: bảng top lỗi (error_code/message/count) + xem stack_trace mẫu để debug.
- [ ] **Licenses**: tìm user, xem/sửa sub, gia hạn thủ công, revoke thiết bị, thêm `revoked_devices` (refund).
- [ ] **Campaigns**: soạn campaign (subject + body text/HTML + segment + preview) → `send-campaign` → xem `email_logs`.

## Quy tắc

- Đọc dữ liệu hiển thị **trực tiếp qua supabase-js + RLS** (client component); thao tác nhạy cảm qua API route (server, service role).
- Anon key ở client là bình thường (RLS bảo vệ); service role **chỉ ở server route** (`lib/supabase-admin.ts`), không bao giờ ở client bundle.
- Tiếng Việt, responsive, charm pricing VND.

## Acceptance criteria

- [ ] User đăng nhập thấy đúng sub + thiết bị của mình (không thấy người khác — RLS).
- [ ] Mua gói → QR → sau khi CK, trang tự cập nhật "đã thanh toán".
- [ ] Gỡ thiết bị trên web → add-in máy đó activate lại được (giải phóng seat).
- [ ] Admin (trong allowlist) vào được; user thường bị chặn admin.
- [ ] Admin thấy biểu đồ top tool + top lỗi khớp dữ liệu telemetry.
- [ ] Admin gửi campaign → log hiển thị thành công/thất bại.
