---
name: market-research
description: "Demand-side market research cho digital product / service ở Việt Nam — đo cầu thật + WTP + channel-market fit + defensibility qua keyword volume, marketplace sales (Shopee/Unica/Edumall/Gitiho/KyNa), community signal (FB groups, TikTok hashtag, Zalo OA), competitor pricing, unit economics — không phải macro PESTEL. Output: keyword portfolio + Niche Score 100 điểm 7-dimension có evidence + go/no-go decision + falsification protocol. Force triangulate ≥3 sources cho mỗi claim quan trọng. USE WHEN user says 'nghiên cứu thị trường', 'market research', 'validate niche', 'keyword research', 'demand validation', 'niche có nên làm không', 'có ai làm chưa', 'thị trường đủ lớn không', 'có lời không', 'chọn ngách', 'kiểm tra cầu'. Cũng trigger khi user mô tả 1 ý tưởng kinh doanh cụ thể và muốn check feasibility. Skill này KHÔNG fit: high-ticket transactional sale (BĐS, ô tô), B2B enterprise (sales cycle 6+ tháng), hyper-local geo micro-market (1 toà nhà, 1 phường). KHÔNG làm: macro PESTEL/Porter (dùng `vpd-environment-map`), customer profile/JTBD (dùng `vpd-customer-profile-builder`), business model stress test (dùng `vpd-bm-stress-test`)."
framework: "Demand Signal Triangulation + Niche Score 100 7-dimension (Problem Severity × WTP & Unit Economics × Search Demand × Trend & Timing × Competition & Defensibility × Channel-Market Fit × Personal Alignment) + TAM/SAM/SOM Vietnam + WTP Smoke Test Gate"
source: "BIZ.MKT.OS market-research skill — VN-native, focused demand-side complement cho vpd-environment-map"
---

# Market Research (Demand-side)

Đo cầu thật cho 1 niche / ý tưởng kinh doanh số ở Việt Nam — bằng data triangulate qua keyword + marketplace + community, không phải opinion. Output là 1 niche score 100 điểm có evidence + go/no-go decision.

> **Nguyên tắc đầu tiên:** Mỗi claim quan trọng (demand, competition, monetization) phải có **≥3 source độc lập** support. 1 source = anecdote. 2 = coincidence. 3 = signal. Nếu không triangulate được, ghi "evidence yếu" và downgrade confidence — không bịa.

## Skill này phù hợp khi

- User đã có 1 niche ý tưởng cụ thể, muốn validate trước khi đầu tư thời gian/tiền
- User chưa có niche, cần brainstorm + pick top từ portfolio
- User cần size TAM/SAM/SOM realistic cho solopreneur VN, không phải corporate-scale
- User muốn biết "ai đang làm rồi", giá bao nhiêu, định vị ở đâu

## Skill này KHÔNG làm (dùng skill khác)

| Việc cần làm | Dùng skill |
|---|---|
| Macro PESTEL, Porter Five Forces, industry trends | `vpd-environment-map` |
| Customer profile, JTBD, Pains/Gains | `vpd-customer-profile-builder` |
| Stress-test business model | `vpd-bm-stress-test` |
| Customer interview design | `vpd-customer-discovery-interview` |
| Đóng gói offer Hormozi | `vpd-offer-packaging-alex-homozi` |

## Workflow

### Mode A — Đã có 1 niche, cần validate (2-3h)
Skip Phase 1. Chạy Phase 2 → Phase 4. Đây là use case phổ biến nhất.

### Mode B — Chưa có niche, cần discover + pick (4-6h)
Phase 1 → 2 → 4. Bỏ Phase 3 trừ khi đã narrow xuống 1-2 candidate.

### Mode C — Đã validate, cần size TAM/SAM/SOM (1h)
Phase 3 only. Reference [tam-sam-som-vn.md](./references/tam-sam-som-vn.md).

| Phase | Mục tiêu | Output |
|---|---|---|
| **1. Discover** | Brainstorm 50+ candidate keyword/niche từ 5 source | Seed list |
| **2. Signal** | Đo 4 demand signal cho mỗi candidate | Evidence table |
| **3. Size** | TAM/SAM/SOM cho top 1-2 niche | Sizing model |
| **4. Score & Decide** | Niche Score 100 + go/no-go | Decision report |

