---
name: biz-sales-page-layout
description: "⚠️ DEPRECATED (2026-05-14) — Skill này KHÔNG còn trong pipeline chuẩn. Quy trình mới đã bỏ bước wireframe markdown trung gian: sau `/biz-offer-alex-hormozi` đi THẲNG sang `ui-ux-pro-max` để build Next.js sales page production-ready (có design language nhất quán: style + palette + font pairing, không phải Tailwind defaults). Lý do deprecate: wireframe markdown làm thêm 1 bước trung gian không tạo giá trị — `ui-ux-pro-max` đọc trực tiếp `offer.json` đã đầy đủ anchor + core + bonus + guarantee + urgency + pricing rồi ra HTML production luôn. Chỉ dùng skill này KHI user EXPLICITLY yêu cầu wireframe markdown để review/in/share trước khi build code (rare case). KHÔNG trigger trên các keyword 'tạo sales page', 'tạo landing page bán hàng' nữa — những keyword đó giờ trigger `ui-ux-pro-max`."
---

# ⚠️ DEPRECATED — Biz Sales Page Layout (Wireframe Builder)

> **STATUS:** Deprecated 2026-05-14. **Pipeline mới: `/biz-offer-alex-hormozi` → `ui-ux-pro-max` (skip skill này).**
>
> **Lý do:** `ui-ux-pro-max` đọc trực tiếp `offer.json` rồi ra Next.js project production-ready trong 1 lượt. Wireframe markdown trung gian không tạo giá trị (user vẫn phải build HTML sau đó), và việc generate copy filled-in 2 lần (1 ở layout, 1 ở copy upgrade) gây overlap không cần thiết.
>
> **Khi nào vẫn dùng skill này:**
> - User EXPLICITLY yêu cầu wireframe markdown để review/in/share với team trước khi build code
> - User không deploy bằng Next.js, muốn paste vào page builder khác (Webflow, Framer, WordPress page builder)
> - User muốn audit cấu trúc Hormozi/Priestley trước khi commit budget code
>
> **Quy trình mới chuẩn:**
> ```
> /market-research (optional) → /biz-offer-alex-hormozi → /ui-ux-pro-max → /biz-deploy-vercel → /biz-email-setup → /biz-nextjs-chatbot-openrouter (optional)
> ```

---

# Biz Sales Page Layout — Landing Page Wireframe Builder *(legacy)*

Skill này biến **một offer đã đóng gói + một bộ pain/gain của khách hàng** thành **khung layout sales page hoàn chỉnh** sẵn sàng để build HTML hoặc paste vào page builder, tối ưu cho thị trường Việt Nam.

> **Triết lý thiết kế**: Khách hàng quyết định mua hay không trong 3 giây đầu khi nhìn vào hero section. Hero phải làm 5 việc Priestley dạy: name the pain/promise → direct to action → promise 3 measurable wins → prove credibility → invite low-friction next step. Sau đó body phần dưới làm việc Hormozi dạy: amplify pain → reveal mechanism → stack value → reverse risk → push urgency.
>
> Hai trường phái không mâu thuẫn — Priestley dạy mở đầu, Hormozi dạy đóng đơn. Skill này hợp nhất cả hai.

Đầu ra của skill là 3 file trong `output/sales-pages/<slug>/`:
- `layout.md` — wireframe section-by-section kèm copy filled-in (Vietnamese), dùng để review/in
- `layout.json` — structured data cho downstream pipeline (deploy, A/B testing, content management)
- `hero-block.md` — block above-the-fold paste-ready (5 elements: hook, subhead, value-prop, credibility, CTA)

---

## Khi nào dùng skill này

- User vừa chạy `/biz-offer-alex-hormozi` xong, có `offer.json`, muốn build trang bán.
- User có **pain/gain từ VPD** (Customer Profile) + sản phẩm/dịch vụ → muốn ra layout không qua bước design offer formal.
- User chỉ có **ý tưởng sản phẩm** → skill phỏng vấn surface pain/gain rồi build layout luôn (less rigorous than going through `/biz-offer` first, but faster).

**KHÔNG dùng skill này khi:**
- Cần lead-gen page với quiz/assessment kiểu Priestley scorecard → use case khác, skill khác.
- Chưa có hình dung khách hàng → chạy VPD pipeline trước.
- Cần HTML production-ready → skill này ra wireframe + copy; deploy bằng `ui-ux-pro-max` hoặc `biz-deploy-vercel`.

