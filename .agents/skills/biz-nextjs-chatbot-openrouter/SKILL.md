---
name: biz-nextjs-chatbot-openrouter
description: "Cài chatbot AI dạng floating widget góc dưới phải vào project Next.js có sẵn (App Router hoặc Pages Router), responsive đầy đủ web + tablet + mobile, gọi LLM qua OpenRouter (mặc định google/gemini-3-flash-preview, có thể đổi sang anthropic/Codex-sonnet-4.6), streaming response, RENDER MARKDOWN trong assistant bubble (bold / list / link / code) qua react-markdown + remark-gfm — KHÔNG hiện raw **bold** dạng text — có knowledge base từ FAQ + tài liệu sản phẩm/khóa học do user cung cấp để chatbot tự động trả lời khách hàng, và TỰ ĐỘNG EXTRACT + LƯU LEAD (tên + SĐT + email) vào Upstash Redis/Vercel KV dưới namespace `chat-lead:{phone}` khi user cung cấp đầy đủ thông tin trong chat — dedupe theo SĐT, TTL 90 ngày, fire-and-forget không block stream. Skill tự detect số lượng project Next.js — nếu có nhiều hơn 1 sẽ hỏi user chọn project nào để cài; tự detect TypeScript/JS, App Router/Pages Router, Tailwind/CSS module, KV/Upstash availability (skip auto-save nếu chưa có); tự install react-markdown + remark-gfm; tự append CSS .chatbot-md vào globals.css; tự tạo .env.local với OPENROUTER_API_KEY và hướng dẫn user cách lấy key. USE WHEN user says: 'tạo chatbot trên web', 'thêm chatbot vào website', 'cài chatbot cho landing page', 'add chatbot widget', 'chatbot góc dưới phải', 'floating chatbot Next.js', 'chatbot trả lời khách hàng tự động', 'chatbot FAQ khóa học', 'AI chat widget cho web', 'biz-nextjs-chatbot', 'chatbot dùng OpenRouter', 'tích hợp Gemini vào website', 'tích hợp Sonnet vào website', 'chatbot khóa học tự động', 'support bot tự động cho landing page', 'thêm AI hỗ trợ khách hàng vào trang web', 'embed chatbot vào Next.js project'. Trigger cả khi user vừa launch sales page xong và muốn thêm support bot, hoặc khi user muốn giảm tải support manual."
framework: "Next.js 13+ (App Router) hoặc Pages Router — OpenRouter REST API streaming — Tailwind hoặc CSS module fallback — mobile-first responsive"
models: "google/gemini-3-flash-preview (mặc định, nhanh + rẻ) / anthropic/Codex-sonnet-4.6 (chất lượng cao hơn, đắt hơn)"
---

# Biz Next.js Chatbot OpenRouter — Cài chatbot AI floating vào website 1 phát

Skill này gắn 1 **chatbot AI dạng floating widget** vào project Next.js có sẵn. Widget nằm góc **dưới phải**, responsive đầy đủ 3 màn hình, gọi LLM qua **OpenRouter** với knowledge base từ FAQ + tài liệu khóa học/sản phẩm, **render markdown trong assistant bubble** (bold cho số/giá, bullet list, link clickable, code inline) bằng `react-markdown` + `remark-gfm`, và **tự động extract + lưu lead** (tên + SĐT + email) vào KV (Upstash Redis / Vercel KV) khi user cung cấp đầy đủ thông tin trong chat — admin xem được qua `/admin` dashboard. Mục tiêu: solopreneur / course creator có **support bot tự động 24/7 + lead capture passive** ngay trên landing page bán khóa học, không bỏ sót khách hỏi qua chat.

> **Tinh thần**: Tự detect mọi thứ có thể (Next.js version, App/Pages Router, TS/JS, Tailwind/CSS), chỉ hỏi user 4 thứ thật sự cần: (1) project nào nếu có nhiều, (2) FAQ, (3) tài liệu sản phẩm, (4) tone/brand name. Còn lại là code → live trong vài phút.

## Khi nào dùng

User muốn:
- Gắn chatbot AI hỗ trợ khách hàng vào landing page bán khóa học / dịch vụ
- Giảm tải trả lời câu hỏi lặp lại (giá, lộ trình, hoàn tiền, đối tượng phù hợp...)
- Cần widget chat nhỏ gọn góc dưới phải, không che nội dung
- Cần chatbot hiểu chính xác nội dung khóa học / sản phẩm của họ (FAQ-driven)
- Đã có Next.js project (vừa chạy `/biz-sales-page-layout` xong, hoặc project cũ)

