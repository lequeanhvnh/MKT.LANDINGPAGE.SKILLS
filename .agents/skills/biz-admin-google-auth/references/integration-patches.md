# Integration patches — Phase 5

Sau khi scaffold 6 file mới, đổi lớp auth ở 2 nhóm: (5a) route `/api/admin/*`, (5b) `app/admin/page.tsx`.

---

## 5a. Patch route `/api/admin/*` — checkAdminPass → requireAdmin

Tìm hết route còn dùng password:

```bash
grep -rln "checkAdminPass\|x-admin-pass\|invalid_password" ${BASE}/app/api/admin
```

Với MỖI method trong MỖI file route (GET / POST / PATCH / DELETE), đổi:

### TRƯỚC (password)
```ts
import { checkAdminPass } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!checkAdminPass(request)) {
    return Response.json({ error: "invalid_password" }, { status: 401 });
  }
  // ... logic ...
}
```

### SAU (Google + allowlist)
```ts
import { requireAdmin, adminAuthError } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return adminAuthError(auth);
  // ... logic giữ NGUYÊN ...
}
```

Các điểm cần chú ý:
- `requireAdmin` là **async** — phải `await`. Handler vốn đã `async` nên OK.
- Đổi import dòng đầu file: bỏ `checkAdminPass`, thêm `requireAdmin, adminAuthError` (và `requireSuperAdmin` nếu route có thao tác chỉ super admin được làm).
- Nếu một route có thao tác nhạy cảm chỉ super admin (hiếm — vd reset dữ liệu) → dùng `requireSuperAdmin` cho method đó.
- Route `/api/admin/affiliates/route.ts` (từ `/biz-affiliate-system`) nằm trong danh sách grep này — patch y hệt.

Sau khi patch xong: `grep -rn "checkAdminPass" ${BASE}/app` phải KHÔNG còn kết quả nào.

---

## 5b. Patch `app/admin/page.tsx` — password popup → Google gate

Trang dashboard từ `/biz-admin-leads-dashboard` đang: (a) giữ `pass` trong state, (b) hiện popup nhập mã, (c) gắn header `x-admin-pass` vào mọi `fetch`. Đổi thành Google OAuth.

### B1. Import (đầu file, dưới `"use client";`)

Thêm:
```ts
import { useState, useEffect, useCallback, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  supabaseBrowser,
  adminFetch,
  loginWithGoogle,
  logout,
} from "@/lib/admin-client";
import AdminUsersTab from "@/components/AdminUsersTab";
```
(Gộp với import `react` đã có — đừng khai trùng.)

### B2. Mở rộng type Tab + thêm "admins"
```ts
type Tab = "dashboard" | "leads" | "campaigns" | "admins";
// (giữ các tab cũ của project: leads/campaigns/affiliates/checkins... + thêm "admins")
```

### B3. Thay state password bằng auth state machine

BỎ: `const [pass, setPass] = useState("")`, `const [authed, setAuthed] = useState(false)`, mọi logic popup nhập mã.

THÊM vào component `AdminPage()`:
```ts
type AuthState = "checking" | "anon" | "denied" | "ok";

const [authState, setAuthState] = useState<AuthState>("checking");
const [email, setEmail] = useState("");
const [isSuper, setIsSuper] = useState(false);

useEffect(() => {
  let cancelled = false;

  async function evaluate(session: Session | null) {
    if (!session) {
      if (!cancelled) setAuthState("anon");
      return;
    }
    try {
      const res = await adminFetch("/api/admin/me");
      if (cancelled) return;
      if (res.ok) {
        const json = (await res.json()) as { email: string; isSuperAdmin?: boolean };
        setEmail(json.email);
        setIsSuper(Boolean(json.isSuperAdmin));
        setAuthState("ok");
      } else if (res.status === 403) {
        setEmail(session.user.email ?? "");
        setAuthState("denied");
      } else {
        setAuthState("anon");
      }
    } catch {
      if (!cancelled) setAuthState("anon");
    }
  }

  const hasOAuthCode = new URLSearchParams(window.location.search).has("code");
  const { data: sub } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
    if (session) void evaluate(session);
    else if (event === "INITIAL_SESSION" && hasOAuthCode) {
      /* đang đổi ?code= → chờ SIGNED_IN */
    } else setAuthState("anon");
  });

  const timer = window.setTimeout(() => {
    if (!cancelled) setAuthState((s) => (s === "checking" ? "anon" : s));
  }, 8000);

  return () => {
    cancelled = true;
    window.clearTimeout(timer);
    sub.subscription.unsubscribe();
  };
}, []);
```

### B4. Render gate trước dashboard
```ts
if (authState === "checking") return <CheckingGate />;
if (authState === "anon") return <LoginGate />;
if (authState === "denied") return <DeniedGate email={email} />;
// ... return dashboard như cũ ...
```

### B5. Dán 3 gate component + GoogleIcon (cuối file, cạnh các component khác)

