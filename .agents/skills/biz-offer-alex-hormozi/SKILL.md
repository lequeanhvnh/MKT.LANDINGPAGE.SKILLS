---
name: biz-offer-alex-hormozi
description: "Đóng gói offer **không thể chối từ** (grand slam offer) theo phương pháp Alex Hormozi ($100M Offers) — nhận input pains/gains/customer jobs theo Value Proposition Design (Osterwalder 2014) + sản phẩm/dịch vụ, rồi sinh ra: (1) markdown report tiếng Việt đầy đủ Value Equation scoring + Core Offer + 3-4 Bonus stack + Guarantee + Urgency + Pricing, (2) offer.json structured cho pipeline downstream (`ui-ux-pro-max` build sales page production-ready), (3) conversion copy block (headline + subheadline + CTA) sẵn sàng paste landing page. 2 input mode: (B) user paste sẵn pains + gains + product, (C) user chỉ có sản phẩm — skill phỏng vấn theo VPD framework để surface pain/gain trước. Bonus stack mode hybrid: skill brainstorm 5-7 candidate có justification value rồi user pick/chỉnh 3-4 cái. Tiếng Việt thuần (xưng anh/chị), giá VND charm pricing (X99K), 3-tier decoy structure. USE WHEN user says 'đóng gói offer', 'tạo offer', 'thiết kế offer Hormozi', 'grand slam offer', 'value stack', 'offer stack', 'làm offer hấp dẫn', 'package offer', 'tạo offer từ pain gain', 'có VPC rồi đóng gói offer', 'biz-offer', 'offer alex hormozi', '100M offers', 'value equation offer', 'bonus stack', 'guarantee offer', 'pricing strategy VND', 'đóng gói sản phẩm số', 'tạo offer khóa học', 'offer coaching', 'offer dịch vụ', 'làm sao tăng perceived value', 'offer cho ngách của tôi'. Cũng trigger khi user có sẵn pain profile từ VPD pipeline (vpc.json) và muốn package thành offer; hoặc user chỉ có ý tưởng sản phẩm và cần một offer hoàn chỉnh để bán. Skill này KHÔNG làm: market research độ lớn nhu cầu (dùng `market-research`), customer profile từ đầu (dùng VPD pipeline trước), build sales page production-ready (dùng `ui-ux-pro-max` sau khi có offer.json — skill đó style + palette + component đúng design language, KHÔNG dùng `biz-sales-page-layout` cũ vì pipeline đã skip bước wireframe trung gian)."
---

# Biz Offer — Alex Hormozi $100M Offers Packaging Skill

Skill này biến **một sản phẩm/dịch vụ + một bộ pain/gain của khách hàng** thành **một offer không thể chối từ** (grand slam offer) theo phương pháp luận của Alex Hormozi trong sách *$100M Offers* (2021), kết hợp với Value Proposition Design (Osterwalder 2014) làm input và Vietnamese market pricing psychology.

> **Triết lý gốc của Hormozi**: "Make people an offer so good they would feel stupid saying no."  
> **Công thức**: Value = (Dream Outcome × Perceived Likelihood) ÷ (Time Delay × Effort & Sacrifice).  
> **Nguyên tắc**: Value > Price tối thiểu 10x. Stack bonus thay vì giảm giá. Risk reversal thay vì thêm feature.

Đầu ra của skill này là 4 file đặt trong `output/<slug>/`:
- `02-offer.json` — structured data, **single source of truth** cho cả pipeline downstream (ui-ux-pro-max, biz-email-setup, biz-sales-page-copy) lẫn HTML report
- `02-offer.html` — HTML report visual (load `02-offer.json`) — hồ sơ khách hàng + value stack + value-equation chart + 3-tier pricing decoy + guarantee + urgency + FAQ. Copy `templates/offer-report.html` y nguyên, không cần edit.
- `02-offer.md` — báo cáo markdown để in/đọc/review (optional — sinh nếu user cần diff/grep workflow)
- `02-conversion-copy.md` — block headline + sub + CTA sẵn sàng paste sales page

