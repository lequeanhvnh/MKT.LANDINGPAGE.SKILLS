---
name: biz-email-setup
description: "Setup SMTP-based email auto-responder cho landing page bán hàng — tự động gửi email sau khi user điền form (tên/SĐT/email), KHÔNG cố định vào provider nào. Skill này (1) hỏi user chọn SMTP provider (Gmail/Google Workspace, Resend SMTP, SendGrid, Mailgun, Brevo, Zoho, hoặc SMTP custom của hosting VN) và detect Next.js stack đang dùng, (2) đọc context từ `offer.json` + `conversion-copy.md` (từ `/biz-offer-alex-hormozi`) HOẶC đọc trực tiếp Next.js project đã build qua `ui-ux-pro-max` (file `app/page.tsx`) HOẶC đọc HTML landing page đã deploy để hiểu offer, dream outcome, mechanism, bonus. Lưu ý: skill `biz-sales-page-layout` đã DEPRECATED 2026-05-14 — pipeline mới skip layout/copy.json, (3) **draft 2 email**: email A — auto-responder gửi cho lead (warm welcome + deliver lead magnet/booking confirm/payment link tuỳ offer type), email B — notification gửi cho owner (lead alert + thông tin liên hệ), (4) **show draft cho user duyệt và chỉnh sửa** trước khi wire vào code, (5) cài `nodemailer` và wire form HTML/React lên API endpoint với SPF/DKIM domain verification guide theo provider đã chọn, (6) suggest deploy lại qua `/biz-deploy-vercel`. Output: code patch + env vars list (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/MAIL_FROM/OWNER_EMAIL) + test instructions + email preview HTML. Tiếng Việt thuần (xưng anh/chị), mobile-responsive email template, charm pricing VND. USE WHEN user says: 'setup smtp', 'gửi email sau khi user điền form', 'auto-responder cho landing page', 'thank you email tự động', 'email confirmation cho lead', 'wire form to email', 'gửi email khi có lead', 'gmail smtp setup', 'sendgrid smtp', 'mailgun smtp', 'brevo smtp', 'làm sao gửi email từ landing page', 'lead nurture email', 'biz-email-setup', 'sau khi deploy landing page muốn gửi email', 'form submission gửi mail', 'email tự động sau khi đăng ký', 'connect form to email service', 'transactional email setup', 'nodemailer setup', 'smtp transactional email'. Cũng trigger khi user vừa chạy xong `/biz-deploy-vercel` và muốn bước tiếp theo wire email; hoặc user có landing page đã deploy nhưng form chưa gửi email đi đâu. Skill này KHÔNG làm: email marketing broadcast/newsletter (đó là Mailchimp/ConvertKit/MailerLite use case); SMS auto-responder (skill khác); CRM integration (Hubspot/Pipedrive — skill khác); cold email outreach (đó là Instantly/Smartlead). Skill này chuyên transactional/auto-responder trigger từ form submission, dùng SMTP nên user pick được provider phù hợp túi tiền + region."
---

# Biz SMTP Form Autoresponder — Auto-email sau khi lead điền form

Skill này biến **form đăng ký trên landing page** (tên/SĐT/email theo chuẩn VN traffic) thành **2 email tự động** ngay khi user submit: (A) email warm welcome gửi cho lead, (B) email notification gửi cho owner. Email được **draft riêng cho từng offer** dựa vào context có sẵn từ pipeline biz-* (không generic "Cảm ơn anh/chị đã đăng ký, chúng tôi sẽ liên hệ sớm" — đó là copy đốt lead).

> **Triết lý**: Email auto-responder là moment vàng. Lead vừa nhấn nút submit = đang ở peak intent. Email đến trong 30 giây phải (1) confirm họ submit đúng, (2) deliver thứ đã promise trong CTA (lead magnet / booking / payment link), (3) set expectation rõ bước tiếp theo. Một email auto-responder tốt = chuyển 20-40% lead nguội thành lead nóng. Một email generic = lead block sender hoặc forget tên brand trong 24h.
>
> **Tại sao SMTP (không lock vào 1 provider)**: SMTP là chuẩn mở — user pick được provider hợp túi tiền + region + compliance. Gmail SMTP free 500/ngày (đủ cho landing page <50 lead/ngày), Resend SMTP 3000/tháng, SendGrid 100/ngày forever-free, Brevo (popular VN) 300/ngày free, hosting VN (Mắt Bão/PA/Inet) thường tặng kèm SMTP. Code dùng `nodemailer` — swap provider chỉ cần đổi 4 env var, không sửa code. Tránh vendor lock-in.

Output skill: code patch + 2 email draft HTML responsive + env vars list + test plan. **Skill KHÔNG tự gửi test email** — user phải confirm draft trước, vì lead magnet link, brand voice, urgency wording đều thuộc tài sản của user.

---

## Khi nào dùng skill này

