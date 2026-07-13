---
name: biz-admin-google-auth
description: "Nâng cấp xác thực trang /admin (và /admin/affiliates) của landing page Next.js App Router từ **password popup** (ADMIN_PASSWORD + header x-admin-pass) sang **đăng nhập Google qua Supabase Auth + allowlist** — chỉ email nằm trong bảng `admin_users` mới vào được, có khái niệm **super admin** (hard-code, không tự xoá được mình) và tab **Quản trị viên** ngay trong dashboard để super admin thêm/xoá quản trị viên khác. Skill scaffold: migration Supabase (`admin_users` table RLS deny-all + hàm SECURITY DEFINER `is_admin_email`), `lib/admin-auth.ts` (`requireAdmin`/`requireSuperAdmin`/`adminAuthError` verify Bearer token offline qua getClaims), `lib/admin-client.ts` (browser PKCE OAuth + `loginWithGoogle`/`logout`/`adminFetch`), `lib/admin-users.ts` (allowlist CRUD + `isSuperAdmin`), 2 API route (`/api/admin/me`, `/api/admin/admin-users`), component `components/AdminUsersTab.tsx` (tab Quản trị viên). Sau đó PATCH các route `/api/admin/*` đã có (thay `checkAdminPass()` → `requireAdmin()`) và PATCH `app/admin/page.tsx` (thay password popup → Google login gate + auth state machine + đổi mọi `fetch` x-admin-pass sang `adminFetch` + thêm tab Quản trị viên). Guide user bật Google provider trong Supabase Auth + tạo OAuth client trên Google Cloud Console + set 4 env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Đây là skill UPGRADE chạy SAU `/biz-admin-leads-dashboard` (và tuỳ chọn `/biz-affiliate-system`) — KHÔNG thay thế chúng, chỉ đổi lớp auth. Tiếng Việt thuần (xưng anh/chị). USE WHEN user says: 'admin đăng nhập bằng google', 'login google cho admin', 'google oauth admin', 'bỏ password admin dùng google', 'phân quyền admin', 'quản lý nhiều admin', 'allowlist admin', 'super admin thêm admin', 'tab quản trị viên', 'admin nhiều người dùng', 'role admin', 'nâng cấp bảo mật trang admin', 'supabase auth admin', 'biz-admin-google-auth', 'cho nhân viên vào admin bằng gmail', 'admin login an toàn hơn password'. KHÔNG dùng khi: (a) project chưa có `app/admin/page.tsx` + `lib/leads-supabase.ts` — phải chạy `/biz-setup-sepay-payment` (Supabase) + `/biz-admin-leads-dashboard` trước, (b) project dùng Vercel KV — skill chỉ support Supabase, (c) user muốn giữ password đơn giản cho 1 người — không cần upgrade này."
---

# Biz Admin Google Auth — nâng cấp /admin từ password → Google OAuth + allowlist

Skill này **đổi lớp xác thực** của trang `/admin` (và `/admin/affiliates` nếu có) từ password popup chung sang **đăng nhập Google qua Supabase Auth**, kèm **allowlist** (bảng `admin_users`) và phân quyền **super admin** vs **quản trị viên thường**. Không build lại dashboard — dashboard/affiliate giữ nguyên, chỉ thay cách kiểm tra "ai được vào".

> **Triết lý**: password chung (1 mã cho tất cả) không phân biệt được người, không thu hồi được quyền 1 người, dễ rò rỉ. Google OAuth + allowlist giải quyết cả 3: mỗi người đăng nhập bằng Gmail của mình → server verify token + đối chiếu bảng `admin_users` → super admin tự thêm/xoá quản trị viên trong dashboard mà không cần đụng code hay env.

```
Browser /admin → chưa có phiên → LoginGate "Đăng nhập với Google"
     ↓  signInWithOAuth (PKCE) → Google → redirect về /admin?code=...
     ↓  supabaseBrowser tự đổi ?code= thành phiên (localStorage, auto-refresh)
Mọi API call → adminFetch() đính kèm Authorization: Bearer <access_token>
     ↓  server requireAdmin(): getClaims(token) verify offline (ES256/JWKS, check exp)
     ↓  rpc is_admin_email(email) — SECURITY DEFINER bypass RLS
     ├─ email trong allowlist → 200 (kèm isSuperAdmin)
     ├─ token hợp lệ nhưng email KHÔNG trong allowlist → 403 → DeniedGate
     └─ không/sai token → 401 → LoginGate
Super admin → tab "Quản trị viên" → thêm/xoá email allowlist (requireSuperAdmin)
```

