# Telegram Bot Setup — chi tiết step-by-step

Reference này chi tiết hơn 3 bước trong SKILL.md Phase 1. Đọc khi user hỏi "lấy chat_id ở đâu", "bot không nhận tin nhắn", "tạo group bot thế nào".

---

## Bước 1 — Tạo bot mới

### Mở @BotFather

1. Mở app Telegram (mobile hoặc desktop hoặc web.telegram.org).
2. Bấm icon search (kính lúp) → gõ `BotFather` → chọn account có tick xanh xác minh chính thức (`@BotFather`).
3. Bấm `START` (hoặc gõ `/start`) — BotFather trả về danh sách lệnh.

### Tạo bot

```
You: /newbot

BotFather: Alright, a new bot. How are we going to call it? Please choose a name for your bot.

You: Đơn Hàng Brand X
   ↑ Tên hiển thị — có thể tiếng Việt, có dấu, ai trong group cũng thấy tên này.

BotFather: Good. Now let's choose a username for your bot. It must end in 'bot'.

You: brandx_orders_bot
   ↑ Username — phải unique global, kết thúc bằng "_bot" hoặc "bot". Chỉ chữ + số + underscore.
   ↑ Nếu trùng, BotFather sẽ báo "Sorry, this username is already taken." → thử tên khác.

BotFather: Done! Congratulations on your new bot. You will find it at t.me/brandx_orders_bot.
You can now add a description, about section and profile picture for your bot, see /help for a list of commands.

Use this token to access the HTTP API:
1234567890:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Copy đoạn token đó (vd: `1234567890:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`). Đó là **TELEGRAM_BOT_TOKEN**.

### Bảo mật token

- Token = quyền điều khiển bot. Ai có token = gửi message tùy ý dưới danh nghĩa bot.
- KHÔNG commit lên Git (luôn vào `.env.local`, `.gitignore` đã ignore).
- KHÔNG paste lên forum/Discord public.
- Nếu lỡ leak: quay lại @BotFather → `/token` → chọn bot → `/revoke` → confirm → BotFather trả token mới. Token cũ ngừng hoạt động ngay.

### (Optional) Customize bot

- `/setdescription` — text hiển thị trong "About" của bot.
- `/setabouttext` — short text dưới username.
- `/setuserpic` — upload avatar bot.
- `/setcommands` — set up slash commands (nếu bot có command như /status, /help).

Cho use case payment notify, KHÔNG cần customize. Bot chỉ push message một chiều, không có command.

---

## Bước 2 — Lấy chat_id

Telegram phân biệt 4 loại chat, mỗi loại có chat_id khác:

| Loại | chat_id format | Use case |
|---|---|---|
| User (1-1 với bot) | số dương, vd `123456789` | Solopreneur, owner cá nhân nhận alert |
| Group (chat thường) | số âm, vd `-987654321` | Team sale ≤200 người |
| Supergroup | số âm bắt đầu `-100`, vd `-1001234567890` | Group lớn, hoặc group đã upgrade |
| Channel | số âm bắt đầu `-100` | Broadcast 1 chiều, không thảo luận |

### Cách 1 — Chat 1-1 (recommended cho solopreneur)

```
1. Trong Telegram, search: @userinfobot → bấm START
2. Bot trả về:
   "
   👤 Tony Hoang
   🆔 Id: 123456789
   👤 Username: @tonyhoang
   "
3. Số "Id: 123456789" — đó là chat_id của anh/chị (chat User-User).
```

**Quan trọng**: Trước khi bot có thể gửi message vào chat này, anh/chị phải **chat với bot trước 1 lần** (gửi `/start` cho `@brandx_orders_bot`). Nếu không, Telegram trả `Bad Request: chat not found` vì bot chưa "biết" user.

### Cách 2 — Group chat (recommended cho team)

```
1. Tạo group Telegram mới (hoặc dùng group có sẵn của team).
   - Mobile: New Message → New Group → chọn members → đặt tên group
   - Desktop: tương tự, ở menu chính

2. Add bot vào group:
   - Bấm tên group (header) → Members → Add Members → search "@brandx_orders_bot" → Add

3. Trong group, gõ bất kỳ tin nhắn nào, ví dụ:
   /start@brandx_orders_bot

4. Mở browser, truy cập:
   https://api.telegram.org/bot<TOKEN>/getUpdates
   Thay <TOKEN> bằng token bước 1, ví dụ:
   https://api.telegram.org/bot1234567890:AAExxx.../getUpdates

5. Browser hiện JSON response, tìm phần:
   {
     "ok": true,
     "result": [
       {
         "update_id": 123456789,
         "message": {
           "chat": {
             "id": -987654321,         ← ĐÂY là chat_id
             "title": "Team Sale Brand X",
             "type": "group"
           },
           ...
         }
       }
     ]
   }

6. Copy số -987654321 (nhớ giữ dấu trừ). Đó là TELEGRAM_CHAT_ID.
```

**Common gotcha**:
- `getUpdates` trả `[]` rỗng → chưa có ai gõ tin nhắn vào group sau khi add bot. Gõ thêm 1 tin rồi refresh.
- Tin nhắn cũ trước khi add bot → bot không thấy. Telegram chỉ deliver message sau khi bot join.
- Group đã từng là supergroup → chat_id bắt đầu `-100`. Vẫn dùng được.

### Cách 3 — Channel (broadcast only)

```
1. Tạo channel mới: New Channel
2. Add bot làm ADMIN của channel (không phải member thường):
   - Channel info → Administrators → Add Admin → search bot → Add
   - Cấp quyền: Post Messages (tối thiểu)
3. Post 1 message vào channel.
4. Truy cập https://api.telegram.org/bot<TOKEN>/getUpdates
5. Tìm "channel_post":{ "chat": {"id": -1001234567890, "type": "channel"} }
6. Copy số đó (bắt đầu -100).
```

Channel tốt cho case: broadcast đơn hàng cho VIP customer hoặc public log để team xem (nhưng không reply được).

---

## Bước 3 — Test bot send message

Trước khi wire vào code, test bot có thể gửi được không. Mở terminal:

```bash
TOKEN="1234567890:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
CHAT_ID="123456789"

curl -X POST "https://api.telegram.org/bot$TOKEN/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "'$CHAT_ID'",
    "text": "✓ Test from terminal — bot OK",
    "parse_mode": "HTML"
  }'
```

**Expect**:
- Response: `{"ok":true,"result":{"message_id":1,"from":{...},"chat":{...},"date":...,"text":"..."}}`
- Telegram chat: tin nhắn `✓ Test from terminal — bot OK` xuất hiện trong < 2 giây.

**Nếu fail** → đọc `references/troubleshooting.md`.

---

## Inline keyboard (advanced — optional)

Nếu user muốn message Telegram có nút bấm (vd: link đến CRM, mark "đã liên hệ"), Telegram support inline keyboard. Add field `reply_markup` vào sendMessage:

```json
{
  "chat_id": "123456789",
  "text": "🎉 Đơn hàng mới...",
  "parse_mode": "HTML",
  "reply_markup": {
    "inline_keyboard": [
      [
        { "text": "📞 Gọi ngay", "url": "tel:+84901234567" },
        { "text": "💬 Chat Zalo", "url": "https://zalo.me/0901234567" }
      ],
      [
        { "text": "🗂 Mở CRM", "url": "https://crm.brandx.vn/leads/123" }
      ]
    ]
  }
}
```

User chỉ thấy 3 nút → bấm `Gọi ngay` mở app điện thoại, `Chat Zalo` mở Zalo web, `Mở CRM` mở browser.

Không default bật (giảm noise) — chỉ add nếu user request.
