// lib/admin-auth.ts
//
// CHỈ scaffold file này NẾU project chưa có lib/admin-auth.ts.
// (biz-admin-leads-dashboard tạo file y hệt — không ghi đè nếu đã tồn tại.)
//
// So sánh ADMIN_PASSWORD timing-safe để chặn timing attack.

import { timingSafeEqual } from "node:crypto";

export function checkAdminPass(headerPass: string | null): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !headerPass) return false;
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(headerPass, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
