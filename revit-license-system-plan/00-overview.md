# Plan tổng quan — Hệ thống License Revit Add-in

> Tài liệu thiết kế gốc: [`../so-do-thuat-toan-revit-license-supabase.md`](../so-do-thuat-toan-revit-license-supabase.md)
> Thư mục này chứa **plan chi tiết theo từng module**. Mỗi file = 1 module có thể giao cho 1 người/1 phiên code.
> Quy ước: **chưa viết code** ở giai đoạn plan — chỉ mô tả scope, deliverables, task checklist, data contract, tiêu chí nghiệm thu.

## Quyết định kiến trúc (cập nhật 2026-06-20)

**KHÔNG dùng Supabase Edge Functions.** Toàn bộ backend là **Next.js (App Router) API routes deploy trên Vercel**. Supabase chỉ làm **Postgres + Auth**.

Lý do:
- 1 codebase, 1 deploy; khớp toàn bộ pipeline + skill có sẵn trong repo này.
- **Tái dùng được skill:** `/biz-setup-sepay-payment`, `/biz-email-setup`, `/biz-telegram-payment-notify`, `/biz-admin-leads-dashboard`, `/biz-admin-google-auth`, `/ui-ux-pro-max` — tất cả đều scaffold cho Next.js.
- Add-in Revit gọi thẳng `https://<app>/api/...` (client desktop → **không cần CORS**).

**2 lưu ý bắt buộc khi deploy Vercel:**
1. Đặt **region Vercel = region Supabase** (vd Singapore `sin1`) để latency thấp.
2. Truy cập DB qua **supabase-js (PostgREST)** hoặc **connection pooler (port 6543, Supavisor transaction mode)** — KHÔNG mở kết nối Postgres long-lived (serverless sẽ cạn connection).

**Khả năng chịu tải:** 1000 users / 200 DAU dùng liên tục là rất nhẹ — nhờ kiểm tra quyền mỗi command **chạy cục bộ (offline verify Ed25519), không gọi API**. API chỉ bị gọi cho `activate` (~1 lần/user/ngày) + telemetry batch (~0,5 req/s trung bình). Bottleneck thực sự là **dung lượng telemetry** → xem chiến lược retention ở [`06-telemetry.md`](06-telemetry.md). Chi phí vận hành dự kiến: Vercel Pro ~$20 + Supabase Pro ~$25 + email provider.

## Sản phẩm

Revit API Add-in 3 bộ môn: **ARC** (Kiến trúc) · **STR** (Kết cấu) · **MEP** (Điện nước).
Bán **subscription theo bộ môn hoặc combo**, có **trial 1 tháng tự động**, quản lý license/thiết bị, kiểm tra quyền mỗi command, telemetry usage + lỗi, và hệ thống email.

## Stack chốt

| Lớp | Công nghệ |
|---|---|
| Web + API | **Next.js 15 App Router + TS + TailwindCSS** (deploy Vercel) — frontend & API routes chung 1 project |
| Auth | Supabase Auth (GoTrue) — email/password + Google |
| DB | Supabase Postgres + RLS + pg_cron (Supabase **Pro** khi production) |
| Truy cập DB | `@supabase/supabase-js` (PostgREST) — service role chỉ ở server route |
| Ký token | Ed25519 (private trong Vercel env, public nhúng add-in) |
| Thanh toán | Sepay VietQR (manual renewal cộng dồn) |
| Cron | **Supabase Cron** (pg_cron + pg_net) — SQL job nội bộ + HTTP gọi API mailer (Vercel Cron là phương án thay thế) |
| Email | Supabase Auth (auth mail) + Resend/Brevo (nghiệp vụ + campaign) |
| Add-in | C#/.NET (Revit API) + WPF dialog + `HttpClient` + DPAPI cache |
| Charts | `recharts` (trong Next.js admin) |

## Danh sách module & file plan

| # | Module | File | Phụ thuộc |
|---|---|---|---|
| 01 | Database schema + RLS + pg_cron | [`01-database-schema.md`](01-database-schema.md) | — |
| 02 | API License (activate/refresh/check/trial) | [`02-api-license.md`](02-api-license.md) | 01 |
| 03 | Thanh toán (create-order + webhook + renewal) | [`03-payment.md`](03-payment.md) | 01 |
| 04 | Auth trong Revit (login/register/forgot) | [`04-revit-auth.md`](04-revit-auth.md) | 01 |
| 05 | Revit Add-in core (LicenseClient + CanRun) | [`05-revit-addin-core.md`](05-revit-addin-core.md) | 02, 04 |
| 06 | Telemetry (usage + error log + dashboard) | [`06-telemetry.md`](06-telemetry.md) | 01, 05 |
| 07 | Email engine (4 loại) | [`07-email.md`](07-email.md) | 01, 03 |
| 08 | Web Next.js (dashboard + admin + bán hàng) | [`08-web-react.md`](08-web-react.md) | 01, 02, 03 |
| 09 | Cron jobs (hết hạn + mailer + rollup) | [`09-cron-jobs.md`](09-cron-jobs.md) | 01, 07 |
| 10 | Bảo mật & hardening | [`10-security-hardening.md`](10-security-hardening.md) | tất cả |
| 11 | Lộ trình & milestone | [`11-milestones.md`](11-milestones.md) | — |
| 12 | Deploy Vercel + cấu hình & secrets | [`12-deploy-vercel.md`](12-deploy-vercel.md) | tất cả |

> **Thông tin Supabase + email server do anh cung cấp** — gom tại [`12-deploy-vercel.md`](12-deploy-vercel.md) mục 1. Em wire vào env khi anh đưa giá trị.

## Thứ tự build khuyến nghị

```
01 schema ─┬─► 02 api-license ──┬─► 05 addin-core ─► 06 telemetry
           ├─► 03 payment ──────┤
           ├─► 04 revit-auth ───┘
           ├─► 07 email
           ├─► 08 web (Next.js)
           └─► 09 cron-jobs
                     └─► 10 hardening (xuyên suốt) ─► 11 milestone
```

## Quy ước chung

- **Mã bộ môn:** `ARC` / `STR` / `MEP`. **command_id:** `<PRODUCT>.<Tool>` vd `STR.ColumnRebar`, `STR.BeamRebar`, `ARC.WallDimension`.
- **Tiền tệ:** VND charm pricing — `200.000đ` (tháng), `2.000.000đ` (năm).
- **Định danh đơn:** `DH` + 6 số zero-pad → `DH000123`.
- **API:** Next.js App Router route handlers tại `app/api/<name>/route.ts`. Add-in gọi qua HTTPS.
- **Naming:** identifier code = English; UI text + email = tiếng Việt (xưng anh/chị).
- **Bí mật (Vercel env):** không commit. `SUPABASE_SERVICE_ROLE_KEY`, `ED25519_PRIVATE_KEY`, `SEPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`.
- **Idempotency:** webhook + telemetry + email phải chịu được gọi trùng.

## Định nghĩa "Done" toàn hệ thống

1. User mới: đăng ký trong Revit → tự có trial 30 ngày 3 bộ môn → chạy command OK.
2. Hết trial → mua VietQR → webhook kích hoạt → command theo bộ môn đã mua chạy được, bộ môn chưa mua bị chặn.
3. Offline trong grace vẫn chạy; hết grace yêu cầu online.
4. Mọi lần chạy command được log (success/error/denied); admin xem được top tool + top lỗi.
5. 4 loại email hoạt động: xác nhận đăng ký, reset mật khẩu, xác nhận mua, nhắc hết hạn + campaign.
6. Quá số máy → chặn, gỡ máy trên web rồi kích hoạt lại được.