Mã nguồn template trong skill này được **trích từ một landing page đang chạy production** (`output/ai-agent-camp-3n2d-dalat/landing-page`) — đã proven, không phải code mẫu.

---

## Khi nào dùng skill này

- Project đã có `app/admin/page.tsx` (từ `/biz-admin-leads-dashboard`) đang dùng **password popup** và user muốn chuyển sang đăng nhập Google + cho nhiều người (nhân viên/trợ lý) vào với quyền khác nhau.
- User nói "admin đăng nhập bằng Google", "phân quyền admin", "quản lý nhiều admin", "bỏ password dùng Gmail", "tab quản trị viên".

**KHÔNG dùng khi**:
- Project chưa có `app/admin/page.tsx` hoặc `lib/leads-supabase.ts` → bảo user chạy `/biz-setup-sepay-payment` (chọn Supabase) + `/biz-admin-leads-dashboard` trước. Skill này chỉ **đổi auth**, không tạo dashboard.
- Project dùng Vercel KV thay Supabase → skill chỉ support Supabase (allowlist cần SQL + RLS + SECURITY DEFINER RPC).
- User chỉ có 1 người dùng admin và muốn giữ password đơn giản → không cần upgrade.

---

## Workflow (7 phase)

```
Phase 0: DETECT App Router + verify lib/leads-supabase.ts + lib/supabase-admin.ts + app/admin/page.tsx — GATE
Phase 1: GUIDE user bật Google provider (Supabase Auth) + tạo OAuth client (Google Cloud) — GATE
Phase 2: SET 2 env mới (NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY); xác nhận SUPABASE_URL + SERVICE_ROLE đã có
Phase 3: HỎI super admin email + chạy migration admin_users + is_admin_email — GATE
Phase 4: SCAFFOLD 6 file mới (3 lib + 2 route + 1 component)
Phase 5: PATCH các route /api/admin/* (checkAdminPass → requireAdmin) + PATCH app/admin/page.tsx (password gate → Google gate + adminFetch + tab Quản trị viên)
Phase 6: TEST 4 cấp (build, login đúng/sai allowlist, super-admin thêm/xoá, route 401/403)
```

Phase 0, 1, 3 có **gate đợi user**. Phase 2, 4, 5, 6 skill chủ động.

---

## Phase 0 — Detect + verify prerequisites

```bash
test -f next.config.js -o -f next.config.mjs -o -f next.config.ts && echo "Next.js: ✓"
# Xác định base path (src/ hay không)
test -d src/app && BASE=src && echo "App Router (src/): ✓" || { test -d app && BASE=. && echo "App Router: ✓" || echo "✗ KHÔNG có App Router"; }

test -f ${BASE}/lib/leads-supabase.ts && echo "Supabase lead store: ✓" || echo "✗ THIẾU leads-supabase.ts — chạy /biz-setup-sepay-payment (Supabase) trước"
test -f ${BASE}/lib/supabase-admin.ts && echo "service_role client: ✓" || echo "✗ THIẾU supabase-admin.ts"
test -f ${BASE}/app/admin/page.tsx && echo "admin dashboard: ✓" || echo "✗ THIẾU app/admin/page.tsx — chạy /biz-admin-leads-dashboard trước"

# Hiện trạng auth cũ (password) để biết phải patch gì
grep -rl "checkAdminPass\|x-admin-pass\|ADMIN_PASSWORD" ${BASE}/app/api/admin ${BASE}/app/admin 2>/dev/null
ls ${BASE}/app/api/admin/*/route.ts 2>/dev/null
test -f ${BASE}/app/admin/affiliates/page.tsx && echo "có /admin/affiliates (sẽ patch nếu cần)"
```

Xác định **base path** (`src/app` + `src/lib` nếu có `src/`, ngược lại `app` + `lib`) — mọi đường dẫn bên dưới bám theo.

**Gate — thiếu prerequisite thì DỪNG**, báo user chạy skill cần thiết trước. Khi đủ → liệt kê cho user các route `/api/admin/*` sẽ patch + xác nhận sang Phase 1.

---

## Phase 1 — Guide bật Google OAuth (GATE)

Đây là phần thao tác **ngoài code** — user phải làm trên 2 dashboard. Đọc `references/google-oauth-setup.md` và hướng dẫn user theo đúng thứ tự:

1. **Google Cloud Console** → tạo OAuth 2.0 Client ID (Web application) → lấy Client ID + Client Secret. Authorized redirect URI = `https://<PROJECT_REF>.supabase.co/auth/v1/callback`.
2. **Supabase Dashboard** → Authentication → Providers → **Google** → bật + dán Client ID + Secret.
3. **Supabase Dashboard** → Authentication → URL Configuration → thêm Site URL + Redirect URLs: `http://localhost:3000/admin` (dev) và `https://<domain>/admin` (production).

