# Module 10 — Bảo mật & Hardening

**Mục tiêu:** Khép kín bảo mật xuyên suốt: quản lý khóa, RLS, chống crack add-in, chống lạm dụng trial, audit.

**Phụ thuộc:** áp lên tất cả module.

## Checklist

### Khóa & secret
- [ ] Ed25519 private key chỉ trong **Vercel env (server route)**; public key nhúng add-in có `kid` để **xoay khóa** (giữ 2 kid trong giai đoạn chuyển).
- [ ] Service role key chỉ ở **API route (server)** — không bao giờ ở client bundle/add-in. Tránh prefix `NEXT_PUBLIC_` cho secret.
- [ ] Mọi secret qua Vercel env, không commit. Kiểm tra `.gitignore`.
- [ ] `CRON_SECRET` bảo vệ route cron; webhook secret bảo vệ `sepay-webhook`.

### Token
- [ ] Entitlement token TTL ngắn (24h, giảm 1–4h nếu cần chặt refund).
- [ ] `grace_until` hợp lý (7 ngày) cân bằng offline ↔ lạm dụng.
- [ ] Thu hồi: `revoked_devices` check ở `refresh-token`; refund → thêm device vào đây.

### RLS & API
- [ ] Tất cả bảng bật RLS, deny-by-default; chỉ service role ghi bảng nhạy cảm.
- [ ] API route ép `user_id` từ JWT, bỏ giá trị client gửi (telemetry, activate).
- [ ] Webhook verify chữ ký Sepay; luôn 200; idempotent theo order_id.
- [ ] Rate-limit endpoint nhạy cảm (issue-trial, create-order, telemetry).

### Add-in (chống crack)
- [ ] Obfuscation (ConfuserEx/Dotfuscator) cho assembly, đặc biệt phần verify.
- [ ] Cache token + auth mã hoá DPAPI (CurrentUser) — copy máy khác vô dụng.
- [ ] Verify chữ ký trước khi tin token; không tin đồng hồ hệ thống tuyệt đối (cân nhắc lấy server time khi online).
- [ ] Chấp nhận: không chống crack 100% — mục tiêu nâng chi phí crack > giá mua.

### Chống lạm dụng trial
- [ ] Trial khóa theo `user_id` **và** `device_fingerprint`.
- [ ] Theo dõi `check_logs`/`usage_events`: 1 device nhiều account, 1 account nhiều device bất thường → cảnh báo admin.

### Audit & giám sát
- [ ] `check_logs` cho quyết định quyền (online check).
- [ ] `get_advisors` (security + performance) sau mỗi migration.
- [ ] Log webhook + email_logs để đối soát.

## Acceptance criteria

- [ ] Pentest cơ bản: client với anon key không đọc/ghi được data người khác.
- [ ] Giả token (ký sai) → add-in từ chối.
- [ ] Refund → thêm revoked → trong ≤ TTL token, máy đó mất quyền.
- [ ] `get_advisors` sạch cảnh báo nghiêm trọng.
- [ ] Không có secret nào trong git history / bundle client.
