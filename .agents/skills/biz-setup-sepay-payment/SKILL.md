---
name: biz-setup-sepay-payment
description: "End-to-end Sepay VietQR payment infrastructure cho landing page Next.js — guide user setup Sepay account + bank linking + scaffold đầy đủ payment flow trong project. Skill này xử lý 7 phase: (0) detect Next.js stack + **HỎI user chọn lead store backend** (Vercel KV hoặc Supabase Free Postgres — default recommend Supabase do free tier rộng hơn ~50× + có SQL + admin UI), (1) GUIDE user đăng ký Sepay account tại my.sepay.vn + link bank account VN (Vietcombank/Techcombank/MB/ACB/VPBank/BIDV/...) + lấy API key + setup webhook URL trên Sepay dashboard, (2A nếu chọn KV) setup Vercel KV (install `@vercel/kv` + KV namespace + 4 env vars KV_*), (2B nếu chọn Supabase) setup Supabase project (tạo project tại Singapore region + chạy migration SQL tạo 4 bảng leads/phone_index/order_counter/webhook_dedup với pg_cron TTL cleanup + RLS deny-all + lấy SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + Vercel Cron ping `/api/health` mỗi 6 ngày chống auto-pause), (3) scaffold `lib/leads-store.ts` (thin re-export wrapper provider-agnostic) + `lib/leads-{kv|supabase}.ts` impl với cùng API surface: `createLead()`, `getLeadByOrderId()`, `getLeadByPhone()`, `findPendingLeadByAmountAndTime()`, `markLeadPaid()`, dedup helpers — TTL 7 ngày pending / 90 ngày paid để store không bloat, (4) scaffold `app/api/checkout/route.ts` (App Router) hoặc `pages/api/checkout.ts` (Pages Router) — handler nhận form submission từ landing page, generate order_id format `DH{6-digit-zero-padded}`, lưu lead vào store, return `{orderId, amount, bankInfo, qrUrl}`, (5) scaffold `app/api/sepay-webhook/route.ts` với Apikey auth timing-safe + dedup theo `payload.id` + multi-strategy matching (content-orderid → content-phone → amount-timestamp window) + side effects placeholder (sẵn sàng cho `biz-email-setup` và `biz-telegram-payment-notify` wire vào), (6) embed VietQR vào landing page — 3 pattern UI để user chọn: (a) modal popup, (b) dedicated `/checkout/[orderId]` page với QR + bank details + status polling, (c) inline pricing card. QR generated via `https://qr.sepay.vn/img?acc=X&bank=Y&amount=Z&des=DH{id}&template=compact` — không cần backend, chỉ image URL. (7) test plan 5 cấp: store connection sanity → simulated checkout flow → simulated Sepay webhook payload → production verify với 1 đơn 1.000đ thật → (chỉ Supabase) cron ping verify. API routes hoàn toàn provider-agnostic via `lib/leads-store.ts` — đổi provider sau = sửa 1 dòng re-export. Output: code patch hoàn chỉnh + Sepay account setup guide tiếng Việt + provider-specific setup guide + env vars list + test instructions + redirect sang `/biz-email-setup` và `/biz-telegram-payment-notify`. Tiếng Việt thuần (xưng anh/chị), VND charm pricing, mobile-first checkout UX. USE WHEN user says: 'setup sepay', 'tích hợp sepay vào landing page', 'sepay payment Next.js', 'add VietQR thanh toán', 'biz-setup-sepay-payment', 'cài payment gateway VN', 'setup payment cho landing page', 'tạo checkout flow Sepay', 'wire Sepay webhook', 'setup lead store cho landing page', 'sepay với supabase', 'sepay với vercel kv', 'tạo flow thanh toán cho khoá học online', 'embed QR Sepay vào sales page', 'tạo trang checkout', 'order management cho landing page', 'setup payment infra', 'lưu lead vào supabase', 'lưu lead vào postgres'. Trigger NGAY CẢ KHI: (a) user vừa deploy landing page xong và muốn add payment, (b) user đang chuẩn bị launch sản phẩm số (course/coaching/digital product) và cần payment flow, (c) user nói 'làm sao nhận tiền online' trong context Next.js project. Skill này LÀ tiền đề cho `biz-email-setup` và `biz-telegram-payment-notify` (cả 2 skill đó dùng `lib/leads-store.ts` + `/api/sepay-webhook` do skill này tạo, provider-agnostic). KHÔNG dùng skill này khi: (a) user dùng Stripe/PayPal (skill khác cho international), (b) user muốn manual bank transfer không cần auto-confirm (UX kém), (c) user đã có payment infra rồi và chỉ muốn add notification (đi thẳng `/biz-telegram-payment-notify` hoặc `/biz-email-setup`)."
---

