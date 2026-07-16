---
name: biz-i18n-landing-page
description: "Thêm đa ngôn ngữ (i18n) cho landing page Next.js đã build sẵn — biến trang viết bằng 1 ngôn ngữ thành trang đa ngôn ngữ với nút pill chuyển ngôn ngữ cố định góc trên bên phải, đổi tức thì không reload không đổi URL. Workflow 8 phase: (0) detect Next.js App Router project trong output/ — TS/Tailwind/src wrapper/path alias @/, hỏi user chọn nếu có nhiều landing page; (1) **PHỎNG VẤN user qua AskUserQuestion**: hỏi muốn hỗ trợ ngôn ngữ nào (gợi ý Tiếng Việt / English / 中文 / 한국어 — và Other cho 日本語, Thái...) và ngôn ngữ nào làm mặc định hiện khi mới vào trang; (2) quét toàn bộ copy hardcode trong app/page.tsx + mọi component con (Hero/Pricing/FAQ/Footer/form...) + metadata layout.tsx, gom thành dictionary key theo section; (3) **tự dịch** sang mọi ngôn ngữ đã chọn — bản địa hoá marketing chứ không dịch máy, giữ nguyên tên brand + giá VND + SĐT + URL; (4) scaffold hệ thống i18n client-side trong app/i18n/ — React Context + JSON dictionaries + localStorage + auto-detect ngôn ngữ trình duyệt, KHÔNG đổi URL, KHÔNG đụng app/api hay app/admin, KHÔNG thêm dependency; (5) gắn LanguageProvider vào layout.tsx + render LanguageSwitcher pill + rewire mỗi component dùng hook useT() thay text hardcode; (6) chạy npm run build verify trang ngôn ngữ gốc hiển thị y hệt trước; (7) báo cáo + gợi ý deploy lại qua /biz-deploy-vercel. File ngôn ngữ gốc (vi.ts) làm source-of-truth type nên TypeScript bắt lỗi nếu thiếu key dịch. USE WHEN user says 'làm landing page đa ngôn ngữ', 'thêm i18n', 'website nhiều ngôn ngữ', 'dịch landing page sang tiếng Anh', 'song ngữ Việt Anh', 'nút chuyển ngôn ngữ', 'language switcher', 'multilingual landing page', 'add i18n to website', 'translate landing page', 'biz-i18n', 'hỗ trợ tiếng Trung tiếng Hàn cho web', 'cho khách nước ngoài xem được trang', 'thêm tiếng Anh vào trang'. Dùng skill này BẤT CỨ KHI NÀO user muốn trang web hiển thị được nhiều hơn 1 ngôn ngữ — kể cả khi chỉ nói 'cho khách Tây đọc được' hay 'web em mới có tiếng Việt thôi'. Skill KHÔNG dịch chatbot / email auto-responder / admin dashboard — các hệ thống đó có cơ chế riêng; skill chỉ lo copy hiển thị trên landing page."
framework: "Next.js 13+ App Router — i18n client-side (React Context + JSON dictionaries) — không thêm dependency — Tailwind cho nút switcher"
---

# biz-i18n-landing-page

Biến một landing page Next.js đang viết bằng **1 ngôn ngữ** thành trang **đa
ngôn ngữ**. Visitor thấy một nút pill nhỏ cố định ở góc trên bên phải — bấm
là đổi ngôn ngữ ngay tức thì, không reload, không đổi URL. Lựa chọn được nhớ
qua `localStorage`, và lần đầu vào trang skill tự đoán theo ngôn ngữ trình
duyệt.

Skill này chạy **sau khi** landing page đã build (qua `ui-ux-pro-max`). Chạy
trước hay sau `/biz-deploy-vercel` đều được — nếu trang đã deploy thì cuối
cùng deploy lại.

## Vì sao client-side, không dùng locale routing

Landing page ở repo này là **một URL duy nhất** đã sở hữu sẵn `app/api/`,
`app/admin/`, `app/cam-on/`... Đi theo hướng locale routing (`app/[locale]/` +
middleware) sẽ phải dời mọi route vào dưới `[locale]` — một thay đổi nặng và
rủi ro cho một trang bán hàng một-trang. Thay vào đó ngôn ngữ sống trong React
state: nhẹ, không thêm dependency, không phá vỡ route nào, và đúng trải nghiệm
"bấm nút là đổi" mà trang bán hàng cần. Đánh đổi duy nhất: mỗi ngôn ngữ không
có URL riêng cho SEO — chấp nhận được với trang chạy traffic quảng cáo.

## Cấu trúc i18n sinh ra

