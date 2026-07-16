---
name: biz-sales-page-copy
description: "Nâng cấp copy sales page tiếng Việt — biến copy có sẵn (từ `offer.json` + `conversion-copy.md` của `/biz-offer-alex-hormozi`, HOẶC từ Next.js project đã build qua `ui-ux-pro-max`, HOẶC user paste block copy bất kỳ) thành **copy chất lượng cao chốt đơn**: headline punchy hơn, pain agitation đau hơn, mechanism rõ hơn, benefit cụ thể hơn, FAQ xử lý đúng objection của thị trường VN, CTA mạnh hơn. Skill này có 3 INTENSITY LEVEL: (1) **Polish** — light edit + power word + sửa nhịp; (2) **Conversion-optimized** — rewrite 5 block critical + tạo A/B variants cho hero/CTA; (3) **Sales-letter** — long-form story-driven full rewrite kèm P.S.. Mỗi section áp dụng đúng formula thuyết phục (PAR cho pain, BAB cho solution, FEP cho benefit, PVEN cho final CTA, Star-Chain-Hook cho testimonial). Output gồm 4 file: `copy-upgraded.md`, `copy-variants.md` (A/B test bank — 3 hero + 3 CTA + 3 final-CTA), `copy-changes.md` (diff Trước/Sau + lý do), `copy.json` (structured downstream). Giọng văn tiếng Việt thuần (xưng anh/chị), VND charm pricing, không dịch máy từ tiếng Anh, không sáo rỗng. USE WHEN user says: 'nâng cấp copy sales page', 'viết lại copy sales page', 'cải thiện copy landing page', 'copy hero chưa hay', 'rewrite headline', 'polish copy landing page', 'A/B test hero variants', 'copy chốt đơn', 'punch up copy', 'làm hero mạnh hơn', 'pain agitation đau hơn', 'optimize CTA', 'biz-sales-page-copy', 'có offer.json rồi nâng cấp copy', 'sau khi build page bằng ui-ux-pro-max muốn polish copy', 'copy thuyết phục hơn', 'apply Hormozi headline formula', 'rewrite cho người Việt'. Cũng trigger khi user vừa chạy `/biz-offer-alex-hormozi` + `ui-ux-pro-max` xong và muốn polish copy A/B test; hoặc user paste copy block và xin viết lại. Skill này KHÔNG làm: design offer (dùng `/biz-offer-alex-hormozi`); HTML production code (dùng `ui-ux-pro-max`); copy social media post / email sequence ngắn (skill này chuyên sales page dài). LƯU Ý: skill `biz-sales-page-layout` ĐÃ DEPRECATED 2026-05-14 — không còn input layout.md/layout.json, thay bằng `offer.json` + Next.js project."
---

# Biz Sales Page Copy — Vietnamese Conversion Copywriter

> **Update 2026-05-14:** Pipeline mới đã skip `biz-sales-page-layout` (deprecated). Skill này nhận input từ một trong:
> - **Mode A** — `offer.json` + `conversion-copy.md` từ `/biz-offer-alex-hormozi` (path: `output/cases/<slug>/`)
> - **Mode B** — Next.js project đã build qua `ui-ux-pro-max` — đọc `app/page.tsx` extract copy hiện tại
> - **Mode C** — User paste copy block bất kỳ (hero, pain, CTA, FAQ...)
>
> Nếu Mode B (Next.js project), output `copy-upgraded.md` thêm hint diff để user apply vào `app/page.tsx` từng block.

Skill này biến **copy hiện có** thành **copy chất lượng chốt đơn**, tối ưu cho người đọc Việt Nam.

> **Triết lý**: Layout skill làm xong **khung + draft copy**. Skill này làm **polish layer** — nơi một headline trung bình biến thành headline punchy, một pain bullet flat biến thành câu đâm vào tim, một CTA generic biến thành CTA buộc người ta phải click. Đây không phải là viết lại từ đầu — là **nâng cấp có chiến lược**.
>
> **Không phải mọi câu đều cần upgrade**. 80% conversion đến từ 5 block: Headline, Subheading, 1 dòng pain mạnh nhất, Mechanism name, CTA button text. Skill này dồn lực vào đó.