- User vừa deploy landing page xong (qua `/biz-deploy-vercel`) và form đang submit vào hư không.
- User có landing page sẵn (Next.js, Vite, hoặc static HTML trên Vercel) và muốn wire email auto-responder.
- User đang build mới và muốn email integration ngay từ đầu trước khi deploy.
- User đã có Gmail/Google Workspace muốn tận dụng SMTP free thay vì tạo account provider mới.
- User có hosting VN (Mắt Bão, PA, Inet) có sẵn SMTP server muốn dùng.

**KHÔNG dùng skill này khi:**
- User muốn email marketing broadcast (newsletter, drip campaign 7-30 ngày) → Mailchimp/ConvertKit/MailerLite phù hợp hơn.
- User muốn SMS/Zalo OA auto-responder → use case khác.
- User muốn CRM tích hợp (lead vào Hubspot/Pipedrive/Notion DB) → skill khác.
- User cần cold email outreach hàng loạt → Instantly/Smartlead, không phải transactional.

---

## Workflow tổng quan (7 phase)

```
Phase 0: DETECT PROJECT STACK (Next.js App / Pages / Vite / static HTML)
       ↓
Phase 1: PICK SMTP PROVIDER (Gmail / Resend SMTP / SendGrid / Mailgun / Brevo / Zoho / Custom)
       ↓
Phase 2: GATHER CONTEXT (offer.json + conversion-copy.md, hoặc đọc Next.js app/page.tsx, hoặc đọc HTML đã deploy)
       ↓
Phase 3: PICK EMAIL PATTERN (lead magnet / booking / payment / nurture)
       ↓
Phase 4: DRAFT 2 EMAIL (auto-responder + owner notification) — show user
       ↓
Phase 5: USER REVIEW & EDIT — iterate cho đến khi user duyệt
       ↓
Phase 6: WIRE CODE (install nodemailer + API route + form binding + env vars)
       ↓
Phase 7: PROVIDER SETUP + TEST PLAN — hướng dẫn lấy SMTP credentials, verify domain (nếu cần), test live
```

Mỗi phase **dừng để user xác nhận** — đặc biệt Phase 1 (provider choice), Phase 4-5 (email content), Phase 7 (provider DNS) vì đó là tài sản brand của user. Code generation ở Phase 6 thì skill chủ động hơn.

---

## Phase 0 — Detect Project Stack

Đọc file root của project để xác định stack. Stack quyết định: API route đặt ở đâu, syntax import `nodemailer`, kiểu form binding (fetch hay form action).

| File phát hiện | Stack | API route path | Form binding |
|---|---|---|---|
| `next.config.js/mjs/ts` + `app/` folder | **Next.js App Router** | `app/api/submit/route.ts` | client component `fetch('/api/submit')` |
| `next.config.js/mjs/ts` + `pages/` folder | **Next.js Pages Router** | `pages/api/submit.ts` | client component `fetch('/api/submit')` |
| `vite.config.js/ts` | **Vite (React/Vue/Svelte)** | `api/submit.js` (Vercel function) | client component `fetch('/api/submit')` |
| `package.json` không có framework, có `index.html` | **Static HTML** | `api/submit.js` (Vercel function) | inline `<script>` với `fetch('/api/submit')` |
| Không có project local, chỉ có URL | **Existing deployed page** | Cần user clone repo trước hoặc chỉ ra repo path | — |

**Đọc thêm để xác định form fields**:
- Tìm `<form>` trong code → liệt kê các `<input name="...">` đã có
- Default expected (per project memory): `name`, `phone`, `email`. Một số page thêm: `company`, `message`, `budget`, `utm_source`.
- Nếu form chưa có → skill sẽ tạo form mới với 3 field tối thiểu (tên/SĐT/email) trong Phase 6.

**Quan trọng**: Nếu user chưa có project local (chỉ deploy được URL), dừng lại hỏi: *"Anh/chị có repo local để em wire code không? Em cần edit file source. Nếu chỉ có URL, anh/chị clone repo về và chỉ em đường dẫn nhé."* Không thể wire chỉ qua URL.

---

## Phase 1 — Pick SMTP Provider

Hỏi user chọn 1 trong 7 provider. Mỗi provider có config SMTP khác nhau (host/port/auth), skill auto-fill template env vars khi user pick.

| # | Provider | Free tier | Phù hợp khi | SMTP host | Port | Notes |
|---|---|---|---|---|---|---|
| 1 | **Gmail / Google Workspace** | 500/ngày | User có sẵn Gmail/Workspace, traffic thấp | `smtp.gmail.com` | 587 (STARTTLS) | Bắt buộc App Password (2FA), KHÔNG xài password chính |
| 2 | **Resend SMTP** | 3000/tháng | Muốn deliverability cao + log đẹp, OK setup DNS | `smtp.resend.com` | 587 | User = `resend`, Pass = API key. Cần verify domain để gửi từ custom `@brand.vn` |
| 3 | **SendGrid SMTP** | 100/ngày forever-free | Stack đã quen SendGrid, cần webhook | `smtp.sendgrid.net` | 587 | User = `apikey` literal, Pass = API key |
| 4 | **Mailgun SMTP** | 100/ngày × 3 tháng | EU/US region, dev-friendly | `smtp.mailgun.org` (US) hoặc `smtp.eu.mailgun.org` (EU) | 587 | User/pass từ Mailgun domain settings |
| 5 | **Brevo (Sendinblue) SMTP** | 300/ngày forever-free | **Popular VN, free tier rộng nhất**, có VN support | `smtp-relay.brevo.com` | 587 | User = login email, Pass = SMTP key (khác API key) |
| 6 | **Zoho Mail SMTP** | 5/ngày free, $1/user/tháng | User đã xài Zoho Workspace | `smtp.zoho.com` | 587 | Cần App Password nếu bật 2FA |
| 7 | **Custom SMTP** | Phụ thuộc hosting | Hosting VN (Mắt Bão/PA/Inet/Nhân Hòa) tặng kèm SMTP, hoặc dùng Postfix tự host | User cung cấp | User cung cấp | User paste full host/port/user/pass |