# Biz Setup Sepay Payment — End-to-end VietQR payment infra cho Next.js

Skill này build **toàn bộ infrastructure thanh toán** cho landing page Next.js dùng Sepay (cổng thanh toán VietQR Việt Nam). Sau khi xong: khách điền form → tạo order → quét QR → chuyển khoản → Sepay webhook về → verify + lookup lead + trigger email/telegram. Tự động hết, không cần admin manual confirm.

> **Triết lý**: Sepay là path of least resistance cho VN — VietQR + bank API native, không cần khách đăng ký gì, scan QR bằng app ngân hàng có sẵn. Phí 1.5-2% rẻ hơn Stripe (4-5%), settlement T+1, free tier hợp lý cho landing page <100 đơn/tháng.
>
> **Tại sao có lead store**: Sepay webhook chỉ gửi `content` (text khách dán khi CK) + amount. Sepay KHÔNG biết khách là ai. Phải có lead store local để map `content` → lead `{name, phone, email, product, amount}`.

**2 lead store options** — user chọn 1 ở Phase 0:
- **Vercel KV** (Upstash Redis) — setup 2 phút, native TTL, free 30K commands/tháng → < 500 đơn/tháng
- **Supabase Free** (Postgres) — setup 5 phút, SQL queries + Studio UI, free tier rộng hơn ~50× → < 2000 đơn/tháng. KHUYẾN NGHỊ.

API routes (`/api/checkout`, `/api/sepay-webhook`, `/api/admin/leads`) **provider-agnostic** qua `lib/leads-store.ts` thin re-export. Đổi provider sau = sửa 1 dòng.

Skill **KHÔNG tự đăng ký Sepay account** cho user (cần KYC business + bank). Skill guide user step-by-step, sau đó wire toàn bộ code.

---

## Khi nào dùng skill này

- User đang launch sản phẩm số / khoá học / coaching và cần nhận thanh toán online.
- User đã có landing page Next.js (qua `ui-ux-pro-max` hoặc tương đương) và muốn add payment flow.
- User chuẩn bị wire `biz-email-setup` hoặc `biz-telegram-payment-notify` mà chưa có payment infra → skill này LÀM TIỀN ĐỀ.

**KHÔNG dùng skill này khi**:
- User dùng Stripe/PayPal (international card payment) → use case khác.
- User chấp nhận manual bank transfer + tự verify (low scale, không khuyến khích).
- User đã có payment infra và chỉ thiếu notification → đi thẳng `/biz-email-setup` hoặc `/biz-telegram-payment-notify`.

---

## Workflow tổng quan (7 phase)

```
Phase 0: DETECT Next.js stack + HỎI provider (KV / Supabase) — GATE
       ↓
Phase 1: GUIDE user setup Sepay account — manual GATE đợi user xong
       ↓
Phase 2A (nếu KV): SETUP Vercel KV (install package + env vars + KV namespace)
Phase 2B (nếu Supabase): SETUP Supabase (tạo project + migration SQL + service_role)
       ↓
Phase 3: SCAFFOLD lib/leads-store.ts (re-export wrapper) + lib/leads-{kv|supabase}.ts (impl)
       ↓
Phase 4: SCAFFOLD /api/checkout route (form → order → store)
       ↓
Phase 5: SCAFFOLD /api/sepay-webhook route (verify + lookup + side effects placeholder)
       ↓
Phase 6: EMBED VietQR vào landing page (chọn 1 trong 3 pattern UX)
       ↓
Phase 7: TEST plan 5 cấp (store → checkout → webhook → production → (Supabase only) cron ping)
```

Phase 0 + 1 có **gate đợi user**. Phase 2/3/4/5/6 skill chủ động.

---

## Phase 0 — Detect Next.js stack + chọn provider

### 0.1 Detect stack

