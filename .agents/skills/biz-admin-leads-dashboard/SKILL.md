---
name: biz-admin-leads-dashboard
description: "Scaffold trang `/admin` CRM-style trực quan vào Next.js project (Supabase backend) — KHÔNG còn variant Vercel KV. Layout 1CRM-inspired: sidebar 3 tab (Tổng quan / Khách hàng / Email marketing) + popup nhập mã đăng nhập. **Tab Tổng quan**: 4 KPI cards (Tổng leads / Đã thanh toán / Tỷ lệ chuyển đổi / Doanh thu) có delta arrow vs kỳ trước, line chart leads+paid+revenue theo ngày dùng `recharts`, donut trạng thái paid/pending/expired, period selector pill 7d/30d/90d, list 5 thanh toán gần nhất. **Tab Khách hàng**: bảng leads + search + filter trạng thái + filter ngày + CSV export. **Tab Email marketing**: form soạn chiến dịch (tên + tiêu đề + body chọn định dạng **văn bản thường HOẶC HTML** + placeholder `{{name}}` + audience 4 loại all/paid/pending/last_days + tên người gửi) — có nút **Xem trước** mở modal iframe render đúng email thật (text → auto convert + wrap khung; HTML fragment → wrap khung, HTML đầy đủ giữ nguyên) → gửi bulk qua SMTP (reuse `nodemailer` của `biz-email-setup` — KHÔNG cài provider mới), log per-recipient vào Supabase, bảng lịch sử chiến dịch hiển thị thành công/thất bại/thời gian (bấm 1 row để xem trước email đã gửi). Workflow 6 phase: (0) detect Next.js App Router + verify `lib/leads-supabase.ts` đã có (nếu không → bảo user chạy `/biz-setup-sepay-payment` trước), verify SMTP env vars đã có (nếu không → bảo chạy `/biz-email-setup` trước), (1) HỎI user password (mặc định `123456`, khuyến nghị mạnh hơn cho production), (2) cài `recharts` (npm install recharts) — `nodemailer` đã có từ `biz-email-setup`, (3) chạy `templates/supabase-migration-admin.sql` trong Supabase SQL Editor tạo bảng `campaigns` + `campaign_sends` (RLS deny-all), (4) append `ADMIN_PASSWORD` vào `.env.local` + .gitignore, (5) scaffold 9 file: `lib/admin-auth.ts` (timing-safe pass check), `lib/admin-stats.ts` (KPI + time-series + deltas), `lib/campaigns.ts` (CRUD + audience query), `lib/mailer.ts` (nodemailer transporter + plain→HTML wrapper + opt-out footer + throttle 200ms), `app/admin/page.tsx` (1CRM 3-tab UI client component), `app/api/admin/leads/route.ts`, `app/api/admin/dashboard/route.ts`, `app/api/admin/campaigns/route.ts` (GET list + POST create&send đồng bộ, throttle 200ms/email, maxDuration 60s). (6) hướng dẫn test 3 cấp (curl dashboard, UI smoke, gửi test campaign cho email riêng của owner). Pages Router KHÔNG còn support trong skill này — user dùng Pages Router phải port manual hoặc convert sang App Router. Output: 8 file + 1 SQL migration + 1 env var + npm dep recharts + 3 test plans. Tiếng Việt thuần (xưng anh/chị), columns tiếng Việt, charm pricing VND, email opt-out footer tiếng Việt 'Reply HỦY để ngừng nhận'. USE WHEN user says: 'tạo trang admin', 'admin dashboard CRM', 'admin xem leads', 'dashboard kiểu 1CRM', 'admin có biểu đồ', 'theo dõi leads theo ngày tuần tháng', 'tỷ lệ chuyển đổi admin', 'admin có chart', 'admin gửi email quảng cáo', 'email marketing dashboard', 'gửi email bulk cho khách', 'campaign email cho lead', 'email khuyến mãi cho khách hàng', 'admin xem ai đã thanh toán', 'admin popup nhập mã', 'biz-admin-leads-dashboard', 'CRM lite Next.js', 'admin Supabase + email'. KHÔNG dùng khi: (a) project chưa có `lib/leads-supabase.ts` — phải chạy `/biz-setup-sepay-payment` chọn Supabase trước, (b) project dùng Vercel KV thay Supabase — skill version này KHÔNG còn support KV, (c) cần multi-user role-based admin — skill này 1 password chung, (d) cần email tracking mở/click chi tiết — chỉ track sent/failed."
---