**Default recommendation theo offer type**:
- Landing page <50 lead/ngày, user có Gmail → **Gmail SMTP** (zero cost, 5 phút setup).
- Landing page >50 lead/ngày hoặc cần deliverability pro → **Brevo** (free 300/ngày, deliverability tốt cho VN) hoặc **Resend SMTP** (3000/tháng, log đẹp).
- User muốn migration-proof, có thể self-host sau này → **Custom SMTP** ngay từ đầu.

**Format câu hỏi cho user**:
```
Anh/chị muốn dùng SMTP provider nào để gửi email tự động?

1. Gmail / Google Workspace (free 500/ngày, dễ nhất nếu đã có Gmail)
2. Resend SMTP (free 3000/tháng, deliverability cao, cần verify domain)
3. SendGrid SMTP (free 100/ngày forever, đã quen API)
4. Mailgun SMTP (free 100/ngày × 3 tháng)
5. Brevo / Sendinblue SMTP (free 300/ngày, popular VN)
6. Zoho Mail SMTP (nếu đã xài Zoho Workspace)
7. Custom SMTP (hosting VN của anh/chị có sẵn / tự host)

Nếu chưa có sẵn account nào, em đề xuất [Gmail nếu traffic thấp / Brevo nếu cần deliverability cao]. Anh/chị chọn số mấy?
```

Sau khi user chọn → lưu lại để Phase 6 inject vào env template + Phase 7 hướng dẫn lấy credentials đúng provider.

> ⚠️ **Quan trọng — security**: SMTP credentials (đặc biệt App Password Gmail) có quyền gửi email từ tài khoản của user. **Không bao giờ** hardcode vào source code. Luôn qua env var. Cảnh báo user rotate ngay nếu vô tình commit.

---

## Phase 2 — Gather Context

Mục tiêu: hiểu offer đủ sâu để draft email không generic. 3 mode input:

### Mode A — Có pipeline artifacts (richest)
User vừa chạy `/biz-offer-alex-hormozi` và/hoặc `ui-ux-pro-max` → có file:
- `output/<case-slug>/offer.json` — segment, dream outcome, mechanism, bonus stack, guarantee, pricing (PRIMARY source of truth)
- `output/<case-slug>/conversion-copy.md` — hero block paste-ready (headline, subhead, CTA wording)
- `output/<case-slug>/landing-page/app/page.tsx` — Next.js sales page hiện tại đã build (đọc để biết sections + form fields đang dùng)

> ⚠️ **Update 2026-05-14:** Pipeline cũ có `layout.json` + `copy.json` (từ `biz-sales-page-layout` đã DEPRECATED) — quy trình mới SKIP 2 file đó. Chỉ cần `offer.json` + đọc page.tsx là đủ context.

**Đọc 3 source trên**. Trích ra cho email:
- **Segment + dream outcome** → personalize subject line ("[Tên], lộ trình AI Agent 8 tuần đã sẵn sàng" thay vì "Welcome")
- **Mechanism name** → reinforce trong body ("Hệ thống PROMPT framework anh/chị sắp học...")
- **Bonus stack** → list trong email (nếu offer free/low-ticket có bonus deliver ngay)
- **Guarantee text** → quote nguyên trong email để giảm anxiety
- **CTA wording** → mirror trong email final CTA

### Mode B — Có landing page nhưng không có json
User có HTML deployed nhưng không chạy biz-offer/biz-sales-page. Skill đọc HTML:
- `curl -s <URL>` hoặc đọc file `index.html` local
- Parse hero h1, subheading, CTA button text, pricing block, guarantee block
- Từ đó infer offer type + segment

Mode B đủ tốt 80% case nhưng email kém personalized hơn Mode A. **Suggest user**: "Có thể chạy `/biz-offer-alex-hormozi` để có offer.json rồi quay lại đây, email sẽ chất hơn. Hoặc tiếp tục Mode B."

