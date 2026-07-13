---
name: biz-affiliate-system
description: "Thêm hệ thống affiliate (tiếp thị liên kết) cho landing page Next.js App Router đã có Sepay payment + Supabase lead store — đối tác gắn link aff `?aff=CODE`, skill tự động gán đơn theo last-touch cookie 30 ngày, tính hoa hồng theo tier (Pro 30% / Elite 40%, chỉnh được), tạo bản ghi hoa hồng khi đơn được thanh toán, theo dõi trạng thái chi trả (chờ duyệt → đã duyệt → đã trả). Skill scaffold 3 bảng Supabase (affiliates / affiliate_clicks / affiliate_commissions) + ALTER `leads` thêm cột `aff_code`, thư viện `lib/affiliate.ts`, component `AffiliateTracker` bắt `?aff=` ghi cookie + đếm click, 3 API route (`/api/affiliate/click` public, `/api/affiliate` portal data, `/api/admin/affiliates` quản trị), trang quản trị `/admin/affiliates` (thêm/sửa đối tác, xem doanh thu + hoa hồng từng aff, duyệt + đánh dấu đã trả hoa hồng) và portal đối tác `/affiliate` (đối tác đăng nhập bằng mã aff + email để tự xem link, click, đơn giới thiệu, hoa hồng). Patch 4 file có sẵn (`leads-supabase.ts`, route tạo lead — thường `api/checkout`, `api/sepay-webhook`, `layout.tsx`) — không đụng các form đăng ký vì API đọc cookie aff phía server. **Phase 7 extensions (tuỳ chọn, xem references/affiliate-extensions.md)**: trang đăng ký đối tác CÔNG KHAI `/aff-register` (tự phục vụ, nhận mã + link ngay) + bảng XẾP HẠNG đối tác `/api/admin/affiliate-leaderboard` (podium theo tuần/tháng/năm) + 4 loại EMAIL cho đối tác qua `lib/affiliate-mailer.ts` (welcome khi đăng ký / báo có hoa hồng mới khi đơn paid / báo đã chi trả hoa hồng / + bulk email cho aff qua audience 'affiliate' của biz-admin-leads-dashboard) — email gated SMTP env của biz-email-setup. Tiếng Việt thuần (xưng anh/chị), tiền VND. USE WHEN user says: 'tạo chức năng aff', 'thêm affiliate', 'hệ thống tiếp thị liên kết', 'affiliate marketing cho landing page', 'quản lý đối tác aff', 'tính hoa hồng affiliate', 'link giới thiệu cho đối tác', 'mã giới thiệu', 'referral system Next.js', 'cộng tác viên bán hàng online', 'quản lý doanh thu affiliate', 'theo dõi hoa hồng đối tác', 'biz-affiliate-system', 'aff code', 'portal cho affiliate', 'trang đối tác xem hoa hồng', 'commission tracking', 'gắn link aff', 'trang đăng ký affiliate', 'cho đối tác tự đăng ký', 'bảng xếp hạng affiliate', 'leaderboard đối tác', 'gửi email cho affiliate', 'email welcome đối tác', 'thông báo hoa hồng qua email', hoặc khi user muốn cho người khác giới thiệu khách và được chia % doanh thu. Trigger NGAY CẢ KHI user chỉ nói 'làm aff cho web', 'thêm CTV', 'chia hoa hồng cho người giới thiệu' trong context một landing page Next.js đã có payment. KHÔNG dùng khi: (a) project chưa có Sepay payment + `lib/leads-supabase.ts` — bảo user chạy `/biz-setup-sepay-payment` (chọn Supabase) trước, (b) project dùng Vercel KV thay Supabase — skill này chỉ support Supabase, (c) user cần multi-level / MLM nhiều tầng hoa hồng — skill này 1 tầng phẳng."
---

# Biz Affiliate System — affiliate tracking + hoa hồng cho landing page Next.js