## Live Research Protocol (bắt buộc dùng tools)

Model có cutoff. Search volume + competitor list + pricing thay đổi mỗi quý. Đoán = sai.

### Step 1 — Mỗi research bắt buộc chạy 6/10 query này

Thay `$NICHE` bằng keyword tiếng Việt + tiếng Anh để cross-check. Date-stamp mọi finding bằng today (lấy từ context, không hardcode trong report).

```
"$NICHE khóa học vietnam"                     → Có ai đang dạy / sell course
"$NICHE shopee.vn"                            → Marketplace activity (sales, reviews)
"$NICHE unica.vn OR edumall.vn OR gitiho.vn"  → Course platform VN (số học viên, giá)
"$NICHE tiktok.com vietnam"                   → TikTok hashtag + creator (discovery #1 Gen Z VN 2026)
"$NICHE threads.net vietnam"                  → Threads VN (creator AI/tech đang shift sang, ít competition)
"$NICHE zalo OR shopee live vietnam"          → Zalo Mini App + livestream sale (kênh native VN)
"$NICHE site:reddit.com OR site:facebook.com" → Pain points + sentiment
"$NICHE facebook group vietnam"               → Community signal
"$NICHE google trends vietnam"                → Trend direction
"$NICHE giá bao nhiêu"                         → Pricing benchmark
```

**Bắt buộc:** ≥1 query phải là TikTok/Threads — kênh discovery thực tế của buyer VN 2026 đã dịch chuyển khỏi Google search cho nhiều niche (AI tool, beauty, finance, parenting). Bỏ qua = miss demand signal lớn nhất.

### Step 2 — WebFetch để extract số chính xác

Search xong, **fetch URL cụ thể** để lấy data exact (không paraphrase):
- Course page → giá, số học viên, review count, instructor credentials
- Shopee listing → "Đã bán X", price range, top seller stores
- FB Ads Library (facebook.com/ads/library, filter VN) → active ad creatives, ad spend signals
- Competitor pricing page → exact tier prices, bonuses, guarantee

### Step 3 — Manual tools (guide user nếu cần login)

| Tool | URL | Lấy gì |
|---|---|---|
| Google Trends VN | trends.google.com (region: Vietnam) | 5-year trend direction, related rising queries, geo hotspot |
| Google Keyword Planner | ads.google.com (free account) | Monthly search volume, CPC, competition level |
| FB Ads Library | facebook.com/ads/library (country: VN) | Active competitor ads, creative angles |
| Shopee Sales Filter | shopee.vn → sort by sales count | Top seller sales, price range, review patterns |

Khi cần user thao tác, output theo dạng: "Vào X, làm Y, copy data về theo template Z."

Chi tiết step-by-step + threshold đọc số: [vn-data-sources.md](./references/vn-data-sources.md)

## Niche Score 100 — 7 Dimension (revised 2026-05-17)

7 chiều, weight không đều. Mỗi score **bắt buộc có evidence** (URL + số cụ thể), không "tôi nghĩ".

| # | Dimension | Max | Đo cái gì (1 dòng) |
|---|---|---|---|
| 1 | **Problem Severity** | 15 | Pain intensity × frequency × urgency × failed-attempts (starving crowd) |
| 2 | **WTP & Unit Economics** | 20 | Direct paid signal + net-of-fees margin + LTV / backend ladder + price-point match |
| 3 | **Search Demand** | 12 | Primary keyword + portfolio volume Vi+En cộng dồn |
| 4 | **Trend & Timing** | 10 | 5-year direction + adoption curve position |
| 5 | **Competition & Defensibility** | 15 | Sweet spot 10pts (active vs stale) + unfair advantage / moat 5pts |
| 6 | **Channel-Market Fit** | 15 | Audience kênh nào + creator content native fit + CAC viable (LTV/CAC ≥ 3) |
| 7 | **Personal Alignment** | 13 | Expertise + sustainability + network access |
| | **TOTAL** | **100** | |

> **Vì sao re-weight (so với bản cũ 5×20):** bản cũ cho Search Demand + Trend mỗi cái 20pts → 40% score dồn vào 1 loại tín hiệu correlated, thiếu hẳn Problem Severity / Channel-CAC / Defensibility. Bản mới ép decision dựa trên business-model viability, không chỉ "có người search". WTP & Unit Economics giữ trọng số cao nhất (20) vì đây là tín hiệu thật nhất về việc kiếm được tiền.