---

## Workflow tổng quan (5 phase)

```
Phase 0: DETECT INPUT MODE (A/B/C)
       ↓
Phase 1: ANCHOR — chốt segment + dream outcome + top 3 pain + top 3 gain
       ↓
Phase 2: HERO BLOCK — propose 2-3 hook variants, build 5-element above-the-fold
       ↓
Phase 3: BODY LAYOUT — design 8-10 section anatomy dựa trên offer + pain/gain
       ↓
Phase 4: OUTPUT — generate 3 file, suggest next step (deploy)
```

Mỗi phase **hỏi user xác nhận hoặc lựa chọn** — không tự ý chốt. Layout là tài sản marketing của user, không phải của skill.

---

## Phase 0 — Detect Input Mode

Đọc message và file user reference. 3 mode:

**Mode A — Có offer.json** (richest path):
- User reference path tới `offer.json` hoặc nói "tôi vừa chạy biz-offer xong"
- Skill đọc đầy đủ: segment, dream outcome, pain/gain, core offer name + mechanism, bonus stack, guarantee, urgency, pricing 3-tier
- → Đi thẳng Phase 1 với data full, chỉ confirm lại 4 anchor element.

**Mode B — Có pain/gain + product** (medium path):
- User paste pain/gain theo VPD (bullet list) + mô tả sản phẩm
- Hoặc có file `vpc.json` từ VPD pipeline + thông tin sản phẩm
- → Skill suggest: "Anh/chị muốn chạy `/biz-offer-alex-hormozi` trước để có offer.json đầy đủ không? Sẽ ra page chất lượng hơn." Nếu user nói "không, build luôn" → Phase 1 với data có sẵn, sẽ phải improvise phần offer stack ở Phase 3.

**Mode C — Chỉ có sản phẩm** (lean path):
- User nói "tôi bán khóa học X" mà không kèm pain/gain
- → Skill phải phỏng vấn ngắn VPD-style trước Phase 1. Đọc `references/interview-mode-c.md` cho câu hỏi.
- → Tốt nhất vẫn suggest user chạy `/biz-offer` trước, nhưng nếu user cần nhanh thì tiếp tục.

**Quan trọng**: Đừng để user skip Phase 1. Sales page mà không hiểu pain của khách = copy generic = không convert. Đó là lý do Priestley dạy hook phải name pain/promise cụ thể, không phải "we're awesome".

---

## Phase 1 — Anchor (north star của toàn page)

4 yếu tố phải có và user gật đầu trước khi vào Hero:

### 1.1 Segment cụ thể
Không "doanh nghiệp", "phụ nữ", "người trẻ". Phải narrow:
- ✅ "Solopreneur VN bán khóa học doanh thu 30-100M/tháng, stuck ở scaling"
- ✅ "Mẹ bỉm 28-35 tuổi thành thị, full-time office, có con dưới 5 tuổi"

### 1.2 Dream Outcome (Hormozi: specific + measurable + time-bound)
- ❌ "Giảm cân" → ✅ "Giảm 8kg trong 12 tuần, không đếm calorie, không gym"
- ❌ "Tăng thu nhập" → ✅ "30 triệu/tháng từ side business online trong 90 ngày, 10h/tuần"

### 1.3 Top 3 Pain (rank severity)
Phải có cả 3 chiều theo VPD:
- **Functional** — cản trở việc gì cụ thể
- **Emotional** — cảm xúc gì khi không làm được
- **Social** — mất mặt với ai, sợ ai nghĩ gì

### 1.4 Top 3 Gain (rank desire)
- **Required** — tối thiểu phải có
- **Expected** — mong đợi mặc nhiên
- **Desired/Unexpected** — wow factor

**Output Phase 1**: Block "Anchor" — segment / dream outcome / 3 pain / 3 gain — được user confirm. Đây là north star cho mọi copy quyết định tiếp theo.

---

## Phase 2 — Hero Block (Priestley 5-Element Formula)

Đây là phase quan trọng nhất — 80% conversion quyết định bởi hero. Đọc `references/hero-block-design.md` để hiểu sâu từng element.

### 5 element bắt buộc

**Element 1: HOOK** (headline — first thing scrolled into view)

Skill **propose 2-3 variant**, user pick 1:

- **Frustration hook**: "Cảm thấy frustrated vì [pain] dù đã [effort that didn't work]?"
  - VD: "Cảm thấy frustrated vì content TikTok không lên view dù đăng đều mỗi ngày?"