Skill này gắn **một hệ thống affiliate 1 tầng** vào landing page Next.js App Router đã có sẵn Sepay payment + Supabase lead store (từ `/biz-setup-sepay-payment`). Sau khi xong: đối tác có mã + link riêng → khách click link → mua hàng → hệ thống tự gán đơn cho đối tác → tính hoa hồng → admin duyệt + chi trả → đối tác tự xem kết quả qua portal.

> **Triết lý**: Affiliate ở quy mô landing page VN không cần MLM, không cần cổng affiliate riêng. Cần đúng 4 thứ: (1) **gán đơn đáng tin** — last-touch cookie, đọc server-side để không phụ thuộc JS form; (2) **hoa hồng là bản ghi tài chính** — mỗi đơn paid sinh 1 row `affiliate_commissions` bất biến, snapshot rate + số tiền, không bao giờ hết hạn (khác `leads` có TTL); (3) **idempotent** — webhook Sepay retry không tạo hoa hồng trùng; (4) **đối tác tự phục vụ** — portal riêng để họ xem số liệu, giảm hỏi han admin.

```
Khách bấm link  https://site.com/?aff=LINH7K2
     ↓  AffiliateTracker (layout) ghi cookie aff_ref=LINH7K2 (30 ngày, last-touch) + đếm click
Khách điền form đăng ký bất kỳ trang nào → POST route tạo lead (vd /api/checkout)
     ↓  route đọc cookie aff_ref phía server → lưu leads.aff_code
Khách chuyển khoản → Sepay webhook → markLeadPaid()
     ↓  recordCommissionForOrder() → tra affiliate theo aff_code → insert affiliate_commissions (pending)
Admin /admin/affiliates → duyệt → đánh dấu đã trả
Đối tác /affiliate → đăng nhập (mã aff + email) → xem link, click, đơn, hoa hồng
```

---

## Khi nào dùng skill này

- Landing page Next.js App Router đã có Sepay payment + `lib/leads-supabase.ts` (Supabase backend), user muốn cho cộng tác viên / đối tác giới thiệu khách và ăn hoa hồng %.
- User nói "tạo chức năng aff", "thêm affiliate", "chia hoa hồng cho người giới thiệu", "quản lý doanh thu đối tác", "portal cho affiliate".

**KHÔNG dùng khi**:
- Project chưa có `lib/leads-supabase.ts` → bảo user chạy `/biz-setup-sepay-payment` (chọn Supabase) trước. Affiliate không thể tính hoa hồng nếu chưa có lead store + webhook.
- Project dùng Vercel KV → skill chỉ support Supabase (hoa hồng cần SQL join + bản ghi bền). User phải migrate sang Supabase trước.
- User cần MLM / hoa hồng nhiều tầng (F1 giới thiệu F2...) → skill này 1 tầng phẳng, không phù hợp.

---

## Workflow (7 phase + extensions)

```
Phase 0: DETECT Next.js App Router + verify Sepay/Supabase prerequisites — GATE
Phase 1: CHỐT config với user (tier rate, query param, portal login) — GATE
Phase 2: VERIFY npm deps (thường không cần cài gì mới)
Phase 3: SCAFFOLD + APPLY Supabase migration (3 bảng + ALTER leads)
Phase 4: SCAFFOLD 8 file mới (1 lib + 1 component + 3 route + 2 page)
Phase 5: PATCH 4 file có sẵn (leads-supabase / route tạo lead vd checkout / sepay-webhook / layout)
Phase 6: TEST plan 4 cấp + hướng dẫn vận hành
Phase 7 (EXTENSIONS, tuỳ chọn): đăng ký công khai + leaderboard + 4 loại email
         → đọc references/affiliate-extensions.md
```

Phase 0 + 1 có **gate đợi user**. Phase 2–6 skill chủ động. Phase 7 chạy khi user muốn bộ tính năng đầy đủ như project tham chiếu (`ai-agent-camp`).

### Phase 7 — Extensions (đăng ký công khai + leaderboard + email)

Áp dụng khi user muốn: (a) **đối tác tự đăng ký** thay vì admin thêm tay, (b) **bảng xếp hạng** đối tác, (c) **email tự động cho đối tác**. Chi tiết đầy đủ (code hàm lib + mọi patch) ở `references/affiliate-extensions.md`. Tóm tắt:

1. **Đăng ký công khai**: copy `app-aff-register-page.tsx` → `app/aff-register/page.tsx` + `api-affiliate-register-route.ts` → `app/api/affiliate/register/route.ts` (đã wire welcome email).
2. **Leaderboard**: thêm hàm lib (A2/A3 trong reference) + copy `api-admin-affiliate-leaderboard-route.ts` + dán podium card vào trang admin affiliate.
3. **Email cho aff** (4 loại): copy `lib-affiliate-mailer.ts` (3 email giao dịch: welcome / có-hoa-hồng / đã-chi-trả) → patch `recordCommissionForOrder` trả info + patch `sepay-webhook` (email có-hoa-hồng) + patch admin PATCH route (email đã-chi-trả). Loại thứ 4 — **bulk email cho aff** — thêm audience `"affiliate"` vào `biz-admin-leads-dashboard` (mục D trong reference).
4. **Gate email**: cần `nodemailer` + SMTP env (từ `/biz-email-setup`). Thiếu → email tự bỏ qua, không lỗi. Thêm env `LANDING_PAGE_URL` cho link trong email. Thay 2 placeholder `__BRAND_NAME__` / `__BRAND_SIGNATURE__` trong `lib-affiliate-mailer.ts`.

> Nếu project đã có các hàm email aff trong `lib/mailer.ts` (như project tham chiếu) → import từ đó, KHÔNG tạo `lib/affiliate-mailer.ts` trùng.

---

## Phase 0 — Detect + verify prerequisites

```bash
test -f next.config.js -o -f next.config.mjs -o -f next.config.ts && echo "Next.js: ✓"
test -d src/app && echo "App Router (src/): ✓" || { test -d app && echo "App Router: ✓" || echo "✗ KHÔNG có App Router"; }
test -f src/lib/leads-supabase.ts -o -f lib/leads-supabase.ts && echo "Supabase lead store: ✓" || echo "✗ THIẾU leads-supabase.ts"
test -f src/lib/supabase-admin.ts -o -f lib/supabase-admin.ts && echo "service_role client: ✓"
ls src/app/api/register src/app/api/sepay-webhook app/api/register app/api/sepay-webhook 2>/dev/null
grep -rE "^ADMIN_PASSWORD=" .env.local 2>/dev/null && echo "ADMIN_PASSWORD: ✓" || echo "⚠ chưa có ADMIN_PASSWORD"
```

Xác định **base path** — `src/app` + `src/lib` (nếu có thư mục `src/`) hoặc `app` + `lib`. Mọi đường dẫn bên dưới bám theo base path đã detect.

**Gate — nếu thiếu prerequisite thì DỪNG**, báo user:
- Thiếu `leads-supabase.ts`: *"Affiliate cần lead store + Sepay webhook để tính hoa hồng. Anh/chị chạy `/biz-setup-sepay-payment` (chọn Supabase) trước rồi quay lại."*
- Không phải App Router: *"Skill này chỉ support Next.js App Router."*
- Thiếu `ADMIN_PASSWORD`: chưa chặn được — trang `/admin/affiliates` dùng chung pass này. Nếu thiếu, Phase 1 sẽ hỏi user một pass.

**Tóm tắt cho user** (Next.js App Router ✓, Supabase store ✓, register + webhook routes ✓) rồi sang Phase 1.

---

## Phase 1 — Chốt config với user (GATE)

Hỏi gọn, đề xuất sẵn default — user chỉ cần xác nhận hoặc sửa:

> Em sẽ dựng hệ thống affiliate với cấu hình mặc định sau, anh/chị xác nhận hoặc chỉnh giúp em:
>
> 1. **Hoa hồng theo 2 nhóm (tier)**: Pro **30%**, Elite **40%** trên giá trị đơn. Mỗi đối tác gán 1 tier; mức % có thể chỉnh riêng từng người sau.
> 2. **Tham số link aff**: `?aff=` (vd `https://site.com/?aff=LINH7K2`). Skill cũng nhận `?ref=` như bí danh.
> 3. **Gán đơn**: last-touch, cookie **30 ngày** — link aff bấm gần nhất được tính công.
> 4. **Portal đối tác** `/affiliate`: đối tác đăng nhập bằng **mã aff + email** (cặp này phải khớp bản ghi). Đơn giản, không cần mật khẩu riêng — mã aff công khai trên link nên email đóng vai "lớp khoá" cơ bản, đủ cho quy mô landing page.
> 5. **Trang quản trị**: `/admin/affiliates` độc lập, dùng chung `ADMIN_PASSWORD` với `/admin`.
>
> Anh/chị OK hết, hay muốn sửa mục nào?

**GATE**: đợi user xác nhận. Ghi lại giá trị cuối cùng cho `TIER_RATES`, query param, cookie ngày, để dùng khi scaffold. Nếu Phase 0 thiếu `ADMIN_PASSWORD` → hỏi thêm pass và append `.env.local` ở Phase 5.

---

## Phase 2 — Verify npm deps

```bash
grep -E '"@supabase/supabase-js"' package.json && echo "@supabase: ✓"
```

`@supabase/supabase-js` đã có sẵn từ `/biz-setup-sepay-payment`. Skill này **không cần cài package mới** — không dùng recharts/nodemailer. Nếu vì lý do nào đó thiếu `@supabase/supabase-js`, cài: `npm install @supabase/supabase-js`.

---

## Phase 3 — Supabase migration

Đọc `references/affiliate-schema.md` để hiểu 3 bảng + vòng đời hoa hồng.

1. Copy `templates/supabase-migration-affiliate.sql` vào thư mục migration của project:
   - Nếu project có `supabase/migrations/` → ghi file `supabase/migrations/<timestamp>_affiliate_system.sql` (timestamp format `YYYYMMDDHHMMSS`).
   - Nếu không → ghi ra `supabase-migration-affiliate.sql` ở root để user tự chạy.
2. Áp dụng migration:
   - Project có Supabase CLI (`npm run db:push` trong `package.json`) → chạy `npm run db:push`.
   - Không có CLI → bảo user mở **Supabase Dashboard → SQL Editor**, dán nội dung file, Run. Migration **idempotent** (`IF NOT EXISTS` guards), chạy lại an toàn.
3. Verify: cuối migration có `SELECT` đếm 3 bảng + check cột `leads.aff_code` đã thêm.

Migration tạo: `affiliates`, `affiliate_clicks`, `affiliate_commissions` + `ALTER TABLE leads ADD COLUMN aff_code` + RLS deny-all (backend dùng service_role) + index. Không tạo job pg_cron mới cho hoa hồng (bản ghi tài chính giữ vĩnh viễn); chỉ thêm cleanup `affiliate_clicks` > 180 ngày vào logic cleanup nếu project đã có pg_cron.

---

## Phase 4 — Scaffold 7 file mới (+ 1 file điều kiện)

Copy từ `templates/`, đổi đường dẫn import theo base path đã detect (`@/lib/...` giữ nguyên alias). Khi copy, thay các giá trị config Phase 1 (tier rate, query param, cookie days) nếu user đã chỉnh khác default.

| Template | Đích | Vai trò |
|---|---|---|
| `lib-affiliate.ts` | `lib/affiliate.ts` | Store Supabase: CRUD đối tác, tạo/đổi trạng thái hoa hồng, đếm click, login portal, hằng số `TIER_RATES`, sinh `aff_code` |
| `components-affiliate-tracker.tsx` | `components/AffiliateTracker.tsx` | Client component: bắt `?aff=` → ghi cookie `aff_ref` 30 ngày (last-touch) → bắn beacon đếm click |
| `api-affiliate-click-route.ts` | `app/api/affiliate/click/route.ts` | Public: nhận beacon click, ghi `affiliate_clicks`. Fire-and-forget, luôn trả 200 |
| `api-affiliate-portal-route.ts` | `app/api/affiliate/route.ts` | Portal data: POST `{code,email}` → verify → trả link, click, đơn, hoa hồng của đối tác đó |
| `api-admin-affiliates-route.ts` | `app/api/admin/affiliates/route.ts` | Quản trị: GET (list đối tác + hoa hồng + thống kê), POST (tạo đối tác), PATCH (sửa đối tác / đổi trạng thái hoa hồng). Auth `x-admin-pass` |
| `app-affiliate-page.tsx` | `app/affiliate/page.tsx` | Portal UI: form đăng nhập mã aff + email → dashboard đối tác |
| `app-admin-affiliates-page.tsx` | `app/admin/affiliates/page.tsx` | UI quản trị: popup pass → bảng đối tác (thêm/sửa) + bảng hoa hồng (duyệt/đánh dấu đã trả) |