---

## Khi nào dùng skill này

- User có **pain/gain profile** (từ VPD pipeline hoặc paste trực tiếp) và **sản phẩm/dịch vụ** → cần đóng gói thành offer.
- User chỉ có **ý tưởng sản phẩm** → muốn skill phỏng vấn để surface pain/gain rồi package luôn.
- User đang chuẩn bị **launch khóa học / coaching / dịch vụ / digital product** ở thị trường Việt Nam.
- User muốn **rebuild offer hiện tại** vì conversion thấp hoặc giá quá thấp.

**KHÔNG dùng skill này khi:**
- Cần research độ lớn thị trường → dùng `market-research`.
- Chưa có hình dung customer cụ thể → chạy VPD pipeline trước (vpd-customer-profile-builder).
- Cần build sales page production-ready từ offer.json → dùng `ui-ux-pro-max` (skill này feed input cho skill đó). KHÔNG dùng `biz-sales-page-layout` cũ — pipeline đã skip bước wireframe trung gian, đi thẳng từ offer → Next.js production HTML có design language nhất quán (style + palette + font pairing + component patterns).

---

## Workflow tổng quan (7 phase)

```
Phase 0: DETECT INPUT MODE (B paste / C interview)
       ↓
Phase 1: ANCHOR — chốt 1 segment + 1 dream outcome cụ thể + top 3 pain + top 3 gain
       ↓
Phase 2: SCORE VALUE EQUATION — chấm 4 lever (1-10) để biết bonus nên đánh đâu
       ↓
Phase 3: DESIGN CORE OFFER — sản phẩm chính, ~60-70% tổng stack value
       ↓
Phase 4: BRAINSTORM BONUS STACK — đề xuất 5-7 bonus → user pick 3-4
       ↓
Phase 5: GUARANTEE — propose 2-3 risk reversal variants
       ↓
Phase 6: URGENCY — propose 2-3 scarcity element thật
       ↓
Phase 7: PRICING + OUTPUT — VND charm pricing, 3-tier decoy, sinh 3 file
```

Mỗi phase đều **hỏi user xác nhận hoặc lựa chọn**. Skill không tự ý chốt — chỉ propose và để user quyết định. Đây là Customer Profile và offer của họ, không phải của mình.

---

## Phase 0 — Detect Input Mode

Đọc message của user. Skill cần phân biệt 2 trường hợp:

**Mode B — User đã có pain/gain ready**: User paste sẵn 1 trong các format sau:
- Pains/Gains/Customer Jobs theo VPD format (bullet list)
- File `vpc.json` từ pipeline VPD (path: `output/cases/<slug>/vpc.json`)
- Đoạn mô tả chi tiết về khách hàng và sản phẩm cùng lúc

→ Đi thẳng vào **Phase 1** với data đã có.

**Mode C — User chỉ có sản phẩm/dịch vụ**: User nói kiểu "tôi đang bán khóa học X" hoặc "tôi muốn launch dịch vụ Y" mà KHÔNG kèm pain/gain.

→ Phải chạy **interview ngắn** trước khi vào Phase 1. Đọc `references/interview-questions-mode-c.md` để biết câu hỏi VPD-style cần hỏi.

**Quan tâm**: Đừng cho phép user skip phase pain/gain. Offer mà không hiểu pain của khách thì luôn vague và conversion thấp. Đó là lý do Hormozi viết hẳn 1 chương về "Pricing → Value" — giá trị bắt đầu từ pain.

---

## Phase 1 — Anchor: Chốt Segment + Dream Outcome + Pain/Gain

Trước khi design offer, phải có 4 yếu tố này được **viết ra rõ ràng** và **user gật đầu**:

### 1.1 Niche/Segment cụ thể

Không chấp nhận "doanh nghiệp" hay "phụ nữ". Phải narrow xuống mức cụ thể như:
- "Solopreneur Việt Nam bán khóa học online doanh thu 30-100M/tháng, đang stuck ở scaling"
- "Mẹ bỉm sữa 28-35 tuổi ở thành thị, có 1-2 con dưới 5 tuổi, đi làm văn phòng full-time"

