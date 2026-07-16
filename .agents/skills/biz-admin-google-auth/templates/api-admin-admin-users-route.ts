// app/api/admin/admin-users/route.ts
//
// Quản lý allowlist quản trị viên trang /admin.
//   GET    → { admins, superAdminEmail, isSuperAdmin } — mọi admin xem được
//   POST   → thêm admin   { email, note? }            — CHỈ super admin
//   DELETE → xoá admin    ?email=...                  — CHỈ super admin
//
// Auth qua Authorization: Bearer <token> (Supabase Google OAuth).

import {
  requireAdmin,
  requireSuperAdmin,
  adminAuthError,
} from "@/lib/admin-auth";
import {
  addAdminUser,
  listAdminUsers,
  removeAdminUser,
  SUPER_ADMIN_EMAIL,
} from "@/lib/admin-users";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function serverError(scope: string, err: unknown) {
  console.error(`[/api/admin/admin-users ${scope}]`, err);
  return Response.json({ error: "internal_error" }, { status: 500 });
}

// ---------------------------------------------------------------------------
// GET — danh sách quản trị viên (mọi admin xem được)
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return adminAuthError(auth);
  try {
    const admins = await listAdminUsers();
    return Response.json({
      admins,
      superAdminEmail: SUPER_ADMIN_EMAIL,
      isSuperAdmin: auth.isSuperAdmin,
    });
  } catch (err) {
    return serverError("GET", err);
  }
}

// ---------------------------------------------------------------------------
// POST — thêm quản trị viên (chỉ super admin)
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return adminAuthError(auth);

  let body: { email?: string; note?: string };
  try {
    body = (await request.json()) as { email?: string; note?: string };
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email) return Response.json({ error: "missing_email" }, { status: 400 });
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  try {
    const result = await addAdminUser(email, body.note);
    if (!result.ok) {
      const status = result.error === "email_exists" ? 409 : 500;
      return Response.json({ error: result.error }, { status });
    }
    return Response.json({ ok: true, admin: result.admin });
  } catch (err) {
    return serverError("POST", err);
  }
}

// ---------------------------------------------------------------------------
// DELETE — xoá quản trị viên (chỉ super admin); super admin không xoá được
// ---------------------------------------------------------------------------

export async function DELETE(request: Request) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return adminAuthError(auth);

  const email =
    new URL(request.url).searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!email) return Response.json({ error: "missing_email" }, { status: 400 });

  try {
    const result = await removeAdminUser(email);
    if (!result.ok) {
      const status =
        result.error === "is_super" ? 403 : result.error === "not_found" ? 404 : 500;
      return Response.json({ error: result.error }, { status });
    }
    return Response.json({ ok: true });
  } catch (err) {
    return serverError("DELETE", err);
  }
}