**GATE**: đợi user xác nhận "đã bật Google provider + thêm redirect URL xong" rồi sang Phase 2. (Nếu bỏ qua bước này, nút đăng nhập Google sẽ lỗi `provider is not enabled`.)

---

## Phase 2 — Set env

Trang `/admin` chạy phía browser nên cần Supabase URL + anon key dạng `NEXT_PUBLIC_*` (an toàn để lộ). Server verify token vẫn dùng `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` đã có từ `/biz-setup-sepay-payment`.

```bash
# 2 biến MỚI cho browser (lấy từ Supabase → Project Settings → API):
#   NEXT_PUBLIC_SUPABASE_URL       = giống SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY  = anon/publishable key (KHÔNG phải service_role)
grep -q "^NEXT_PUBLIC_SUPABASE_URL=" .env.local || echo 'NEXT_PUBLIC_SUPABASE_URL=...' >> .env.local
grep -q "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local || echo 'NEXT_PUBLIC_SUPABASE_ANON_KEY=...' >> .env.local

# 2 biến server (phải đã có):
grep -E "^SUPABASE_URL=" .env.local && echo "SUPABASE_URL: ✓"
grep -E "^SUPABASE_SERVICE_ROLE_KEY=" .env.local && echo "SERVICE_ROLE: ✓"
```

Bảo user paste giá trị `NEXT_PUBLIC_SUPABASE_URL` (= Project URL) + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon key). `ADMIN_PASSWORD` cũ có thể giữ lại làm comment hoặc xoá — không còn dùng sau khi patch xong.

---

## Phase 3 — Super admin email + migration (GATE)

Hỏi user:

> Anh/chị cho em **email Google của super admin** — tài khoản tối cao DUY NHẤT được thêm/xoá quản trị viên khác (và không bao giờ tự xoá được mình). Thường là email chính của anh/chị. Ví dụ: `tencua-anh@gmail.com`

**Đợi user trả lời.** Lấy email, lowercase. Đây là giá trị thay vào placeholder `__SUPER_ADMIN_EMAIL__`.

Sau đó hướng dẫn chạy migration. Copy `templates/supabase-migration-admin-users.sql`, **thay `__SUPER_ADMIN_EMAIL__`** bằng email user vừa cho, rồi:

- Project có `supabase/migrations/` → ghi file `supabase/migrations/<YYYYMMDDHHMMSS>_admin_users_allowlist.sql`. Chạy `npm run db:push` nếu có, hoặc bảo user dán vào **Supabase → SQL Editor → Run**.
- Không có thư mục migration → bảo user dán nội dung vào **Supabase → SQL Editor → Run**.

Migration tạo: bảng `admin_users` (RLS deny-all) + hàm `is_admin_email()` (SECURITY DEFINER) + seed 1 dòng super admin. Idempotent (`if not exists` / `on conflict do nothing`).

**GATE**: đợi user confirm "đã chạy SQL xong" rồi sang Phase 4.

---

## Phase 4 — Scaffold 6 file mới

Copy từ `templates/`, đổi đường dẫn theo base path. Thay `__SUPER_ADMIN_EMAIL__` trong `lib-admin-users.ts` bằng email Phase 3. Giữ alias `@/lib/...` nếu project có (Next.js default).

| Template | Đích | Vai trò |
|---|---|---|
| `lib-admin-users.ts` | `lib/admin-users.ts` | `SUPER_ADMIN_EMAIL` hard-code + `isSuperAdmin()` + allowlist CRUD (`listAdminUsers`/`addAdminUser`/`removeAdminUser`) qua service_role |
| `lib-admin-auth.ts` | `lib/admin-auth.ts` | `requireAdmin()` (verify Bearer token offline qua `getClaims` + rpc `is_admin_email`), `requireSuperAdmin()`, `adminAuthError()` → **THAY THẾ** file `lib/admin-auth.ts` cũ (password) |
| `lib-admin-client.ts` | `lib/admin-client.ts` | Browser: `supabaseBrowser` (PKCE), `loginWithGoogle()`, `logout()`, `adminFetch()` đính Bearer token |
| `api-admin-me-route.ts` | `app/api/admin/me/route.ts` | GET → `{ email, isSuperAdmin }` nếu trong allowlist; 401/403 nếu không. Trang dùng để quyết định hiện dashboard / DeniedGate |
| `api-admin-admin-users-route.ts` | `app/api/admin/admin-users/route.ts` | GET list (mọi admin) / POST thêm / DELETE xoá (CHỈ super admin via `requireSuperAdmin`) |
| `components-admin-users-tab.tsx` | `components/AdminUsersTab.tsx` | UI tab "Quản trị viên" — bảng allowlist + form thêm + nút xoá; theme khớp dashboard |