### Mode C — Không có gì
User chỉ có form HTML, chưa có context. Skill phải phỏng vấn 5 câu nhanh:
1. Sản phẩm/dịch vụ anh/chị bán là gì? (1 câu)
2. Sau khi user điền form, anh/chị muốn gửi cho họ thứ gì? (PDF tải về / link booking / link payment / chỉ confirm và sẽ gọi sau)
3. Tên brand + tên người gửi (sẽ hiện trong "From:")
4. Email anh/chị muốn nhận notification lead mới
5. Domain anh/chị sở hữu để verify SPF/DKIM (nếu chọn Resend/SendGrid/Mailgun/Brevo — Gmail thì skip)

---

## Phase 3 — Pick Email Pattern

**Mô hình 2-trigger (cho offer có checkout flow)**: Với low-ticket course / digital product có thanh toán online, có **2 trigger điểm khác nhau, gửi 2 email khác nhau**. Đừng gộp vào 1 email duy nhất.

```
Lead điền form trên landing page
         ↓
   [Trigger A — /api/submit]
         ↓
   Email P3 (PRE-PAYMENT REMINDER, slim)
         ↓
Lead thanh toán xong → payment provider webhook
         ↓
   [Trigger B — /api/payment-webhook]
         ↓
   Email P5 (POST-PURCHASE ONBOARDING, full)
```

**Quy tắc nội dung**:
- **P3 (pre-payment)**: chỉ có payment link + guarantee ngắn + urgency. **KHÔNG** list full deliverables/bonus stack — lead chưa "earn" được, list ra giảm urgency thanh toán.
- **P5 (post-payment)**: deliver TOÀN BỘ — access link, full deliverables, bonus stack, group link, lịch office hour, **1 câu hỏi follow-up** để personalize. Đây mới là moment vàng.

(Đọc memory `feedback_email-autoresponder-2-stage-flow` cho rationale chi tiết.)

---

Từ context Phase 2, chọn pattern phù hợp. Đọc `references/email-formulas.md` cho template chi tiết tiếng Việt.

| Pattern | Trigger | Khi nào dùng | Subject hint |
|---|---|---|---|
| **P1 — Lead Magnet Delivery** | Form submit | Offer = tải PDF/ebook/template/swipe file/checklist free | "[Tên], tài liệu [X] đã sẵn sàng — mở file ngay 👇" |
| **P2 — Booking Confirmation** | Form submit | Offer = đặt lịch call/consultation/demo/free strategy session | "[Tên], đã ghi nhận đăng ký buổi tư vấn — bước tiếp theo bên trong" |
| **P3 — Pre-Payment Reminder** | Form submit (chưa pay) | Offer = sản phẩm low-ticket (199K-3M VND), email dẫn về checkout | "[Tên], link thanh toán [Khóa X] — giữ giá ưu đãi 24h ⏰" |
| **P4 — Nurture (Sale call upcoming)** | Form submit | Offer = high-ticket coaching/agency 5M-50M+ VND, sales team sẽ call trong 24h | "[Tên], em [Người gọi] sẽ liên hệ trong 24h — checklist chuẩn bị bên trong" |
| **P5 — Post-Purchase Onboarding** | **Payment webhook** | Lead vừa thanh toán xong — deliver full value + 1 câu hỏi personalize | "🎉 Chào mừng [Tên] vào [Khóa X] — mở khoá ngay" |

**Quy tắc chọn pattern**:
- Offer = free download/training → **P1 only** (1 trigger, 1 email).
- Offer = booking call free → **P2 only** (1 trigger, 1 email).
- Offer = low-ticket có thanh toán online (Stripe/Momo/ZaloPay/Sepay) → **P3 + P5** (2 trigger, 2 email).
- Offer = high-ticket sale call → **P4 only**, follow-up qua sales team (onboarding sau khi close deal là 1 process khác).

Skill **đề xuất pattern phù hợp + lý do**, hỏi user confirm. Ví dụ: *"Dựa vào offer.json em thấy đây là khoá 1.99M VND có payment integration. Em đề xuất setup **2 email**: P3 (nhắc thanh toán khi điền form) + P5 (onboarding sau khi pay xong + 1 câu hỏi personalize). Anh/chị đồng ý hay chỉ muốn 1 email P3 trước?"*

---

## Phase 4 — Draft 2 Email

Generate **2 email tiếng Việt thuần** (xưng anh/chị), mobile-responsive HTML.

### Email A — Auto-responder gửi cho lead

Cấu trúc 6 block (đọc `references/email-formulas.md` cho wording cụ thể per pattern):

1. **Subject line** — personalized với `{{name}}`, ngắn dưới 50 ký tự, có 1 emoji nhẹ ở cuối nếu phù hợp brand voice (✉️ 👇 ✓), tránh spam trigger ("FREE", "$$$", "guarantee" caps).
2. **Preview text** — 1 câu hiển thị dưới subject trong inbox, giải thích value email mở ra.
3. **Greeting** — "Chào anh/chị {{name}}," — không "Dear", không "Xin chào quý khách".
4. **Body chính** — theo pattern đã chọn. Quy tắc:
   - Ngắn (dưới 200 từ).
   - Có 1 link/button CTA primary rõ ràng.
   - Reference cụ thể tên offer/mechanism từ context (không "sản phẩm của chúng tôi").
   - Nếu Pattern P3/P4 → có 1 urgency reminder + 1 reassurance (guarantee).