# Biz Admin Leads Dashboard — CRM-style /admin cho Supabase

Scaffold trang `/admin` kiểu 1CRM vào Next.js project (App Router). 3 tab — Tổng quan (KPI + chart), Khách hàng (bảng + filter), Email marketing (soạn + gửi bulk + history).

**Triết lý**: Đơn giản hơn 1CRM (1 password chung, không multi-user), nhưng có đủ chart + delta + email marketing để chủ doanh nghiệp 1-2 người dùng được. Mọi state lưu Supabase, file scaffold độc lập với project hiện có.

```
/admin → popup "Nhập mã quản trị" → các tab gọi /api/admin/{leads|dashboard|campaigns}
                                  → mỗi request gửi header x-admin-pass
                                  → server timing-safe compare với ADMIN_PASSWORD env
```

Password lưu trong React state — refresh page = popup hiện lại (intended, đơn giản, không cần session cookie).

**Chỉ Supabase** — KV variant đã bị bỏ. Lý do: campaigns + campaign_sends cần SQL join + service_role bypass RLS; KV không native hỗ trợ.

---

## Khi nào dùng skill này

- Project đã có Sepay payment + lead store qua `lib/leads-supabase.ts` (từ `biz-setup-sepay-payment` chọn Supabase) → cần view layer + dashboard + email marketing.
- User muốn page CRM-style: KPI cards có delta, line chart theo ngày, donut conversion, gửi email khuyến mãi cho khách đã đăng ký.

**KHÔNG dùng khi**:
- Project chưa có `lib/leads-supabase.ts` → bảo user chạy `/biz-setup-sepay-payment` (chọn Supabase) trước.
- Project dùng Vercel KV thay Supabase → skill này KHÔNG còn support KV. User chỉ có 2 lựa chọn: migrate sang Supabase hoặc tự port manual.
- Cần multi-admin với role/permission → skill 1 password chung, không phù hợp.
- Cần email tracking chi tiết (mở/click per recipient) → skill chỉ track sent/failed. User cần Resend/SendGrid/Brevo bulk có tracking.

---

## Workflow (6 phase)

```
Phase 0: DETECT Next.js App Router + verify lib/leads-supabase.ts + verify SMTP env
Phase 1: HỎI user password (default 123456) — GATE
Phase 2: INSTALL npm dep `recharts`
Phase 3: CHẠY supabase-migration-admin.sql trong Supabase SQL Editor — GATE
Phase 4: WRITE ADMIN_PASSWORD vào .env.local
Phase 5: SCAFFOLD 9 file code (5 lib + 4 route + 1 page)
Phase 6: TEST 3 cấp (curl dashboard, UI smoke, gửi test campaign)
```

---

## Phase 0 — Detect + verify dependencies

```bash
# Check Next.js + App Router
test -f next.config.js -o -f next.config.mjs -o -f next.config.ts && echo "Next.js: ✓"
test -d app && echo "App Router: ✓" || { echo "✗ Cần App Router. Skill này không support Pages Router."; exit 1; }

# Verify Supabase lead store
test -f lib/leads-supabase.ts && echo "Supabase store: ✓" || { echo "✗ Thiếu lib/leads-supabase.ts — chạy /biz-setup-sepay-payment chọn Supabase trước"; exit 1; }
test -f lib/leads-store.ts && echo "Provider-agnostic wrapper: ✓"
test -f lib/supabase-admin.ts && echo "Service-role client: ✓"

# Verify SMTP env (từ biz-email-setup)
grep -E "^SMTP_HOST=" .env.local && echo "SMTP_HOST: ✓" || { echo "✗ Thiếu SMTP env — chạy /biz-email-setup trước"; exit 1; }
grep -E "^SMTP_USER=" .env.local
grep -E "^SMTP_PASS=" .env.local
grep -E "^MAIL_FROM=" .env.local

# Verify package
grep '"nodemailer"' package.json && echo "nodemailer: ✓"
grep '"@supabase/supabase-js"' package.json && echo "@supabase: ✓"
```