**File điều kiện** — `lib-admin-auth.ts` → `lib/admin-auth.ts`: chỉ ghi **nếu project chưa có** (`test -f lib/admin-auth.ts`). `/biz-admin-leads-dashboard` tạo file y hệt; nếu đã có thì KHÔNG ghi đè. File này cung cấp `checkAdminPass()` cho `/api/admin/affiliates`.

> ⚠️ **Thứ tự với `/biz-admin-google-auth`**: skill affiliate phải chạy **TRƯỚC** google-auth. Lý do: google-auth ghi đè `lib/admin-auth.ts` (bỏ `checkAdminPass`, thay bằng `requireAdmin`) rồi tự patch các route `/api/admin/*` (gồm cả `/api/admin/affiliates` + `/api/admin/affiliate-leaderboard`) sang Bearer token. Nếu google-auth đã chạy trước → kiểm tra `grep -q "export function checkAdminPass" lib/admin-auth.ts`: nếu KHÔNG còn, các route admin của affiliate phải dùng `requireAdmin(request)` + `adminAuthError(auth)` thay cho `checkAdminPass(...)` (xem `biz-admin-google-auth/references/integration-patches.md` mục 5a), và trang `/admin/affiliates` phải đổi `fetch` `x-admin-pass` → `adminFetch`.

Sau khi scaffold, **nếu `/admin` page chuẩn 1CRM tồn tại** (`app/admin/page.tsx` có mảng `items` trong sidebar), gợi ý thêm 1 link điều hướng sang `/admin/affiliates` — chỉ thêm 1 `<a href="/admin/affiliates">` nhỏ, KHÔNG phẫu thuật file lớn. Nếu không chắc layout → bỏ qua, `/admin/affiliates` đứng độc lập vẫn chạy tốt.

---

## Phase 5 — Patch 4 file có sẵn

Theo `references/integration-patches.md` — có before/after chính xác cho từng file. Tóm tắt:

1. **`lib/leads-supabase.ts`** — thêm `affCode?: string` vào `CreateLeadInput`, thêm `aff_code` vào object insert của `createLead()`, thêm `aff_code` vào type `LeadRow`.
2. **`app/api/register/route.ts`** — đọc cookie `aff_ref` từ `request.headers.get("cookie")` (helper `readAffCookie`), truyền `affCode` vào `createLead()`.
3. **`app/api/sepay-webhook/route.ts`** — sau khi `markOrderPaid()` thành công, gọi `recordCommissionForOrder(orderId)` từ `lib/affiliate.ts`, bọc `try/catch` — hoa hồng KHÔNG được làm fail xác nhận thanh toán.
4. **`app/layout.tsx`** — import + mount `<AffiliateTracker />` trong `<body>` (cạnh `{children}`).

Nguyên tắc: **không sửa các component form đăng ký**. Có nhiều form rải rác (RegisterFormSection + mỗi trang khoá học một form) — patch hết là mong manh. Thay vào đó `/api/register` đọc cookie `aff_ref` server-side, nên mọi form đều tự động kèm aff mà không cần đụng tới.

---

## Phase 6 — Test plan + hướng dẫn vận hành

Hướng dẫn user test 4 cấp (chi tiết trong `references/integration-patches.md`):