> **VN volume note:** Threshold Search Demand thấp hơn US-mindset ~60% — VN keyword volume thường = 15-30% US cho cùng concept. Nếu audience là tech-savvy (lập trình viên, designer), volume En có thể chiếm 50-70% portfolio → cộng dồn cả 2 ngôn ngữ.
>
> **Saturation flip:** Đếm "active competitor 12 tháng gần" thay vì tổng. Unica/Edumall thường show 50+ course nhưng top course đã 18-24 tháng tuổi, instructor không update → de facto sweet spot, không phải saturated. Filter: course update <12 tháng + last review <6 tháng = "active".
>
> **Gross-to-net haircut:** Marketplace course revenue ≠ instructor take-home. Unica/Edumall share 30-50% revenue; refund rate VN online course 5-12%; FB Ads để fill course 30-60% revenue. "Top course 1.2K × 899K = 1B revenue" thật ra ≈ 250-400M net cho instructor. Score Monetization theo NET, không gross.

**Decision tier:**

| Score | Verdict | Action |
|---|---|---|
| **80-100** | Strong Go | Allocate resource, fast-track — vẫn phải qua WTP smoke test gate (xem dưới) trước build full |
| **60-79** | Solid Go | **Bắt buộc** qua WTP smoke test gate + 10 customer interview trước khi spend >5M VND build |
| **40-59** | Marginal | Chỉ proceed nếu Personal Alignment ≥10 AND Channel-Market Fit ≥10, set hard milestone + falsification trigger |
| **<40** | Pass | Quay lại Phase 1, pick niche khác |

Rubric chi tiết per dimension + worked example: [niche-scoring-100.md](./references/niche-scoring-100.md)

## WTP Smoke Test Gate (bắt buộc cho score 60-79, optional cho 80+)

Score cao nhưng chưa ai trả tiền cho **chính price-point của bạn** = giả định, chưa validate. Smoke test cheapest:

1. **Build 1 trang landing 1-page** (1-2 ngày qua `ui-ux-pro-max`) — chỉ promise + CTA "Đăng ký waitlist / giữ chỗ early-bird" với giá thật user định bán.
2. **Drive 200-500 warm traffic** qua organic content + 500K-2M FB Ads test.
3. **Đọc số:**
   - Waitlist signup ≥5% warm traffic = WTP signal valid → proceed MVP
   - Pre-pay/deposit ≥1% = WTP signal mạnh nhất → proceed full launch
   - <2% signup = WTP yếu → giảm giá 30-50% hoặc pivot offer hoặc kill
4. **Document số trong report** — đây là Tier A evidence mạnh hơn cả marketplace data.

## Falsification Protocol (pre-mortem — bắt buộc trong output)

Sau khi score, ép user pre-commit kill criteria trước khi spend:

> "Trong 90 ngày, nếu 3 signal nào xuất hiện thì kill niche này thay vì double-down?"

Ví dụ trigger:
- Waitlist conversion <1% sau 500 traffic = WTP fail
- 0 organic content piece đạt >5K reach trong 30 ngày = channel-market mismatch
- 2 large competitor cùng launch offer giống = window closed
- Personal cost: >40h/tuần × 90 ngày mà revenue <20M = burnout floor crossed

Pre-mortem này phải nằm trong report. Không có pre-mortem = không có decision discipline.

## TAM/SAM/SOM cho solopreneur VN

```
TAM = Total potential buyers (VN)  × Average price
SAM = TAM × geo% × demo% × psycho%
SOM Year 1 = SAM × realistic share% (solo creator)
```

**Sanity check (red flags):**
- SOM Year 1 < 100M VND → niche quá nhỏ cho solo, pivot hoặc raise price
- SOM > 1% market share → quá lạc quan, dial back assumption
- TAM/SOM > 1000x → market quá fragmented, hard to capture share

Worked examples (AI course, English course, freelance course): [tam-sam-som-vn.md](./references/tam-sam-som-vn.md)

## Output — JSON là dữ liệu, HTML load JSON