## Khi nào KHÔNG dùng

- Project không phải Next.js (React thuần Vite, Vue, Svelte, plain HTML) → skill này chuyên Next.js. Có thể adapt nhưng không tối ưu.
- Cần chatbot có RAG (retrieval-augmented) với knowledge base hàng ngàn trang → cần vector DB (Pinecone/Supabase pgvector), skill này dùng system prompt đơn giản phù hợp ≤ 20K token kiến thức.
- Cần chatbot voice / multimodal (gửi ảnh) → skill này text-only.
- Cần chatbot lưu lịch sử chat per-user vào DB → skill này stateless, ephemeral session, có thể mở rộng sau.
- Backend không phải Vercel-friendly (cần long polling, WebSocket persistent) → OpenRouter streaming hoạt động OK trên Vercel Edge, nhưng nếu cần WS riêng thì khác.

## Output user sẽ nhận

Sau khi skill chạy xong:

1. **File mới trong project Next.js của user**:
   - `components/Chatbot.tsx` (hoặc `.jsx`) — widget UI (render markdown qua `react-markdown` + `remark-gfm`)
   - `app/api/chat/route.ts` (App Router) **HOẶC** `pages/api/chat.ts` (Pages Router) — API proxy gọi OpenRouter + auto extract lead sau stream
   - `lib/chatbot-knowledge.ts` (hoặc `.js`) — knowledge base + system prompt (có block ĐỊNH DẠNG TRẢ LỜI + block THU THẬP LEAD CHỦ ĐỘNG)
   - `lib/chat-lead.ts` — **CHỈ tạo nếu project có KV/Upstash** — extractor + saver, dedupe theo SĐT, TTL 90 ngày, namespace `chat-lead:{phone}`
   - Markdown styles `.chatbot-md` append vào `app/globals.css` (từ `templates/chatbot-markdown-styles.css`)
   - `.env.local` được tạo/append với `OPENROUTER_API_KEY=` (placeholder)
   - `.env.example` (nếu chưa có) để document biến môi trường
   - Mount `<Chatbot />` vào `app/layout.tsx` hoặc `pages/_app.tsx`

2. **Packages cài thêm** (qua package manager đã detect từ lockfile):
   - `react-markdown` — render markdown an toàn (không cần `dangerouslySetInnerHTML`)
   - `remark-gfm` — GitHub Flavored Markdown (table, autolink, strikethrough)

3. **Hướng dẫn rõ ràng cuối session**:
   - 3 bước user phải tự làm: (a) lấy OpenRouter API key, (b) paste vào `.env.local`, (c) `npm run dev` test
   - Cách đổi model giữa Gemini và Sonnet
   - Cách update knowledge base sau này

## Workflow

### Bước 1 — Detect Next.js project

Tìm các Next.js project candidate. Chạy:

```bash
# Tìm package.json có chứa "next" trong dependencies, độ sâu tối đa 4
find /Users/tonyhoang/Documents/GitHub -maxdepth 4 -name "package.json" -not -path "*/node_modules/*" 2>/dev/null | xargs grep -l '"next"' 2>/dev/null | head -20
```

(Nếu user đang ở trong 1 working directory cụ thể, ưu tiên tìm từ `cwd` xuống trước, fallback ra `~/Documents/GitHub` nếu không thấy.)

**Phân nhánh**:
- **0 project**: Báo user và dừng. Đề xuất: "Anh/chị có project Next.js nào chưa? Nếu chưa, có muốn em tạo 1 cái mới với `/biz-sales-page-layout` rồi quay lại không?"
- **1 project**: Confirm path với user trước khi proceed: "Em sẽ cài chatbot vào [path]. Anh/chị OK chứ?"
- **≥ 2 project**: Liệt kê path + tên (`name` từ package.json) ra list đánh số, hỏi user pick: "Em thấy có N project Next.js. Anh/chị muốn cài vào cái nào?"

### Bước 2 — Probe project context

Sau khi user xác nhận project, đọc:

1. `package.json` → check:
   - TypeScript (có `typescript` trong deps?)
   - Tailwind (có `tailwindcss` trong devDeps?)
   - Package manager (lockfile: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, default `npm`)
   - Next.js version

