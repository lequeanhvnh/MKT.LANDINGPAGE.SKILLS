# Module 02 — API License Core (Next.js API routes)

**Mục tiêu:** API cấp & xác thực quyền: `issue-trial`, `activate`, `refresh-token`, `check-entitlement` (tuỳ chọn). Ký entitlement token Ed25519. Triển khai bằng **Next.js App Router route handlers** (KHÔNG dùng Supabase Edge Functions).

**Phụ thuộc:** Module 01 (schema, `get_active_disciplines`).

**Deliverables (Next.js, deploy Vercel):**
```
app/api/
  issue-trial/route.ts
  activate/route.ts
  refresh-token/route.ts
  check-entitlement/route.ts
lib/
  supabase-admin.ts    // service-role client (chỉ chạy server)
  auth-user.ts         // verify user JWT (Supabase getClaims / getUser), lấy user_id
  signing.ts           // ký/verify Ed25519 (Node: 'crypto' hỗ trợ Ed25519 sẵn)
  http.ts              // chuẩn hoá response + mã lỗi
```

## Env (Vercel)

- `ED25519_PRIVATE_KEY` (PEM/base64) — chỉ server route.
- `ED25519_PUBLIC_KEY_ID` — kid để add-in chọn đúng public key (hỗ trợ xoay khóa).
- `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

> Region: cấu hình project Vercel cùng region Supabase (vd `sin1`). Route dùng Node runtime (cần `crypto` Ed25519) — đặt `export const runtime = 'nodejs'`.

## Entitlement token (chuẩn hoá)

JWT ký Ed25519, header `{ alg:"EdDSA", kid }`, payload:
```json
{ "sub","device","disciplines":["ARC","STR"],"plan","iat","exp","grace_until","jti" }
```
- `exp` = iat + 24h (config). `grace_until` = iat + 7 ngày.
- Add-in chỉ cần public key (cùng kid) verify offline.

## Task checklist theo route

### POST /api/issue-trial
- [ ] Verify user JWT → user_id.
- [ ] Nhận `{ device_fingerprint }`.
- [ ] Check `trials` theo user_id **và** device_fingerprint → nếu có ⇒ 409.
- [ ] Insert `trials (expires_at=now()+30d)` + 3 dòng `subscriptions` (ARC/STR/MEP, source='trial').
- [ ] Trả `{ ok, expires_at }`. Idempotent: bắt unique violation → 409.

### POST /api/activate
- [ ] Verify user JWT → user_id; nhận `{ device_id, device_name }`.
- [ ] Đếm `device_activations` active của user; vượt `max_devices` và device mới ⇒ 403 `DEVICE_LIMIT`.
- [ ] Upsert `device_activations` (last_seen=now).
- [ ] `disciplines = get_active_disciplines(user_id)`.
- [ ] Ký token Ed25519 → trả `{ token, kid, exp, grace_until, disciplines }`.

### POST /api/refresh-token
- [ ] Verify user JWT (hoặc token cũ còn chữ ký hợp lệ) + `{ device_id }`.
- [ ] Check `revoked_devices` → nếu có ⇒ 403 `REVOKED`.
- [ ] Update `device_activations.last_seen`; lấy disciplines mới; ký token mới.

### POST /api/check-entitlement (tuỳ chọn, online thuần)
- [ ] Nhận `{ device_id, command_id }`; tra `command_registry` → product_code.
- [ ] Kiểm tra sub active; trả `{ allowed, reason }`. Ghi `check_logs`.

## Mã lỗi chuẩn (trả cho add-in)

`UNAUTHENTICATED` (401) · `DEVICE_LIMIT` (403) · `REVOKED` (403) · `TRIAL_USED` (409) · `NO_ENTITLEMENT` (200 allowed=false) · `INTERNAL` (500).

## Acceptance criteria

- [ ] User mới gọi `issue-trial` 2 lần → lần 2 trả 409.
- [ ] `activate` trả token verify được bằng public key tương ứng kid.
- [ ] Token chứa đúng disciplines theo sub hiện tại (trial 3 môn / paid theo gói).
- [ ] Vượt `max_devices` → 403; gỡ device → activate lại OK.
- [ ] `refresh-token` cho device trong `revoked_devices` → 403.
- [ ] Route dùng `runtime='nodejs'` ký/verify Ed25519 thành công trên Vercel.
