// lib/admin-users.ts
//
// Quản lý allowlist `admin_users` — danh sách email được đăng nhập trang /admin.
// Chỉ super admin (SUPER_ADMIN_EMAIL) mới được thêm / xoá quản trị viên.
// Dùng service_role client (bypass RLS) — chỉ chạy server-side.

import { getSupabaseAdmin } from "./supabase-admin";

/**
 * Email super admin — DUY NHẤT tài khoản này được thêm / xoá quản trị viên.
 * Cố tình hard-code (không lấy từ DB) để dù bảng admin_users có bị sửa thì
 * quyền tối cao vẫn cố định, và super admin không bao giờ tự xoá được mình.
 *
 * ⚠️ THAY bằng email Google của super admin (viết thường). Phải KHỚP dòng
 * seed trong migration supabase-migration-admin-users.sql.
 */
export const SUPER_ADMIN_EMAIL = "__SUPER_ADMIN_EMAIL__";

/** true nếu email là super admin (so khớp không phân biệt hoa thường). */
export function isSuperAdmin(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

export type AdminUser = {
  email: string;
  note: string | null;
  createdAt: string;
  isSuper: boolean;
};

export type AddAdminResult =
  | { ok: true; admin: AdminUser }
  | { ok: false; error: "email_exists" | "db_error" };

export type RemoveAdminResult =
  | { ok: true }
  | { ok: false; error: "is_super" | "not_found" | "db_error" };

function toAdminUser(row: {
  email: string;
  note: string | null;
  created_at: string;
}): AdminUser {
  return {
    email: row.email,
    note: row.note ?? null,
    createdAt: row.created_at,
    isSuper: isSuperAdmin(row.email),
  };
}

/** Danh sách quản trị viên — super admin xếp đầu, còn lại theo ngày thêm. */
export async function listAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("admin_users")
    .select("email, note, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []).map(toAdminUser);
  rows.sort((a, b) => Number(b.isSuper) - Number(a.isSuper));
  return rows;
}

/** Thêm 1 quản trị viên mới vào allowlist. Email tự chuẩn hoá về chữ thường. */
export async function addAdminUser(
  emailRaw: string,
  noteRaw?: string,
): Promise<AddAdminResult> {
  const email = emailRaw.trim().toLowerCase();
  const note = noteRaw?.trim() || null;

  const { data, error } = await getSupabaseAdmin()
    .from("admin_users")
    .insert({ email, note })
    .select("email, note, created_at")
    .single();

  if (error) {
    // 23505 = unique_violation → email đã có trong allowlist.
    if ((error as { code?: string }).code === "23505") {
      return { ok: false, error: "email_exists" };
    }
    console.error("[admin-users] addAdminUser lỗi:", error);
    return { ok: false, error: "db_error" };
  }
  return { ok: true, admin: toAdminUser(data) };
}

/** Xoá 1 quản trị viên khỏi allowlist. KHÔNG bao giờ xoá được super admin. */
export async function removeAdminUser(
  emailRaw: string,
): Promise<RemoveAdminResult> {
  const email = emailRaw.trim().toLowerCase();
  if (isSuperAdmin(email)) return { ok: false, error: "is_super" };

  const { data, error } = await getSupabaseAdmin()
    .from("admin_users")
    .delete()
    .eq("email", email)
    .select("email");

  if (error) {
    console.error("[admin-users] removeAdminUser lỗi:", error);
    return { ok: false, error: "db_error" };
  }
  if (!data || data.length === 0) return { ok: false, error: "not_found" };
  return { ok: true };
}