5. **Signature** — Tên người gửi + tên brand + 1 link contact (Zalo/Phone/Website).
6. **Footer** — Address (luật anti-spam yêu cầu) + unsubscribe link (cần cho compliance, dù transactional cũng nên có).

### Email B — Notification gửi cho owner

Cấu trúc gọn (owner cần info nhanh, không cần style):

```
Subject: 🔥 Lead mới — {{name}} ({{phone}}) — {{landing_page_slug}}

Tên: {{name}}
SĐT: {{phone}}
Email: {{email}}
Source: {{utm_source || 'direct'}}
Page: {{landing_page_url}}
Thời gian: {{timestamp_vn}}

Suggested action: {{action_per_pattern}}
- P1: Lead vừa nhận PDF, follow-up trong 48h
- P2: Vào lịch call, gọi xác nhận trong 1h
- P3: Theo dõi payment, gọi nếu chưa pay sau 2h
- P4: Gọi ngay trong 5 phút (hot lead, intent peak)
```

### Show to user

Sau khi draft xong, **show full HTML preview của Email A** + plain text của Email B. Format response:

```
📧 EMAIL A (gửi cho lead) — Pattern P3

Subject: Anh Tony, link thanh toán "AI Agent + Personal Branding" bên trong — giữ giá 1.99M trong 24h ⏰

Preview: Em vừa nhận thông tin đăng ký của anh. Link thanh toán + lộ trình 8 tuần ngay dưới đây...

[HTML rendered]
<HTML preview here>

---

📧 EMAIL B (gửi cho owner — hoang.tran@prediction3d.com)

Subject: 🔥 Lead mới — Anh Tony (0901234567) — ai-agent-course

Tên: Tony
SĐT: 0901234567
Email: tony@example.com
...

---

Anh/chị review giùm em:
1. Subject line OK không, có muốn em thử variant?
2. Body tone đã đúng brand voice chưa?
3. CTA button có cần đổi text/link?
4. Có thiếu thông tin gì (URL bonus, guarantee detail, Zalo link)?
```

---

## Phase 5 — User Review & Edit

Đợi user feedback. 3 loại feedback thường gặp:

| Feedback | Hành động |
|---|---|
| "OK, gửi đi" / "Duyệt" | Đi Phase 6 wire code |
| "Đổi câu X thành Y" / "Subject ngắn hơn" / "Thêm link Zalo" | Edit inline, show lại preview, hỏi confirm |
| "Tone chưa đúng, làm lại từ đầu" | Hỏi rõ tone họ muốn (chuyên nghiệp / thân thiện / hài hước / formal), redraft |

**Quan trọng**: Không tự ý "polish" thêm khi user đã OK. User OK = wire code ngay. Skill bị fail mode là loop polish vô tận khi user đã sign-off.

---

## Phase 6 — Wire Code

Skill thực thi 4 thay đổi:

### 6.1 Install nodemailer

```bash
# Detect package manager qua lockfile
# pnpm-lock.yaml → pnpm add nodemailer && pnpm add -D @types/nodemailer
# yarn.lock → yarn add nodemailer && yarn add -D @types/nodemailer
# package-lock.json → npm install nodemailer && npm install -D @types/nodemailer
# Static HTML không có package.json → tạo package.json mới với "nodemailer": "^6.9.0"
```

`@types/nodemailer` chỉ cần nếu project TypeScript.

### 6.2 Tạo API route

Theo stack đã detect Phase 0, đọc template tương ứng:

| Stack | Template | Đích copy |
|---|---|---|
| Next.js App Router | `templates/api-route-nextjs-app.ts` | `app/api/submit/route.ts` |
| Next.js Pages Router | `templates/api-route-nextjs-pages.ts` | `pages/api/submit.ts` |
| Vite / Static HTML | `templates/api-route-vercel-function.js` | `api/submit.js` |

API route làm 5 việc:
1. Parse body (JSON từ fetch hoặc form-data từ form action).
2. Validate fields cơ bản (name, phone, email không empty; email regex check; phone là string).
3. Render 2 email HTML từ template (inject biến `{{name}}`, `{{phone}}`, `{{offer_name}}`).
4. Tạo `nodemailer.createTransport({ host, port, secure, auth: { user, pass } })` từ env vars, gọi `transporter.sendMail()` 2 lần. `Promise.all()` để parallel.
5. Return `200 { ok: true }` hoặc `500 { error }`.

**Quan trọng — runtime**: Next.js App Router phải set `export const runtime = "nodejs"` ở đầu file route. `nodemailer` dùng Node `net`/`tls` module, KHÔNG chạy được trên Edge runtime.

**Lý do tách 2 email call**: Owner email không cần template phức tạp (plain HTML đủ), nhưng lead email cần responsive. Tách giúp debug dễ hơn khi 1 cái fail.

### 6.3 Wire form

