# Bật đăng nhập Google cho /admin — thao tác ngoài code (Phase 1)

Đây là phần user phải tự làm trên 2 dashboard. Code đã sẵn; nếu bỏ bước này, nút "Đăng nhập với Google" sẽ báo lỗi `provider is not enabled` hoặc login xong kẹt ở màn "Đang kiểm tra…".

Cần `<PROJECT_REF>` = phần đầu Supabase URL. Ví dụ URL `https://abcd1234.supabase.co` → `PROJECT_REF = abcd1234`.

---

## Bước 1 — Tạo OAuth Client trên Google Cloud Console

1. Vào https://console.cloud.google.com/ → chọn (hoặc tạo) 1 project.
2. **APIs & Services → OAuth consent screen**:
   - User Type: **External** → Create.
   - App name, support email, developer email — điền email của anh/chị.
   - Scopes: để mặc định (email, profile, openid là đủ). Save.
   - Test users (nếu app ở chế độ Testing): thêm các Gmail sẽ đăng nhập /admin. (Hoặc bấm **Publish app** để mọi Gmail dùng được — vẫn bị allowlist `admin_users` chặn nên an toàn.)
3. **APIs & Services → Credentials → + Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: thêm
     - `http://localhost:3000`
     - `https://<domain-production>` (vd `https://agentcamp.vercel.app`)
   - **Authorized redirect URIs**: thêm CHÍNH XÁC
     - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
       (đây là callback của Supabase, KHÔNG phải /admin của anh/chị — Supabase nhận code từ Google rồi mới redirect về /admin)
   - Create → copy **Client ID** + **Client Secret**.

---

## Bước 2 — Bật Google provider trong Supabase

1. Supabase Dashboard → **Authentication → Sign In / Providers → Google**.
2. Bật **Enable Sign in with Google**.
3. Dán **Client ID** + **Client Secret** (từ Bước 1) → Save.

---

## Bước 3 — Khai báo Redirect URL trong Supabase

Supabase chỉ cho redirect về URL trong danh sách trắng. Nếu thiếu → login xong `?code=` không đổi được thành phiên.

Supabase Dashboard → **Authentication → URL Configuration**:
- **Site URL**: `https://<domain-production>` (vd `https://agentcamp.vercel.app`). Lúc mới dev có thể để `http://localhost:3000`.
- **Redirect URLs** (Add URL từng dòng):
  - `http://localhost:3000/admin`
  - `http://localhost:3000/**` (tiện cho dev)
  - `https://<domain-production>/admin`
  - `https://<domain-production>/**`

> `loginWithGoogle()` trong `lib/admin-client.ts` dùng `redirectTo: ${window.location.origin}/admin` — nên origin nào chạy /admin thì origin đó PHẢI có trong Redirect URLs.

---

## Bước 4 — Env (Phase 2)

`.env.local` (và Vercel env khi deploy):

```
# Browser (an toàn để lộ) — lấy từ Supabase → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>

# Server (đã có từ /biz-setup-sepay-payment) — KHÔNG để lộ
SUPABASE_URL=https://<PROJECT_REF>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role secret>
```

`NEXT_PUBLIC_SUPABASE_URL` = `SUPABASE_URL`. Anon key ≠ service_role key — đừng lẫn.

---

## Checklist xác nhận trước khi sang Phase 2

- [ ] OAuth client Web application đã tạo, có Client ID + Secret
- [ ] Redirect URI `https://<PROJECT_REF>.supabase.co/auth/v1/callback` đã thêm ở Google
- [ ] Google provider đã Enable + dán Client ID/Secret ở Supabase
- [ ] `http://localhost:3000/admin` + `https://<domain>/admin` đã thêm vào Supabase Redirect URLs
- [ ] (Nếu consent screen ở Testing) Gmail của các admin đã thêm vào Test users

---

## Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Fix |
|---|---|---|
| `provider is not enabled` | Chưa bật Google ở Supabase | Bước 2 |
| Login Google xong về /admin nhưng kẹt "Đang kiểm tra…" rồi ra LoginGate | `/admin` không có trong Supabase Redirect URLs → `?code=` không đổi được phiên | Bước 3 |
| `redirect_uri_mismatch` (màn Google đỏ) | Thiếu callback Supabase trong Authorized redirect URIs ở Google | Bước 1.3 |
| Đăng nhập được nhưng luôn thấy "Không có quyền truy cập" (DeniedGate) | Email Google chưa có trong bảng `admin_users` | Super admin thêm trong tab Quản trị viên, hoặc insert trực tiếp Supabase Table Editor |
| `access_denied` / "App chưa được xác minh" | Consent screen Testing + Gmail chưa là test user | Bước 1.2 (thêm test user hoặc Publish app) |