**Nếu thiếu** `lib/leads-supabase.ts`:
> ⚠ Em thấy project chưa có Supabase lead store. Anh/chị chạy `/biz-setup-sepay-payment` trước (chọn Supabase backend) để wire payment + bảng `leads` + RLS. Rồi quay lại em scaffold admin dashboard.

**Nếu thiếu SMTP env**:
> ⚠ Em thấy SMTP chưa cấu hình. Tab Email marketing cần SMTP để gửi. Anh/chị chạy `/biz-email-setup` trước để chọn provider (Gmail/Resend SMTP/Brevo/SendGrid/Zoho...) rồi quay lại em scaffold admin. Em có thể tiếp tục mà bỏ tab email — anh/chị xác nhận?

**Tóm tắt cho user**:
> Em phát hiện: Next.js App Router ✓, Supabase store ✓, SMTP wired ✓. Em sẽ:
> 1. Hỏi anh/chị pass cho /admin
> 2. Cài `recharts` (cho line chart + donut)
> 3. Chạy SQL migration tạo bảng `campaigns` + `campaign_sends` trong Supabase
> 4. Ghi `ADMIN_PASSWORD` vào .env.local
> 5. Scaffold 9 file (5 lib + 4 route + 1 page)
> 6. Hướng dẫn test
>
> Sẵn sàng đi Phase 1 chưa anh/chị?

---

## Phase 1 — Hỏi password (GATE)

Hỏi y nguyên:

> Anh/chị muốn dùng pass gì cho trang /admin?
> - Mặc định em đề xuất: `123456`
> - Hoặc anh/chị paste pass mạnh hơn cho production (≥12 ký tự, có chữ + số + ký tự đặc biệt)
>
> Anh/chị paste pass (hoặc gõ "123456" để dùng default):

**Đợi user trả lời**. Lấy pass user paste. Bỏ trống → dùng `123456`.

KHÔNG đi Phase 2 cho tới khi user xác nhận pass.

---

## Phase 2 — Install recharts

```bash
# Detect package manager
test -f pnpm-lock.yaml && PM=pnpm
test -f yarn.lock && PM=yarn
test -z "$PM" && PM=npm

$PM add recharts  # hoặc: pnpm add recharts / yarn add recharts
```

`nodemailer` đã cài bởi `/biz-email-setup`. Không cài lại.

---

## Phase 3 — Chạy SQL migration (GATE)

Hướng dẫn user:

> Anh/chị mở Supabase Dashboard → SQL Editor → New query → paste toàn bộ nội dung file dưới đây → bấm **Run**:
>
> ```
> [paste templates/supabase-migration-admin.sql ở đây]
> ```
>
> SQL này tạo 2 bảng mới: `campaigns` (header chiến dịch) + `campaign_sends` (per-recipient log). KHÔNG đụng tới bảng `leads` đã có.
>
> Chạy xong anh/chị verify ở phần cuối SQL — phải thấy `campaigns: 0` và `campaign_sends: 0`.

Đợi user confirm "đã chạy SQL xong" rồi đi Phase 4.

---

## Phase 4 — Write .env.local

Append vào `.env.local`:

```
# Admin /admin page password
ADMIN_PASSWORD=<user-paste-from-phase-1>
```

Nếu `ADMIN_PASSWORD` đã có → hỏi user có overwrite không (default KHÔNG).

Đảm bảo `.env.local` trong `.gitignore`:

```bash
grep -qxF ".env.local" .gitignore 2>/dev/null || echo ".env.local" >> .gitignore
```

---

## Phase 5 — Scaffold 9 file

```
lib/admin-auth.ts          ← templates/lib-admin-auth.ts
lib/admin-stats.ts         ← templates/lib-admin-stats.ts
lib/campaigns.ts           ← templates/lib-campaigns.ts
lib/email-render.ts        ← templates/lib-email-render.ts
lib/mailer.ts              ← templates/lib-mailer.ts
app/admin/page.tsx         ← templates/app-admin-page.tsx
app/api/admin/leads/route.ts      ← templates/app-api-admin-leads-route.ts
app/api/admin/dashboard/route.ts  ← templates/app-api-admin-dashboard-route.ts
app/api/admin/campaigns/route.ts  ← templates/app-api-admin-campaigns-route.ts
```