Đọc HTML/JSX hiện tại, thay đổi:
- Form action: `<form onSubmit={handleSubmit}>` (React) hoặc `<form id="lead-form">` + inline script (static HTML)
- Add validation client-side cơ bản (required, type="email", pattern="[0-9]{9,11}" cho SĐT VN)
- Add loading state ("Đang gửi..." button text khi submit)
- Add success/error state hiển thị inline (không alert)

Template snippet: `templates/form-binding-react.tsx` và `templates/form-binding-vanilla.html`.

**Success state wording (VN)**:
> ✓ Đã nhận thông tin! Anh/chị check email (và spam folder) trong 1 phút tới. Có gì cần hỗ trợ liên hệ Zalo: 09xx.xxx.xxx

**Error state wording**:
> ⚠️ Có lỗi gửi form. Anh/chị thử lại hoặc liên hệ trực tiếp Zalo 09xx.xxx.xxx

### 6.4 Setup env vars

Tạo/update `.env.local` (nếu Next.js/Vite) hoặc thêm vào Vercel dashboard env (static HTML). **Template chung cho mọi provider**:

```env
# SMTP transport — đổi 4 biến này để swap provider, code không sửa
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false              # false = STARTTLS (port 587), true = SSL (port 465)
SMTP_USER=youremail@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # Gmail App Password / Resend API key / SendGrid API key / ...

# Email addresses
MAIL_FROM="Tên Brand <hello@yourbrand.vn>"
OWNER_EMAIL=hoang.tran@prediction3d.com

# Branding
LANDING_PAGE_URL=https://yourbrand.vn
```

**Preset SMTP_HOST/SMTP_PORT theo provider Phase 1**:

| Provider chọn ở Phase 1 | SMTP_HOST | SMTP_PORT | SMTP_SECURE | SMTP_USER ví dụ | SMTP_PASS ví dụ |
|---|---|---|---|---|---|
| Gmail / Workspace | `smtp.gmail.com` | `587` | `false` | `youremail@gmail.com` | App Password 16 ký tự |
| Resend SMTP | `smtp.resend.com` | `587` | `false` | `resend` (literal) | `re_xxxxxxxx` API key |
| SendGrid | `smtp.sendgrid.net` | `587` | `false` | `apikey` (literal) | `SG.xxxxxxxx` API key |
| Mailgun US | `smtp.mailgun.org` | `587` | `false` | `postmaster@mg.yourbrand.vn` | Mailgun SMTP password |
| Mailgun EU | `smtp.eu.mailgun.org` | `587` | `false` | (same) | (same) |
| Brevo / Sendinblue | `smtp-relay.brevo.com` | `587` | `false` | login email Brevo | SMTP key (Brevo dashboard → SMTP & API) |
| Zoho Mail | `smtp.zoho.com` | `587` | `false` | `you@yourbrand.vn` | App Password Zoho |
| Custom | User cung cấp | User cung cấp | User cung cấp | User cung cấp | User cung cấp |

**Quan trọng — không hardcode**:
- Add `.env.local` vào `.gitignore` nếu chưa có.
- Nếu deploy Vercel, hướng dẫn user vào Vercel dashboard → Project → Settings → Environment Variables → paste vào → redeploy. (Không thể setup env qua CLI nếu user chưa link project.)
- Cảnh báo nếu thấy hardcode `SMTP_PASS`/App Password trong code: rollback ngay + suggest user rotate password.

---

## Phase 7 — Provider Setup + Test Plan

### 7.1 Lấy SMTP credentials theo provider

Hướng dẫn cụ thể trong `references/domain-verification.md`. Tóm tắt nhanh per provider:

#### Gmail / Google Workspace
1. Bật 2FA tại [myaccount.google.com/security](https://myaccount.google.com/security) (BẮT BUỘC, không xài password thường được nữa từ 2022).
2. Vào [App Passwords](https://myaccount.google.com/apppasswords) → chọn "Mail" + "Other (Custom name)" → đặt tên (vd: "Landing Page yourbrand.vn") → copy 16 ký tự (dạng `abcd efgh ijkl mnop`, **bỏ space khi paste**).
3. `SMTP_USER=youremail@gmail.com`, `SMTP_PASS=abcdefghijklmnop`.
4. `MAIL_FROM` phải = `SMTP_USER` (Gmail không cho phép gửi từ alias khác trừ khi setup "Send mail as").
5. Giới hạn: 500 email/ngày cho Gmail personal, 2000/ngày cho Workspace.

#### Resend SMTP
1. Login [resend.com](https://resend.com) → API Keys → tạo key mới (read+write).
2. `SMTP_USER=resend` (literal), `SMTP_PASS=re_xxxxxxxx`.
3. Verify domain → add DNS record (SPF/DKIM) — xem `references/domain-verification.md` section "Resend".
4. Sau verify, `MAIL_FROM="Brand <hello@yourbrand.vn>"`. Trước verify chỉ dùng `onboarding@resend.dev`.

#### SendGrid SMTP
1. Login [sendgrid.com](https://sendgrid.com) → Settings → API Keys → Create → Full Access → copy key (chỉ hiện 1 lần).
2. `SMTP_USER=apikey` (literal — đúng chữ "apikey"), `SMTP_PASS=SG.xxxxxxxx`.
3. Sender Authentication → Domain Authentication → add DNS record.

#### Mailgun SMTP
1. Login [mailgun.com](https://mailgun.com) → Sending → Domains → chọn domain → SMTP credentials.
2. Copy username (`postmaster@mg.yourbrand.vn`) + reset password để lấy.
3. Add DNS record (Mailgun cung cấp 4-5 record).

#### Brevo (Sendinblue) SMTP
1. Login [brevo.com](https://brevo.com) → SMTP & API → SMTP tab → Generate a new SMTP key.
2. `SMTP_USER` = email đăng nhập Brevo, `SMTP_PASS` = SMTP key vừa generate (KHÔNG dùng API key).
3. Senders → add domain → DNS record.

#### Zoho Mail SMTP
1. Cần đã có Zoho Mail account.
2. Bật 2FA → Security → App Passwords → tạo mới.
3. `SMTP_USER=you@yourbrand.vn`, `SMTP_PASS=app-password`.

#### Custom SMTP (hosting VN)
1. Liên hệ hosting (Mắt Bão / PA / Inet / Nhân Hòa) lấy: SMTP host, port (thường 587 hoặc 465), email account user/pass.
2. Test bằng `swaks` hoặc `telnet smtp.host 587` trước khi cấu hình.

### 7.2 Domain verification (chỉ áp dụng provider 2-7, KHÔNG cần cho Gmail nếu gửi từ chính địa chỉ Gmail)

Đọc `references/domain-verification.md` cho hướng dẫn chi tiết SPF/DKIM theo provider + theo DNS provider (Cloudflare/Namecheap/GoDaddy/Mắt Bão).

**Dừng skill ở đây nếu domain chưa verified** (với provider yêu cầu verify). Báo user: *"Em đã wire code xong. Anh/chị add DNS record vào domain provider, đợi verify (5-30 phút), báo em khi xanh dấu tick để em test live."*

### 7.3 Test plan

3 cách test, đi từ nhẹ đến nặng:

**Test 0 — Sanity check SMTP credentials với swaks (terminal)**:
```bash
# Cài: brew install swaks
swaks --to hoang.tran@prediction3d.com \
      --from "$SMTP_USER" \
      --server "$SMTP_HOST" \
      --port 587 --tls \
      --auth-user "$SMTP_USER" --auth-password "$SMTP_PASS" \
      --header "Subject: SMTP test" \
      --body "Test from skill"

# Expect: "250 OK" cuối log = SMTP credentials đúng.
# Nếu fail ở "AUTH LOGIN" → user/pass sai.
# Nếu fail ở "TLS" → port hoặc SMTP_SECURE setting sai.
```

**Test 1 — Local API endpoint**:
```bash
# Sau khi `npm run dev` chạy local
curl -X POST http://localhost:3000/api/submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","phone":"0901234567","email":"hoang.tran@prediction3d.com"}'

# Expect: {"ok":true}
# Check email hoang.tran@prediction3d.com — phải nhận 2 email (1 auto-responder + 1 notification).
```

**Test 2 — Live form trên localhost**:
- Mở `http://localhost:3000` (hoặc port tương ứng), điền form thực tế.
- Submit, xem có success state hiện không.
- Check email inbox + spam folder.

**Test 3 — Production sau khi deploy**:
- Suggest user chạy `/biz-deploy-vercel` để push code mới.
- Sau khi deploy, test live URL với email thực của owner.
- Check provider dashboard (Resend / SendGrid / Brevo dashboard có log; Gmail xem Sent folder).

### 7.4 Monitor sau test

- **Resend / SendGrid / Mailgun / Brevo**: dashboard có log Delivered/Opened/Bounced/Complained. Pin tab.
- **Gmail SMTP**: không có dashboard, check Sent folder của Gmail. Nếu bounce, Gmail gửi lại notification email.
- **Custom SMTP**: log thường ở `/var/log/mail.log` trên server, hoặc cPanel → Mail Logs.

Nếu thấy bounce rate >5% hoặc complaint >0.5% → email content có vấn đề, redraft.

---

## Quy tắc viết email tiếng Việt thuần (NEVER VIOLATE)

1. **Xưng hô**: "anh/chị" (default), hoặc "anh" / "chị" nếu biết giới tính từ form. Không "bạn", không "quý khách", không "Mr./Ms.".
2. **Người gửi xưng**: "em" (default cho B2C VN), hoặc "mình" (casual freelancer/coach), hoặc "chúng tôi" (corporate). Đọc `offer.json` `voice.register` hoặc Next.js `app/page.tsx` để decide.
3. **Currency**: VND, charm pricing "1.99M", "199K", "499K". Không "$99", không "1.990.000 VNĐ" lủng củng.
4. **Date format**: dd/mm/yyyy. Time: 14h30 (không 2:30 PM).
5. **Phone**: format VN "0901 234 567" (cách 3-3-3), không "+84-90-123-4567".
6. **Spam triggers tránh**: ALL CAPS subject, "FREE!!!", "100% guarantee", "Act now". Đặc biệt quan trọng khi xài Gmail SMTP (spam filter strict).
7. **Emoji**: tối đa 1 emoji ở subject, 0-2 emoji trong body. Không emoji-spam. Phù hợp: ✓ ⏰ 👇 ✉️ 🔥 📩. Tránh: 🎉🎊✨💯 (spam-y).
8. **CTA button text**: imperative ngắn — "Tải ngay", "Mở khóa truy cập", "Xem lộ trình 8 tuần", "Thanh toán giữ chỗ". Không "Click here", "Submit".
9. **No machine translation feel**: nếu thấy câu nào dịch từ template tiếng Anh, rewrite. Ví dụ: "We received your submission" → "Em vừa nhận thông tin anh/chị gửi" (không "Chúng tôi đã nhận được sự đệ trình của bạn").

---

## Output cuối cùng skill trả về user

Sau Phase 7, summary cho user:

```
✓ Đã wire xong SMTP email cho landing page (provider: Gmail/Brevo/...)

📁 File thay đổi:
- app/api/submit/route.ts (NEW)
- app/components/LeadForm.tsx (MODIFIED — wire fetch + validation)
- .env.local (NEW — KHÔNG commit)
- .gitignore (MODIFIED — add .env.local)
- package.json (MODIFIED — add nodemailer)

📧 Email đã setup:
- Email A (auto-responder): Pattern P3 — payment link
- Email B (notification): gửi tới hoang.tran@prediction3d.com

📨 SMTP provider: [Gmail / Resend / SendGrid / Brevo / Custom]
- Host: smtp.xxx
- Port: 587
- Free tier: NNN email/ngày

🔧 TODO của anh/chị (manual gate):
1. Lấy SMTP credentials (xem Phase 7.1 trong skill) → paste vào .env.local
2. (Nếu provider khác Gmail) add DNS record verify domain → đợi 5-30 phút
3. Test local: chạy swaks (Test 0) → `npm run dev` rồi điền form (Test 1-2)
4. Khi pass test, deploy: chạy `/biz-deploy-vercel`
5. Add env vars trên Vercel dashboard trước khi deploy

📊 Monitor: [provider dashboard URL] — xem log delivered/opened/bounced.
```

---

## Reference files

- `references/email-formulas.md` — 4 pattern email tiếng Việt chi tiết (P1/P2/P3/P4) với template subject + body + CTA
- `references/nextjs-setup.md` — Wiring chi tiết Next.js App Router + Pages Router với nodemailer
- `references/static-html-setup.md` — Wiring static HTML + Vercel serverless function với nodemailer
- `references/domain-verification.md` — SPF/DKIM setup theo từng SMTP provider (Resend/SendGrid/Mailgun/Brevo) + theo DNS provider phổ biến VN
- `references/troubleshooting.md` — Common issues: SMTP auth fail, email vào spam, rate limit, Gmail App Password expire

## Templates

- `templates/api-route-nextjs-app.ts` — Next.js App Router API route (nodemailer)
- `templates/api-route-nextjs-pages.ts` — Next.js Pages Router API route (nodemailer)
- `templates/api-route-vercel-function.js` — Vercel serverless function cho static/Vite (nodemailer)
- `templates/email-confirmation.html` — Lead auto-responder HTML responsive
- `templates/email-notification.html` — Owner notification HTML gọn
- `templates/form-binding-react.tsx` — React form với fetch + validation + states
- `templates/form-binding-vanilla.html` — Vanilla HTML form với inline script

---

## Anti-pattern (đừng làm)

- ❌ Gửi email "Cảm ơn anh/chị đã đăng ký, chúng tôi sẽ liên hệ sớm" — quá generic, không deliver value, lead quên brand trong 5 phút.
- ❌ Subject "[BRAND] - Notification #12345" — không personalized, đốt open rate.
- ❌ Hardcode SMTP_PASS / App Password trong source code → rotate ngay nếu thấy.
- ❌ Dùng Gmail password chính (không phải App Password) → Google block từ 2022, sẽ fail auth.
- ❌ Dùng `from` khác domain với SMTP_USER khi chưa verify (Resend/SendGrid/Mailgun/Brevo) → fail SPF, vào spam.
- ❌ Skip domain verification, gửi qua Gmail SMTP cho production traffic cao → bị Gmail rate-limit + flag spam.
- ❌ Đặt `export const runtime = "edge"` trong Next.js route dùng nodemailer → crash (nodemailer cần Node `net`/`tls`).
- ❌ Tự ý gửi test email mass mà không hỏi user.
- ❌ Email A có 3-4 CTA cùng lúc → confused lead, drop conversion.
- ❌ Email B (owner notification) HTML rườm rà → owner cần info nhanh, plain text đủ.
- ❌ Lock vào 1 SMTP provider cụ thể trong code → user muốn migration phải rewrite. Code phải đọc từ env, swap provider = đổi env, không sửa code.