- **Readiness hook**: "Anh/chị đã sẵn sàng để [dream outcome] chưa?"
  - VD: "Anh/chị đã sẵn sàng để có 30 triệu/tháng từ side business chưa?"
- **Bold-promise hook** (Hormozi style): "[Outcome cụ thể] trong [timeframe] mà không cần [pain]"
  - VD: "Có 30 triệu/tháng từ side business trong 90 ngày mà không cần bỏ việc full-time"

**Element 2: SUBHEADING** (direct-to-action, dưới headline)

Priestley dạy subheading phải direct người đọc làm gì tiếp theo, không phải explain thêm. Format:
- "[Lời hứa cụ thể về cách phương pháp này khác biệt + lý do tại sao trust được]"
- VD: "Hệ thống 4 bước đã giúp 200+ học viên ra 30M+/tháng, không cần kinh nghiệm marketing trước đó."

**Element 3: VALUE PROPOSITION — "3 thứ measurable"** (Priestley insight)

Priestley dạy: cho người ta biết bạn sẽ improve/measure **3 thứ cụ thể** trên đường đến outcome. Vì 3 thứ đó dễ visualize, làm outcome credible hơn.

Format Vietnamese:
> "Khóa học này sẽ giúp anh/chị xây dựng và đo lường 3 thứ:
> - **[Thứ 1]** — [lý do tại sao quan trọng]
> - **[Thứ 2]** — [lý do tại sao quan trọng]
> - **[Thứ 3]** — [lý do tại sao quan trọng]"

VD cho khóa side business:
> - **Niche profitable đã validate** — không tốn 6 tháng làm sai niche không ai mua
> - **Funnel bán hàng tự động chạy** — kiếm tiền cả khi đang ngủ, không cần chốt sale 1-1
> - **Hệ thống content lead-gen** — leads vào đều đặn, không phụ thuộc ads

⚠️ Đây là điểm khác biệt lớn so với template sales page truyền thống (chỉ list benefit thuần). "3 thứ measurable" cảm giác process-driven, không phải hype.

**Element 4: CREDIBILITY** (Priestley: who created this + background + research/stats)

Block ngắn 2-3 câu trả lời 3 câu hỏi:
- **Who**: Ai tạo ra hệ thống này? (tên + role + 1 line context)
- **Background**: Có gì để trust? (kinh nghiệm, kết quả past)
- **Research/stat**: Số liệu nào ủng hộ? (VD: "85% solopreneur stuck ở mức 30M/tháng — Báo cáo Brand Vietnam 2025")

Format Vietnamese:
> "Tôi là [Name], [role/credential]. Đã giúp [N] khách hàng đạt [specific result]. Theo nghiên cứu của [source], [N]% người trong tình trạng tương tự gặp khó khăn vì [insight] — đó chính là lý do hệ thống này được build."

**Element 5: CTA** (Priestley 4-part formula)

CTA mạnh cần 4 yếu tố:
- **Next step rõ**: "Đăng ký giữ chỗ" / "Xem chi tiết khóa học" / "Đặt cọc giữ giá"
- **Time low**: "Chỉ 3 phút" / "Trong 60 giây"
- **Free/risk-free**: "Hoàn 100% trong 90 ngày" / "Miễn phí buổi 1"
- **Immediate value**: "Nhận PDF Roadmap ngay sau đăng ký" / "Truy cập module 1 trong 5 phút"

Format button + microcopy dưới button:
```
[BUTTON: "Giữ chỗ ngay — chỉ còn 12 suất"]
🛡️ Hoàn 100% trong 90 ngày | ⚡ Truy cập ngay sau thanh toán
```

**Output Phase 2**: Block "Hero" hoàn chỉnh 5 element. User confirm trước khi vào Phase 3.

---

## Phase 3 — Body Layout (8-10 Section Anatomy)

Đọc `references/body-sections-blueprint.md` để biết chi tiết từng section. Skill build từng section theo thứ tự, mỗi section có:
- **Mục đích** (purpose) — section này làm gì cho conversion
- **Copy filled-in** (Vietnamese, dựa trên Anchor + Hero + offer.json)
- **Visual note** (image type, CTA placement, mobile consideration)

### Anatomy (8-10 sections — flexibility based on offer complexity)