Đầu ra là 4 file trong `output/sales-pages/<slug>/`:

| File | Mục đích |
|------|----------|
| `copy-upgraded.md` | Overlay refined trên `layout.md` gốc — paste-ready |
| `copy-variants.md` | A/B test bank — 3 hero variant + 3 CTA variant + 3 final-CTA variant + lý do |
| `copy-changes.md` | Diff Trước/Sau từng block + lý do để user audit |
| `copy.json` | Structured cho downstream (`ui-ux-pro-max`, `biz-deploy-vercel`) |

---

## Khi nào dùng skill này

- ✅ User vừa chạy `/biz-sales-page-layout` xong, có `layout.md` + `layout.json`, muốn polish copy
- ✅ User có copy sales page sẵn (đã viết tay hoặc skill khác sinh ra) và xin viết lại
- ✅ User paste 1 block copy (hero, pain, CTA) và xin nâng cấp
- ✅ User cần A/B variants cho 1 element cụ thể

**KHÔNG dùng skill này khi:**
- ❌ Chưa có layout — chạy `/biz-sales-page-layout` trước
- ❌ Cần email sequence / social post / quảng cáo Facebook → skill khác (`/biz-content`)
- ❌ Cần dịch sales page từ tiếng Anh sang Việt — skill này viết lại tiếng Việt thuần, không dịch
- ❌ Offer chưa đóng gói → chạy `/biz-offer-alex-hormozi` trước, layout sau, rồi mới đến đây

---

## Workflow tổng quan (4 phase)

```
Phase 0: DETECT INPUT + CONFIRM INTENSITY LEVEL
       ↓
Phase 1: ANCHOR REVIEW (đọc Anchor, lock segment + pain language)
       ↓
Phase 2: SECTION-BY-SECTION UPGRADE (áp dụng đúng formula cho từng section)
       ↓
Phase 3: A/B VARIANTS BANK (3 variant cho hero + CTA chính)
       ↓
Phase 4: OUTPUT 4 FILE
```

---

## Phase 0 — Detect Input + Confirm Intensity

### 0.1 Detect input mode

**Mode A — Layout-aware (chính)**: User reference path tới `layout.md` hoặc `layout.json` từ `output/sales-pages/<slug>/`. Đọc cả 2 file, biết được:
- Anchor (segment, dream outcome, pain, gain)
- Hero hook type (frustration | readiness | bold_promise)
- 10 section đã có copy draft
- Offer stack + pricing + guarantee

**Mode B — Block paste**: User paste 1 block copy bất kỳ, không có context layout. Hỏi ngắn:
- "Đây là sales page cho sản phẩm gì?"
- "Đối tượng cụ thể là ai?"
- "Block này nằm ở section nào? (hero / pain / benefit / CTA / FAQ...)"

**Mode C — From-scratch**: User chưa có layout nhưng yêu cầu viết copy. → Suggest chạy `/biz-sales-page-layout` trước. Nếu user nhất quyết không → tiếp tục Mode B với mini-anchor (3 câu hỏi).

### 0.2 Confirm INTENSITY LEVEL

Quan trọng: hỏi user chọn level trước khi viết, vì 3 level cho output khác nhau hoàn toàn.

```
🎚️ Anh/chị muốn em làm tới đâu?

【1】 POLISH — Light edit, giữ nguyên 80% copy gốc
     ↳ Sửa nhịp câu, thêm 1-2 power word/section, fix dấu câu, fix dịch máy
     ↳ Phù hợp: copy đã decent, chỉ cần đánh bóng
     ↳ Thời gian: nhanh, ~10-15 phút
     ↳ Risk: thấp — không thay đổi tone/voice user

【2】 CONVERSION-OPTIMIZED ⭐ (mặc định)
     ↳ Rewrite 5 block critical: Headline + Subheading + Pain bullets + Mechanism + CTA
     ↳ Generate A/B variants (3 hero + 3 CTA)
     ↳ Polish các section còn lại
     ↳ Phù hợp: launch mới, muốn squeeze conversion từ copy
     ↳ Thời gian: trung bình, ~20-30 phút

【3】 SALES-LETTER — Full rewrite long-form story-driven
     ↳ Rewrite toàn bộ kiểu sales letter (founder story, P.S., P.P.S.)
     ↳ Add 2-3 mini-story trong body, deeper emotional layering
     ↳ Page dài ra 30-50%
     ↳ Phù hợp: ticket > 5M, audience cold, cần long-form persuasion
     ↳ Thời gian: lâu, ~40-60 phút
     ↳ Risk: thay đổi nhiều — tone có thể đậm hơn user expect

Mặc định em chọn Level 2. Anh/chị muốn khác không?
```

