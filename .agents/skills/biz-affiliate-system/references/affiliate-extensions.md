# Affiliate extensions — đăng ký công khai + leaderboard + 4 loại email

Phần bổ sung cho `biz-affiliate-system` (ngoài 9 template gốc). Gồm: (A) hàm lib cần thêm vào `lib/affiliate.ts`, (B) đổi `recordCommissionForOrder` để trả info gửi email, (C) các patch wire 4 loại email + leaderboard route + podium UI, (D) bulk email cho aff (đụng `biz-admin-leads-dashboard`).

Yêu cầu nền: đã chạy `biz-affiliate-system` (bản gốc) + `biz-email-setup` (có `nodemailer` + SMTP env). Nếu thiếu SMTP → email tự bỏ qua (gated), không lỗi.

Thêm env (nếu chưa có) — dùng cho link trong email:
```
LANDING_PAGE_URL=https://<domain-production>
```

---

## A. Hàm thêm vào `lib/affiliate.ts`

### A1. Helpers mask (đặt cạnh các helper khác)
```ts
const LEADERBOARD_SIZE = 10;

/** Che giữa tên: "Nguyễn Thị Linh" → "Nguyễn ••• Linh". Giữ từ đầu + từ cuối. */
function maskName(raw: string): string {
  const parts = (raw ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? "Đối tác";
  return `${parts[0]} ••• ${parts[parts.length - 1]}`;
}

/** Che SĐT: giữ 4 số đầu + 3 số cuối. "0901234567" → "0901***567". */
function maskPhone(raw: string): string {
  const p = (raw ?? "").replace(/\s+/g, "");
  if (p.length <= 7) return p.length <= 3 ? p : p.slice(0, 2) + "***";
  return p.slice(0, 4) + "***" + p.slice(-3);
}
```

### A2. Leaderboard portal (đối tác xem ranking — CÓ mask tên)
```ts
export type LeaderboardEntry = {
  rank: number;
  affCode: string;
  name: string; // đã mask trừ chính mình
  tier: AffiliateTier;
  isMe: boolean;
  orders: number;
  revenue: number;
  commissionTotal: number;
};
export type LeaderboardData = {
  top: LeaderboardEntry[];
  me: LeaderboardEntry | null;
  totalRanked: number;
};

export async function getAffiliateLeaderboard(
  currentAffCode: string,
  limit = LEADERBOARD_SIZE,
): Promise<LeaderboardData> {
  const supabase = getSupabaseAdmin();
  const meCode = normalizeAffCode(currentAffCode);

  const [affRes, comRes] = await Promise.all([
    supabase.from("affiliates").select("id, name, aff_code, tier"),
    supabase
      .from("affiliate_commissions")
      .select("affiliate_id, status, order_amount, commission_amount"),
  ]);
  if (affRes.error) throw new Error(`getAffiliateLeaderboard failed: ${affRes.error.message}`);

  type Agg = { orders: number; revenue: number; commissionTotal: number };
  const aggById = new Map<string, Agg>();
  for (const c of (comRes.data ?? []) as Array<{ affiliate_id: string; status: CommissionStatus; order_amount: number; commission_amount: number }>) {
    if (c.status === "rejected") continue;
    const a = aggById.get(c.affiliate_id) ?? { orders: 0, revenue: 0, commissionTotal: 0 };
    a.orders += 1;
    a.revenue += Number(c.order_amount) || 0;
    a.commissionTotal += Number(c.commission_amount) || 0;
    aggById.set(c.affiliate_id, a);
  }

  const ranked = ((affRes.data ?? []) as Array<{ id: string; name: string; aff_code: string; tier: AffiliateTier }>)
    .map((a) => ({ affCode: a.aff_code, rawName: a.name, tier: a.tier, isMe: a.aff_code === meCode, ...(aggById.get(a.id) ?? { orders: 0, revenue: 0, commissionTotal: 0 }) }))
    .filter((e) => e.orders > 0)
    .sort((x, y) => y.commissionTotal - x.commissionTotal || y.orders - x.orders || y.revenue - x.revenue);

  const toEntry = (e: (typeof ranked)[number], rank: number): LeaderboardEntry => ({
    rank, affCode: e.affCode, name: e.isMe ? e.rawName : maskName(e.rawName),
    tier: e.tier, isMe: e.isMe, orders: e.orders, revenue: e.revenue, commissionTotal: e.commissionTotal,
  });

  const top = ranked.slice(0, limit).map((e, i) => toEntry(e, i + 1));
  const meIndex = ranked.findIndex((e) => e.isMe);
  const me = meIndex >= 0 ? toEntry(ranked[meIndex], meIndex + 1) : null;
  return { top, me, totalRanked: ranked.length };
}
```

