---
name: biz-telegram-payment-notify
description: "Setup Telegram bot notification cho thanh toán thành công từ Sepay webhook trong Next.js project. Skill này: (1) hướng dẫn user 3 bước tạo Telegram bot riêng qua @BotFather + lấy bot token + chat_id (qua @userinfobot cho chat 1-1, hoặc /getUpdates API cho group), (2) tạo helper function `sendTelegramNotification()` reusable trong `lib/telegram.ts`, (3) detect existing Sepay webhook route trong project (thường là `/api/sepay-webhook`, `/api/payment-success`, hoặc tương đương) và wire Telegram call CÙNG CHỖ với email auto-responder (Resend) — gửi parallel qua `Promise.allSettled` để Telegram fail KHÔNG block 200 response trả Sepay (Sepay sẽ retry webhook nếu nhận non-200, gây duplicate notification), (4) draft message format mặc định tiếng Việt: emoji + tên khách + SĐT + email + amount (charm pricing VND định dạng `499.000đ`) + tên sản phẩm + timestamp giờ VN dd/mm/yyyy HH:mm, (5) update `.env.local` với `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`, add vào `.gitignore`, nhắc user paste vào Vercel dashboard env vars trước khi deploy production, (6) test plan 3 cấp: curl test bot direct (sanity check token + chat_id) → simulated Sepay payload via curl localhost → production webhook verify qua Sepay dashboard. Output: code patch + bot setup guide tiếng Việt + env vars list + 3-step test instructions. Tiếng Việt thuần (xưng anh/chị), không emoji-spam, message format gọn dễ đọc trên mobile Telegram. USE WHEN user says: 'gửi telegram khi có đơn hàng', 'thông báo telegram khi khách thanh toán', 'telegram bot notify payment', 'sepay webhook telegram', 'add telegram alert vào landing page', 'biz-telegram-payment-notify', 'wire telegram bot vào webhook', 'thông báo realtime khi có khách mua', 'telegram alert đơn hàng mới', 'tích hợp telegram bot Next.js', 'báo telegram khi sepay nhận tiền', 'notify khi thanh toán thành công', 'thông báo qua telegram cho team sale', 'tạo telegram bot báo đơn', 'telegram thay vì email cho owner alert', 'bot telegram khi có giao dịch sepay'. Trigger NGAY CẢ KHI: (a) user vừa setup Sepay webhook xong và muốn được notify realtime, (b) user đã có `/api/payment-success` xử lý email Resend rồi và muốn bổ sung Telegram parallel, (c) user nói 'báo cho tôi khi có đơn' mà context là landing page/sales page. KHÔNG dùng skill này khi: (a) user muốn Slack/Discord notification thay vì Telegram (use case khác — skill khác), (b) user muốn email-only owner alert (đã có `biz-email-setup`), (c) user chưa có Sepay webhook setup từ đầu (skill này wire VÀO webhook có sẵn, không tự setup Sepay account hay đăng ký bank account), (d) user muốn Zalo OA bot thay vì Telegram (Zalo OA cần OA verified business account, use case rất khác)."
---

# Biz Telegram Payment Notify — Realtime alert khi Sepay nhận tiền

Skill này wire **Telegram bot notification** vào Sepay webhook đã có sẵn trong project Next.js. Mỗi khi khách chuyển khoản thành công vào tài khoản ngân hàng đã link với Sepay, skill làm Telegram bot đẩy 1 tin nhắn realtime vào chat của owner (hoặc group team sale) — kèm tên khách, SĐT, amount, sản phẩm, thời gian.

> **Triết lý**: Email auto-responder cho khách (Resend) và Telegram alert cho owner phục vụ 2 actor khác nhau. Email là trang trọng cho khách. Telegram là "ping" cho owner — anh/chị đang đi ngoài đường, mở Telegram là thấy ngay đơn mới, không phải mở Gmail tìm trong 100 email khác. Latency Telegram < 2 giây vs email 30-60 giây.
>
> **Tại sao Telegram chứ không phải Slack/Discord/Zalo**: Telegram bot setup 5 phút (1 token + 1 chat_id), không cần workspace/server admin, free unlimited message, push notification mạnh hơn email, app native iOS/Android/desktop. Slack cần workspace + invite. Discord cần server + permission setup. Zalo OA cần verified business account (3-7 ngày approve) + monthly active user fee. Telegram là path of least resistance cho owner-side alert.