2. Cấu trúc thư mục → check:
   - `app/` directory tồn tại → App Router
   - `pages/` directory tồn tại (và không có `app/`) → Pages Router
   - Cả 2 cùng tồn tại → ưu tiên App Router cho file mới (Next.js đang chuyển sang)
   - `src/` wrapper → adjust path (vd. `src/app/`, `src/components/`)

3. `tsconfig.json` → check path alias (`@/*` → `./src/*` hay `./*`)

4. `.env.local`, `.env.example` → check đã tồn tại chưa

5. **KV/Upstash availability** (cho auto lead capture):
   - `package.json` có `@upstash/redis` HOẶC `@vercel/kv` → có KV → SCAFFOLD chat-lead.ts + wire vào route
   - Có file `src/lib/kv.ts` (hoặc `lib/kv.ts`) export `kv` → dùng luôn helper sẵn (camp pattern)
   - Không có KV → SKIP scaffold chat-lead.ts, báo user: "Project chưa có KV — auto lead capture không bật. Em có thể chạy `/biz-setup-sepay-payment` để cài KV trước rồi quay lại bật lead capture, hoặc skip."

**Lưu các quan sát này** thành 1 bảng nhỏ để dùng ở các bước sau.

### Bước 3 — Thu thập knowledge base từ user

**Hỏi user 4 câu** (gộp trong 1 message để user trả lời 1 lần, đỡ qua lại):

```
Để chatbot trả lời chính xác, em cần 4 thứ:

1. **FAQ** — danh sách câu hỏi thường gặp + câu trả lời (giá, lộ trình, hoàn tiền, đối tượng, thời gian học, hỗ trợ sau khóa...). 
   Anh/chị paste trực tiếp vào đây, HOẶC chỉ đường dẫn file (.md / .txt / .docx).

2. **Tài liệu sản phẩm / khóa học** — mô tả chi tiết khóa học: tên, nội dung từng module, kết quả đầu ra, giảng viên, bonus, giá tier nếu có nhiều.
   Cũng paste hoặc chỉ đường dẫn file.

3. **Brand name + tone** — Tên brand/khóa học để chatbot xưng hô (vd. "trợ lý của AI Mastery"). Tone bot dùng: thân thiện anh/chị (mặc định) / formal / casual em-bạn.

4. **Model** — mặc định `google/gemini-3-flash-preview` (nhanh, rẻ, đủ tốt cho support). Muốn dùng `anthropic/Codex-sonnet-4.6` (chất lượng cao hơn, đắt hơn ~10x) cho early stage chatlượng đầu vẫn thấp thì nói em.

Anh/chị trả lời 1 lượt được không?
```

**Khi user trả lời**:
- Nếu chỉ đường dẫn file → đọc file đó bằng Read tool.
- Nếu paste nội dung trực tiếp → dùng nội dung paste.
- Nếu user nói "tự generate placeholder dùm em" → tạo FAQ placeholder generic và đánh dấu `// TODO: user fill in` để user biết phải cập nhật.
- Brand name không có → default "Trợ lý AI" và xưng anh/chị.

### Bước 4 — Generate các file vào project

Đọc các template trong `templates/` của skill này và **adapt** vào project. Các template:

- `templates/chatbot-knowledge.ts` — Module export knowledge base + systemPrompt. Inject FAQ, product info, brand name, tone vào đây. **Có sẵn block ĐỊNH DẠNG TRẢ LỜI** (markdown rules) + **block THU THẬP LEAD CHỦ ĐỘNG** (dạy LLM xin tên/SĐT/email khi buyer signal, cảm ơn + confirm khi user cung cấp, KHÔNG nói "đã lưu database").
- `templates/Chatbot.tsx` — Widget component, Tailwind-first. Đã import `react-markdown` + `remark-gfm`, render assistant message bằng `<ReactMarkdown remarkPlugins={[remarkGfm]}>` (chỉ assistant — user message vẫn plain `whitespace-pre-wrap`). Nếu project KHÔNG có Tailwind → fallback `templates/Chatbot-noTailwind.tsx` + `templates/chatbot.module.css`.
- `templates/chat-route-app.ts` — API route cho App Router (`app/api/chat/route.ts`). **Có sẵn hook `persistLeadIfReady`** chạy fire-and-forget sau khi stream close — không block response.
- `templates/chat-route-pages.ts` — API route cho Pages Router (`pages/api/chat.ts`).
- `templates/chat-lead.ts` — **CHỈ scaffold nếu project có KV/Upstash** — regex extract VN phone + email + name heuristic (intro patterns "tên X" / "tôi là X" / "tên: X"), `saveChatLead` dedupe theo SĐT, TTL 90 ngày, key namespace `chat-lead:{phone}`.
- `templates/chatbot-markdown-styles.css` — Snippet CSS cho class `.chatbot-md`. **PHẢI append vào cuối `app/globals.css`** (hoặc `src/app/globals.css` / `styles/globals.css`). Đổi accent color (`#fde68a` / `#f59e0b`) theo brand palette của project trước khi append.
- `templates/env-instructions.md` — Snippet hướng dẫn lấy OpenRouter key, dùng ở bước cuối.