User confirm → lock level → Phase 1.

---

## Phase 1 — Anchor Review

Đọc Anchor từ `layout.md` (segment, dream outcome, 3 pain, 3 gain). **KHÔNG được skip step này** — copy không hiểu anchor = copy generic = không convert.

### Lock 4 thứ trước khi viết

1. **Pain language exact** — câu nói thật của khách hàng (không phải mô tả pain bằng từ marketing). VD:
   - ❌ Marketing-speak: "Khó khăn trong việc scale doanh thu"
   - ✅ Customer voice: "Cả tháng cày 80 tiếng mà tài khoản không nhúc nhích"

2. **Dream outcome cụ thể + đếm được** — phải có số, timeframe, và "không cần X" clause:
   - ❌ "Tăng doanh thu nhanh chóng"
   - ✅ "30 triệu/tháng trong 90 ngày, 10h/tuần, không cần bỏ việc"

3. **Mechanism name** — tên hệ thống/phương pháp. Nếu layout chưa có hoặc generic, **đề xuất 3 tên** cho user chọn. VD:
   - "Hệ thống 4P Side Income"
   - "Lộ trình 90 Ngày Bứt Phá"
   - "Phương pháp Funnel Tự Chạy"

4. **CTA button text** — 1 câu duy nhất, repeat 4-5 lần xuyên page. Lock nó ngay.

⚠️ Nếu thiếu pain language exact → hỏi user: "Anh/chị có note nào về câu nói thật của khách không? Ví dụ từ tin nhắn Inbox, comment, hoặc DM?" Customer voice copy beats marketing-speak copy 3-5x trong A/B test.

---

## Phase 2 — Section-by-Section Upgrade

Đọc `references/section-copy-recipes.md` để biết chi tiết. Mỗi section áp dụng 1 formula chính + power word ladder + voice rules.

### Mapping section → formula

| Section | Formula chính | Tại sao |
|---------|---------------|---------|
| Hero Headline | Hook Pattern (Frustration / Readiness / Bold Promise) | 3s capture — phải fit awareness level |
| Hero Subheading | PVEN-mini (Promise + Evidence trong 1 câu) | Reassure ngay sau hook |
| Pain Agitation | **PAR** (Problem → Amplify → Resolve-tease) | Audience pain-aware — đào đau cho đến khi muốn thoát |
| Solution Bridge | **BAB** (Before → After → Bridge) | Transition từ pain → giải pháp |
| Mechanism | **FEP** (Feature → Edge → Payoff) | Explain hệ thống bằng vì-sao-khác-biệt |
| Benefits Cascade | **FEP-stack** (6-8 dòng FEP ngắn) | Paint after-state cụ thể |
| Social Proof | **Star-Chain-Hook** (testimonial restructure) | Mỗi testimonial = mini story arc |
| Offer Stack | **Value-anchor + reciprocity** | Build perceived value 10x giá |
| Guarantee | **Risk-reversal pattern** | Shift rủi ro sang seller |
| Urgency | **Honest scarcity** (cohort/spot/price-deadline) | Push decision mà không fake |
| FAQ | **Objection-Acknowledge-Reframe-Evidence (OARE)** | Mỗi câu trả lời là 1 micro-sales |
| Final CTA | **PVEN** (Promise + Vision + Evidence + Nudge) | Last layer thuyết phục — đầy đủ |

### Workflow viết 1 section

Cho mỗi section, làm 4 bước:

1. **Đọc copy draft từ `layout.md`** — hiểu intent
2. **Áp dụng formula** từ recipe (đọc `references/section-copy-recipes.md`)
3. **Power word pass** — thêm 1-2 power word từ `references/power-words-vn.md`, ladder phù hợp:
   - Section info (intro, mechanism): Level 1-2 (subtle/moderate)
   - Section emotional (pain, urgency): Level 2-3 (moderate/strong)
   - Headline + CTA: Level 3 (strong), Level 4 chỉ sparingly
4. **Voice check** — đọc lại theo rule `references/voice-rules-vn.md`:
   - Xưng "anh/chị" (B2B/coaching/course tier 1M+) hay "bạn" (consumer < 500K)?
   - Câu pain ngắn (5-12 từ), câu solution dài hơn (15-25 từ)?
   - Số liệu cụ thể (1.247 không phải "nhiều")?
   - Không sáo (tránh "đột phá", "bước ngoặt" nếu chưa có proof)?
   - Đọc lên có quê không? Nếu có → simplify.

### Critical: 5 block dồn lực

Theo Level 2 (mặc định), dồn 80% effort vào 5 block:

1. **Hero Headline** — 3 variant đủ kiểu (frustration / readiness / bold promise)
2. **Hero Subheading** — phải bao gồm "Khác biệt + Proof point" trong 1 câu
3. **Pain bullet số 1** (đau nhất) — câu này quyết định 30% người scroll tiếp hay bounce
4. **Mechanism name + 1 dòng explainer** — phải sticky, dễ nhớ, signal "đây là phương pháp riêng"
5. **CTA button text** — short, action-driven, ngụ ý immediate value

Các section khác (Social Proof, Offer Stack, Guarantee, Urgency, FAQ, Final CTA) cũng upgrade nhưng theo recipe, không cần multiple variants.

---

## Phase 3 — A/B Variants Bank

(Chỉ chạy ở Level 2 và Level 3.)

### 3.1 Hero variants — 3 variant đầy đủ

Mỗi variant bao gồm: headline + subheading + value-prop 3 thứ + credibility + CTA. **Mỗi variant đại diện 1 awareness level**:

| Variant | Khi dùng | Hook type |
|---------|----------|-----------|
| **A — Frustration** | Audience pain-aware mạnh — đang khổ, biết mình khổ | "Cảm thấy [pain] dù đã [effort]?" |
| **B — Readiness** | Audience desire-aware — biết muốn gì, đang tìm cách | "Đã sẵn sàng [dream outcome] chưa?" |
| **C — Bold Promise** | Audience solution-aware — biết có giải pháp tồn tại, đang so sánh | "[Outcome cụ thể] trong [time] không cần [pain]" |

Mỗi variant đi kèm:
- **Khi nào nên dùng** (cold/warm/hot traffic, FB ad vs SEO vs email...)
- **Tone signal** (urgent vs aspirational vs measured)
- **Expected resistance** (objection variant này dễ trigger)

### 3.2 CTA variants — 3 variant

| Variant | Pattern | VD |
|---------|---------|-----|
| **A — Action-direct** | "[Verb action] ngay" | "Đăng ký ngay — còn 12 suất" |
| **B — Benefit-first** | "[Outcome] [time-frame]" | "Bắt đầu 30M/tháng từ hôm nay" |
| **C — Curiosity-loop** | "[Tease + invite]" | "Xem em làm được trong 90 ngày" |

### 3.3 Final-CTA variants — 3 variant

| Variant | Tone | Khi dùng |
|---------|------|----------|
| **A — Urgent recap** | Push, deadline-driven | Cohort sắp đóng, ticket cao |
| **B — Emotional close** | Story-driven, P.S. heavy | Audience cold, cần emotional layer |
| **C — Logical close** | Risk-reversal + ROI math | Audience analytical, B2B |

Mỗi variant đầy đủ: headline final + recap bullets + P.S. + P.P.S.

Đọc `references/ab-variants-playbook.md` để biết format chi tiết và rule mỗi variant.

---

## Phase 4 — Output 4 file

Sinh 4 file vào `output/sales-pages/<slug>/` (cùng folder với layout). **KHÔNG ghi đè `layout.md` / `layout.json`** — copy upgrade là layer riêng để user audit và revert nếu muốn.