Output skill: code patch + bot setup guide step-by-step + env vars list + 3-cấp test plan. Skill **KHÔNG tự test gửi Telegram** — yêu cầu user paste bot token + chat_id trước, vì credentials này thuộc tài sản user.

---

## Khi nào dùng skill này

- User vừa wire Sepay webhook xong và muốn được notify realtime trên Telegram khi có khách chuyển tiền.
- User đã có `/api/payment-success` (hoặc tương đương) xử lý email Resend rồi và muốn bổ sung Telegram alert PARALLEL — không tách route mới, không duplicate logic.
- User nói "báo cho tôi khi có đơn" và context là landing page bán hàng có Sepay integration.

**KHÔNG dùng skill này khi:**
- User muốn Slack/Discord notification → use case khác.
- User muốn Zalo OA bot → cần OA verified business + cost cấu trúc khác.
- User chưa setup Sepay webhook (chưa có bank account link Sepay, chưa có endpoint nhận webhook) → skill này không setup Sepay từ đầu, chỉ wire vào webhook có sẵn.
- User muốn email-only cho owner → `biz-email-setup` đã có Email B (owner notification).

---

## Workflow tổng quan (6 phase)

```
Phase 0: DETECT existing Sepay webhook route (path + framework + handler shape)
       ↓
Phase 0.5: DETECT lead store (lib/leads-kv.ts từ /biz-setup-sepay-payment)
           → có: dùng KV lookup thực
           → không: offer 2 option (raw mode HOẶC chạy /biz-setup-sepay-payment trước)
       ↓
Phase 1: GUIDE user create Telegram bot (BotFather → token → chat_id)
       ↓ [GATE — đợi user paste token + chat_id]
       ↓
Phase 2: DRAFT message format → show user preview → confirm
       ↓
Phase 3: WIRE code (lib/telegram.ts helper + integrate vào webhook handler + env vars)
       ↓
Phase 4: TEST plan (curl bot direct → simulated Sepay payload → production verify)
```

Phase 1 và Phase 4 có **gate đợi user** vì cần user thao tác manual (lấy token, verify production). Phase 0/0.5/2/3 skill chủ động.

---

## Phase 0 — Detect existing Sepay webhook

Skill này wire vào webhook có sẵn, KHÔNG tạo route mới. Đầu tiên locate handler.

**Tìm webhook route** — grep theo các keyword phổ biến:

```bash
# Trong project root
grep -r "sepay" --include="*.ts" --include="*.js" --include="*.tsx" -l
grep -r "transferAmount\|transferType\|payment-success\|payment-webhook" --include="*.ts" --include="*.js" -l
```

**3 kịch bản phổ biến**:

| Kịch bản | Path đã có | Hành động |
|---|---|---|
| User dùng pipeline `biz-email-setup` | `app/api/payment-success/route.ts` (hoặc `pages/api/payment-success.ts`) đã có Resend gọi `sendCustomerEmail` + `sendOwnerEmail` | Wire `sendTelegramNotification` vào cùng `Promise.allSettled` |
| User có route Sepay-specific | `app/api/sepay-webhook/route.ts` hoặc `app/api/webhook/sepay/route.ts` | Wire vào sau khi parse + validate Sepay payload (nhánh `transferType === 'in'`) |
| Không tìm thấy route nào | — | DỪNG. Báo user: *"Em chưa tìm thấy webhook route nhận Sepay. Anh/chị setup Sepay webhook trước (link bank vào Sepay → tạo webhook URL trỏ về domain) rồi quay lại em wire Telegram. Hoặc nếu webhook ở endpoint tên khác, anh/chị chỉ giúp em path."* |

**Đọc handler hiện tại** để hiểu shape:
- Có authenticate Sepay request không? (Authorization header `Apikey` hoặc HMAC)
- Có dedup theo `id` hoặc `referenceCode` không? (Sepay retry nếu non-200 → cần dedup tránh double notify)
- Có lookup lead theo `content` (transfer message chứa order ID) không?
- Format response trả Sepay: `{ success: true }` hay `200 OK` plain?

Nếu handler hiện tại **chưa dedup** — cảnh báo user nhưng KHÔNG block. Skill chỉ wire Telegram, dedup là concern của payment logic. Suggest user thêm dedup riêng nếu cần.

---

