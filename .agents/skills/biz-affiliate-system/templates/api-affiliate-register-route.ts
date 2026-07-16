// app/api/affiliate/register/route.ts
//
// Đăng ký làm Đối tác giới thiệu (affiliate) — endpoint CÔNG KHAI, tự phục vụ.
// POST {name, email, phone} → tạo affiliate nhóm Pro (30% hoa hồng) → trả về
// mã đối tác. Đối tác active ngay, đăng nhập portal /affiliate bằng mã + email.
// Sau khi tạo thành công → gửi email welcome (kèm mã + link giới thiệu).
//
// Khác /api/affiliate (portal data, cần verify) và /api/admin/affiliates (admin
// tạo tay) — route này cho phép người dùng tự tạo tài khoản đối tác.

import { createAffiliate } from "@/lib/affiliate";
import { sendAffiliateWelcomeEmail } from "@/lib/affiliate-mailer";

export const dynamic = "force-dynamic";

type RegisterBody = { name?: string; email?: string; phone?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// SĐT Việt Nam — 0xxxxxxxxx hoặc +84xxxxxxxxx.
const PHONE_RE = /^(0|\+84)[0-9]{9}$/;

export async function POST(request: Request) {
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = (body.name ?? "").trim().slice(0, 120);
  const email = (body.email ?? "").trim().toLowerCase().slice(0, 160);
  const phone = (body.phone ?? "").replace(/\s+/g, "").slice(0, 20);

  if (name.length < 2) return Response.json({ error: "invalid_name" }, { status: 400 });
  if (!EMAIL_RE.test(email)) return Response.json({ error: "invalid_email" }, { status: 400 });
  if (!PHONE_RE.test(phone)) return Response.json({ error: "invalid_phone" }, { status: 400 });

  // tier "pro" → commission_rate mặc định 30% (xem TIER_RATES trong lib/affiliate).
  const result = await createAffiliate({
    name,
    email,
    phone,
    tier: "pro",
    note: "Tự đăng ký qua /aff-register",
  });

  if (!result.ok) {
    // email_exists → 409 để client gợi ý đăng nhập portal; còn lại 500.
    const status = result.error === "email_exists" ? 409 : 500;
    return Response.json({ error: result.error }, { status });
  }

  // Welcome email — fire-and-forget, KHÔNG để lỗi email làm fail đăng ký.
  try {
    await sendAffiliateWelcomeEmail({
      name: result.affiliate.name,
      email: result.affiliate.email,
      affCode: result.affiliate.affCode,
      commissionRate: result.affiliate.commissionRate,
    });
  } catch (err) {
    console.error("[aff-register] welcome email fail:", err);
  }

  return Response.json({
    ok: true,
    affCode: result.affiliate.affCode,
    name: result.affiliate.name,
    commissionRate: result.affiliate.commissionRate,
  });
}