### 4.1 `copy-upgraded.md`

Cấu trúc giống `layout.md` nhưng copy đã refined. Header có meta:

```markdown
# Sales Page Copy (UPGRADED) — {{PRODUCT_NAME}}
> Source layout: `layout.md` (generated {{LAYOUT_DATE}})
> Copy intensity: {{LEVEL}} (1=Polish | 2=Conversion-optimized | 3=Sales-letter)
> Formulas applied: PAR (Pain), BAB (Solution), FEP (Benefit), PVEN (Final), SCH (Testimonial)
> Voice: Anh/chị | Charm pricing VND | Customer-voice prioritized

[Section 1 đến 10 refined copy...]
```

→ Template: `templates/copy-upgraded.md.tpl`

### 4.2 `copy-variants.md`

A/B test bank. Cấu trúc:

```markdown
# A/B Variants Bank — {{PRODUCT_NAME}}

## HERO — 3 variants

### Variant A: Frustration hook
[full block: headline + subheading + value-prop + credibility + CTA]
**Khi dùng**: ...
**Tone signal**: ...
**Expected resistance**: ...

### Variant B: Readiness hook
[...]

### Variant C: Bold Promise hook
[...]

## CTA BUTTON — 3 variants
[...]

## FINAL CTA — 3 variants
[...]
```

→ Template: `templates/copy-variants.md.tpl`

### 4.3 `copy-changes.md`

Diff Trước/Sau cho audit. Cấu trúc:

```markdown
# Copy Changes — {{PRODUCT_NAME}}
> So sánh: `layout.md` → `copy-upgraded.md`
> Lý do: tại sao mỗi thay đổi

## Section 1: Hero Headline
**TRƯỚC** (layout.md):
> [original copy]

**SAU** (copy-upgraded.md):
> [new copy]

**LÝ DO**:
- Formula áp dụng: [...]
- Power word thêm: [...]
- Voice fix: [...]
- Expected lift: [...]

[Repeat cho 10 section]

## Tổng kết changes
- Hero: rewrite hoàn toàn (Level 2)
- Pain Agitation: rewrite 3/5 bullet, giữ structure
- ...
```

→ Template: `templates/copy-changes.md.tpl`

### 4.4 `copy.json`

Structured downstream. Schema:

```json
{
  "version": "1.0",
  "slug": "{{SLUG}}",
  "intensity_level": 2,
  "source_layout": "output/sales-pages/{{SLUG}}/layout.json",
  "voice": { "pronoun": "anh/chị", "register": "respectful-direct" },
  "hero": {
    "primary": { "headline": "...", "subheading": "...", "value_prop": [...], "credibility": "...", "cta": {...} },
    "variants": [
      { "id": "A", "type": "frustration", "headline": "...", "when_to_use": "...", "tone_signal": "..." },
      { "id": "B", "type": "readiness", ... },
      { "id": "C", "type": "bold_promise", ... }
    ]
  },
  "sections": [...],
  "cta_variants": [...],
  "final_cta_variants": [...],
  "formulas_applied": { "pain": "PAR", "solution": "BAB", "benefit": "FEP", "final": "PVEN", "testimonial": "SCH" },
  "power_words_density": { "level_1": 12, "level_2": 8, "level_3": 4, "level_4": 1 }
}
```

→ Template: `templates/copy.json.tpl`

### Sau khi output

Report cho user:
- Path 4 file
- Tóm tắt thay đổi: "Đã refine 10 section, generate 9 A/B variants (3 hero + 3 CTA + 3 final-CTA), apply 5 formula thuyết phục"
- 3 next step gợi ý:
  - "Anh/chị xem `copy-changes.md` trước để audit từng thay đổi — em viết kèm lý do."
  - "Sau đó dùng `copy-upgraded.md` paste vào `ui-ux-pro-max` để build HTML."
  - "Khi launch, A/B test theo `copy-variants.md` — Variant A vs B trong 7 ngày."

---

## Nguyên tắc xuyên suốt

### 1. Customer voice > Marketing-speak
Nếu user có note "khách nói gì" → ưu tiên giữ nguyên ngôn ngữ đó. Copywriting tốt là transcript có chỉnh, không phải sáng tác.