### A3. Leaderboard admin (podium theo kỳ — KHÔNG mask, có email + status)
```ts
export type LeaderboardPeriod = "week" | "month" | "year" | "all";
export type AdminLeaderboardEntry = {
  rank: number; affiliateId: string; affCode: string; name: string; email: string;
  tier: AffiliateTier; status: AffiliateStatus; orders: number; revenue: number; commissionTotal: number;
};
export type AdminLeaderboardData = {
  period: LeaderboardPeriod; periodLabel: string; periodStart: string | null;
  podium: AdminLeaderboardEntry[]; rest: AdminLeaderboardEntry[]; totalRanked: number;
};

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  week: "Tuần này", month: "Tháng này", year: "Năm nay", all: "Toàn thời gian",
};
const VN_TZ_OFFSET_MS = 7 * 60 * 60 * 1000;

function periodStartIso(period: LeaderboardPeriod): string | null {
  if (period === "all") return null;
  const nowVn = new Date(Date.now() + VN_TZ_OFFSET_MS);
  const y = nowVn.getUTCFullYear(), m = nowVn.getUTCMonth(), d = nowVn.getUTCDate(), dow = nowVn.getUTCDay();
  let startVn: Date;
  if (period === "week") { const back = dow === 0 ? 6 : dow - 1; startVn = new Date(Date.UTC(y, m, d - back)); }
  else if (period === "month") startVn = new Date(Date.UTC(y, m, 1));
  else startVn = new Date(Date.UTC(y, 0, 1));
  return new Date(startVn.getTime() - VN_TZ_OFFSET_MS).toISOString();
}

export async function getAdminAffiliateLeaderboard(
  period: LeaderboardPeriod = "month",
  limit = 10,
): Promise<AdminLeaderboardData> {
  const supabase = getSupabaseAdmin();
  const startIso = periodStartIso(period);

  let comQuery = supabase
    .from("affiliate_commissions")
    .select("affiliate_id, status, order_amount, commission_amount, created_at");
  if (startIso) comQuery = comQuery.gte("created_at", startIso);

  const [affRes, comRes] = await Promise.all([
    supabase.from("affiliates").select("id, name, email, aff_code, tier, status"),
    comQuery,
  ]);
  if (affRes.error) throw new Error(`getAdminAffiliateLeaderboard failed: ${affRes.error.message}`);
  if (comRes.error) throw new Error(`getAdminAffiliateLeaderboard failed: ${comRes.error.message}`);

  type Agg = { orders: number; revenue: number; commissionTotal: number };
  const aggById = new Map<string, Agg>();
  for (const c of (comRes.data ?? []) as Array<{ affiliate_id: string; status: CommissionStatus; order_amount: number; commission_amount: number }>) {
    if (c.status === "rejected") continue;
    const a = aggById.get(c.affiliate_id) ?? { orders: 0, revenue: 0, commissionTotal: 0 };
    a.orders += 1; a.revenue += Number(c.order_amount) || 0; a.commissionTotal += Number(c.commission_amount) || 0;
    aggById.set(c.affiliate_id, a);
  }

  const ranked = ((affRes.data ?? []) as Array<{ id: string; name: string; email: string; aff_code: string; tier: AffiliateTier; status: AffiliateStatus }>)
    .map((a) => ({ affiliateId: a.id, affCode: a.aff_code, name: a.name, email: a.email, tier: a.tier, status: a.status, ...(aggById.get(a.id) ?? { orders: 0, revenue: 0, commissionTotal: 0 }) }))
    .filter((e) => e.orders > 0)
    .sort((x, y) => y.revenue - x.revenue || y.commissionTotal - x.commissionTotal || y.orders - x.orders);

  const toEntry = (e: (typeof ranked)[number], rank: number): AdminLeaderboardEntry => ({
    rank, affiliateId: e.affiliateId, affCode: e.affCode, name: e.name, email: e.email,
    tier: e.tier, status: e.status, orders: e.orders, revenue: e.revenue, commissionTotal: e.commissionTotal,
  });

  const all = ranked.slice(0, limit).map((e, i) => toEntry(e, i + 1));
  return { period, periodLabel: PERIOD_LABELS[period], periodStart: startIso, podium: all.slice(0, 3), rest: all.slice(3), totalRanked: ranked.length };
}
```