→ Hỏi user xác nhận: "Anh/chị xác nhận target segment chính xác là [X]?"

### 1.2 Dream Outcome — cực kỳ specific

Theo Hormozi, dream outcome phải có 3 tiêu chí: **Specific, Measurable, Time-bound**.

❌ "Giảm cân" → ✅ "Giảm 8kg trong 12 tuần, không cần đếm calorie, không phải tập gym"  
❌ "Kiếm thêm thu nhập" → ✅ "Có 30 triệu/tháng từ side business online trong 90 ngày, dành 10h/tuần"

→ Skill propose 2-3 phiên bản dream outcome dựa trên gain user đã cho, user chọn 1.

### 1.3 Top 3 Pain (rank theo severity)

Pain phải **specific + emotional**. Theo VPD framework:
- Functional pain (cản trở việc gì)
- Emotional pain (cảm xúc gì khi không làm được)
- Social pain (mất mặt với ai)

→ Nếu user paste >3 pain, ask: "3 pain nào đau nhất, đáng tiền nhất?"

### 1.4 Top 3 Gain (rank theo desire)

Gain cũng phải specific. Hormozi nhấn mạnh "specificity wins":
- Required gain (tối thiểu phải có)
- Expected gain (mong đợi)
- Desired gain (sướng nếu có)
- Unexpected gain (wow factor)

→ Skill xác nhận lại 3 gain top, output ra block "Anchor".

**Output cuối Phase 1**: Block "Anchor" viết ra (segment / dream outcome / 3 pain / 3 gain). Đây là north star cho mọi quyết định tiếp theo.

---

## Phase 2 — Score Value Equation (baseline)

Chấm điểm offer **hiện tại** (chỉ core product, chưa có bonus) theo công thức Hormozi:

```
        Dream Outcome × Perceived Likelihood
Value = ─────────────────────────────────────
            Time Delay × Effort
```

Mỗi lever chấm 1-10. Đọc `references/value-equation-and-stack.md` để biết tiêu chí chấm mỗi lever.

| Lever | Câu hỏi chấm điểm | Cách boost |
|-------|-------------------|------------|
| Dream Outcome | Outcome có specific + emotional + time-bound không? | Reframe outcome cụ thể hơn, paint vivid picture |
| Perceived Likelihood | Khách có tin nó sẽ work CHO HỌ không? | Testimonial, case study, guarantee, demo |
| Time Delay | Bao lâu thấy result đầu tiên? | Quick win module, instant access, fast-track |
| Effort & Sacrifice | Khách phải làm gì, hi sinh gì? | Done-for-you, templates, automation, support |

**Output Phase 2**: Block scoring + identify **lever yếu nhất**. Đó là chỗ bonus stack sẽ ưu tiên đánh vào.

VD: Nếu Time Delay = 3 (khách phải đợi 6 tháng mới thấy result) → bonus nên có "Quick Win 7-day kit" để giảm time delay xuống còn 1 tuần.

---

## Phase 3 — Design Core Offer

Core offer là sản phẩm chính, gánh **60-70% tổng stack value**.

Hỏi user (hoặc chốt từ thông tin đã có):

- **Tên sản phẩm** (benefit-driven, không phải feature-driven)
  - ❌ "Khóa học Excel 30 ngày" → ✅ "Hệ thống Excel Tự Động Hóa Báo Cáo trong 30 Ngày"
- **Format giao hàng**: video course / coaching / done-for-you / hybrid?
- **Thời lượng/scope**: bao nhiêu module, bao nhiêu buổi, bao nhiêu tuần?
- **Mechanism độc đáo**: phương pháp gì khiến nó khác competitor? (Hormozi gọi đây là "unique mechanism")
- **Pricing tier nào** trong value ladder? (Low-ticket 199-699K / Mid-ticket 2.99-9.99M / High-ticket 19.99M+)