### 2. Specificity wins
- ❌ "Nhiều học viên thành công" → ✅ "1.247 học viên đạt 30M+/tháng trong 90 ngày"
- ❌ "Tăng đáng kể" → ✅ "Gấp 2.3 lần"
- ❌ "Sớm" → ✅ "Trong 14 ngày"

### 3. One CTA action, repeat 5+ times
Skill này không tạo CTA biến thể KHÁC ACTION ("Learn more" + "Buy now"). Tạo **variant cùng action** ("Đăng ký ngay — còn 12 suất" vs "Giữ chỗ — chỉ còn 12 suất"). Chọn 1 cho production, A/B test các variant.

### 4. Power word density 2-3 per sentence max
Đừng stack ("phương pháp đột phá bứt phá ngoạn mục"). Density quá cao = hype = trust ↓. Quy tắc 80/20: 80% câu Level 1-2, 20% câu Level 3-4 ở momentum point.

### 5. "Đọc to" test — pass or rewrite
Mỗi block, đọc to lên (hoặc Sub-vocalize). Nếu nghe quê / nghe dịch / nghe "ai nói chuyện vậy" → rewrite. Vietnamese audience nhạy bén với copy không tự nhiên — bounce nhanh.

### 6. Pain section: ngắn, đau, mid-thought-interrupt
Câu pain nên ngắt nhịp như suy nghĩ thật. VD:
- ❌ "Anh/chị có thể đang phải đối mặt với nhiều khó khăn trong việc tìm khách hàng" (35 từ, formal)
- ✅ "Đăng bài đều mỗi ngày. Không một ai inbox. 3 tháng trôi qua. Vẫn không inbox." (4 câu ngắn, beat-driven)

### 7. Mechanism name phải sticky
1-3 từ, dễ nhớ, có "shape" trong đầu. Ví dụ tốt: "Hệ Thống 4P", "Lộ Trình 90 Ngày", "Phương Pháp Funnel Bộ Ba". Ví dụ kém: "Quy trình toàn diện kết hợp nhiều yếu tố".

### 8. Number > Adjective
"5 bước" > "Few steps". "30M/tháng" > "Significant income". Khán giả VN trust số cụ thể hơn tính từ.

### 9. Tránh phrase "translation-y"
- ❌ "Đừng để cảm thấy bị overwhelmed" → ✅ "Đừng để chìm trong đống việc"
- ❌ "Unlock tiềm năng" → ✅ "Khai mở tiềm năng"
- ❌ "Game-changer" → ✅ "Bước ngoặt thực sự" (chỉ dùng khi có proof)

### 10. Risk-reversal đặt ngay sau pricing
Guarantee phải hiển thị **cùng moment** với price decision — không phải scroll thêm 2 section sau. Visual: badge ngay dưới CTA Offer Stack.

---

## Reference files

| File | Khi nào đọc |
|------|-------------|
| `references/persuasion-formulas-vn.md` | Phase 2 — chi tiết 8 formula (PAR, BAB, FEP, PVEN, SCH, ACCA, AIDA, 1-2-3-4) với VD tiếng Việt thuần |
| `references/headline-patterns-vn.md` | Phase 2, 3 — 30+ template headline tiếng Việt, organize theo intent |
| `references/power-words-vn.md` | Phase 2 — 4-level ladder power words tiếng Việt native (không dịch) + emotional triggers VN |
| `references/section-copy-recipes.md` | Phase 2 — recipe cụ thể nâng cấp từng section, kèm before/after example |
| `references/voice-rules-vn.md` | Phase 2 — rule giọng văn: anh/chị placement, nhịp câu, tránh dịch máy |
| `references/ab-variants-playbook.md` | Phase 3 — format và rule viết variants, "khi nào dùng cái nào" |
| `templates/copy-upgraded.md.tpl` | Phase 4.1 |
| `templates/copy-variants.md.tpl` | Phase 4.2 |
| `templates/copy-changes.md.tpl` | Phase 4.3 |
| `templates/copy.json.tpl` | Phase 4.4 |

---

## Anti-patterns (đừng làm)