> **Lưu ý `lib/admin-auth.ts`**: file cũ từ `/biz-admin-leads-dashboard` chứa `checkAdminPass()` (password). Template này **ghi đè** nó bằng bản Google. Vì vậy Phase 5 phải patch mọi nơi còn gọi `checkAdminPass()`.

---

## Phase 5 — Patch route + admin page

Theo `references/integration-patches.md` (có before/after chính xác). Hai nhóm patch:

### 5a. Patch mọi route `/api/admin/*` đã có

Với mỗi file route (dashboard, leads, campaigns, và affiliates nếu có) — thay header-password check bằng Bearer check:

```ts
// TRƯỚC (password):
import { checkAdminPass } from "@/lib/admin-auth";
export async function GET(request: Request) {
  if (!checkAdminPass(request)) {
    return Response.json({ error: "invalid_password" }, { status: 401 });
  }
  // ...
}

// SAU (Google + allowlist):
import { requireAdmin, adminAuthError } from "@/lib/admin-auth";
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return adminAuthError(auth);
  // ... (phần còn lại giữ nguyên)
}
```

Dùng grep để tìm hết: `grep -rln "checkAdminPass" ${BASE}/app/api`. Mỗi route thường có nhiều method (GET/POST/PATCH/DELETE) — patch từng method. Route `/api/admin/affiliates` (nếu có từ `/biz-affiliate-system`) cũng nằm trong danh sách này.

### 5b. Patch `app/admin/page.tsx`

Đây là patch lớn nhất. `references/integration-patches.md` có đầy đủ snippet 3 gate + auth state machine + Google icon + style. Tóm tắt việc cần làm:

1. **Import**: thêm `import { supabaseBrowser, adminFetch, loginWithGoogle, logout } from "@/lib/admin-client"` + `import type { Session } from "@supabase/supabase-js"` + `import AdminUsersTab from "@/components/AdminUsersTab"`.
2. **Bỏ state password** (`pass`, `authed`, popup nhập mã) → thay bằng `authState: "checking" | "anon" | "denied" | "ok"` + `email` + `isSuper`, với `useEffect` lắng `onAuthStateChange` + gọi `/api/admin/me` (xem snippet trong reference).
3. **Render gate**: `checking → <CheckingGate/>`, `anon → <LoginGate/>`, `denied → <DeniedGate email/>`. Dán 3 component gate + `GoogleIcon` + style `gateWrap/gateCard/googleBtn/...` từ reference.
4. **Đổi mọi `fetch(..., { headers: { "x-admin-pass": pass } })` → `adminFetch(...)`** (bỏ header password — `adminFetch` tự đính Bearer). Grep `x-admin-pass` trong file để không sót.
5. **Sidebar**: thêm item `{ key: "admins", label: "Quản trị viên", icon: "🔐" }` + nút "Đăng xuất" gọi `logout()` + hiển thị email đang đăng nhập.
6. **Tab body**: thêm `{tab === "admins" && <AdminUsersTab currentEmail={email} isSuper={isSuper} />}` và mở rộng type `Tab` thêm `"admins"`.

Nếu project có `app/admin/affiliates/page.tsx` (trang affiliate đứng riêng từ `/biz-affiliate-system`) dùng popup password riêng → patch tương tự (đổi sang Google gate + `adminFetch`), HOẶC khuyến nghị user gộp affiliate thành 1 tab trong dashboard chính (như project tham chiếu). Mặc định: chỉ đổi auth, giữ nguyên trang đứng riêng.

---

## Phase 6 — Test 4 cấp

1. **Build sạch**: `npm run build` — không lỗi TypeScript (chú ý import `Session` type, alias `@/`).
2. **Login flow (local `npm run dev`)**:
   - Mở `/admin` → thấy LoginGate → bấm "Đăng nhập với Google" → chọn tài khoản **trong allowlist** (super admin) → vào được dashboard, sidebar hiện email + tab "Quản trị viên".
   - Đăng xuất → đăng nhập bằng Gmail **không trong allowlist** → thấy **DeniedGate** "Không có quyền truy cập".
3. **Super admin quản lý**:
   - Tab "Quản trị viên" → "+ Thêm quản trị viên" → nhập 1 email Gmail khác → thấy trong bảng với badge "Quản trị viên".
   - Đăng nhập bằng email vừa thêm → vào được nhưng tab Quản trị viên hiện banner "không thêm/xoá được" (không phải super admin). Nút xoá ẩn.
   - Super admin xoá email đó → email đó mất quyền (lần đăng nhập sau → DeniedGate).
   - Thử xoá super admin → bị chặn (🔒 cố định).