→ Đọc `references/value-equation-and-stack.md` mục "Core Offer Naming + Mechanism" để biết cách đặt tên.

**Output Phase 3**: Block "Core Offer" với 5 trường: tên / format / scope / mechanism / value estimate.

---

## Phase 4 — Brainstorm + Stack Bonuses (HYBRID MODE)

Đây là phase quan trọng nhất. Skill **chủ động đề xuất 5-7 bonus candidate**, mỗi cái có:

- Tên (benefit-driven)
- Thuộc category nào (Time Saver / Skill Builder / Support / Fast-Action)
- What's included (cụ thể)
- Giá trị ước tính (có justification: market price / replacement cost / time saved × hourly rate)
- Lever Value Equation nào nó boost
- Pain/gain nào nó address

Sau đó **user pick 3-4 cái** (recommend pick ít nhất 1 cái mỗi category để stack đa dạng).

### 4 category bonus (Hormozi framework)

1. **Time Saver (10-15% stack value)** — Templates, checklists, scripts, swipe files
2. **Skill Builder (10-15% stack value)** — Mini-course bổ trợ, masterclass, case study library
3. **Support & Community (15-20% stack value)** — Group call, private Telegram/Zalo, office hours
4. **Fast-Action Bonus (10-15% stack value)** — Chỉ cho người mua trong X giờ/X người đầu, exclusive

→ Đọc `references/bonus-ideation-bank.md` để brainstorm bonus theo niche cụ thể (course / coaching / service / SaaS).

**Cách present cho user**:

```markdown
Đây là 7 bonus candidate em đề xuất cho offer của anh/chị. Anh/chị pick 3-4 cái phù hợp:

[BONUS A — Time Saver]  
Tên: "Bộ 50 Mẫu Email Bán Hàng Sẵn-Dùng"  
What's included: 50 email templates phân theo 5 phase funnel (cold/warm/cart/win-back/upsell)  
Giá trị: 5.000.000đ (so với hire copywriter viết: 100K/email × 50 = 5M)  
Boost lever: Effort (giảm effort viết email từ 20h → 0h)  
Address pain: "Không biết viết gì trong email để khách mua"

[BONUS B — Skill Builder]  
...
```

→ User reply "lấy A, C, E, G" hoặc "đổi B thành ..." → skill confirm và lưu.

---

## Phase 5 — Guarantee (Risk Reversal)

Hormozi: **"The seller should bear the risk, not the buyer."**

Đề xuất 2-3 guarantee variants, user pick 1:

| Loại | Format | Khi nào dùng |
|------|--------|-------------|
| **Money-back đơn giản** | "Hoàn 100% trong 30 ngày, không hỏi lý do" | Sản phẩm digital, low-mid ticket, audience nghi ngờ |
| **Conditional guarantee** | "Làm theo X bước, không thấy Y kết quả → hoàn tiền" | Coaching/course có roadmap rõ |
| **Service guarantee** | "Work with you until you succeed" | High-ticket coaching/done-with-you |
| **Better-than-money-back** | "Giữ hết tài liệu + hoàn tiền + tặng thêm Z" | High trust audience, premium positioning |

⚠️ **Lưu ý thị trường VN**: Trust digital product thấp hơn phương Tây → guarantee phải mạnh hơn (60-90 ngày thay vì 30) + có cách contact người bán dễ.

→ Đọc `references/value-equation-and-stack.md` mục "Guarantee Engineering" để biết cách viết wording.

**Output Phase 5**: Block "Guarantee" với type + duration + wording cụ thể.

---

## Phase 6 — Urgency / Scarcity

Hormozi: **"Scarcity through truth"** — không bịa, dùng giới hạn thật.

Đề xuất 2-3 mechanism:

- **Time-based**: Bonus X chỉ còn đến hết ngày Y/Z/2026 (có deadline thật)
- **Quantity-based**: Đợt này chỉ nhận 30 học viên (vì capacity coach thật)
- **Pricing-based**: Tăng giá sau ngày Z (có lý do: thêm content, có testimonial mới...)
- **Cohort-based**: Khai giảng đợt tiếp theo cách 3-6 tháng

