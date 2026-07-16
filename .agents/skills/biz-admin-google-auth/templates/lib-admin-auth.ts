// lib/admin-auth.ts
//
// Xác thực trang /admin bằng Google OAuth (Supabase Auth) + allowlist.
// Browser đăng nhập Google → gửi access token qua header
// `Authorization: Bearer <token>` → server verify token rồi đối chiếu email
// với bảng `admin_users` qua hàm is_admin_email().
//
// ⚠️ File này GHI ĐÈ bản admin-auth.ts cũ (password / checkAdminPass) từ
//    /biz-admin-leads-dashboard. Sau khi thay, patch mọi route /api/admin/*
//    còn gọi checkAdminPass() sang requireAdmin().

import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isSuperAdmin } from "@/lib/admin-users";

export type AdminAuth =
  | { ok: true; email: string; isSuperAdmin: boolean }
  | { ok: false; reason: "no_token" | "invalid_token" | "not_allowed" };

/** Verify Bearer token của request + kiểm tra email có trong allowlist admin_users. */
export async function requireAdmin(request: Request): Promise<AdminAuth> {
  const authz = request.headers.get("authorization") ?? "";
  const token = authz.toLowerCase().startsWith("bearer ")
    ? authz.slice(7).trim()
    : "";
  if (!token) return { ok: false, reason: "no_token" };

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[admin-auth] thiếu SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    return { ok: false, reason: "invalid_token" };
  }

  try {
    // 1. Verify token CỤC BỘ bằng getClaims() — project ký JWT bằng ES256 nên
    //    chữ ký được verify offline qua JWKS, KHÔNG gọi /auth/v1/user. Tránh
    //    lỗi 403 "session_not_found" khi session bị thu hồi (đăng xuất ở
    //    tab/flow khác) trong khi token vẫn còn hạn. getClaims vẫn check exp.
    const verifier = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await verifier.auth.getClaims(token);
    const email = data?.claims?.email?.trim().toLowerCase();
    if (error || !email) return { ok: false, reason: "invalid_token" };

    // 2. Đối chiếu allowlist qua hàm SECURITY DEFINER — bỏ qua RLS chắc chắn.
    const { data: isAdmin, error: rpcErr } = await getSupabaseAdmin().rpc(
      "is_admin_email",
      { p_email: email },
    );
    if (rpcErr) {
      console.error("[admin-auth] rpc is_admin_email lỗi:", rpcErr);
      return { ok: false, reason: "invalid_token" };
    }
    if (!isAdmin) return { ok: false, reason: "not_allowed" };

    return { ok: true, email, isSuperAdmin: isSuperAdmin(email) };
  } catch (err) {
    console.error("[admin-auth] lỗi xác thực:", err);
    return { ok: false, reason: "invalid_token" };
  }
}

/**
 * Như requireAdmin nhưng yêu cầu thêm: email phải là super admin.
 * Dùng cho các thao tác chỉ super admin được làm (vd: thêm/xoá quản trị viên).
 * Admin thường bị trả `not_allowed` (403).
 */
export async function requireSuperAdmin(request: Request): Promise<AdminAuth> {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth;
  if (!auth.isSuperAdmin) return { ok: false, reason: "not_allowed" };
  return auth;
}

/** Chuyển kết quả requireAdmin thất bại thành Response chuẩn (401 / 403). */
export function adminAuthError(
  auth: Extract<AdminAuth, { ok: false }>,
): Response {
  const status = auth.reason === "not_allowed" ? 403 : 401;
  return Response.json({ error: auth.reason }, { status });
}