1. **Build sạch**: `npm run build` — không lỗi TypeScript.
2. **Migration**: query Supabase `SELECT count(*) FROM affiliates;` chạy được; `leads` có cột `aff_code`.
3. **Luồng gán đơn (local `npm run dev`)**:
   - Admin tạo 1 đối tác test ở `/admin/affiliates` → nhận `aff_code`.
   - Mở `/?aff=<code>` → DevTools → Application → Cookies thấy `aff_ref=<code>`; bảng `affiliate_clicks` có row mới.
   - Điền form đăng ký 1 gói paid → bảng `leads` có row mới với `aff_code` đúng.
   - Giả lập Sepay webhook (curl, payload như test của `/biz-setup-sepay-payment`) → bảng `affiliate_commissions` có 1 row `pending`, số tiền = `order_amount × rate%`.
4. **Portal**: mở `/affiliate`, đăng nhập mã aff + email của đối tác test → thấy đúng click, đơn, hoa hồng.

**Hướng dẫn vận hành ngắn cho user**: cách thêm đối tác, gửi link aff cho họ (`<domain>/?aff=CODE` + link portal `<domain>/affiliate`), quy trình duyệt → chi trả hoa hồng hàng tháng.

---

## Quy ước quan trọng

- **Idempotent hoa hồng**: `affiliate_commissions.order_id` là UNIQUE. Webhook Sepay retry → insert lần 2 dính `23505` → bỏ qua, không nhân đôi hoa hồng.
- **Snapshot**: lúc tạo commission, lưu cứng `commission_rate` + `commission_amount` + `customer_name` + `ticket` + `order_amount`. Sau này admin đổi tier/rate của đối tác, hoặc lead hết TTL 90 ngày bị xoá, hoa hồng cũ vẫn nguyên.
- **Hoa hồng không TTL**: `leads` có pg_cron xoá sau 90 ngày; `affiliate_commissions` thì KHÔNG — là sổ sách tài chính.
- **Last-touch**: mỗi lần thấy `?aff=` mới, `AffiliateTracker` ghi đè cookie. Đối tác giới thiệu sau cùng được tính công.
- **aff_code an toàn URL**: chữ HOA + số, bỏ ký tự dễ nhầm (`0/O`, `1/I/L`), độ dài ~7. Sinh tự động, trùng thì retry.
- **RLS**: 3 bảng affiliate đều bật RLS không policy → anon/auth bị chặn hết. Chỉ backend service_role đọc/ghi. `aff_code` lộ trên URL là chủ đích (link công khai); email + dữ liệu hoa hồng KHÔNG bao giờ ra client trừ qua API đã verify.
- **Tiếng Việt thuần** xưng anh/chị, tiền VND có chấm phân cách nghìn, format `1.286.800đ`.

## Tham khảo

- `references/affiliate-schema.md` — chi tiết 3 bảng + vòng đời hoa hồng + quyết định thiết kế.
- `references/integration-patches.md` — before/after chính xác cho 4 file patch + test plan chi tiết.
- `references/affiliate-extensions.md` — **Phase 7**: hàm lib leaderboard/referrals + đổi `recordCommissionForOrder` + wire 4 loại email + podium UI + bulk audience.
- `templates/` — 9 file gốc + 4 file extensions (`lib-affiliate-mailer.ts`, `app-aff-register-page.tsx`, `api-affiliate-register-route.ts`, `api-admin-affiliate-leaderboard-route.ts`) + 1 SQL migration.

### Bảng template extensions (Phase 7)

| Template | Đích | Vai trò |
|---|---|---|
| `lib-affiliate-mailer.ts` | `lib/affiliate-mailer.ts` | 3 email giao dịch (welcome / commission-earned / payout), self-contained transporter, gated SMTP env |
| `app-aff-register-page.tsx` | `app/aff-register/page.tsx` | Trang đăng ký đối tác công khai → nhận mã + link ngay |
| `api-affiliate-register-route.ts` | `app/api/affiliate/register/route.ts` | API đăng ký công khai (tier Pro) + gửi welcome email |
| `api-admin-affiliate-leaderboard-route.ts` | `app/api/admin/affiliate-leaderboard/route.ts` | Bảng xếp hạng theo kỳ (week/month/year/all) — bản password auth |