### A4. Referrals (danh sách khách đối tác đã giới thiệu — SĐT mask)
```ts
export type ReferralStatus = "pending" | "paid";
export type AffiliateReferral = {
  name: string; phoneMasked: string; ticket: string; amount: number; status: ReferralStatus; createdAt: string;
};

export async function listAffiliateReferrals(affCode: string): Promise<AffiliateReferral[]> {
  const code = normalizeAffCode(affCode);
  if (!code) return [];
  const { data, error } = await getSupabaseAdmin()
    .from("leads")
    .select("name, phone, product_name, amount, status, created_at")
    .eq("aff_code", code)
    .order("created_at", { ascending: false });
  if (error) { console.error("listAffiliateReferrals failed:", error.message); return []; }
  return ((data ?? []) as Array<{ name: string; phone: string | null; product_name: string | null; amount: number | null; status: ReferralStatus; created_at: string }>)
    .map((r) => ({ name: r.name, phoneMasked: maskPhone(r.phone ?? ""), ticket: r.product_name ?? "", amount: Number(r.amount) || 0, status: r.status, createdAt: r.created_at }));
}
```

### A5. Cập nhật `getAffiliatePortalData` — kèm referrals + leaderboard
Sửa type trả về + thêm 2 trường vào Promise.all:
```ts
export type AffiliatePortalData = {
  affiliate: Affiliate; stats: AffiliateStats; commissions: Commission[];
  referrals: AffiliateReferral[]; leaderboard: LeaderboardData;
};
// trong getAffiliatePortalData, đổi Promise.all để gọi thêm:
//   listAffiliateReferrals(affiliate.affCode)
//   getAffiliateLeaderboard(affiliate.affCode)
// rồi return { affiliate, stats, commissions, referrals, leaderboard }
```
(Trang portal `app/affiliate/page.tsx` có thể render thêm 2 mục này; tối thiểu giữ nguyên cũng không lỗi vì trường mới optional ở UI.)

---

## B. Đổi `recordCommissionForOrder` để trả info gửi email

Thay chữ ký `Promise<void>` → trả `CommissionEarnedInfo | null` (null nếu đơn không qua aff / trùng / đối tác paused). Thêm `email` + `name` vào select affiliate.