→ User pick 1-2 mechanism phù hợp business model.

⚠️ **Đừng dùng fake countdown** — nó destroy trust ở thị trường VN nhanh.

**Output Phase 6**: Block "Urgency" với mechanism + deadline thật + lý do legit.

---

## Phase 7 — Pricing + Generate Output

### 7.1 Tính tổng stack value

```
Core Offer:        [estimate VND]
Bonus 1:           [estimate VND]
Bonus 2:           [estimate VND]
Bonus 3:           [estimate VND]
Bonus 4:           [estimate VND]
─────────────────────────────────
Tổng giá trị:      [sum VND]
```

### 7.2 Đề xuất giá bán

Áp dụng **3-tier decoy structure** (Hormozi recommends 3 tiers):
- **Decoy thấp**: BASIC — chỉ core, no bonus, để làm anchor
- **Sweet spot**: STANDARD — core + 3-4 bonus + community ⭐ PHỔ BIẾN NHẤT
- **Anchor cao**: PREMIUM — standard + 1-on-1 + priority support

VD pricing thực tế VN:
- BASIC: 1.997.000đ
- STANDARD: 4.997.000đ ⭐
- PREMIUM: 9.997.000đ

→ Đọc `references/pricing-psychology-vn.md` để biết charm numbers + payment plans.

**Quy tắc**:
- Tổng stack value phải ≥ **10× giá bán STANDARD** (Hormozi rule)
- Giá ending bằng 997/997K/x9.99M (charm pricing)
- Tránh số 4 ở cuối (kiêng kỵ VN)
- Có installment plan nếu giá > 3M

### 7.3 Generate output files (JSON là single source of truth, HTML load JSON)

Skill tạo folder `output/<slug>/` (slug = kebab-case của product name) và viết:

1. **`02-offer.json`** — structured data, primary deliverable. Schema bên dưới (mở rộng từ Hormozi abstract sang rich event/program shape). Cả `ui-ux-pro-max` lẫn HTML report đều đọc từ file này.
2. **`02-offer.html`** — copy y nguyên `templates/offer-report.html` → folder output. Template KHÔNG cần edit; tự fetch `./02-offer.json` rồi auto-render: header (stack value / price / ratio), hồ sơ khách hàng (segment + dream + audiences + pains + gains + not-for + before/after), mechanism, value-equation chart, core offer + outcomes, bonus stack với value bars, 3-tier pricing decoy (tier "khuyên dùng" highlight), guarantee, urgency, differentiators, FAQ.
3. **`02-conversion-copy.md`** — block headline + sub + CTA paste-ready. Template ở `references/output-templates.md`.
4. **`02-offer.md`** (optional) — báo cáo markdown cho diff/grep workflow. Chỉ sinh nếu user explicit request.

**Mở HTML report:**
- (a) `cd output/<slug> && npx serve .` → `http://localhost:3000/02-offer.html`
- (b) VSCode Live Server (right-click → "Open with Live Server")
- (c) Open trực tiếp file:// → click "📂 Chọn file JSON" trong banner để load thủ công

→ Schema JSON đầy đủ + sample example: [templates/offer-report.sample.json](./templates/offer-report.sample.json) (worked example Agent Camp 3N2Đ Đà Lạt).
→ Markdown + conversion-copy templates: `references/output-templates.md`.

**JSON schema (chính):**