❌ **Rewrite mà bỏ pain language gốc của khách** — mất authenticity, copy generic
❌ **Stack power word quá dày** ("phương pháp đột phá bứt phá ngoạn mục độc đáo") — hype cao = trust thấp
❌ **Variants A/B với action khác nhau** ("Tìm hiểu thêm" vs "Đăng ký") — variants phải cùng goal, khác wording
❌ **Dịch máy từ template tiếng Anh** ("Unleash your potential", "Skyrocket your business") — quê
❌ **Sửa headline mà không sửa subheading** — 2 phần phải đi cùng nhau, mismatch = confuse
❌ **Headline dài quá 15 từ** — mobile cut off, mất impact
❌ **CTA microcopy chứa 4+ thông tin** ("Hoàn 100% trong 90 ngày | Truy cập ngay | Bonus 4 cho 30 đầu | Trả góp 3 kỳ") — chọn 2 mạnh nhất
❌ **FAQ generic** ("Q: Khóa này có hiệu quả không? A: Có") — phải address objection thật (giá, thời gian, niềm tin, kết quả past)
❌ **Final CTA chỉ recap mà không có emotional layer** — P.S. là chỗ đẩy emotion cuối cùng, đừng phí
❌ **Add testimonial mà không có số cụ thể** — "Khóa rất hay" = không count; "Tăng từ 5M lên 32M trong 11 tuần" = mạnh

---

## Vietnamese market overlays (bắt buộc)

- **Xưng "anh/chị"** ở ticket > 1M (coaching, course, dịch vụ). Xưng "bạn" chỉ khi consumer < 500K hoặc audience trẻ < 25.
- **VND charm pricing**: 497K / 997K / 1.997M / 4.997M / 9.997M / 19.99M. Tránh số 4.
- **Không countdown timer giả** — destroy trust ở VN nhanh hơn ở Tây.
- **Trust signal phải có**: real photo, real number, real address/SDT/Zalo. Stock photo + fake testimonial = chết.
- **"Đăng ký" > "Mua"** — softer, less commitment-y. "Mua" chỉ ở physical product low-friction.
- **Payment friction**: hiện logo Momo/ZaloPay/ATM/VietQR ngay dưới CTA — không phải scroll thêm.
- **Group-validation**: "1.247 anh/chị đã đăng ký" > "Best-seller". VN trust peer hơn authority.

Chi tiết thêm: `references/voice-rules-vn.md` và `references/power-words-vn.md`.

---

## Khi user push back

- **"Copy mới nghe hype quá"** → Hỏi: "Block cụ thể nào?" Drop xuống 1 level power word, đặc biệt section pain/urgency.
- **"Tôi không muốn xưng anh/chị, muốn xưng em"** → OK, nhưng warn: "anh/chị" tăng authority signal ở ticket cao. Lock register sau khi user chốt.
- **"Variants A/B không khác nhau lắm"** → Đúng — variants tốt khác về **hook type** (frustration vs readiness vs bold promise), không khác về wording surface. Show user reasoning: A test pain-aware audience, B test desire-aware.
- **"Tôi đọc thấy chưa đủ mạnh"** → Hỏi: "Anh/chị có example copy nào (sales page khác) đọc thấy 'mạnh'?" — calibrate tone, không guess.
- **"Có thể short hơn không?"** → Suggest Level 1 (Polish) thay vì Level 2/3. Hoặc giảm Section 4 (Benefits) từ 6 dòng xuống 4, giảm Section 9 (FAQ) từ 12 Q xuống 6 Q.

Stand firm về principle (customer voice, specificity, single CTA action) nhưng humble về tone preference của user — đó là **brand voice của họ**.

---

## Integration với pipeline

```
/biz-offer-alex-hormozi  →  offer.json
        ↓
/biz-sales-page-layout   →  layout.md + layout.json + hero-block.md
        ↓
/biz-sales-page-copy ⭐   →  copy-upgraded.md + copy-variants.md + copy-changes.md + copy.json
        ↓
/ui-ux-pro-max  hoặc  /biz-deploy-vercel  (build HTML + deploy)
```

Skill này là **layer cuối cùng trước HTML** — chốt copy production-ready.