```
app/i18n/                       (hoặc src/app/i18n/ nếu project dùng src/)
├── dictionaries/
│   ├── vi.ts        ← source of truth: copy gốc nguyên văn, định nghĩa SHAPE
│   ├── en.ts        ← bản dịch — typed là Dictionary, phải khớp key với vi.ts
│   └── index.ts     ← registry: dictionaries, locales, defaultLocale, localeNames
├── LanguageContext.tsx   ← Provider + hook useT() / useLanguage()
└── LanguageSwitcher.tsx  ← nút pill cố định góc trên phải
```

Mọi file template nằm ở `templates/`. `LanguageContext.tsx` và
`LanguageSwitcher.tsx` copy gần như nguyên văn; `index.ts` và các file
dictionary thì điền nội dung thật.

## Quy trình — 8 phase

### Phase 0 — Detect project

Tìm landing page cần xử lý. Trang Next.js nằm trong `output/<slug>/` (thường
là `output/<slug>/landing-page/`) — nhận diện qua sự tồn tại của `app/page.tsx`
hoặc `src/app/page.tsx`.

- Nếu có **nhiều** landing page → dùng `AskUserQuestion` hỏi user chọn project.
- Detect và ghi nhớ: dùng TypeScript (`tsconfig.json`) hay JS; có wrapper
  `src/` không; có Tailwind không; có path alias `@/` không (`tsconfig.json` →
  `compilerOptions.paths`). Xác nhận là App Router (có `app/`).
- Nếu đã tồn tại `app/i18n/` → skill đang được chạy lại để **thêm ngôn ngữ**;
  xem mục cuối `references/wiring-guide.md`, không làm lại từ đầu.

### Phase 1 — Phỏng vấn ngôn ngữ — CHECKPOINT, bắt buộc

Đọc nhanh `page.tsx` để biết trang đang viết bằng ngôn ngữ gì (ở repo này gần
như luôn là tiếng Việt). Rồi hỏi user — **không được bỏ qua, không được tự
quyết thay user**:

1. **Hỗ trợ ngôn ngữ nào** — `AskUserQuestion`, `multiSelect: true`. Đưa
   ngôn ngữ gốc (đánh dấu "giữ nguyên bản gốc") + các ngôn ngữ hợp với tệp
   khách của trang. Gợi ý mặc định: Tiếng Việt, English, 中文 (Trung), 한국어
   (Hàn) — user vẫn có ô "Other" để thêm 日本語, ภาษาไทย, Français...
2. **Ngôn ngữ mặc định** — `AskUserQuestion`, single-select, options là đúng
   các ngôn ngữ vừa chọn ở câu 1. Khuyến nghị chọn **ngôn ngữ trang đang viết
   sẵn**: nó thành source-of-truth, không phải dịch nên không có rủi ro sai.

Quy ước locale code: `vi`, `en`, `zh`, `ko`, `ja`, `th`, `fr`... (ISO 639-1,
2 ký tự, khớp với `navigator.language` để auto-detect chạy đúng).

Dừng tại đây tới khi có đủ 2 câu trả lời.

### Phase 2 — Quét & gom copy

Lập **bản kê đầy đủ** mọi chuỗi visitor đọc được. Sót một chuỗi là chuỗi đó
kẹt lại ở ngôn ngữ gốc mãi mãi. Đọc `references/extraction-guide.md` để biết
chính xác chỗ cần quét, chuỗi nào tính, chuỗi nào bỏ, và cách đặt key.

Tóm tắt: đi từ `page.tsx` → mọi component con (`Hero`, `Pricing`, `FAQ`,
`Footer`...) + `metadata` trong `layout.tsx`. Gom key theo component
(`hero.*`, `pricing.*`, `faq.*`). Mảng dữ liệu lặp (pricing tiers, FAQ items)
giữ nguyên dạng mảng.

### Phase 3 — Dựng dictionaries + dịch

1. Viết file ngôn ngữ gốc trước (vd `vi.ts`) với **chuỗi gốc nguyên văn** —
   không paraphrase, không "sửa cho hay". File này định nghĩa SHAPE. Xem
   `templates/dictionary-source.example.ts` cho cấu trúc (lưu ý: **không** có
   `as const`).
2. Với mỗi ngôn ngữ còn lại, viết file dictionary tương ứng — **typed là
   `Dictionary`**, khớp key từng-cái-một với file gốc. Đây là copy bán hàng:
   bản địa hoá theo chất lượng marketing, không dịch máy literal. Giữ nguyên
   tên brand, giá VND, SĐT, URL. Đọc `references/translation-guide.md`.

### Phase 4 — Scaffold hệ thống i18n

Tạo thư mục `app/i18n/` (hoặc `src/app/i18n/`):