```ts
export type CommissionEarnedInfo = {
  affiliateId: string; affiliateName: string; affiliateEmail: string; affCode: string;
  orderId: string; customerName: string; ticket: string;
  orderAmount: number; commissionRate: number; commissionAmount: number;
};

export async function recordCommissionForOrder(orderId: string): Promise<CommissionEarnedInfo | null> {
  const supabase = getSupabaseAdmin();
  const { data: lead, error: leadErr } = await supabase
    .from("leads").select("order_id, name, product_name, amount, aff_code").eq("order_id", orderId).maybeSingle();
  if (leadErr || !lead) return null;

  const affCode = lead.aff_code ? normalizeAffCode(lead.aff_code as string) : "";
  if (!affCode) return null;

  const { data: aff } = await supabase
    .from("affiliates").select("id, name, email, aff_code, commission_rate, status").eq("aff_code", affCode).maybeSingle();
  if (!aff || aff.status !== "active") return null;

  const orderAmount = Number(lead.amount) || 0;
  const rate = Number(aff.commission_rate) || 0;
  const commissionAmount = Math.round((orderAmount * rate) / 100);

  const { error } = await supabase.from("affiliate_commissions").insert({
    affiliate_id: aff.id, aff_code: aff.aff_code, order_id: orderId,
    customer_name: lead.name, ticket: lead.product_name, order_amount: orderAmount,
    commission_rate: rate, commission_amount: commissionAmount, status: "pending",
  });
  if (error) {
    // 23505 = order_id đã có hoa hồng → webhook retry, KHÔNG email lần 2.
    if (error.code !== "23505") console.error(`recordCommissionForOrder(${orderId}) failed:`, error.message);
    return null;
  }

  return {
    affiliateId: aff.id as string, affiliateName: aff.name as string, affiliateEmail: aff.email as string,
    affCode: aff.aff_code as string, orderId, customerName: lead.name as string,
    ticket: (lead.product_name as string) ?? "", orderAmount, commissionRate: rate, commissionAmount,
  };
}
```

---

## C. Wire 4 loại email + leaderboard route + podium UI

### C1. Email "có hoa hồng mới" — patch `app/api/sepay-webhook/route.ts`
Bản gốc skill gọi `recordCommissionForOrder(orderId)` (bỏ kết quả). Đổi thành:
```ts
import { recordCommissionForOrder } from "@/lib/affiliate";
import { sendAffiliateCommissionEarnedEmail } from "@/lib/affiliate-mailer";
// ... sau khi markOrderPaid() thành công:
try {
  const earned = await recordCommissionForOrder(orderId);
  if (earned) {
    await sendAffiliateCommissionEarnedEmail({
      affiliateName: earned.affiliateName, affiliateEmail: earned.affiliateEmail, affCode: earned.affCode,
      customerName: earned.customerName, ticket: earned.ticket, orderAmount: earned.orderAmount,
      commissionRate: earned.commissionRate, commissionAmount: earned.commissionAmount, orderId: earned.orderId,
    });
  }
} catch (e) {
  console.error("[sepay-webhook] commission/email error:", e); // KHÔNG fail xác nhận thanh toán
}
```

### C2. Email "đã chi trả" — patch `app/api/admin/affiliates/route.ts` (method PATCH đổi trạng thái)
Sau khi `updateCommissionStatus(id, "paid", note)` trả về Commission, fetch email đối tác rồi gửi:
```ts
import { sendAffiliatePayoutEmail } from "@/lib/affiliate-mailer";
import { getAffiliateById } from "@/lib/affiliate";
// ... trong nhánh status === "paid":
const updated = await updateCommissionStatus(id, "paid", payoutNote);
if (updated) {
  try {
    const aff = await getAffiliateById(updated.affiliateId);
    if (aff) {
      await sendAffiliatePayoutEmail({
        affiliateName: aff.name, affiliateEmail: aff.email,
        orderId: updated.orderId, commissionAmount: updated.commissionAmount, payoutNote: payoutNote ?? null,
      });
    }
  } catch (e) { console.error("[admin/affiliates] payout email fail:", e); }
}
```
(Welcome email đã wire sẵn trong template `api-affiliate-register-route.ts` — không cần patch thêm.)

### C3. Leaderboard route
Copy template `api-admin-affiliate-leaderboard-route.ts` → `app/api/admin/affiliate-leaderboard/route.ts`. Cần các hàm A3 đã thêm vào lib.