```bash
test -f next.config.js -o -f next.config.mjs -o -f next.config.ts && echo "Next.js: ✓"
test -d app && echo "Router: App"
test -d pages && echo "Router: Pages"
test -f tsconfig.json && echo "TS: ✓"
test -f pnpm-lock.yaml && echo "pkg: pnpm" || test -f yarn.lock && echo "pkg: yarn" || echo "pkg: npm"
```

**Nếu không phải Next.js**: DỪNG. Báo: *"Skill này hiện chỉ support Next.js. Stack hiện tại của anh/chị là [X]. Em port logic sang Vite/static với Vercel function không?"* — wait user.

**Nếu cả `app/` và `pages/`**: hỏi user dùng cái nào.

### 0.2 Check existing infra

```bash
ls app/api/ pages/api/ lib/ 2>/dev/null
grep -E '"@vercel/kv"|"@supabase/supabase-js"|"@upstash/redis"' package.json
grep -E "SEPAY|KV_REST|SUPABASE_" .env.local 2>/dev/null
```

### 0.3 HỎI user chọn provider

```
Em phát hiện anh/chị dùng Next.js [App/Pages] Router + TypeScript + [pnpm/yarn/npm].

Anh/chị muốn lưu lead store ở đâu?

1. Vercel KV (Upstash Redis)
   ✓ Setup nhanh 2 phút (1-click trong Vercel dashboard)
   ✓ Native TTL — không lo project pause
   ✗ Free chỉ 30K commands/tháng → ~500 đơn/tháng
   ✗ Không có SQL — admin filter phức tạp khó

2. Supabase Free (Postgres) — KHUYẾN NGHỊ
   ✓ Free tier rộng nhất (500MB DB + 5GB bandwidth, unlimited query)
   ✓ Postgres = SQL query mạnh, Supabase Studio UI đẹp để view data
   ✓ Type-safe TypeScript auto-generated
   ✓ Setup 5 phút (Console + paste 2 env vars)
   ⚠ Project auto-pause sau 7 ngày silence → em wire Vercel Cron ping `/api/health` mỗi 6 ngày để fix
   ⚠ TTL manual qua pg_cron (đã wire trong migration SQL)
   → Phù hợp < 2000 đơn/tháng, dễ scale admin features

Anh/chị chọn 1 hay 2?
```

**GATE**: KHÔNG đi Phase 1 cho đến khi user chọn. Default suggest Supabase nhưng force chọn explicit.

Sau khi user chọn, tóm tắt plan:

> Anh/chị chọn **[Vercel KV / Supabase]**. Em sẽ:
> 1. Hướng dẫn anh/chị setup Sepay account (5-10 phút)
> 2. Setup lead store theo provider đã chọn
> 3. Wire code: lib/leads-store.ts + /api/checkout + /api/sepay-webhook + embed VietQR
> 4. Test
>
> Sẵn sàng đi Phase 1 chưa anh/chị?

---

## Phase 1 — Guide user setup Sepay account

Đọc `references/sepay-account-setup.md` cho full guide. Tóm tắt 5 bước cho user:

### Bước 1 — Đăng ký my.sepay.vn

1. Truy cập https://my.sepay.vn → Đăng ký
2. Điền SĐT, email, mật khẩu → verify OTP
3. Hoàn tất profile: Họ tên + CCCD/CMND (cá nhân) hoặc Tax code (công ty)

### Bước 2 — Link bank account

Dashboard → **Tài khoản ngân hàng** → **Thêm tài khoản**:
- Chọn bank (Vietcombank, Techcombank, MB, ACB, VPBank, BIDV, VietinBank, TPBank, ...)
- Nhập số TK + tên chủ TK (khớp với app banking)
- Verify auto (qua bank API) hoặc manual (chuyển 1.000-10.000đ với mã xác minh Sepay đưa)

### Bước 3 — Lấy API key

Dashboard → **Cài đặt** → **API & Webhook** → **Tạo API Key mới**:
- Name: `landing-page-prod`
- Permissions: `webhook:read`
- Copy key (chỉ hiện 1 lần)

### Bước 4 — Setup webhook URL

Cùng trang → **Webhook** → **Thêm webhook**:
- URL: `https://yourdomain.vn/api/sepay-webhook` (sẽ live sau deploy)
- Auth: API Key → paste key vừa tạo
- Events: `transaction:incoming`
- Save