## Phase 0.5 — Detect lead store (CRITICAL)

Sepay webhook chỉ gửi `content` (text khách dán khi chuyển khoản) + `transferAmount` + `referenceCode`. **Sepay KHÔNG biết khách là ai** — phải lookup local store theo `content` (chứa order ID).

Skill check 3 thứ:

```bash
# 1. Check lead store helper exists
test -f lib/leads-kv.ts || test -f lib/leads-kv.js && echo "lead store: ✓"

# 2. Check Vercel KV env vars
grep -E "KV_REST_API_URL|KV_REST_API_TOKEN" .env.local && echo "KV env: ✓"

# 3. Check @vercel/kv installed
grep '"@vercel/kv"' package.json && echo "KV package: ✓"
```

**3 kịch bản**:

| Kịch bản | Hành động |
|---|---|
| Cả 3 ✓ — lead store sẵn sàng | Đi tiếp Phase 1, dùng `getLeadByOrderId()` từ `lib/leads-kv.ts` trong webhook handler |
| Thiếu 1+ — chưa setup | DỪNG, hỏi user 2 option (xem dưới) |

**Nếu thiếu**, hỏi user:

> Em phát hiện anh/chị chưa có lead store (Vercel KV). Sepay webhook không biết khách là ai — chỉ có nội dung CK + amount. Anh/chị muốn:
>
> **Option 1 — Setup lead store đầy đủ qua `/biz-setup-sepay-payment` trước** (recommended):
>    - Skill đó sẽ setup Vercel KV + scaffold lib/leads-kv.ts + wire form submit để lưu lead khi user đăng ký
>    - Sau đó quay lại đây em wire Telegram lookup tên/SĐT/email khách đầy đủ
>    - Telegram alert sẽ hiện: "Nguyễn Văn A — 0901234567 — a@gmail.com — 499K — Khoá AI Agent"
>
> **Option 2 — Raw mode**: gửi Telegram thẳng payload Sepay, không lookup lead:
>    - Telegram chỉ hiện: "Vietcombank — 499.000đ — content: DH001 0901234567 — 14:32"
>    - Owner tự đoán khách qua content + cross-check Resend email log
>    - Đơn giản, chạy được ngay, nhưng kém UX
>
> Anh/chị chọn 1 hay 2?

**Nếu user chọn 1** → DỪNG skill này, suggest `/biz-setup-sepay-payment`. Sau khi user xong setup → quay lại skill này.

**Nếu user chọn 2** → đi tiếp Phase 1, dùng raw template (xem `templates/lib-telegram-raw.ts`).

---

## Phase 1 — Guide user create Telegram bot

Đọc `references/telegram-bot-setup.md` cho hướng dẫn chi tiết với screenshot text. Tóm tắt 3 bước cho user:

### Bước 1 — Tạo bot mới qua @BotFather

```
1. Mở Telegram (mobile/desktop)
2. Search: @BotFather → bấm Start
3. Gõ lệnh: /newbot
4. BotFather hỏi tên bot — nhập tên hiển thị (ví dụ: "Đơn Hàng Brand X")
5. BotFather hỏi username — nhập username kết thúc bằng "_bot" (ví dụ: brandx_orders_bot) — phải unique global
6. BotFather trả về message kèm dòng:
   "Use this token to access the HTTP API: 1234567890:AAxxxxxxxxxxxxxxxxxxxxxx"
7. Copy token đó, paste cho em.
```

**LƯU Ý BẢO MẬT**: Token này = quyền điều khiển bot. Đừng commit lên Git, đừng share public. Nếu lỡ leak → quay lại @BotFather → /token → /revoke để tạo token mới.

### Bước 2 — Lấy chat_id

**Chat 1-1 (chỉ owner nhận)** — recommended cho solopreneur:

```
1. Trong Telegram, search: @userinfobot → bấm Start
2. Bot trả về message kèm "Id: 123456789" — copy số đó.
3. Đó là chat_id của anh/chị.
```

**Group chat (team sale cùng nhận)** — recommended cho team:

```
1. Tạo group Telegram mới (hoặc dùng group có sẵn)
2. Bấm tên group → Add member → search bot vừa tạo (theo username @brandx_orders_bot) → Add
3. Trong group, gõ: /start@brandx_orders_bot (hoặc bất kỳ tin nhắn nào)
4. Mở browser, truy cập:
   https://api.telegram.org/bot<TOKEN>/getUpdates
   (thay <TOKEN> bằng token bước 1)
5. Trong JSON response, tìm "chat":{"id":-1001234567890,...} — copy số đó (nhớ giữ dấu trừ nếu có)
6. Đó là chat_id của group.
```