Mỗi lần chạy skill phải sinh **2 file primary** vào `output/<slug>/`:

1. **`01-niche-research.json`** — single source of truth (machine-readable, downstream consumers + diff/grep friendly). Schema bên dưới.
2. **`01-niche-research.html`** — copy y nguyên `templates/niche-report.html`, KHÔNG edit. Template tự fetch `./01-niche-research.json` rồi auto-render radar chart 7-dim + score progress bars + TAM/SAM/SOM funnel + unit-economics waterfall + ladder + WTP smoke-test plan + pre-mortem + timeline.

Markdown report (`01-niche-research-report.md`) là **optional** — chỉ sinh khi user explicit request, hoặc downstream skill có grep workflow cần. Mặc định JSON + HTML là đủ.

### Quy trình sinh output

```bash
mkdir -p output/<slug>
cp .Codex/skills/market-research/templates/niche-report.html output/<slug>/01-niche-research.html
# Skill ghi 01-niche-research.json theo schema bên dưới (Write tool)
```

User mở HTML trong browser → fetch JSON → auto-render. Print → PDF cho client deliverable.

**Lưu ý file:// browser:** Trình duyệt block `fetch()` trên `file://` (CORS). 3 cách mở:
- (a) `cd output/<slug> && npx serve .` rồi mở `http://localhost:3000/01-niche-research.html`
- (b) VSCode Live Server (click chuột phải → "Open with Live Server")
- (c) Mở HTML qua `file://`, click nút "📂 Chọn file JSON" trong banner để load thủ công

### JSON schema (`01-niche-research.json`)

```json
{
  "name": "Tên niche",
  "subtitle": "1-line framing — gồm scope + region + audience",
  "date": "YYYY-MM-DD",
  "framework": "Niche Score 7-dim v2026-05-17 · Triangulation ≥3 nguồn · WTP smoke test gate",
  "total": 69,
  "tldr": ["dòng 1 verdict + evidence", "dòng 2 risk", "dòng 3 next action"],

  "scores": [
    { "key": "problem",     "label": "Problem Severity",            "score": 11, "max": 15, "evidence": "...", "url": "..." },
    { "key": "wtp",         "label": "WTP & Unit Economics",        "score": 14, "max": 20, "evidence": "...", "url": "..." },
    { "key": "search",      "label": "Search Demand",               "score": 9,  "max": 12, "evidence": "...", "url": "..." },
    { "key": "trend",       "label": "Trend & Timing",              "score": 7,  "max": 10, "evidence": "...", "url": "..." },
    { "key": "competition", "label": "Competition & Defensibility", "score": 8,  "max": 15, "evidence": "...", "url": "..." },
    { "key": "channel",     "label": "Channel-Market Fit",          "score": 11, "max": 15, "evidence": "...", "url": "..." },
    { "key": "personal",    "label": "Personal Alignment",          "score": 9,  "max": 13, "evidence": "...", "url": "..." }
  ],

  "keywords":    [{ "kw": "...", "vol": 0, "cpc": 0, "trend": "up|flat|down", "intent": "...", "src": "..." }],
  "signals":     [{ "type": "Course platform|Marketplace|Community|FB Ads|TikTok|Google Trends", "evidence": "...", "source": "url-no-scheme", "date": "YYYY-MM-DD" }],
  "competition": [{ "name": "...", "pos": "...", "price": "...", "strength": "...", "gap": "..." }],

  "unitEcon": { "gross": 990000, "platformFeePct": 0.15, "refundPct": 0.08, "marketingPct": 0.25, "ltvBlended": 2450000, "cacCeiling": 815000 },
  "ladder":   [{ "tier": "Tripwire|Core|Premium|Recurring", "name": "...", "price_display": "..." }],

  "funnel": {
    "tam": 72000000000, "sam": 9600000000,
    "somLow": 120000000, "somBase": 320000000, "somHigh": 680000000,
    "tamNote": "...", "samNote": "...",
    "somLowNote": "...", "somBaseNote": "...", "somHighNote": "..."
  },

  "wtpTest": {
    "step1": "...", "step2": "...", "step3": "...", "step4": "...",
    "proceedRule": "Waitlist ≥ 5% · Pre-pay ≥ 1%",
    "iterateRule": "Waitlist 2-5% — giảm giá 30-50% hoặc pivot offer",
    "killRule":    "Waitlist < 2% · < 7 ngày traffic"
  },

  "premortem": ["trigger 1", "trigger 2", "..."],
  "timeline":  [{ "period": "Tuần 1-2", "action": "...", "output": "...", "metric": "..." }]
}
```

