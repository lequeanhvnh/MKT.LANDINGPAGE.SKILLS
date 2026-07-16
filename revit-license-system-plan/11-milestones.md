# Module 11 — Lộ trình & Milestone

**Mục tiêu:** Chia hệ thống thành các milestone giao được, mỗi mốc có giá trị dùng được + tiêu chí nghiệm thu.

## M1 — Nền tảng license (MVP chạy được)

**Gồm:** Module 01 (schema/RLS) + 02 (issue-trial, activate, refresh) + 04 (auth Revit) + 05 (addin core).
**Kết quả:** User đăng ký trong Revit → tự có trial 30 ngày 3 bộ môn → chạy command được; offline grace hoạt động.
**Nghiệm thu:** đi hết flow đăng ký → trial → CanRun đúng theo bộ môn; sửa cache → fail; offline trong grace OK.

## M2 — Bán hàng & gia hạn

**Gồm:** Module 03 (payment) + phần Buy/Dashboard của Module 08.
**Kết quả:** Hết trial → mua VietQR → webhook kích hoạt → command bộ môn đã mua chạy; combo OK; gia hạn cộng dồn.
**Nghiệm thu:** webhook idempotent; mua combo active 3 môn; mua khi còn trial cộng dồn đúng.

## M3 — Telemetry & Admin thống kê

**Gồm:** Module 06 (telemetry) + admin Overview/Tools/Errors (Module 08).
**Kết quả:** Mọi lần chạy được log; admin xem top tool ưa thích + top lỗi + stack trace.
**Nghiệm thu:** success/error/denied ghi đúng; gửi bù offline; biểu đồ khớp dữ liệu.

## M4 — Email & vận hành

**Gồm:** Module 07 (email) + 09 (cron) + admin Campaigns/Licenses (Module 08).
**Kết quả:** 4 loại email chạy; nhắc hết hạn tự động; campaign khuyến mãi gửi được; admin quản lý license/refund.
**Nghiệm thu:** email xác nhận mua + reset + nhắc hạn + campaign; unsubscribe hiệu lực; dedupe nhắc hạn.

## M5 — Hardening, Deploy & phát hành

**Gồm:** Module 10 (hardening) + Module 12 (deploy Vercel) + landing bán hàng (Module 08, có thể dùng `/ui-ux-pro-max`) + bản cài Storage.
**Kết quả:** Obfuscation, xoay khóa, advisors sạch, **app deploy production trên Vercel** (env Supabase + email server do anh cung cấp), custom domain, Supabase Cron chạy, landing live, bản cài tải được.
**Nghiệm thu:** checklist Module 10 + Module 12 (smoke test production) pass; full E2E từ landing → mua → cài → dùng trên domain thật.

## Ma trận phụ thuộc

```
M1: 01 → 02,04 → 05
M2: (01) → 03 → 08(buy)
M3: (01,05) → 06 → 08(admin-stats)
M4: (01,03) → 07,09 → 08(admin-campaign)
M5: tất cả → 10 → 12(deploy Vercel) → release
```

## Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| VN không hỗ trợ recurring | Manual renewal + email nhắc + cộng dồn |
| Add-in bị crack | Obfuscation + token ngắn hạn + DPAPI; chấp nhận không 100% |
| Webhook trùng cộng tiền 2 lần | Idempotent theo order_id, chặn ở bước pending→paid |
| Telemetry làm lag Revit | Fire-and-forget batch async, không bao giờ chặn command |
| Email vào spam | Verify domain SPF/DKIM, tách transactional/marketing, unsubscribe |
| Lạm dụng trial | Khóa theo user + device fingerprint |

## Quy ước "bắt đầu code"

Sau khi plan này được duyệt → code theo thứ tự M1 → M5. Mỗi module có file plan riêng làm spec; mỗi PR map 1 module/1 milestone con, kèm tiêu chí nghiệm thu của file tương ứng.