> ⚠️ Local dev: dùng [ngrok](https://ngrok.com) expose `localhost:3000` cho Sepay test.

### Bước 5 — Paste cho skill

```
SEPAY_WEBHOOK_API_KEY=sk_xxxxxxxxxxxxxxxxxxxx
SEPAY_BANK_ACCOUNT_NUMBER=1023456789
SEPAY_BANK_NAME=Vietcombank
SEPAY_ACCOUNT_NAME=NGUYEN VAN A
```

**GATE**: KHÔNG đi Phase 2 cho đến khi user paste đủ.

---

## Phase 2A — Setup Vercel KV (chỉ nếu user chọn KV ở Phase 0)

Vercel KV = Upstash Redis managed. Free 30K commands/tháng.

### 2A.1 Tạo KV namespace

Vercel dashboard → Project → **Storage** → **Create Database** → **KV (Redis)** → name `sepay-leads` → Create.

Auto-generate 4 env vars:
```
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

Bấm **Connect to Project** → Vercel inject env (Production + Preview + Development).

### 2A.2 Pull env xuống local

```bash
npm i -g vercel    # nếu chưa có
vercel link
vercel env pull .env.local
```

### 2A.3 Install package

```bash
pnpm add @vercel/kv  # hoặc yarn / npm install
```

### 2A.4 Verify

```bash
node -e "
const { kv } = require('@vercel/kv');
kv.set('test', 'hello').then(() => kv.get('test')).then(v => {
  console.log('KV OK:', v);
  return kv.del('test');
});
"
```

Expect `KV OK: hello`. Đi Phase 3.

---

## Phase 2B — Setup Supabase Free (chỉ nếu user chọn Supabase ở Phase 0)

Đọc `references/supabase-setup.md` cho full guide chi tiết 6 bước. Tóm tắt:

### 2B.1 Tạo Supabase account + project

1. https://supabase.com → Start your project → Login GitHub
2. **New project**:
   - Name: `sepay-leads-<brand>`
   - Database Password: bấm **Generate** → save
   - Region: ⚠️ **Southeast Asia (Singapore)** (default us-east latency 250ms+)
   - Pricing: **Free**
3. Đợi ~2 phút provision

### 2B.2 Chạy migration SQL

Sidebar → **SQL Editor** → **New query** → paste nội dung `templates/supabase-migration.sql` → **Run**.

Tạo 4 bảng + indexes + `next_order_id()` function + RLS enable + pg_cron daily cleanup job.

Verify output: 4 bảng (leads/phone_index/order_counter/webhook_dedup) + 1 pg_cron job + `next_order_id()` trả "DH000001".

Reset counter (vì verify đã tăng counter):
```sql
UPDATE order_counter SET current_value = 0 WHERE id = 1;
DELETE FROM leads WHERE order_id = 'DH000001';
```

### 2B.3 Lấy API credentials

**Project Settings** → **API**:
- Copy **Project URL** (`https://xxxxx.supabase.co`)
- Copy **`service_role` secret** (KHÔNG `anon` key — service_role bypass RLS, dùng cho server)

### 2B.4 Paste env vars

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
```

Skill auto-verify:
- URL match `^https://[a-z0-9]+\.supabase\.co$`
- Key decode JWT, check `role: "service_role"` (KHÔNG `anon`)

Nếu sai → báo lỗi, xin paste lại.

### 2B.5 Install package

```bash
pnpm add @supabase/supabase-js
```

### 2B.6 Wire Vercel Cron ping (chống pause)

Supabase Free auto-pause sau 7 ngày silence. Workaround: ping `/api/health` mỗi 6 ngày.

Skill scaffold `app/api/health/route.ts` (từ `templates/api-health-route.ts`) + append `vercel.json` với:

```json
{
  "crons": [
    { "path": "/api/health", "schedule": "0 3 */6 * *" }
  ]
}
```

⚠️ **Vercel Cron Hobby giới hạn 2 cron/tháng**. Pattern `*/6 days` = ~5 lần/tháng → vượt quota. Options:
1. **Vercel Pro** ($20/tháng) — unlimited cron
2. **GitHub Actions** workflow `.github/workflows/keep-alive.yml` (FREE) — skill scaffold nếu detect repo GitHub
3. **cron-job.org** (FREE) — manual setup, paste URL `/api/health`

Skill mặc định pick option 2 (GitHub Actions) nếu repo có `.git/config` với GitHub remote. Otherwise printout option 3 instruction.

### 2B.7 Verify

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('order_counter').select('current_value').eq('id', 1).single().then(r => {
  if (r.error) { console.error('FAIL:', r.error.message); process.exit(1); }
  console.log('Supabase OK. current_value =', r.data.current_value);
});
"
```

Expect `Supabase OK. current_value = 0`. Đi Phase 3.

---

## Phase 3 — Scaffold lib/leads-store.ts + impl

Provider abstraction: API routes import từ `lib/leads-store.ts`, không biết underlying là KV hay Postgres.

### Nếu chọn KV (Phase 0)

Scaffold 2 file:
- `lib/leads-store.ts` ← copy `templates/lib-leads-store-kv.ts` (1 dòng `export * from './leads-kv'`)
- `lib/leads-kv.ts` ← copy `templates/lib-leads-kv.ts` (KV impl, ~160 dòng)

### Nếu chọn Supabase

Scaffold 3 file:
- `lib/leads-store.ts` ← copy `templates/lib-leads-store-supabase.ts` (re-export Supabase)
- `lib/leads-supabase.ts` ← copy `templates/lib-leads-supabase.ts` (Postgres impl + listLeads cho admin)
- `lib/supabase-admin.ts` ← copy `templates/lib-supabase-admin.ts` (admin client cached singleton với service_role)

API surface CHUNG (cả 2 impl):
- `createLead(input) → { orderId, lead }` — atomic ID + insert + secondary index
- `getLeadByOrderId(orderId) → Lead | null`
- `getLeadByPhone(phone) → Lead | null` — fallback lookup
- `findPendingLeadByAmountAndTime(amount, start, end) → Lead[]` — Strategy 3 webhook matching
- `markLeadPaid(orderId, payment) → Lead | null`
- `isTransactionProcessed(sepayId) → boolean` — dedup
- `markTransactionProcessed(sepayId) → void`

**TTL**: 7 ngày pending / 90 ngày paid. KV qua `ex:` param. Supabase qua `expire_at` field + pg_cron daily delete.

Đổi provider sau = sửa 1 dòng `leads-store.ts` (KHÔNG đụng API code).

Đọc `references/leads-kv-schema.md` (KV) hoặc `references/supabase-leads-schema.md` (Supabase) cho rationale chi tiết.

---

## Phase 4 — Scaffold /api/checkout route

Đọc `templates/api-checkout-app-router.ts` (App Router) hoặc `templates/api-checkout-pages-router.ts` (Pages Router). Copy vào path tương ứng.

Cả 2 template `import { createLead } from '@/lib/leads-store'` — provider-agnostic.

**Flow**:
```
Client POST /api/checkout { name, phone, email, productName, amount }
  ↓
Server:
  1. Validate (phone VN format, email regex, amount > 0)
  2. createLead() → { orderId: "DH000123" }
  3. Generate Sepay QR URL: https://qr.sepay.vn/img?acc=X&bank=Y&amount=Z&des=DH000123&template=compact
  4. Return { orderId, amount, bankInfo, content, qrUrl }
  ↓
Client: show QR modal HOẶC redirect /checkout/DH000123
```

---

## Phase 5 — Scaffold /api/sepay-webhook route

Đọc `templates/api-sepay-webhook-app-router.ts`. Copy vào `app/api/sepay-webhook/route.ts`.

Template `import ... from '@/lib/leads-store'` — provider-agnostic.

**Flow**:
```
Sepay POST /api/sepay-webhook
  Authorization: Apikey {SEPAY_WEBHOOK_API_KEY}
  Body: SepayWebhookPayload
  ↓
Server:
  1. Verify auth qua timingSafeEqual — chống timing attack
  2. Early dedup: isTransactionProcessed(payload.id) → return 200 sớm
  3. Record dedup FIRST — idempotent ngay cả khi processing fail
  4. Filter transferType === 'in' (bỏ outgoing)
  5. Multi-strategy matching:
     a. content → order_id (regex /DH\d+/)
     b. content → phone (regex /0\d{9}/) → getLeadByPhone
     c. amount + timestamp ±30min → findPendingLeadByAmountAndTime (chỉ accept length === 1)
  6. Reject underpayment, ACCEPT overpayment
  7. markLeadPaid(orderId, payment) → update store
  8. Fan-out side effects qua try/catch loop (KHÔNG Promise.all)
  9. ALWAYS return 200 (kể cả internal error) — Sepay retry Fibonacci 7 lần nếu non-200
```

Side effects placeholder cho `biz-email-setup` + `biz-telegram-payment-notify` wire vào sau.

Đọc `references/sepay-webhook-flow.md` cho dedup rationale + retry behavior.

---

## Phase 6 — Embed VietQR vào landing page

3 pattern UX, hỏi user chọn 1:

| Pattern | Khi nào | UX |
|---|---|---|
| **A. Modal popup** | Single product / impulse buy | Submit form → modal popup QR ngay tại trang gốc |
| **B. /checkout/[orderId] page** | Multi-product / cần share URL | Submit → redirect dedicated page với QR + bank + polling |
| **C. Inline pricing card** | Multiple tier (Basic/Pro/Premium) | QR hardcoded amount per tier, không cần form |

**Recommend cho landing page khoá học/coaching**: **Pattern B** — clean, có URL share, dễ polling.

Templates: `checkout-page-app-router.tsx` (B) / `checkout-modal-react.tsx` (A) / `pricing-card-with-qr.tsx` (C).

Status polling: Pattern A + B nên có client polling 3-5s gọi `GET /api/checkout/[orderId]/status` → khi `paid` → success + redirect thank-you.

Đọc `references/vietqr-embed-patterns.md`.

---

## Phase 7 — Test plan (5 cấp)

| Test | Trigger | Cấp |
|---|---|---|
| 1A. KV connection | Chỉ KV | Local |
| 1B. Supabase connection | Chỉ Supabase | Local |
| 2. Simulated checkout flow | Cả 2 | Local |
| 3. Simulated webhook payload | Cả 2 | Local |
| 4. Production verify | Cả 2 | Prod |
| 5. Cron ping verify | Chỉ Supabase | Prod, đợi ~6 ngày |

### Test 1A — KV connection (chỉ KV)

```bash
node -e "
const { kv } = require('@vercel/kv');
const lead = { name: 'Test', phone: '0901234567', email: 't@e.com', productName: 'Test', amount: 499000 };
kv.set('lead:DH999999', lead, { ex: 60 })
  .then(() => kv.get('lead:DH999999'))
  .then(v => console.log('KV OK:', v))
  .then(() => kv.del('lead:DH999999'));
"
```

### Test 1B — Supabase connection (chỉ Supabase)

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.rpc('next_order_id').then(r => {
  if (r.error) { console.error('FAIL:', r.error.message); process.exit(1); }
  console.log('Supabase OK. Next order ID:', r.data);
  // Reset counter để Test 2 start from 000001
  return sb.from('order_counter').update({ current_value: 0 }).eq('id', 1);
});
"
```

Expect `Supabase OK. Next order ID: DH000002` (hoặc cao hơn nếu test trước đó).

### Test 2 — Simulated checkout (cả 2 provider)

```bash
pnpm dev  # localhost:3000

curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"name":"Nguyen Van A","phone":"0901234567","email":"a@e.com","productName":"Khoá AI","amount":499000}'

# Expect: {"orderId":"DH000001","amount":499000,"bankInfo":{...},"qrUrl":"https://qr.sepay.vn/img?..."}
```

### Test 3 — Simulated webhook (cả 2 provider)

```bash
curl -X POST http://localhost:3000/api/sepay-webhook \
  -H "Authorization: Apikey $SEPAY_WEBHOOK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1001,
    "gateway": "Vietcombank",
    "transactionDate": "2026-05-14 14:32:01",
    "accountNumber": "1023456789",
    "code": null,
    "content": "DH000001",
    "transferType": "in",
    "transferAmount": 499000,
    "accumulated": 1000000,
    "referenceCode": "FT26134567890",
    "description": "Test payment"
  }'

# Expect: {"success":true,"orderId":"DH000001","matchMethod":"content-orderid"}
# Verify status='paid' trong store (KV: kv.get('lead:DH000001'); Supabase Studio: Table editor → leads)
```

### Test 4 — Production (cả 2)

1. Deploy `vercel --prod` (qua `/biz-deploy-vercel`)
2. Update Sepay webhook URL sang domain production
3. Submit form 1 đơn test
4. CK thật 1.000đ với content = order_id
5. < 30s, Sepay webhook về Vercel → check logs `200 OK`
6. Sepay dashboard → Webhooks → Logs → delivered

### Test 5 — Cron ping (chỉ Supabase)

Sau ~6 ngày kể từ deploy:
```bash
vercel cron list                # Vercel dashboard → Crons tab
# Hoặc check Vercel Project → Logs → filter "/api/health"
# Expect: 1 execution mỗi ~6 ngày, status 200, response { ok: true, counter: <n> }
```

Nếu dùng GitHub Actions thay vì Vercel Cron: check `Actions` tab → workflow `Keep Supabase Alive` → runs.

---

## Output cuối cùng

### Variant Vercel KV

```
✓ Đã setup hoàn chỉnh Sepay payment infra với Vercel KV backend

📁 File đã tạo:
- lib/leads-store.ts (NEW — provider abstraction)
- lib/leads-kv.ts (NEW — Vercel KV impl)
- app/api/checkout/route.ts (NEW)
- app/api/sepay-webhook/route.ts (NEW)
- app/checkout/[orderId]/page.tsx (NEW — Pattern B)
- app/page.tsx (MODIFIED — wire form submit)
- .env.local + .gitignore (MODIFIED)
- package.json (MODIFIED — add @vercel/kv)

🏦 Sepay: account + bank + API key + webhook URL ✓
🗄 Vercel KV: namespace sepay-leads + TTL 7d pending / 90d paid

🧪 Test:
1A. ✓ KV connection
2.  ✓ Checkout flow
3.  ✓ Webhook payload
4.  ⏳ Production verify (sau deploy)

🔧 TODO:
1. Deploy: /biz-deploy-vercel
2. Update Sepay webhook URL → domain production
3. Test 1 đơn 1.000đ thật
4. Wire side effects: /biz-email-setup + /biz-telegram-payment-notify
```

### Variant Supabase

```
✓ Đã setup hoàn chỉnh Sepay payment infra với Supabase Free backend

📁 File đã tạo:
- lib/leads-store.ts (NEW — provider abstraction)
- lib/leads-supabase.ts (NEW — Postgres impl + listLeads)
- lib/supabase-admin.ts (NEW — service_role client)
- app/api/checkout/route.ts (NEW)
- app/api/sepay-webhook/route.ts (NEW)
- app/api/health/route.ts (NEW — cron ping)
- app/checkout/[orderId]/page.tsx (NEW — Pattern B)
- app/page.tsx (MODIFIED)
- vercel.json (NEW/MODIFIED — cron */6 days)
- .github/workflows/keep-alive.yml (NEW — backup cron, FREE)
- .env.local + .gitignore (MODIFIED)
- package.json (MODIFIED — add @supabase/supabase-js)

🏦 Sepay: account + bank + API key + webhook URL ✓
🗄 Supabase Free (Singapore region):
   - Project: sepay-leads-<brand>
   - Tables: leads / phone_index / order_counter / webhook_dedup
   - TTL: pg_cron daily 03:00 UTC (10:00 VN)
   - RLS: deny-all anon/auth + service_role bypass
   - Keep-alive: Vercel Cron /api/health mỗi 6 ngày

🧪 Test:
1B. ✓ Supabase connection
2.  ✓ Checkout flow
3.  ✓ Webhook payload
4.  ⏳ Production verify (sau deploy)
5.  ⏳ Cron ping verify (đợi ~6 ngày)

🔧 TODO:
1. Deploy: /biz-deploy-vercel
2. Add 2 env vars vào Vercel: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
3. Update Sepay webhook URL → domain production
4. Test 1 đơn 1.000đ thật
5. Wire side effects: /biz-email-setup + /biz-telegram-payment-notify + /biz-admin-leads-dashboard
```

---

## Reference files

- `references/sepay-account-setup.md` — Sepay registration + bank + API key + webhook + 15 bank VN
- `references/vercel-kv-setup.md` — Vercel KV namespace + env vars + pull local + verify
- `references/supabase-setup.md` — Supabase 6-step setup chi tiết + cron ping options
- `references/leads-kv-schema.md` — KV schema rationale + key naming + TTL
- `references/supabase-leads-schema.md` — Postgres schema + indexes + RLS + pg_cron TTL + Postgres vs KV trade-offs
- `references/sepay-webhook-flow.md` — Sepay payload + auth + dedup + retry behavior
- `references/vietqr-embed-patterns.md` — 3 UX pattern + status polling + responsive

## Templates

**Shared (cả 2 provider):**
- `templates/lib-sepay.ts` — Pure helpers: VietQR URL, parse content, timing-safe auth, types
- `templates/api-checkout-app-router.ts` — POST /api/checkout (provider-agnostic via leads-store)
- `templates/api-checkout-pages-router.ts` — Pages Router variant
- `templates/api-sepay-webhook-app-router.ts` — POST /api/sepay-webhook (provider-agnostic)
- `templates/api-checkout-status.ts` — GET status cho polling
- `templates/checkout-page-app-router.tsx` — Pattern B page
- `templates/checkout-status-poll.tsx` — Client polling component
- `templates/checkout-modal-react.tsx` — Pattern A modal
- `templates/pricing-card-with-qr.tsx` — Pattern C inline

**KV variant:**
- `templates/lib-leads-store-kv.ts` — `export * from './leads-kv'`
- `templates/lib-leads-kv.ts` — KV CRUD

**Supabase variant:**
- `templates/lib-leads-store-supabase.ts` — `export * from './leads-supabase'`
- `templates/lib-leads-supabase.ts` — Postgres CRUD + listLeads
- `templates/lib-supabase-admin.ts` — Admin client cached
- `templates/supabase-migration.sql` — DDL idempotent
- `templates/api-health-route.ts` — `/api/health` cho cron ping
- `templates/vercel-cron-config.json` — Cron snippet (append vào vercel.json)

**Webhook handler best practices** (đã apply trong template):
1. **Timing-safe auth** qua `crypto.timingSafeEqual`
2. **Multi-strategy order matching** — content-orderid → content-phone → amount-timestamp window
3. **ALWAYS return 200** — Sepay retry 7 lần Fibonacci nếu non-200, gây duplicate
4. **Reject underpayment, ACCEPT overpayment**
5. **Side effects non-blocking** — try/catch loop, KHÔNG Promise.all
6. **Sepay payload `id` là NUMBER** — convert sang string khi save dedup key

---

## Anti-pattern (đừng làm)

### Chung
- ❌ Skip dedup theo `payload.id` → Sepay retry → mỗi đơn ghi 5 lần → 5 email confirm.
- ❌ Hardcode secrets trong source → leak khi push Git. Luôn qua env var.
- ❌ Lookup lead bằng `transferAmount` → trùng giá → nhầm khách. **Luôn lookup theo content.**
- ❌ Dùng `Promise.all` thay vì try/catch loop cho side effects → 1 fail block all.
- ❌ Throw error trong webhook → Sepay nhận 500 → retry → duplicate. Luôn try/catch return 200.
- ❌ Tạo order_id UUID/timestamp → khách dán nội dung CK quá dài, dễ typo. **Luôn `DH{6-digit}`**.
- ❌ Show QR mà không show bank info text → khách quét không được không có fallback. **Luôn show cả 2**.
- ❌ Quên status polling Pattern B + A → khách chuyển xong không biết success → contact support manual.

### Vercel KV
- ❌ Quên TTL trên KV key → bloat sau vài tháng, cost tăng.
- ❌ Dùng `kv.scan` quá nhiều cho admin dashboard → tốn commands → vượt 30K/tháng. Switch sang Supabase nếu > 500 đơn/tháng.

### Supabase
- ❌ Dùng `anon` key thay vì `service_role` cho server → RLS chặn write → checkout fail silent
- ❌ Region default `us-east-1` → latency từ VN 250ms+. PHẢI Southeast Asia (Singapore)
- ❌ Quên Vercel Cron / GitHub Actions ping `/api/health` → project pause sau 7 ngày → first request lag 30s
- ❌ Commit `SUPABASE_SERVICE_ROLE_KEY` vào Git → full DB bypass leak (god mode)
- ❌ Quên `CREATE EXTENSION pg_cron` trong migration → expired leads không cleanup → bảng phình
- ❌ Run migration SQL qua server code (init script) thay vì SQL Editor manual → race condition khi multi-instance cold-start
- ❌ Không set RLS sau tạo bảng → ai cũng query qua client SDK với anon key
- ❌ Hard-code provider trong API routes (`import from '@/lib/leads-kv'`) thay vì `'@/lib/leads-store'` → mất tính chuyển đổi provider sau