**Quy ước nhỏ:**
- `evidence` hỗ trợ `**bold**` inline — HTML render thành `<strong>`.
- `signals[].source` không cần scheme — JS tự prepend `https://`.
- Các field optional (TAM notes, ladder, wtpTest steps) — nếu vắng, HTML render placeholder hoặc skip.
- Worked example đầy đủ: [templates/niche-report.sample.json](./templates/niche-report.sample.json) — niche "AI tools cho freelance writer VN" 69/100.

### Markdown template (chỉ sinh khi explicit request)

```markdown
# Niche Research Report: $NICHE
**Date:** $YYYY-MM-DD | **Status:** [Strong Go / Solid Go / Marginal / Pass]

## TL;DR (3-5 dòng)
[Verdict + 1 line evidence chính + 1 line risk lớn nhất + recommended next action]

## Keyword Portfolio
| Keyword | Volume/tháng | CPC | Trend | Intent | Source |
|---|---|---|---|---|---|
| Primary: ... | ... | ... | ↑/→/↓ | ... | [Keyword Planner / Trends] |
| Secondary 1-5 | ... | ... | ... | ... | ... |
**Total Addressable Search Volume:** _ /tháng

## Demand Signals (≥3 source rule)
| Signal | Evidence | Source URL | Date |
|---|---|---|---|
| Marketplace | Shopee 247 products, top seller 1.2K sales | shopee.vn/... | 2026-05-14 |
| Course platform | Unica top course 856 học viên, giá 599K | unica.vn/... | 2026-05-14 |
| Community | FB group "X" 23K thành viên, daily posts | facebook.com/groups/... | 2026-05-14 |
| FB Ads | 12 active ads, avg run 30+ ngày | facebook.com/ads/library | 2026-05-14 |

## Competition Landscape
| Competitor | Positioning | Price | Strength | Weakness/Gap |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## Niche Score (7-dimension)
| # | Dimension | Score | Evidence (1-line + URL) |
|---|---|---|---|
| 1 | Problem Severity | _/15 | ... |
| 2 | WTP & Unit Economics | _/20 | ... |
| 3 | Search Demand | _/12 | ... |
| 4 | Trend & Timing | _/10 | ... |
| 5 | Competition & Defensibility | _/15 | (sweet spot _/10 + moat _/5) |
| 6 | Channel-Market Fit | _/15 | ... |
| 7 | Personal Alignment | _/13 | ... |
|   | **TOTAL** | **_/100** | |

## Unit Economics check
- **Gross price:** _ VND
- **Platform/payment fee:** _% (Unica 30-50% / own site 3-5% / Stripe 3% + VAT)
- **Refund rate assumption:** _% (VN online course 5-12%)
- **Marketing cost / sale:** _% revenue (organic ~0% / paid 30-60%)
- **Effective net per sale:** _ VND (gross × net %)
- **LTV (with backend ladder):** _ VND
- **CAC ceiling (LTV ÷ 3):** _ VND

## TAM/SAM/SOM (nếu Phase 3 chạy)
- **TAM:** _ tỷ VND = _ buyers × _ VND avg
- **SAM:** _ tỷ VND = TAM × _% (filters: ...)
- **SOM Year 1:** _ M VND (3 scenarios — Conservative / Base / Optimistic)
- **Sensitivity:** Variable nào nhạy nhất với SOM ([conversion / audience-size / price / cohort-fill])
- **Sanity:** [Pass / Floor warning / Optimism warning]

## WTP Smoke Test plan (bắt buộc nếu score 60-79)
- **Landing page promise:** _
- **Traffic source + cost:** _ (vd FB Ads 1M + 5 piece organic)
- **Success threshold:** ≥5% waitlist OR ≥1% pre-pay → proceed; <2% → kill or pivot
- **Timeline:** _ ngày (typical 7-14)

## Pre-mortem — Falsification triggers (kill criteria)
Trong 90 ngày, nếu **bất kỳ 2 signal nào dưới đây xuất hiện đồng thời**, kill niche thay vì double-down:
- [ ] Waitlist conversion <_% sau _ traffic
- [ ] 0 organic content piece đạt >_ reach trong 30 ngày
- [ ] _ large competitor cùng launch offer overlap
- [ ] Effective CAC > _% LTV cap
- [ ] Personal cost >40h/tuần × 90 ngày mà revenue <_

## Recommendation
**Decision:** [...]
**Rationale:** [2-3 paragraph linking evidence → score → decision]
**Top risk:** [1 line]
**Next steps (90 ngày):**
- [ ] Tuần 1-2: WTP smoke test (landing + waitlist)
- [ ] Tuần 3-4: 10 customer interview định tính
- [ ] Tháng 2: MVP build nếu WTP pass
- [ ] Tháng 3: launch beta cohort, đo conversion thật
**Success metrics (90-day checkpoint):**
- [Metric]: [Target có số]
```