```json
{
  "slug": "kebab-case",
  "name": "Tên offer",
  "subtitle": "1-line framing",
  "date": "YYYY-MM-DD",
  "brand": { "company": "...", "trainer": "...", "program_name": "...", "tagline": "..." },

  "anchor": {
    "segment": "specific niche description",
    "dream_outcome": { "headline": "specific + measurable + time-bound", "timeframe": "...", "metric": "..." },
    "big_idea": "1-sentence philosophical framing (optional)",
    "pains": [{ "rank": 1, "text": "...", "category": "functional|emotional|social", "cost": "X giờ/tuần or Y triệu/tháng" }],
    "gains": [{ "rank": 1, "text": "...", "category": "required|expected|desired|unexpected" }]
  },

  "audiences":   [{ "title": "Persona", "pain_signals": ["..."], "use_cases": ["..."] }],
  "not_for":     ["..."],
  "before_after": { "before": ["..."], "after": ["..."] },

  "mechanism": { "name": "Phương pháp X", "definition": "1-line", "steps": ["Step 1", "..."] },

  "value_equation": {
    "baseline":   { "dream_outcome": 6, "perceived_likelihood": 5, "time_delay": 4, "effort_sacrifice": 4 },
    "after_stack":{ "dream_outcome": 9, "perceived_likelihood": 8, "time_delay": 8, "effort_sacrifice": 8 },
    "weakest_lever": "time_delay"
  },

  "core_offer": {
    "name": "Benefit-driven name",
    "format": "self_paced|cohort|coaching_1on1|done_for_you|hybrid|offline_retreat",
    "scope": "12 buổi / 3 ngày / 6 module",
    "value_vnd": 15000000,
    "outcomes": [{ "title": "...", "description": "..." }]
  },

  "bonuses": [{
    "id": "B1",
    "category": "time_saver|skill_builder|support_community|fast_action",
    "name": "Benefit-driven name",
    "description": "What's included",
    "value_vnd": 5000000,
    "boost_lever": "effort_sacrifice|time_delay|dream_outcome|perceived_likelihood",
    "is_fast_action": false,
    "fast_action_deadline": "deadline string nếu is_fast_action=true"
  }],
  "value_stack_total_vnd": 68000000,

  "guarantee": { "type": "money_back|conditional|service|better_than_money_back", "duration_days": 60, "wording": "Full Vietnamese wording xưng anh/chị" },

  "urgency": [{ "mechanism": "Số lượng giới hạn 60 người", "reason": "...", "deadline": "DD/MM/YYYY (optional)" }],

  "pricing": {
    "currency": "VND",
    "anchor_total_vnd": 26868000,
    "tiers": [
      { "id": "early-bird", "label": "Early Bird", "window": "16-20/05/2026",
        "price_vnd": 12868000, "price_display": "12.868.000đ",
        "save_vs_anchor": 14000000, "save_display": "Tiết kiệm 14.000.000đ",
        "is_recommended": true,
        "includes": ["core","B1","B2","B3"],
        "recommended_for": "..." },
      { "id": "elite", "label": "Elite", "visibility": "faq_only" }
    ],
    "value_to_price_ratio": 5.3
  },

  "differentiators": ["...", "..."],
  "faq": [{ "q": "...", "a": "..." }]
}
```

**Sau khi viết xong**, report cho user:
- Path 4 file đã tạo (`02-offer.json`, `02-offer.html`, `02-conversion-copy.md`, optional `02-offer.md`)
- Tóm tắt 1 câu về offer (segment + outcome + tier "khuyên dùng" price + stack value)
- 1 dòng hướng dẫn mở HTML preview: `cd output/<slug> && npx serve .` rồi mở `02-offer.html`
- Suggest next step: "Anh/chị muốn em invoke `ui-ux-pro-max` để build sales page Next.js production-ready từ `02-offer.json` này không? Skill đó sẽ propose 3 style direction (style + palette + font pairing) phù hợp với segment, anh/chị pick 1 → ra Next.js project deploy được luôn."

> ⚠️ **Quy trình đã update (2026-05-14):** Skip skill `biz-sales-page-layout` cũ (wireframe markdown trung gian). Đi thẳng từ `offer.json` → `ui-ux-pro-max` để có design language nhất quán + production HTML, tránh tình trạng "page generic Tailwind defaults". Skill `biz-sales-page-copy` chỉ dùng SAU khi page đã build qua `ui-ux-pro-max` và user muốn A/B test copy variants — nhận input từ `offer.json` thay vì `layout.json` cũ.

---