**Email render module**: `lib/email-render.ts` là module THUẦN (không import nodemailer) — chứa `textToHtml` / `wrapEmailHtml` / `personalize` / `renderCampaignEmail`. `lib/mailer.ts` re-export lại các hàm này + thêm SMTP transport. Tách vậy để `app/admin/page.tsx` (client component) import được render helper cho nút **Xem trước** mà không kéo nodemailer vào client bundle.

**Lưu ý nếu project đã có `lib/mailer.ts` từ `biz-email-setup`**: KHÔNG ghi đè — scaffold mailer của skill này thành `lib/admin-mailer.ts` và đổi import trong `app/api/admin/campaigns/route.ts` sang `@/lib/admin-mailer`. `lib/email-render.ts` luôn an toàn (tên riêng, không đụng).

**Lưu ý import alias**: tất cả template dùng `@/lib/...`. Verify project có `tsconfig.json` paths `"@/*": ["./*"]` (Next.js default). Nếu không có thì đổi sang relative imports.

**Lưu ý `lib/leads-store.ts`**: API route leads import `listLeads` từ `@/lib/leads-store` (provider-agnostic wrapper từ `biz-setup-sepay-payment`). Nếu user setup KV trước rồi rename → cần verify wrapper trỏ về Supabase.

### Sơ đồ data flow

```
Browser (admin/page.tsx)
  │  fetch (header x-admin-pass)
  ├──► GET /api/admin/dashboard?days=30   → lib/admin-stats.ts → leads table     → { kpi, timeseries, deltas }
  ├──► GET /api/admin/leads?status=...    → lib/leads-store.ts → leads table     → { leads, stats }
  ├──► GET /api/admin/campaigns            → lib/campaigns.ts  → campaigns table → { campaigns: [...] }
  └──► POST /api/admin/campaigns   (body có bodyFormat: 'text' | 'html')
            └─► lib/campaigns.queryAudience(leads.where status/days)
            └─► lib/email-render.renderCampaignEmail(format, body) → { html, text } (render 1 lần)
            └─► lib/campaigns.createCampaign (campaigns row)
            └─► loop (throttle 200ms):
                  lib/mailer.personalize(html/text per recipient)
                  lib/mailer.sendOne(to, subject, html)
                  lib/campaigns.logCampaignSend (campaign_sends row)
            └─► lib/campaigns.setCampaignStatus (final counts + sentAt)
            return { successCount, failCount }

Client preview (KHÔNG gọi server): admin/page.tsx import lib/email-render trực tiếp,
nút "Xem trước" render { html } + personalize(mẫu) → hiện trong <iframe srcDoc sandbox>.
```

---

## Phase 6 — Test 3 cấp

### Test 1 — Curl dashboard endpoint

```bash
PASS="<password-từ-phase-1>"

# Sai pass → 401
curl -i http://localhost:3000/api/admin/dashboard -H "x-admin-pass: wrong"
# Expect: 401, {"error":"invalid_password"}

# Đúng pass → 200 với KPI + timeseries
curl -s http://localhost:3000/api/admin/dashboard?days=7 -H "x-admin-pass: $PASS" | jq '.period, .deltas'
# Expect: period {days, leads, paid, revenue, conversionRate}, deltas {leadsPct, ...}
```

### Test 2 — UI smoke trên browser

```
1. pnpm dev (hoặc yarn/npm)
2. Mở http://localhost:3000/admin
3. Thấy popup "Trang quản trị" → nhập pass sai → "Sai mã, anh/chị thử lại"
4. Nhập đúng → vào dashboard
5. Tab Tổng quan: thấy 4 KPI cards, line chart, donut, period pill 7d/30d/90d hoạt động
6. Tab Khách hàng: thấy bảng + filter + xuất CSV
7. Tab Email marketing: thấy form soạn + history (lúc đầu rỗng)
8. Tab Email marketing: gõ nội dung → bấm "👁 Xem trước" → modal hiện email
   render (đổi toggle Văn bản thường ↔ HTML để xác nhận cả 2 chế độ)
```

### Test 3 — Gửi test campaign cho email owner