| # | Section | Purpose | Phụ thuộc input |
|---|---------|---------|----------------|
| 1 | **Hero** | Capture in 3s | Phase 2 output |
| 2 | **Pain Agitation** | Make status quo unbearable | Anchor pain |
| 3 | **Solution Bridge + Mechanism** | Position offer + name unique mechanism | offer.json `mechanism` hoặc Phase 1 |
| 4 | **Benefits Cascade** | Paint after-state | Anchor gain + offer.json |
| 5 | **Social Proof** | Remove doubt | Cần testimonials (nếu thiếu, skill flag để user fill) |
| 6 | **Offer Stack** | Build perceived value 10x giá | offer.json `bonuses + total_value` (Mode A); improvise Mode B/C |
| 7 | **Guarantee** | Reverse risk | offer.json `guarantee` (Mode A); propose 2-3 variant Mode B/C |
| 8 | **Urgency** | Push decision | offer.json `urgency` (Mode A); propose Mode B/C |
| 9 | **FAQ** | Handle objections (8-12 Q) | Skill generate dựa trên pain + objection common VN market |
| 10 | **Final CTA** | Last push + P.S. | Recap offer + 1 final insight |

### Quy tắc design body

**1. Mỗi section có 1 CTA primary giống nhau** — không "Learn More" rồi "Buy Now". Một action duy nhất: "Đăng ký ngay" hoặc "Giữ chỗ" — repeat 4-5 lần xuyên page.

**2. Mobile-first scrollable** — 70% traffic VN từ mobile. Section breaks rõ, image trên/dưới text không cạnh nhau, button full-width.

**3. Visual cadence** — alternate background color mỗi 2 section để break visual fatigue.

**4. FAQ là minigame quan trọng** — đọc `references/faq-objection-bank-vn.md` để biết 12 objection phổ biến nhất ở thị trường VN.

**5. Specificity wins everywhere** — số cụ thể > generic claim. "1.247 học viên" > "nhiều học viên". "85% đạt 30M+/tháng trong 90 ngày" > "kết quả tốt".

---

## Phase 4 — Output

Sinh 3 file vào `output/sales-pages/<slug>/` (slug = kebab-case của product name).

### 4.1 layout.md

Wireframe section-by-section đầy đủ, có:
- Header báo cáo (segment + dream outcome + product name + price)
- 10 section, mỗi section: `## Section name`, `**Purpose**:`, `**Copy**:`, `**Visual notes**:`
- Footer: navigation links, legal, contact

→ Template: `templates/layout.md.tpl`

### 4.2 layout.json

Structured cho downstream tool. Schema:
```json
{
  "version": "1.0",
  "slug": "khoa-side-business-90-ngay",
  "anchor": { "segment": "...", "dream_outcome": "...", "pains": [...], "gains": [...] },
  "hero": {
    "hook_type": "frustration|readiness|bold_promise",
    "headline": "...",
    "subheading": "...",
    "value_prop_three": ["...", "...", "..."],
    "credibility": "...",
    "cta": { "button_text": "...", "microcopy_below": "..." }
  },
  "sections": [
    {
      "id": "pain-agitation",
      "order": 2,
      "purpose": "...",
      "copy_blocks": { "headline": "...", "body": "...", "bullets": [...] },
      "visual_notes": "...",
      "cta": "primary"
    }
  ],
  "offer_reference": { "from_offer_json": true, "path": "output/cases/<slug>/offer.json" },
  "pricing_display": { "tiers": [...], "guarantee": "...", "urgency": "..." }
}
```

→ Template: `templates/layout.json.tpl`

### 4.3 hero-block.md

Block paste-ready chỉ chứa 5 element hero, format compact để user copy nhanh khi A/B test hero variants.

→ Template: `templates/hero-block.md.tpl`

### Sau khi output

Report cho user:
- Path 3 file đã tạo
- Tóm tắt: "Layout cho [product] — [N] sections, hero hook type [X], total stack value [Y]"
- Next step suggestion:
  - "Anh/chị muốn em invoke `ui-ux-pro-max` để build HTML từ layout.json này không?"
  - "Hoặc invoke `biz-deploy-vercel` để deploy luôn lên Vercel?"

---

## Nguyên tắc xuyên suốt