### C4. Podium card trong trang admin affiliates
Thêm vào `app/admin/affiliates/page.tsx` (hoặc tab affiliate) — fetch `/api/admin/affiliate-leaderboard?period=` rồi render. Snippet gọn (đổi `adminFetch`→`fetch+header x-admin-pass` nếu bản password):
```tsx
function LeaderboardCard() {
  const [period, setPeriod] = useState<"week"|"month"|"year"|"all">("month");
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch(`/api/admin/affiliate-leaderboard?period=${period}`, { headers: { "x-admin-pass": /* pass */ "" } })
      .then(r => r.json()).then(setData).catch(() => {});
  }, [period]);
  const fmt = (n:number) => (n||0).toLocaleString("vi-VN") + "đ";
  const medal = ["🥇","🥈","🥉"];
  return (
    <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:18, marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <strong>🏆 Bảng xếp hạng đối tác — {data?.periodLabel ?? ""}</strong>
        <select value={period} onChange={e=>setPeriod(e.target.value as any)}>
          <option value="week">Tuần này</option><option value="month">Tháng này</option>
          <option value="year">Năm nay</option><option value="all">Toàn thời gian</option>
        </select>
      </div>
      {(data?.podium ?? []).map((e:any,i:number) => (
        <div key={e.affCode} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f3f4f6" }}>
          <span>{medal[i] ?? `#${e.rank}`} <strong>{e.name}</strong> <span style={{color:"#9ca3af",fontSize:12}}>{e.affCode}</span></span>
          <span><strong>{fmt(e.revenue)}</strong> · {e.orders} đơn · HH {fmt(e.commissionTotal)}</span>
        </div>
      ))}
      {(data?.rest ?? []).map((e:any) => (
        <div key={e.affCode} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", fontSize:13, color:"#475569" }}>
          <span>#{e.rank} {e.name} <span style={{color:"#9ca3af"}}>{e.affCode}</span></span>
          <span>{fmt(e.revenue)} · {e.orders} đơn</span>
        </div>
      ))}
      {data && data.totalRanked === 0 && <div style={{ color:"#9ca3af", fontSize:13 }}>Chưa có đối tác nào có đơn trong kỳ.</div>}
    </div>
  );
}
```

---

## D. Email bulk cho đối tác — đụng `biz-admin-leads-dashboard`

Thêm audience `"affiliate"` vào tab Email marketing của `/admin` (skill `biz-admin-leads-dashboard`). Đối tác KHÔNG nằm bảng `leads` mà ở bảng `affiliates` → queryAudience cần đọc thêm bảng đó.

Patch `lib/campaigns.ts`:
```ts
export type AudienceKind = "all" | "paid" | "pending" | "last_days" | "affiliate";

// trong queryAudience(), thêm nhánh:
if (audience.kind === "affiliate") {
  const { data, error } = await getSupabaseAdmin()
    .from("affiliates").select("name, email").eq("status", "active");
  if (error) throw new Error(`queryAudience(affiliate) failed: ${error.message}`);
  // dedupe theo email, map sang AudienceLead shape ({ name, email, ... })
  const seen = new Set<string>();
  return (data ?? []).filter(r => {
    const k = (r.email ?? "").toLowerCase();
    if (!k || seen.has(k)) return false; seen.add(k); return true;
  }).map(r => ({ name: r.name, email: r.email /* + các field khác AudienceLead cần, để rỗng/0 */ }));
}
```
UI: thêm option "Đối tác affiliate" vào dropdown audience trong `app/admin/page.tsx`. Footer opt-out vẫn giữ (đối tác cũng là người nhận email).

> Lưu ý: bulk gửi cho aff dùng CHUNG cơ chế campaign (throttle 200ms, log campaign_sends) của `biz-admin-leads-dashboard` — không cần SMTP/transport riêng. Tách biệt với 3 email giao dịch ở `lib/affiliate-mailer.ts`.

---

## Checklist sau khi áp dụng

- [ ] `npm run build` sạch (chú ý type LeaderboardData/AdminLeaderboardData mới).
- [ ] `/aff-register` → đăng ký → nhận mã + (nếu có SMTP) email welcome.
- [ ] Đơn paid qua `?aff=` → đối tác nhận email "có hoa hồng mới".
- [ ] Admin đánh dấu hoa hồng "đã trả" → đối tác nhận email payout.
- [ ] `/admin` tab affiliate → podium leaderboard hiển thị, đổi kỳ week/month/year/all chạy.
- [ ] (Nếu làm D) tab Email marketing có audience "Đối tác affiliate", gửi test 1 aff OK.