**Channel** (broadcast 1 chiều, không thảo luận) — chat_id bắt đầu bằng `-100`. Cách lấy giống group nhưng add bot làm admin của channel.

### Bước 3 — Paste cho skill

Đợi user paste:
```
TELEGRAM_BOT_TOKEN=1234567890:AAxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=123456789
```

**GATE QUAN TRỌNG**: KHÔNG đi tiếp Phase 2 cho đến khi user paste cả 2 giá trị. Nếu user nói "em đã có rồi, ở chỗ khác" → vẫn đợi paste, vì cần inject vào `.env.local` trong Phase 3.

---

## Phase 2 — Draft message format

Default format tiếng Việt, mobile-friendly (Telegram render HTML):

```html
🎉 <b>ĐƠN HÀNG MỚI</b>

👤 <b>{{name}}</b>
📞 {{phone}}
📧 {{email}}
💰 <b>{{amount}}</b> — {{product_name}}
🕐 {{time_vn}}

🔗 Mã GD: <code>{{reference_code}}</code>
```

Sau khi inject biến:

```
🎉 ĐƠN HÀNG MỚI

👤 Nguyễn Văn A
📞 0901 234 567
📧 a@gmail.com
💰 499.000đ — Khoá học AI Agent
🕐 14:32 14/05/2026

🔗 Mã GD: FT26134567890
```

**Show preview cho user**, hỏi:
1. Format này OK không? Có muốn thêm/bớt field gì? (ví dụ: thêm UTM source, lượt đơn trong ngày, link Zalo khách)
2. Emoji có quá nhiều không? (1 số user prefer plain text)
3. Có muốn thêm 1 nút inline (CTA) link đến CRM/Sheets không? (advanced — skill có thể add inline keyboard)

**Quy tắc format**:
- HTML mode (`parse_mode: "HTML"`) — Telegram support `<b>`, `<i>`, `<u>`, `<code>`, `<pre>`, `<a href>`. KHÔNG support `<br>` — dùng `\n`.
- Amount format VN: `499.000đ` (dấu chấm phân nghìn, kèm `đ` cuối) HOẶC charm `499K` / `1.99M` cho đẹp. Đọc từ `offer.json` `voice` setting nếu có.
- Phone format: `0901 234 567` (cách 3-3-3) — easier scan trên mobile.
- Time VN: `HH:mm dd/mm/yyyy` — đặt giờ Việt Nam (UTC+7), không UTC.
- Tránh emoji spam (>5 emoji/message → giảm professional feel).

---

## Phase 3 — Wire code

3 thay đổi:

### 3.1 Tạo helper function `lib/telegram.ts`

Đọc `templates/lib-telegram.ts` (TypeScript) hoặc `templates/lib-telegram.js` (vanilla JS). Nội dung:

```typescript
// lib/telegram.ts
type TelegramPayload = {
  name: string;
  phone: string;
  email: string;
  amount: number; // VND, raw number (vd: 499000)
  productName: string;
  referenceCode?: string;
};

export async function sendTelegramNotification(payload: TelegramPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('[telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    return; // Không throw — Telegram fail không được block payment response
  }

  const text = formatMessage(payload);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[telegram] Send failed: ${res.status} ${errBody}`);
    }
  } catch (err) {
    console.error('[telegram] Network error:', err);
    // Swallow — đừng để Telegram fail làm Sepay retry
  }
}