1. **Hero làm 80% công việc** — đầu tư copy hero gấp 3 lần các section khác.
2. **3 measurable wins beats 7 features** — Priestley insight: cụ thể hơn = credible hơn = convert hơn.
3. **One CTA action** — đừng confuse với "Learn More" vs "Buy Now". Một action duy nhất xuyên page.
4. **Specificity wins** — "1.247 học viên" > "nhiều học viên". Số cụ thể everywhere.
5. **Mobile-first** — viết copy như đang đọc trên iPhone, không phải desktop 27 inch.
6. **Risk reversal stronger than features** — guarantee 90 ngày impact conversion > thêm 1 bonus.
7. **Credibility must be in hero** — nếu hero không có credibility marker, người ta scroll qua trước khi đọc body.
8. **Single page, no menu navigation** — sales page không phải website. Đừng cho user link đi chỗ khác trừ social proof.

---

## Vietnamese market overlays

- **Xưng "anh/chị"** — never "bạn" ở B2B/coaching/course context (dùng "bạn" ở consumer product low-ticket dưới 500K).
- **VND charm pricing**: 497K / 997K / 1.997M / 4.997M / 9.997M / 19.99M. Tránh số 4.
- **Payment methods prominent**: Momo, ZaloPay, ATM transfer, VietQR. SePay nếu có. Hiện trust badge ngay dưới CTA.
- **Trust deficit cao** → guarantee 60-90 ngày (không phải 30), video testimonial > text, contact thật (số ĐT/Zalo).
- **Group buying mentality** → có referral discount "rủ bạn -10%".
- **Cohort/intake-based** thường convert hơn evergreen ở coaching/course VN.
- **FB Messenger/Zalo chat widget** — VN expect contact instant, không phải email sau 24h.

Chi tiết: `references/vietnamese-overlays.md`.

---

## Reference files

| File | Khi nào đọc |
|------|-------------|
| `references/hero-block-design.md` | Phase 2 — deep dive 5 element Priestley + variants Hormozi |
| `references/body-sections-blueprint.md` | Phase 3 — chi tiết từng section trong 10-section anatomy |
| `references/interview-mode-c.md` | Mode C (Phase 0) — câu hỏi VPD surface pain/gain từ user chỉ có sản phẩm |
| `references/faq-objection-bank-vn.md` | Phase 3 section 9 — 12 objection phổ biến VN + cách handle |
| `references/vietnamese-overlays.md` | Xuyên suốt — VND pricing, trust signals, payment, cultural |
| `templates/layout.md.tpl` | Phase 4.1 — wireframe structure |
| `templates/layout.json.tpl` | Phase 4.2 — JSON schema downstream |
| `templates/hero-block.md.tpl` | Phase 4.3 — paste-ready hero |

---

## Anti-patterns (đừng làm)

❌ Skip Phase 1, đi thẳng Phase 2 — hero hook generic vì không hiểu pain
❌ Copy 100% template Priestley/Hormozi — học structure, copy phải Vietnamese organic
❌ Hero không có credibility marker — convert thấp vì người ta không trust
❌ Nhiều CTA action khác nhau — "Learn more" + "Buy now" + "Watch demo" = confuse = bounce
❌ FAQ generic ("Q: Có hiệu quả không? A: Có") — phải address objection thật của niche
❌ Pricing tròn (1M, 5M) — VN market cảm thấy arbitrary, charm pricing convert hơn
❌ Dùng "bạn" cho coaching/course tier 2M+ — sai tone, mất authority
❌ Skip mobile check — 70% traffic mobile, hero không fit mobile = mất 70% conversion
❌ Generic testimonial copy ("Khóa học rất hay") — phải có number + emotion + segment match
❌ Fake urgency countdown — destroy trust ở VN nhanh hơn cả ở Tây

---

## Khi user push back

- "Page dài quá" → giải thích: sales page dài hơn convert tốt hơn cho ticket > 2M, vì cần build trust qua nhiều layer. Có thể đề xuất biến thể short page cho ticket dưới 500K.
- "Tôi không có testimonial" → Section 5 vẫn build với placeholder + flag rõ để user fill. Hoặc đề xuất collect testimonial qua beta launch trước khi go public.
- "Tôi không muốn nhiều CTA" → giải thích: cùng 1 CTA repeat 4-5 lần là rule, không phải 4 CTA khác nhau. Single action, multiple touchpoint.
- "Giá tôi đề xuất quá cao" → reference `biz-offer-alex-hormozi` về value-equation. Không giảm giá → tăng perceived value qua bonus stack.

Stand firm trên principle nhưng humble với judgment của user về niche họ.