4. **Route bảo vệ** (curl, không token):
   ```bash
   curl -i http://localhost:3000/api/admin/me                 # → 401 no_token
   curl -i http://localhost:3000/api/admin/dashboard?days=7    # → 401 (đã patch requireAdmin)
   ```

---

## Output cuối cùng

```
✓ Đã nâng cấp /admin từ password → Google OAuth + allowlist admin_users

📁 File mới (6):
  lib/admin-users.ts        (SUPER_ADMIN_EMAIL + allowlist CRUD)
  lib/admin-auth.ts         (requireAdmin/requireSuperAdmin — GHI ĐÈ bản password)
  lib/admin-client.ts       (browser OAuth + adminFetch)
  app/api/admin/me/route.ts
  app/api/admin/admin-users/route.ts
  components/AdminUsersTab.tsx

🩹 File đã patch:
  app/admin/page.tsx        (password popup → 3 Google gate + adminFetch + tab Quản trị viên)
  app/api/admin/*/route.ts  (checkAdminPass → requireAdmin) — N route
  app/admin/affiliates/page.tsx (nếu có)

🗄  Supabase migration:
  - Bảng admin_users (RLS deny-all) + hàm is_admin_email() (SECURITY DEFINER)
  - Seed super admin: __SUPER_ADMIN_EMAIL__

🔐 Env mới:
  NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
  (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY tái dùng)

🔧 TODO của anh/chị:
  1. Bật Google provider trong Supabase Auth + tạo OAuth client Google Cloud (Phase 1)
  2. Thêm redirect URL production https://<domain>/admin vào Supabase URL Config
  3. Add 2 env NEXT_PUBLIC_* vào Vercel: vercel env add NEXT_PUBLIC_SUPABASE_URL ...
  4. Re-deploy: vercel --prod → mở https://<domain>/admin → đăng nhập Google
```

---

## Quy ước quan trọng (anti-pattern)

- ❌ **Verify token bằng `auth.getUser()` (gọi network)** → 403 `session_not_found` khi session bị thu hồi ở flow khác dù token còn hạn. Template dùng `getClaims()` verify offline qua JWKS (ES256), vẫn check `exp`.
- ❌ **Lấy super admin từ DB** → nếu bảng `admin_users` bị sửa, mất quyền tối cao. Template **hard-code** `SUPER_ADMIN_EMAIL` trong `lib/admin-users.ts`.
- ❌ **Cho super admin tự xoá mình** → khoá luôn dashboard. `removeAdminUser` chặn `is_super`.
- ❌ **Để anon/publishable key đọc bảng `admin_users`** → lộ danh sách admin. Bảng RLS **deny-all không policy**; chỉ service_role (server) đọc/ghi. Kiểm tra allowlist qua RPC `is_admin_email` SECURITY DEFINER.
- ❌ **Dùng service_role key ở client** → rò rỉ toàn quyền DB. Browser CHỈ dùng `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `lib/admin-client.ts` không bao giờ import service_role.
- ❌ **Còn sót `fetch` với `x-admin-pass`** sau khi đổi auth → request 401 vì server đã bỏ password check. Grep `x-admin-pass` trong page.tsx, đổi HẾT sang `adminFetch`.
- ❌ **Quên thêm redirect URL vào Supabase URL Configuration** → Google login xong nhưng `?code=` không đổi thành phiên → kẹt ở CheckingGate. Phải khai cả localhost lẫn domain production.
- ❌ **Check quyền chỉ ở client** (ẩn tab) mà route không `requireAdmin` → ai cũng curl được. Mọi route `/api/admin/*` phải gọi `requireAdmin()` đầu handler; thao tác super-admin gọi `requireSuperAdmin()`.
- ❌ **So email phân biệt hoa thường** → `Ten@Gmail.com` ≠ allowlist `ten@gmail.com`. Mọi nơi lowercase trước khi so (claims, allowlist, RPC).

## Tham khảo

- `references/google-oauth-setup.md` — guide bật Google provider Supabase + tạo OAuth client Google Cloud + redirect URL (phần thao tác ngoài code).
- `references/integration-patches.md` — before/after chính xác cho route `/api/admin/*` + toàn bộ snippet patch `app/admin/page.tsx` (3 gate + auth state machine + GoogleIcon + style + sidebar + tab).
- `templates/` — 6 file scaffold + 1 SQL migration.