> **QUAN TRỌNG**: Chọn audience `last_days` = 7 với pass đã set, body có `{{name}}`. Gửi test cho 1 lead duy nhất trong DB (lead test của owner) để xác nhận flow trước khi gửi bulk thật.

```
1. Vào tab Email marketing
2. Tên chiến dịch: "Test gửi"
3. Tiêu đề: "Email test từ /admin — anh/chị nhận được không"
4. Audience: "Theo ngày gần nhất" → 7 ngày
5. Nội dung:
     Chào {{name}},
     
     Đây là email test từ trang admin để xác nhận SMTP hoạt động.
     
     Nếu anh/chị nhận được, em sẽ bắt đầu gửi các chiến dịch thật.
6. Bấm "👁 Xem trước" → xác nhận email hiển thị đúng → đóng modal
7. Bấm "Gửi ngay" → confirm
8. Đợi 10-30s (200ms × số recipients)
9. Verify:
   - Banner xanh "Đã gửi X/X email (0 lỗi)"
   - History table có row mới status "Đã gửi"
   - Owner check inbox → thấy email với tên thay {{name}}
```

---

## Output cuối cùng

```
✓ Đã scaffold /admin CRM-style với Supabase + recharts + email marketing

📁 File mới (9):
  lib/
    admin-auth.ts          (timing-safe password check)
    admin-stats.ts         (KPI + time-series + deltas)
    campaigns.ts           (CRUD + audience query)
    email-render.ts        (pure: textToHtml + wrapEmailHtml + renderCampaignEmail — dùng chung server + client preview)
    mailer.ts              (nodemailer transporter + re-export email-render + opt-out footer)
  app/admin/page.tsx       (1CRM 3-tab UI — Tổng quan / Khách hàng / Email marketing — body text/HTML + Xem trước)
  app/api/admin/
    leads/route.ts         (GET list + filter)
    dashboard/route.ts     (GET KPI + timeseries)
    campaigns/route.ts     (GET history + POST send bulk)

🗄  Supabase migration:
  - Bảng campaigns + campaign_sends (RLS deny-all, service_role bypass)
  - Anh/chị đã chạy templates/supabase-migration-admin.sql ✓

📦 NPM dep:
  - recharts (mới cài)
  - nodemailer (đã có từ biz-email-setup)

🔐 Env:
  - ADMIN_PASSWORD đã ghi vào .env.local
  - .gitignore đã include .env.local
  - SMTP_* + MAIL_FROM tái dùng từ biz-email-setup

🧪 Test:
  1. ✓ Curl dashboard endpoint (Test 1)
  2. ✓ UI smoke browser (Test 2)
  3. ✓ Gửi test campaign cho email owner (Test 3)

🔧 TODO của anh/chị:
  1. (Nếu deploy production) Add ADMIN_PASSWORD vào Vercel env vars:
     vercel env add ADMIN_PASSWORD production
  2. Re-deploy: vercel --prod
  3. Mở https://<domain>/admin → gõ pass → confirm 3 tab hoạt động
  4. Lần đầu gửi campaign thật: chọn audience nhỏ (last_days 7) để verify
     SMTP rate limit của provider rồi mới scale lên 'all'
```

---

## Templates

| File | Mô tả |
|---|---|
| `templates/supabase-migration-admin.sql` | Migration tạo `campaigns` + `campaign_sends` |
| `templates/lib-admin-auth.ts` | `checkAdminPass()` timing-safe compare |
| `templates/lib-admin-stats.ts` | `getDashboardData(days)` — KPI + time-series + deltas |
| `templates/lib-campaigns.ts` | CRUD campaigns + `queryAudience()` |
| `templates/lib-email-render.ts` | Module thuần — `textToHtml()` + `wrapEmailHtml()` + `personalize()` + `renderCampaignEmail()` (text/HTML). Không import nodemailer → client component dùng được cho preview |
| `templates/lib-mailer.ts` | nodemailer transporter + `sendOne()` + `sleep()` + re-export render helper từ `email-render` |
| `templates/app-admin-page.tsx` | 1CRM-style page với sidebar + 3 tab + recharts. Tab email có toggle định dạng text/HTML + nút Xem trước (modal iframe) |
| `templates/app-api-admin-leads-route.ts` | Leads table API (gọi `listLeads()`) |
| `templates/app-api-admin-dashboard-route.ts` | Dashboard analytics API |
| `templates/app-api-admin-campaigns-route.ts` | GET list + POST create&send |