```tsx
function GateShell({ children }: { children: ReactNode }) {
  return (
    <div style={S.gateWrap}>
      <div style={S.gateCard}>{children}</div>
    </div>
  );
}

function CheckingGate() {
  return (
    <GateShell>
      <div style={S.gateLogo}>📊</div>
      <h2 style={S.gateTitle}>Trang quản trị</h2>
      <p style={S.gateSub}>Đang kiểm tra đăng nhập…</p>
    </GateShell>
  );
}

function LoginGate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function start() {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch {
      setError("Không mở được đăng nhập Google. Anh/chị thử lại nhé.");
      setLoading(false);
    }
  }
  return (
    <GateShell>
      <div style={S.gateLogo}>📊</div>
      <h2 style={S.gateTitle}>Trang quản trị</h2>
      <p style={S.gateSub}>Đăng nhập bằng Google để xem dashboard.</p>
      {error && <div style={S.gateError}>{error}</div>}
      <button onClick={start} disabled={loading} style={S.googleBtn}>
        <GoogleIcon />
        {loading ? "Đang chuyển tới Google…" : "Đăng nhập với Google"}
      </button>
      <p style={S.gateFootnote}>
        Chỉ tài khoản được cấp quyền mới vào được. Super admin thêm quản trị viên
        mới trong tab “Quản trị viên”.
      </p>
    </GateShell>
  );
}

function DeniedGate({ email }: { email: string }) {
  return (
    <GateShell>
      <div style={S.gateLogo}>🚫</div>
      <h2 style={S.gateTitle}>Không có quyền truy cập</h2>
      <p style={S.gateSub}>
        Tài khoản <strong>{email || "này"}</strong> chưa được cấp quyền vào trang
        quản trị. Anh/chị đăng nhập bằng tài khoản khác, hoặc nhờ super admin thêm
        email này trong tab “Quản trị viên”.
      </p>
      <button onClick={() => void logout()} style={S.btnPrimary}>
        Đăng nhập tài khoản khác
      </button>
    </GateShell>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" fill="#FBBC05" />
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}
```

### B6. Đổi mọi fetch password → adminFetch

```bash
grep -n "x-admin-pass\|fetch(" ${BASE}/app/admin/page.tsx
```

TRƯỚC:
```ts
const res = await fetch(`/api/admin/dashboard?days=${days}`, {
  headers: { "x-admin-pass": pass },
});
```
SAU:
```ts
const res = await adminFetch(`/api/admin/dashboard?days=${days}`);
```

Quy tắc: bỏ object `{ headers: { "x-admin-pass": pass } }`; nếu là POST/DELETE thì giữ `method`/`body`/`content-type` nhưng bỏ header pass. `adminFetch` tự thêm Bearer. Sau khi đổi: `grep "x-admin-pass" ${BASE}/app/admin/page.tsx` phải rỗng.

### B7. Sidebar — thêm tab + đăng xuất + email

Trong mảng `items` của Sidebar, thêm:
```ts
{ key: "admins", label: "Quản trị viên", icon: "🔐" },
```
Thêm vùng user dưới nav (truyền `email` vào Sidebar):
```tsx
<div style={S.sidebarUser}>
  {email && <div style={S.sidebarEmail} title={email}>{email}</div>}
  <button onClick={() => void logout()} style={S.logoutBtn}>Đăng xuất</button>
</div>
```

### B8. Tab body — render AdminUsersTab
```tsx
{tab === "admins" && <AdminUsersTab currentEmail={email} isSuper={isSuper} />}
```

### B9. Style cần thêm vào object `S` của page.tsx
```ts
gateWrap: { position: "fixed", inset: 0, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
gateCard: { width: "100%", maxWidth: 380, background: "#fff", borderRadius: 14, padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 14 },
gateLogo: { fontSize: 36, marginBottom: 4 },
gateTitle: { fontSize: 20, fontWeight: 700, margin: 0, color: "#111827" },
gateSub: { fontSize: 13, color: "#6b7280", margin: "0 0 8px 0" },
gateError: { background: "#fee2e2", color: "#991b1b", padding: "8px 12px", borderRadius: 6, fontSize: 12.5 },
googleBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#3c4043", background: "#fff", border: "1px solid #dadce0", borderRadius: 10, cursor: "pointer" },
gateFootnote: { fontSize: 11.5, color: "#9ca3af", margin: 0, lineHeight: 1.5 },
sidebarUser: { display: "flex", flexDirection: "column", gap: 8 },
sidebarEmail: { fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", padding: "0 4px" },
logoutBtn: { padding: "8px 12px", fontSize: 12.5, color: "#cbd5e1", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, cursor: "pointer" },
```
(Chỉnh màu `logoutBtn` cho hợp sidebar tối/sáng của project.)

---

## Trang affiliate đứng riêng (nếu có)

Nếu project có `app/admin/affiliates/page.tsx` từ `/biz-affiliate-system` (popup password riêng):

- **Cách tối thiểu**: đổi auth của riêng nó — bỏ popup password, dùng cùng pattern gate Google (copy B3–B5) + đổi `fetch x-admin-pass` → `adminFetch`. Route `/api/admin/affiliates` đã patch ở 5a nên đã yêu cầu Bearer.
- **Cách gọn hơn (khuyến nghị nếu user muốn)**: gộp affiliate thành 1 tab trong dashboard chính (`{ key: "affiliates", ... }` + `{tab === "affiliates" && <AffiliatesTab />}`), giống project tham chiếu. Chỉ làm khi user đồng ý — nó đụng cấu trúc nhiều hơn.

Mặc định: chỉ đổi auth, giữ nguyên trang đứng riêng.

---

## Test nhanh sau patch

```bash
npm run build   # 0 lỗi TS
# rồi npm run dev → /admin → login Google (allowlist) → vào được + tab Quản trị viên
curl -i http://localhost:3000/api/admin/me   # 401 no_token (không có Bearer)
```
