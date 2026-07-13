// app/api/admin/me/route.ts
//
// GET /api/admin/me — trả { email, isSuperAdmin } nếu phiên Google hiện tại
// nằm trong allowlist admin_users; 401 (chưa đăng nhập) / 403 (không có quyền)
// nếu không. Trang /admin gọi route này để quyết định hiện dashboard hay màn
// "không có quyền", và để biết có hiện tab quản trị viên (super admin) không.

import { requireAdmin, adminAuthError } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return adminAuthError(auth);
  return Response.json({ email: auth.email, isSuperAdmin: auth.isSuperAdmin });
}