---

## Anti-pattern (đừng làm)

- ❌ **Compare password bằng `===`** → timing attack. Template dùng `crypto.timingSafeEqual` qua `lib/admin-auth.ts`.
- ❌ **Hardcode pass trong source** → quên thay → production deploy với pass test. Luôn qua `process.env.ADMIN_PASSWORD`.
- ❌ **Gửi pass qua URL query string** (`?pass=123456`) → leak vào browser history + access logs. Dùng header `x-admin-pass`.
- ❌ **Tạo login page riêng + session cookie + JWT** khi user chỉ cần simple admin. Popup inline đủ.
- ❌ **Lưu pass trong localStorage** → JS đọc được, XSS leak. Template lưu trong React state (mất khi refresh, intended).
- ❌ **Skip check pass trong API route** (chỉ check ở client) → ai cũng curl được. Mọi route đều `checkAdminPass()` đầu tiên.
- ❌ **Supabase: dùng `anon` key trên server** → RLS chặn SELECT. `lib/supabase-admin.ts` (từ `biz-setup-sepay-payment`) đã dùng service_role.
- ❌ **Bulk send không throttle** → Gmail/Brevo flag spam. Template throttle 200ms giữa các email.
- ❌ **Bulk send cho audience >300 trong 1 request handler** → vượt `maxDuration=60` của Vercel hobby plan. Skill set `maxDuration = 60` nhưng nếu audience >300 user nên upgrade Vercel Pro hoặc chia nhỏ campaign.
- ❌ **Send email không có opt-out** → vi phạm CAN-SPAM/GDPR/Nghị định 91 (VN). Template wrap mọi email với footer "Reply HỦY để ngừng nhận".
- ❌ **Quên xóa lead 'expired' khỏi audience 'all'** → spam khách đã đóng đơn 90+ ngày. `queryAudience('all')` chỉ lấy `paid` + `pending`, exclude `expired`.
- ❌ **Gửi cùng email 2 lần cho 1 người** trong 1 campaign khi user có nhiều order (cùng phone, khác orderId). `queryAudience` dedupe by email (lowercase) — phải verify lại nếu user edit template.
- ❌ **Recharts SSR**: page.tsx dùng `'use client'` đầu file. Đừng thử SSR recharts — sẽ crash hydration.
- ❌ **Import `lib/mailer.ts` (hoặc `admin-mailer.ts`) vào `app/admin/page.tsx`** → kéo `nodemailer` vào client bundle → build fail (`net`/`tls` không tồn tại trên browser). Client preview CHỈ import `lib/email-render.ts` (module thuần). Server route mới import `mailer`.
- ❌ **Render preview lệch với email thật** → admin tưởng OK rồi gửi sai. Cả API gửi lẫn nút Xem trước phải gọi CÙNG hàm `renderCampaignEmail()` — đó là lý do tách `email-render.ts` làm single source of truth.
- ❌ **`<iframe>` preview không có `sandbox`** → HTML khách dán có thể chạy script trong trang admin. Template set `sandbox=""` (chặn hết script/form, chỉ render).

---

## Notes về email marketing legal (VN)

Skill này KHÔNG phải replacement cho email marketing platform chuyên nghiệp (Mailchimp, Sendinblue/Brevo, ConvertKit) — nhược điểm:

- **Không có tracking mở/click** — chỉ biết SMTP có chấp nhận message không (sent/failed).
- **Không có double opt-in** — user đăng ký form là vào audience luôn. Phù hợp pháp lý VN cho khách đã giao dịch, KHÔNG phù hợp cho list mua/scrape.
- **Không có A/B test, segment phức tạp, automation flow**.
- **Rate limit phụ thuộc SMTP provider** (Gmail 500/day, Brevo free 300/day, Resend SMTP 3000/month). Cho >500 recipients/day nên upgrade hoặc chuyển sang API riêng.

Tốt nhất để gửi: (a) follow-up onboarding cho khách đã thanh toán, (b) nhắc khách `pending` quay lại chuyển khoản, (c) thông báo bonus/cập nhật sản phẩm cho customer base nhỏ-vừa (<1000).