**Quy tắc khi adapt template**:
1. **TS vs JS**: nếu project chỉ có JS, đổi extension `.ts/.tsx` → `.js/.jsx` và **bỏ type annotations** (không chỉ đổi tên file). Đọc file mẫu, parse, bỏ types, ghi ra.
2. **Path alias**: nếu `tsconfig` map `@/*` → `./src/*`, các import trong template phải dùng `@/lib/chatbot-knowledge` và file đặt vào `src/lib/`. Nếu không có alias, dùng relative path.
3. **Model**: replace placeholder `__MODEL_ID__` bằng model user chọn (`google/gemini-3-flash-preview` hoặc `anthropic/Codex-sonnet-4.6`).
4. **Brand**: replace `__BRAND_NAME__`, `__BRAND_TONE__`.
5. **Knowledge**: build `systemPrompt` từ FAQ + product info dạng cấu trúc rõ ràng (xem template). **Giữ nguyên block ĐỊNH DẠNG TRẢ LỜI** trong systemPrompt — đây là cái dạy LLM xuất markdown phù hợp với bubble chat nhỏ (bold thay vì heading, bullet ngắn 1 dòng).
6. **Install packages markdown rendering** (BẮT BUỘC — nếu skip thì chatbot hiện raw `**bold**` thay vì in đậm trong bubble):
   ```bash
   # detect lockfile → chọn đúng package manager
   npm install react-markdown remark-gfm
   # hoặc: pnpm add react-markdown remark-gfm
   # hoặc: yarn add react-markdown remark-gfm
   ```
7. **Append markdown styles**: đọc `templates/chatbot-markdown-styles.css`, swap accent color theo brand palette của project (check `globals.css` tìm `--color-primary` hoặc tương đương), rồi append vào cuối `app/globals.css` (hoặc `src/app/globals.css` / `styles/globals.css`).
8. **Mount widget**: 
   - App Router: edit `app/layout.tsx` (hoặc `src/app/layout.tsx`), thêm `import Chatbot from '@/components/Chatbot'` và `<Chatbot />` ngay trước `</body>`. **Đọc layout.tsx hiện tại trước khi edit** để giữ nguyên metadata, fonts, providers.
   - Pages Router: edit `pages/_app.tsx`, wrap return: `<><Component {...pageProps} /><Chatbot /></>`. Đọc `_app` trước, giữ nguyên existing providers.

9. **Auto lead capture wire-up** (chỉ làm nếu đã detect KV ở Bước 2):
   - Copy `templates/chat-lead.ts` vào `lib/chat-lead.ts` (hoặc `src/lib/chat-lead.ts`).
   - Nếu project CHƯA có `lib/kv.ts` → tạo: `import { Redis } from "@upstash/redis"; export const kv = Redis.fromEnv();`
   - Route handler import: `import { extractLeadFromMessages, saveChatLead } from "@/lib/chat-lead"`.
   - Trong stream loop: track `assistantText` (accumulate delta), khi stream close → gọi `persistLeadIfReady(history, assistantText)` (fire-and-forget, KHÔNG await trong response path).
   - System prompt: đảm bảo block THU THẬP LEAD CHỦ ĐỘNG đã có trong `chatbot-knowledge.ts` (template đã có sẵn).
   - **Confirm với user**: "Em đã bật auto lead capture — khi khách paste tên/SĐT/email vào chat, hệ thống tự lưu KV namespace `chat-lead:{SĐT}`. Anh/chị xem leads qua `/admin` (nếu đã cài `/biz-admin-leads-dashboard`)."

### Bước 5 — Setup .env.local + .gitignore

