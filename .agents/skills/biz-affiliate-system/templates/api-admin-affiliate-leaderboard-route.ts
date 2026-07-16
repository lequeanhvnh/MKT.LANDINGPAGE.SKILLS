// app/api/admin/affiliate-leaderboard/route.ts
//
// GET /api/admin/affiliate-leaderboard?period=week|month|year|all
// Bảng xếp hạng đối tác theo doanh thu giới thiệu trong kỳ (cho /admin).
//
// Auth: dùng chung lib/admin-auth.ts của project.
//   - Bản password (mặc định skill này): checkAdminPass(request.headers.get("x-admin-pass")).
//   - Nếu đã chạy /biz-admin-google-auth: file admin-auth.ts đã đổi sang
//     requireAdmin(request) (Bearer token). Skill đó tự patch route này.
//
// ⚠️ DƯỚI ĐÂY là bản PASSWORD (khớp skill biz-affiliate-system mặc định).

import { checkAdminPass } from "@/lib/admin-auth";
import {
  getAdminAffiliateLeaderboard,
  type LeaderboardPeriod,
} from "@/lib/affiliate";

export const dynamic = "force-dynamic";

const VALID: ReadonlySet<LeaderboardPeriod> = new Set([
  "week",
  "month",
  "year",
  "all",
]);

export async function GET(request: Request) {
  if (!checkAdminPass(request.headers.get("x-admin-pass"))) {
    return Response.json({ error: "invalid_password" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("period") ?? "month") as LeaderboardPeriod;
  const period: LeaderboardPeriod = VALID.has(raw) ? raw : "month";

  try {
    const data = await getAdminAffiliateLeaderboard(period);
    return Response.json(data);
  } catch (err) {
    console.error("[/api/admin/affiliate-leaderboard]", err);
    return Response.json(
      {
        error: "internal_error",
        message: err instanceof Error ? err.message : "Unknown",
      },
      { status: 500 },
    );
  }
}