function formatMessage(p: TelegramPayload): string {
  const amountStr = p.amount.toLocaleString('vi-VN') + 'đ';
  const phoneStr = p.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  const now = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return [
    '🎉 <b>ĐƠN HÀNG MỚI</b>',
    '',
    `👤 <b>${escapeHtml(p.name)}</b>`,
    `📞 ${phoneStr}`,
    `📧 ${escapeHtml(p.email)}`,
    `💰 <b>${amountStr}</b> — ${escapeHtml(p.productName)}`,
    `🕐 ${now}`,
    p.referenceCode ? `\n🔗 Mã GD: <code>${escapeHtml(p.referenceCode)}</code>` : '',
  ].filter(Boolean).join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));
}
```

**Vì sao swallow error**: Sepay retry webhook nếu nhận non-200. Nếu Telegram timeout/down làm webhook crash → Sepay retry → mỗi retry gửi lại email + log lại payment → user nhận 5 email + 5 Telegram alert cho 1 đơn. Telegram là **best-effort side-channel**, không phải critical path.

### 3.2 Wire vào Sepay webhook handler

Đọc handler hiện tại, locate chỗ xử lý payment success (sau khi parse Sepay payload + validate `transferType === 'in'`). Thêm:

```typescript
// app/api/payment-success/route.ts (hoặc tương đương)
import { sendTelegramNotification } from '@/lib/telegram';
import { sendCustomerEmail, sendOwnerEmail } from '@/lib/resend'; // nếu đã có

export async function POST(req: Request) {
  const payload = await req.json();

  // [Existing] Validate Sepay auth + parse payload
  if (payload.transferType !== 'in') {
    return Response.json({ success: true }); // ignore outgoing transfer
  }

  // [Existing] Lookup lead theo content (chứa order ID) hoặc referenceCode
  const lead = await lookupLeadByTransferContent(payload.content);

  // [NEW] Fan-out 3 side effects parallel — Telegram fail không block email
  await Promise.allSettled([
    sendCustomerEmail(lead),
    sendOwnerEmail(lead),
    sendTelegramNotification({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      amount: payload.transferAmount,
      productName: lead.productName,
      referenceCode: payload.referenceCode,
    }),
  ]);

  return Response.json({ success: true });
}
```

**Lý do dùng `Promise.allSettled`** thay vì `Promise.all`:
- `Promise.all` reject nếu BẤT KỲ promise nào fail → handler throw → Sepay nhận 500 → retry → duplicate email.
- `Promise.allSettled` đợi tất cả settle (resolve hoặc reject), không throw. Email/Telegram fail vẫn return 200 cho Sepay.

Nếu user CHƯA có Resend integration (chỉ có Telegram), code đơn giản hơn:
```typescript
await sendTelegramNotification({ ... }); // helper đã swallow internally
return Response.json({ success: true });
```

### 3.3 Env vars

Update `.env.local`:
```env
# Telegram bot for payment alerts (lib/telegram.ts)
TELEGRAM_BOT_TOKEN=1234567890:AAxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=123456789
```

Check `.gitignore` có `.env.local` chưa, nếu chưa add ngay (CRITICAL — token trên Git = leak).

**Reminder cho user về Vercel production**:
> Em đã add vào `.env.local` (chỉ chạy local). Trước khi deploy production, anh/chị vào Vercel dashboard → Project → Settings → Environment Variables → add `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` → chọn Production environment → Save. Sau đó redeploy (`vercel --prod` hoặc qua Git push).

---

## Phase 4 — Test plan

3 cấp test, đi từ nhẹ đến nặng. **Skill KHÔNG tự chạy test 1 và 3** (cần user paste token thật + verify trên Sepay dashboard) — chỉ chạy test 2 nếu user request.

### Test 1 — Bot sanity check (curl trực tiếp Telegram API)

User chạy 1 lệnh để confirm bot token + chat_id đúng:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"'$TELEGRAM_CHAT_ID'","text":"Test from skill ✓","parse_mode":"HTML"}'

# Expect:
# - Response: {"ok":true,"result":{...}}
# - Telegram chat: tin nhắn "Test from skill ✓" xuất hiện trong < 2s
```

**Nếu fail**:
- `{"ok":false,"description":"Unauthorized"}` → token sai (typo hoặc đã revoke).
- `{"ok":false,"description":"Bad Request: chat not found"}` → chat_id sai HOẶC bot chưa được add vào group/channel.
- `{"ok":false,"description":"chat_id is empty"}` → biến env chưa load (chạy `source .env.local` trước hoặc dùng `dotenv-cli`).

### Test 2 — Simulated Sepay payload (localhost API endpoint)

Sau khi `npm run dev`, gửi payload mock vào webhook route:

```bash
curl -X POST http://localhost:3000/api/payment-success \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-001",
    "gateway": "Vietcombank",
    "transactionDate": "2026-05-14 14:32:01",
    "accountNumber": "1023456789",
    "code": null,
    "content": "TEST DH001",
    "transferType": "in",
    "transferAmount": 499000,
    "accumulated": 1000000,
    "subAccount": null,
    "referenceCode": "FT26134567890",
    "description": "TEST DH001"
  }'

# Expect:
# - Response: {"success":true}
# - Telegram chat: 🎉 ĐƠN HÀNG MỚI ... xuất hiện
# - (Nếu có Resend) email cũng được gửi
```