1. Check `.env.local` đã tồn tại?
   - **Chưa**: tạo mới với:
     ```
     # OpenRouter API key — Lấy ở https://openrouter.ai/keys
     OPENROUTER_API_KEY=
     
     # Optional: site URL để OpenRouter tracking referrer (giúp rate limit tốt hơn)
     NEXT_PUBLIC_SITE_URL=http://localhost:3000
     ```
   - **Đã có**: append 2 biến trên nếu chưa có, không ghi đè biến cũ.

2. Update `.env.example` (tạo mới nếu chưa có):
   ```
   OPENROUTER_API_KEY=sk-or-v1-xxxxx
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

3. Check `.gitignore` đã có `.env.local`? Nếu chưa → append `.env.local` và `.env*.local`.

### Bước 6 — Báo cáo cho user

In ra **1 message tóm tắt rõ ràng** với 4 phần:

```
✅ Chatbot đã cài xong vào [project name]

📁 Files đã tạo:
  - components/Chatbot.tsx (render markdown qua react-markdown + remark-gfm)
  - app/api/chat/route.ts
  - lib/chatbot-knowledge.ts
  - app/globals.css (append markdown styles .chatbot-md)
  - .env.local (placeholder)

📦 Packages đã cài: react-markdown, remark-gfm

🔑 3 bước anh/chị cần tự làm để chatbot chạy:

1. Lấy OpenRouter API key:
   - Vào https://openrouter.ai → Sign up (có thể login bằng Google)
   - Vào https://openrouter.ai/keys → Create Key
   - Nạp credit (https://openrouter.ai/credits) — Gemini 3 Flash rẻ, $5 đủ chạy hàng nghìn câu chat
   - Copy key dạng `sk-or-v1-xxxxx`

2. Paste vào file `.env.local`:
   OPENROUTER_API_KEY=sk-or-v1-xxxxx-paste-vào-đây

3. Chạy thử:
   [npm/pnpm/yarn] run dev
   Mở http://localhost:3000 → click bong bóng góc dưới phải

🔄 Đổi model giữa Gemini ↔ Sonnet:
  Mở `app/api/chat/route.ts`, sửa biến `model:` ở đầu file.
  - `google/gemini-3-flash-preview` (mặc định, $0.075/1M input, nhanh)
  - `anthropic/Codex-sonnet-4.6` (cao cấp, ~$3/1M input, chất lượng tốt hơn)

📚 Update knowledge base sau này:
  Edit `lib/chatbot-knowledge.ts` — thêm/sửa FAQ và productInfo, save, hot reload.
```

## Mobile-first responsive design

Widget **phải** đạt 3 breakpoint:

| Breakpoint | Hành vi |
|---|---|
| ≤ 640px (mobile) | Click bubble → mở **fullscreen overlay** (z-index 9999), header có nút X close. Input docked bottom với safe-area-inset để không bị che bởi keyboard. |
| 641–1023px (tablet) | Panel 380px × 70vh, anchored bottom-right margin 16px. |
| ≥ 1024px (desktop) | Panel 400px × 600px, anchored bottom-right margin 24px. Bubble 60px tròn. |

**Lý do mobile fullscreen**: VN traffic 70%+ là mobile, panel 380px trên màn 360px sẽ overflow + bàn phím che gần hết. Fullscreen là UX chuẩn (Intercom, Tidio, Crisp đều làm vậy).

Template `Chatbot.tsx` đã có sẵn các Tailwind class implement chuẩn này. Khi adapt, **giữ nguyên responsive logic**, chỉ thay đổi màu/text theo brand.

## OpenRouter API — Quick reference

OpenRouter endpoint: `https://openrouter.ai/api/v1/chat/completions`

Headers bắt buộc:
- `Authorization: Bearer <OPENROUTER_API_KEY>`
- `Content-Type: application/json`

Headers khuyến nghị (giúp rate limit + analytics):
- `HTTP-Referer: <site URL>` 
- `X-Title: <app name>` (vd. "AI Mastery Chatbot")

Body:
```json
{
  "model": "google/gemini-3-flash-preview",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "stream": true
}
```

Streaming response: SSE format (`data: {...}\n\n`). Template `chat-route-app.ts` đã handle pass-through stream từ OpenRouter về client, frontend parse SSE bằng `ReadableStream` reader. **Không cần SDK** — `fetch` thuần đủ.

Chi tiết thêm: xem `references/openrouter-api.md`.

## Edge cases cần xử lý

1. **Project có `src/` wrapper**: tất cả path phải tiền tố `src/` (vd. `src/components/Chatbot.tsx`, `src/app/layout.tsx`). Detect bằng cách check `src/app` hoặc `src/pages` tồn tại.

2. **Project đã có file trùng tên** (vd. `components/Chatbot.tsx` đã có): hỏi user — overwrite hay đổi tên (vd. `AIChatbot.tsx`). Mặc định đổi tên để không destroy work cũ.

3. **Tailwind chưa cài**: 
   - Hỏi user: cài Tailwind không (recommended), hay dùng CSS module fallback?
   - Nếu chọn Tailwind: chạy `npx tailwindcss init -p` và setup, hoặc nếu phức tạp thì dùng fallback và note lại cho user.
   - Mặc định fallback CSS module — an toàn hơn, không invasive với project.

4. **Project dùng React 19 / Server Components strict**: `Chatbot.tsx` phải có `'use client'` directive ở dòng đầu. Template đã có.

5. **Conflict với existing `/api/chat` route**: kiểm tra trước khi tạo. Nếu trùng → đổi tên route thành `/api/chatbot` hoặc tương tự, update fetch URL trong widget.

6. **Knowledge base quá dài (>15K token)**: chia thành 2 phần — `coreKnowledge` (system prompt, luôn load) và `extendedKnowledge` (optional, kèm khi user hỏi về chi tiết cụ thể). Tạm thời implement đơn giản: cảnh báo user nếu >15K chars, gợi ý cắt gọn FAQ.

7. **User trả lời thiếu** (vd. có FAQ nhưng không có product info): vẫn proceed với phần có, để placeholder `// TODO: user add product details here` ở chỗ thiếu.

8. **Project không có KV/Upstash**: SKIP scaffold `chat-lead.ts`. Vẫn cài chatbot full markdown + knowledge base — chỉ thiếu auto-save lead. Báo user 1 dòng: "Auto lead capture skip vì chưa có KV. Cài KV trước qua `/biz-setup-sepay-payment` (hoặc tự cài `@upstash/redis` + Vercel KV) rồi báo em bật sau."

9. **Project đã có `/api/register` hoặc lead store khác** (vd. biz pipeline đã chạy `/biz-setup-sepay-payment`): dùng namespace KHÁC (`chat-lead:{phone}`) để không xung đột với `lead:DH...` của form đăng ký. Admin dashboard `/admin` có thể được mở rộng để show cả 2 type sau.

10. **Admin dashboard tích hợp**: Nếu project đã cài `/biz-admin-leads-dashboard`, cần update query để include `chat-lead:*` keys song song với `lead:*`. Skill này KHÔNG tự update dashboard — báo user để chạy lại `/biz-admin-leads-dashboard` với extension cho chat-lead namespace.

## Cấu trúc system prompt (built từ knowledge base)

Template `chatbot-knowledge.ts` build systemPrompt theo cấu trúc:

```
Bạn là trợ lý AI của [BRAND_NAME].

NHIỆM VỤ:
- Trả lời câu hỏi của khách hàng về sản phẩm/khóa học của [BRAND_NAME]
- Hỗ trợ khách hàng quyết định mua / đăng ký
- KHÔNG bịa thông tin. Nếu không chắc, nói "Em sẽ kiểm tra và phản hồi anh/chị qua email/SĐT".
- KHÔNG trả lời câu hỏi off-topic (chính trị, ý kiến cá nhân, code task...). Lịch sự đổi chủ đề về sản phẩm.

GIỌNG ĐIỆU:
- Xưng [em] - gọi khách [anh/chị] (hoặc theo tone user chỉ định)
- Thân thiện, ngắn gọn, action-oriented
- Mỗi câu trả lời ≤ 4 câu trừ khi cần list chi tiết

ĐỊNH DẠNG TRẢ LỜI (Markdown — chatbot UI có render markdown):
- Dùng **bold** cho số liệu / từ khóa quan trọng (vd. **499.000đ**, **Tier Premium**).
- Dùng bullet list `-` khi liệt kê 2+ items.
- Dùng numbered list `1. 2. 3.` khi nói các bước.
- KHÔNG dùng heading lớn (# / ##) — bubble chat nhỏ, heading vỡ layout.
- KHÔNG dùng table trừ khi so sánh 3+ items.

THÔNG TIN SẢN PHẨM:
[productInfo từ user]

FAQ:
[Q-A pairs từ user]

NẾU KHÁCH MUỐN ĐĂNG KÝ / MUA:
- Hướng dẫn họ scroll lên form đăng ký trên trang (tên/SĐT/email)
- Hoặc cung cấp link đăng ký nếu có
```

**Quan trọng**: block ĐỊNH DẠNG TRẢ LỜI là cái dạy LLM xuất markdown đúng phong cách bubble chat. Phải có 2 chiều cùng lúc:
- **Server-side** (system prompt): yêu cầu LLM dùng `**bold**` / `-` bullet / `1.` numbered, KHÔNG dùng heading.
- **Client-side** (Chatbot.tsx): render markdown bằng `react-markdown` + class `.chatbot-md` styled trong `globals.css`.

Thiếu 1 trong 2 → chatbot hiện raw `**bold**` dạng text (nếu thiếu client render) hoặc LLM trả về flat text không format (nếu thiếu system prompt guidance).

Tone block thay đổi theo user input. FAQ format dạng:

```
Q: [câu hỏi]
A: [câu trả lời]
```

## Anti-patterns — tránh các sai lầm này

- **Không** hardcode API key vào code (luôn dùng `process.env.OPENROUTER_API_KEY`)
- **Không** expose key ra client (`NEXT_PUBLIC_*`) — API route chạy server-side proxy
- **Không** dùng `dangerouslySetInnerHTML` để render message — XSS risk. Dùng `react-markdown` (đã có trong template) — nó sanitize HTML mặc định, an toàn.
- **Không** quên install `react-markdown` + `remark-gfm`. Quên 1 trong 2 → chatbot crash hoặc hiện raw `**bold**` dạng text thay vì in đậm.
- **Không** quên append `.chatbot-md` CSS vào `globals.css`. Quên thì markdown render OK nhưng không có style (no bold color, no list indent...).
- **Không** apply class `.chatbot-md` lên user bubble — markdown của user là text họ gõ (vd. họ hỏi "giá **bao nhiêu**?"), không nên parse thành bold. Chỉ assistant bubble mới render markdown.
- **Không** await `persistLeadIfReady` trong response path — phải fire-and-forget (`void (async () => {...})()`). Await sẽ delay UI close stream → user thấy "đang trả lời" thêm vài giây.
- **Không** để LLM nói "tôi đã lưu thông tin của bạn vào hệ thống" — creepy + lộ cơ chế. System prompt phải dạy: "em đã ghi nhận, team sẽ liên hệ trong 24h".
- **Không** dùng cùng namespace `lead:` với form đăng ký — chat lead dùng `chat-lead:{phone}` để dedupe riêng + không ghi đè order data.
- **Không** lưu lead khi chỉ có 1-2 trường trong 3 (tên + SĐT + email). Extractor trả `null` → save skip. Đợi user trả đủ rồi mới lưu.
- **Không** rate limit ở client (dễ bypass) — nếu cần, thêm `Upstash Ratelimit` ở API route. Skill này skip rate limit để tối giản; lưu ý cho user.
- **Không** mount widget vào `head` hoặc trước hydration — phải client component, mount trong body.
- **Không** dùng `position: fixed` mà thiếu `safe-area-inset-bottom` trên mobile (iPhone notch).
- **Không** dùng z-index < 50 cho widget — sẽ bị các modal khác che. Mặc định z-9999.

## Khi user yêu cầu mở rộng sau này

Sau khi skill chạy xong, user có thể yêu cầu:
- **"Thêm streaming text typing effect"** → đã có sẵn trong template, chỉ cần verify
- **"Lưu lịch sử chat vào localStorage"** → thêm `useEffect` save/load `messages` từ `localStorage`
- **"Thêm rate limit"** → cài `@upstash/ratelimit` + `@upstash/redis`, wrap API route
- **"Đổi sang model khác"** (vd. `meta-llama/llama-3.3-70b-instruct`) → chỉ sửa biến `model:` trong API route
- **"Thêm RAG với knowledge dài hơn"** → setup Supabase pgvector hoặc Pinecone, embed FAQ, query top-k khi user hỏi
- **"Đa ngôn ngữ"** → detect user language, swap system prompt theo locale

Các yêu cầu này nằm ngoài scope skill base, nhưng skill đã đặt foundation tốt để mở rộng — code clean, knowledge tách module, API route stateless.