- `LanguageContext.tsx`, `LanguageSwitcher.tsx` — copy từ `templates/`, gần
  như nguyên văn.
- `dictionaries/index.ts` — từ `templates/dictionaries-index.ts`, điền danh
  sách ngôn ngữ thật: `import` mỗi file, `dictionaries`, `defaultLocale`,
  `localeNames`. Ngôn ngữ gốc import đầu tiên (nó là gốc của type `Dictionary`).
- `dictionaries/<code>.ts` — các file dictionary từ Phase 3.

Nếu project **không có** path alias `@/`, đổi import trong `layout.tsx` và
component sang đường dẫn tương đối. Các file template tham chiếu nhau bằng
đường dẫn tương đối (`./LanguageContext`, `./dictionaries`) nên chạy được cả
hai kiểu. Chi tiết: `references/wiring-guide.md`.

### Phase 5 — Wire vào layout + rewire component

1. `layout.tsx` (giữ là server component): bọc `{children}` trong
   `<LanguageProvider>`, render `<LanguageSwitcher />` một lần ngay bên trong.
   Giữ nguyên `metadata` export.
2. Mỗi component có chứa copy: thêm `"use client"` ở đầu file (hook đọc React
   context — chỉ chạy trong client component), thêm `const t = useT();`, thay
   mỗi chuỗi hardcode bằng key dictionary (`t.hero.title`...). Mảng dữ liệu
   local chuyển vào dictionary, component `.map()` trên giá trị dictionary.

Pattern before/after đầy đủ + cách wire `layout.tsx`: `references/wiring-guide.md`.

### Phase 6 — Build verify

Vào thư mục project, chạy `npm run build` (hoặc `npm run lint`). Sửa hết lỗi.
Bảng lỗi thường gặp + cách sửa: `references/wiring-guide.md`.

**Tiêu chí nghiệm thu:** build xanh, và trang ở **ngôn ngữ mặc định** hiển thị
nội dung **y hệt trước khi chạy skill** — các ngôn ngữ khác chỉ hiện khi
visitor bấm nút. Nếu nội dung tiếng Việt đổi khác đi nghĩa là `vi.ts` đã sai.

### Phase 7 — Báo cáo

In tổng kết: ngôn ngữ đã hỗ trợ + ngôn ngữ mặc định; danh sách file tạo mới /
sửa; cách test (`npm run dev` → bấm pill góc trên phải). Nếu trang đã deploy
trước đó → nhắc deploy lại qua `/biz-deploy-vercel` để bản đa ngôn ngữ lên
production.

## Anti-patterns — tránh tuyệt đối

- ❌ **Chuyển sang locale routing** (`app/[locale]/` + middleware) — phá vỡ
  `app/api`, `app/admin`. Skill này cố ý chọn client-side.
- ❌ **Thêm dependency** (`next-intl`, `i18next`, `react-intl`) — không cần,
  hệ thống Context + JSON đã đủ và nhẹ hơn.
- ❌ **Dịch máy literal** — copy bán hàng phải bản địa hoá. Bản dịch cứng đờ
  giết conversion.
- ❌ **Dịch tên brand / giá VND / SĐT / URL** — copy qua nguyên văn.
- ❌ **Quên `"use client"`** ở component dùng `useT()` — sẽ lỗi
  `useLanguage must be used inside <LanguageProvider>`.
- ❌ **Sửa nội dung ngôn ngữ gốc** — `vi.ts` là chuỗi gốc nguyên văn; trang
  tiếng Việt phải y hệt trước. Muốn nâng cấp copy thì dùng `/biz-sales-page-copy`.
- ❌ **Bỏ qua phỏng vấn** — luôn hỏi user ngôn ngữ + mặc định, đừng tự quyết.
- ❌ **Dịch chatbot / email / admin** — ngoài scope, các hệ thống đó có cơ
  chế ngôn ngữ riêng.

## File trong skill này

| File | Dùng khi |
|------|----------|
| `templates/LanguageContext.tsx` | Phase 4 — copy vào `app/i18n/` gần như nguyên văn |
| `templates/LanguageSwitcher.tsx` | Phase 4 — nút pill, copy nguyên văn |
| `templates/dictionaries-index.ts` | Phase 4 — registry, điền danh sách ngôn ngữ thật |
| `templates/dictionary-source.example.ts` | Phase 3 — cấu trúc mẫu của file dictionary gốc |
| `references/extraction-guide.md` | Phase 2 — quét chuỗi nào, đặt key ra sao |
| `references/translation-guide.md` | Phase 3 — bản địa hoá, tone từng ngôn ngữ, giữ gì nguyên văn |
| `references/wiring-guide.md` | Phase 4–6 — import path, wire layout, rewire component, hydration, sửa lỗi build |