**Nếu webhook trả 500**: check log `npm run dev` console — thường là (a) lookup lead fail vì chưa có lead với order DH001 trong DB (test data), (b) parse payload sai shape.

### Test 3 — Production verify (sau deploy)

User tự test sau deploy:
1. Deploy: `vercel --prod` (hoặc qua skill `/biz-deploy-vercel`).
2. Đăng nhập Sepay dashboard → Webhooks → Logs → check webhook URL = production domain.
3. Tạo 1 đơn test thực tế (nội dung chuyển khoản chứa order ID), chuyển 1.000đ vào account đã link Sepay.
4. Trong < 30s, Telegram chat phải nhận tin nhắn ĐƠN HÀNG MỚI.
5. Check Sepay dashboard → Webhook log → status `200 OK` (không retry).

---

## Output cuối cùng skill trả về user

Sau Phase 4, summary:

```
✓ Đã wire Telegram notification vào Sepay webhook

📁 File thay đổi:
- lib/telegram.ts (NEW — helper function + format)
- app/api/payment-success/route.ts (MODIFIED — add sendTelegramNotification vào Promise.allSettled)
- .env.local (MODIFIED — add TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID)
- .gitignore (verified — .env.local đã ignore)

🤖 Bot setup:
- Bot tên: Đơn Hàng Brand X (@brandx_orders_bot)
- Chat target: 1-1 với owner (chat_id: 123456789)

🧪 Test ngay:
1. Local: curl test bot direct (xem Phase 4 — Test 1)
2. Local: curl simulated Sepay payload (Test 2)
3. Production: deploy → tạo 1 đơn 1.000đ test thật (Test 3)

🔧 TODO của anh/chị (manual gate):
1. Paste TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID vào Vercel dashboard → env vars production
2. Redeploy: vercel --prod (hoặc dùng /biz-deploy-vercel)
3. Test 1 đơn thật → confirm Telegram alert nhận được
```

---

## Reference files

- `references/telegram-bot-setup.md` — chi tiết BotFather + chat_id retrieval (1-1, group, channel) + screenshot text
- `references/sepay-webhook-payload.md` — Sepay payload schema đầy đủ + auth methods + dedup pattern
- `references/troubleshooting.md` — common issues: bot token sai, chat_id sai, webhook duplicate, Telegram rate limit, message escape HTML

## Templates

- `templates/lib-telegram.ts` — TypeScript helper (Next.js TS project)
- `templates/lib-telegram.js` — JS variant (Next.js JS hoặc Vite/static)
- `templates/webhook-integration-snippet.ts` — code snippet wire vào webhook handler (App Router + Pages Router variants)

---

## Anti-pattern (đừng làm)

- ❌ Throw error trong `sendTelegramNotification` → webhook trả 500 → Sepay retry → duplicate alert + duplicate email. **Always swallow.**
- ❌ Dùng `Promise.all` thay vì `Promise.allSettled` → 1 fail block tất cả.
- ❌ Hardcode bot token trong source → leak Git. Luôn qua env var.
- ❌ Tạo route mới `/api/telegram-notify` riêng và gọi từ webhook handler qua `fetch('/api/telegram-notify')` → thêm 1 round-trip không cần thiết, network failure surface tăng. Inline vào webhook handler là đủ.
- ❌ Quên `parse_mode: 'HTML'` → tag `<b>` hiện thành plain text trong Telegram.
- ❌ Quên escape HTML user input (tên khách có thể chứa `<`, `>`) → Telegram trả `Bad Request: can't parse entities`.
- ❌ Format amount sai locale: `499000` (raw) hoặc `$499` thay vì `499.000đ` → owner phải đoán đơn vị tiền.
- ❌ Send Telegram trên CẢ `transferType: 'out'` → owner nhận alert mỗi khi anh/chị chuyển TIỀN RA → spam. Chỉ gửi khi `transferType === 'in'`.
- ❌ Gửi quá chi tiết (full payload Sepay raw) → khó đọc trên mobile, format đẹp gọn quan trọng hơn completeness.