## Anti-patterns thường gặp

| Anti-pattern | Vì sao sai | Cách khác |
|---|---|---|
| "Niche này hot lắm" không có URL | Opinion ≠ data. Báo cáo dạng này vô giá trị | Force ≥3 source mỗi claim |
| Interest = Demand | High traffic không = willingness to pay | Check marketplace sales, CPC, paid course tồn tại |
| 1 source duy nhất | Cherry-picked evidence | Triangulate (search + marketplace + community tối thiểu) |
| Audience size = revenue | 100K followers ≠ doanh thu. Conversion 0.5-2% thường thấy | Tính revenue = audience × conversion × LTV, không assume |
| Skip Personal Alignment | External opportunity + zero fit = burnout 6 tháng | Honest score, không inflate |
| TAM giả định 100% addressable | TAM ≠ SOM. Solo creator capture được 0.01-0.1% thường thấy | Apply geo + demo + psycho filter, document assumption |
| Stale data >12 tháng | Digital market shift quá nhanh | Prefer source ≤12 tháng, date-stamp mọi finding |

## Best Practices

1. **Date-stamp mọi data point**: "Shopee 2026-05-14: 247 products, top seller 1.2K sold"
2. **URL/source cho mỗi number**: kiểm tra lại được, audit được
3. **Triangulate ≥3 source** cho claim demand/competition/monetization
4. **Cross-language search**: tiếng Việt + tiếng Anh — VN audience search cả 2 ngôn ngữ
5. **Timebox** mỗi phase, set deadline trước khi start. 80% confidence đủ để MVP
6. **Save raw search results**: screenshot, archive — markets shift, original data có thể disappear

## Reference Files

- [vn-data-sources.md](./references/vn-data-sources.md) — Danh sách nguồn data VN-specific (Shopee/Unica/Edumall/Gitiho/KyNa/FB/TikTok + Coccoc/Zalo OA/Spiderum/TikTok Creative Center), step-by-step query template, threshold để đọc tín hiệu strong/weak
- [niche-scoring-100.md](./references/niche-scoring-100.md) — Full rubric 7-dimension weighted (revised 2026-05-17) với decision tree từng score band, worked example "AI tools cho freelance writer VN" 69/100
- [tam-sam-som-vn.md](./references/tam-sam-som-vn.md) — VN-native sizing math với 3 worked examples (English course, AI course, freelance coaching), filter % typical, sanity check thresholds
- [templates/niche-report.html](./templates/niche-report.html) — JSON-driven HTML report (Tailwind + Chart.js). Template KHÔNG cần edit — copy y nguyên sang `output/<slug>/01-niche-research.html`, sau đó ghi data file `01-niche-research.json` cùng folder. Open qua local server (`npx serve .` / VSCode Live Server) hoặc dùng file-picker fallback trên `file://`. Hỗ trợ `?data=<custom-path>` URL param.
- [templates/niche-report.sample.json](./templates/niche-report.sample.json) — Worked example schema đầy đủ (niche "AI tools cho freelance writer VN" 69/100). Copy → fill data thật cho niche của user.

---

**Khi user request market research:** confirm scope 1-2 câu (mode A/B/C, niche cụ thể chưa, region), rồi chạy Live Research Protocol Step 1 ngay — không hỏi nhiều trước khi có data đầu tiên.