## Phase 8 — Hand-off brief tới `ui-ux-pro-max` (khi user OK chuyển tiếp)

Khi user gật đầu chuyển tiếp sang build page, **đừng chỉ invoke skill với "build page từ offer.json"** — sẽ ra page generic. Brief đầy đủ theo template sau (skill kế tiếp cần context):

```
INPUT FILE: <path>/offer.json (đầy đủ anchor + core + bonus + guarantee + urgency + pricing)
+ <path>/offer.md (báo cáo dài, có rationale + Hormozi reasoning)
+ <path>/conversion-copy.md (hero block paste-ready)

PRODUCT CONTEXT (1 câu):
"<segment cụ thể> muốn <dream outcome có số + time-bound>, giải pháp = <product name> với mechanism <unique mechanism>. Giá <STANDARD VND charm pricing>."

PAGE TYPE: Long-form sales page (Hormozi-style — Problem → Mechanism → Benefits → Social Proof → Offer Stack → Guarantee → Urgency → FAQ → Final CTA).
TARGET STACK: Next.js 16+ App Router + TypeScript + Tailwind. Production-ready, deploy được lên Vercel ngay.

DESIGN CONSTRAINT (bắt buộc):
- Mobile-first responsive (web + tablet + mobile) — 70% traffic VN từ mobile
- Form đăng ký bắt buộc Tên/SĐT/Email + 1 API route /api/lead validation
- Sticky mobile CTA bar bottom (hiện sau scroll 600px)
- Single CTA action xuyên page — repeat 4-5 lần
- VND charm pricing display, payment methods row (Momo/ZaloPay/Bank/Visa)
- Xưng "anh/chị" (B2B/coaching tier 1M+)

STYLE DIRECTION:
Anh/chị muốn em propose 3 style direction phù hợp với segment "<segment>" — pick 1 trong:
[A] Modern AI/SaaS — bento grid + glassmorphism + neon accent
[B] Editorial premium — minimalism + serif headline + cream/charcoal palette
[C] Bold consumer — brutalism color block + sans bold + high contrast
…hoặc style khác tuỳ segment age + industry. KHÔNG dùng Tailwind defaults generic.

OUTPUT yêu cầu:
- Project Next.js trong <path>/landing-page/
- app/page.tsx + components/* + app/api/lead/route.ts (placeholder cho Resend wire ở bước sau)
- tailwind.config + globals.css với palette + font đã chốt
- README.md mô tả style đã pick + cách run dev/build

NEXT STEPS (sau khi ui-ux-pro-max xong):
1. Test local (npm run dev)
2. /biz-deploy-vercel (deploy production)
3. /biz-email-setup (wire Resend auto-responder vào /api/lead)
4. /biz-nextjs-chatbot-openrouter (optional chatbot widget)
```

**Lý do brief phải đầy đủ vậy:** `ui-ux-pro-max` là design intelligence skill — nó cần biết segment + style + constraint để pick palette + font + component pattern phù hợp. Không brief = nó dùng default = page generic = uổng skill.

---

## Nguyên tắc xuyên suốt (Hormozi principles)

1. **Specificity wins** — vague kills conversion. Mọi outcome đều phải đo được, có time-bound.
2. **Value > Price 10x** — perceived value tối thiểu gấp 10 lần giá. Stack bonus thay vì giảm giá.
3. **Solve obstacles, not features** — list obstacle khách gặp trên đường đến dream outcome, mỗi obstacle = 1 bonus tiềm năng.
4. **Risk reversal increases conversion more than features** — guarantee mạnh > thêm 1 module.
5. **Scarcity through truth** — chỉ dùng giới hạn thật. Fake urgency = lose trust = lose long-term.
6. **Name everything with benefit, not feature** — "30-Day Cashflow Reset" beats "Excel Course Module 1".
7. **Magic Bean Story** — mỗi offer có 1 "unique mechanism" mà competitor không có. Tìm ra và lead with it.

---

## Vietnamese market overlays

- **Trust skepticism cao hơn US/EU** → guarantee dài hơn (60-90 days), nhiều social proof, video testimonial > text
- **Xưng hô "anh/chị"** — never "bạn" hay "you" ở B2B/coaching context
- **Payment**: hỗ trợ ATM/Momo/ZaloPay + installment cho ticket > 3M
- **Charm pricing**: 497K / 997K / 1.997M / 4.997M / 9.997M / 19.99M
- **Tránh số 4** ở final digit (kiêng kỵ chết) — số 8, 9 lucky
- **Group buying mentality** → có referral discount (rủ bạn -10%) tăng conversion
- **Cohort/intake-based** thường hấp dẫn hơn evergreen ở thị trường giáo dục VN (cảm giác có cộng đồng học cùng)

→ Chi tiết tham khảo `references/pricing-psychology-vn.md`.

---

## Reference files

| File | Khi nào đọc |
|------|------------|
| `references/value-equation-and-stack.md` | Phase 2 (scoring) + Phase 3 (core) + Phase 5 (guarantee) — Hormozi theory deep dive |
| `references/bonus-ideation-bank.md` | Phase 4 — brainstorm bonus theo niche type (course / coaching / service / SaaS) |
| `references/pricing-psychology-vn.md` | Phase 7 — VND charm pricing, 3-tier decoy, payment plans, installments |
| `references/interview-questions-mode-c.md` | Mode C (Phase 0) — VPD-style questions để surface pain/gain khi user chỉ có sản phẩm |
| `references/output-templates.md` | Phase 7 — exact structure cho file output (offer.md / conversion-copy.md). Note: skill mới ưu tiên `02-offer.json` + `02-offer.html` (JSON-driven HTML report) làm primary deliverable — markdown chỉ optional. |
| `templates/offer-report.html` | Phase 7 — HTML report template (Tailwind + Chart.js, JSON-driven). Copy y nguyên sang `output/<slug>/02-offer.html` — KHÔNG cần edit. Auto-render hồ sơ khách hàng (segment + dream + audiences + pains + gains + not-for + before/after) + mechanism + value-equation chart + core offer + bonus stack có value bars + 3-tier pricing decoy + guarantee + urgency + differentiators + FAQ. Open qua `npx serve .` hoặc VSCode Live Server; file-picker fallback cho file://. |
| `templates/offer-report.sample.json` | Phase 7 — Worked example schema đầy đủ (Agent Camp 3N2Đ Đà Lạt 12.868K-26.868K). Reference khi sinh `02-offer.json` cho user. |

---

## Anti-patterns (đừng làm)

❌ Skip Phase 1 và đi thẳng vào design offer — không hiểu khách = offer vague  
❌ Stack bonus mà không address pain cụ thể — bonus thành rác, không tăng perceived value  
❌ Đặt giá tròn (500K, 1M) — Vietnamese market cảm thấy arbitrary  
❌ Guarantee yếu (7-day money back cho coaching 6 tháng) — không match risk profile  
❌ Đề xuất fake urgency (countdown 24h reset hàng ngày) — destroy trust  
❌ Tổng stack value < 5× giá bán — không thấy steal deal  
❌ Generic bonus ("Bonus video tài liệu") — Hormozi: "If you can't articulate the value, customer can't either"  
❌ Dùng "bạn" thay "anh/chị" — sai tone thị trường VN B2B/coaching  

---

## Khi user push back

Nếu user nói "giá đó cao quá thị trường" hoặc "khách Việt Nam không trả được":
- Hỏi: "Anh/chị đã thấy ai pay giá này trong niche chưa?" (validate giả định)
- Reference: `market-research` skill có data competitor pricing
- Solution thường KHÔNG phải giảm giá → là **payment plan** (chia 3-6 tháng) hoặc **tier thấp hơn** (BASIC version)
- Nếu thực sự market chưa có willingness-to-pay → đó là vấn đề product-market fit, không phải offer design

Đây là kiểu skill cần stand firm trên principle Hormozi nhưng vẫn humble với judgment của user về niche của họ.
