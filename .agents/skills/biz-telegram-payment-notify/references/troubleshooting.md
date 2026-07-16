# Troubleshooting — Telegram payment notify

Khi test bị fail, tra theo bảng dưới. Đi từ symptom → root cause → fix.

---

## A. Test bot direct (curl) bị fail

### A1. `{"ok":false,"description":"Unauthorized"}`

**Cause**: Token sai (typo, hoặc đã `/revoke` qua BotFather).

**Fix**:
1. Quay lại @BotFather → `/mybots` → chọn bot → `API Token` → copy lại token mới.
2. Update `TELEGRAM_BOT_TOKEN` trong `.env.local`.
3. Nếu deploy production, update Vercel dashboard env vars luôn.

### A2. `{"ok":false,"description":"Bad Request: chat not found"}`

**Cause**:
- Chat 1-1: User CHƯA chat với bot lần nào (chưa gửi `/start` cho bot).
- Group: bot chưa được add vào group, HOẶC chat_id sai (thiếu dấu trừ).
- Channel: bot chưa được add làm admin.

**Fix**:
- Chat 1-1: search bot username (vd `@brandx_orders_bot`), bấm START.
- Group: re-add bot, gõ tin nhắn mới, refresh `/getUpdates` lấy chat_id.
- Channel: vào Channel Info → Admins → Add bot → cấp quyền Post Messages.

### A3. `{"ok":false,"description":"chat_id is empty"}` hoặc `Bad Request: chat_id is empty`

**Cause**: biến env không load.

**Fix**:
```bash
# Check biến đã có chưa
echo $TELEGRAM_CHAT_ID

# Nếu rỗng, source file
source .env.local
# Hoặc dùng dotenv-cli
npx dotenv -e .env.local -- curl ...
```

### A4. `{"ok":false,"description":"Bad Request: can't parse entities: ..."}`

**Cause**: Text chứa HTML không escape, vd ký tự `<`, `>`, `&` không thoát.

**Fix**: trong helper `lib/telegram.ts`, đảm bảo gọi `escapeHtml()` trên tất cả user input (tên khách, email, sản phẩm). Reference implementation đã có sẵn — check không bị xoá nhầm.

### A5. Curl chạy thành công nhưng không thấy tin nhắn trên Telegram

**Cause**:
- Notification bị mute trong Telegram setting.
- Sai account Telegram (đăng nhập 2 account khác nhau ở mobile vs desktop).
- chat_id của user khác (vd test với chat_id của bạn collegue).

**Fix**:
- Check Telegram chat → Settings → Notifications → Unmute.
- Check `id` từ @userinfobot lần nữa, đảm bảo đúng account.

---

## B. Webhook simulated test (curl localhost) bị fail

### B1. `404 Not Found` trên `POST /api/payment-success`

**Cause**: Route file không tồn tại hoặc path sai.

**Fix**:
- App Router: file phải là `app/api/payment-success/route.ts` (folder `payment-success`, file `route.ts`).
- Pages Router: file phải là `pages/api/payment-success.ts`.
- Restart `npm run dev` sau khi tạo file mới.

### B2. `500 Internal Server Error`

**Cause** (xem console log của `npm run dev`):

| Log error | Root cause | Fix |
|---|---|---|
| `Cannot find module '@/lib/telegram'` | TypeScript path alias chưa setup, hoặc file không tồn tại | Check `tsconfig.json` có `"paths": { "@/*": ["./*"] }`. Hoặc dùng relative path `../../../lib/telegram` |
| `payload.transferAmount is not a number` | Test payload sai shape | Check curl JSON — `transferAmount` phải là number, không phải string |
| `lookupLeadByTransferContent is not defined` | Function chưa implement, vẫn là stub | Implement hoặc mock — return dummy lead cho test |
| `process.env.TELEGRAM_BOT_TOKEN is undefined` | `.env.local` chưa load (Next.js auto load nhưng cần restart dev server) | Stop `npm run dev` (Ctrl+C) → `npm run dev` lại |

### B3. Response trả 200 nhưng KHÔNG nhận Telegram

**Cause**: side effect bị skip. Likely:
- `transferType !== 'in'` → bị early return. Check payload có `"transferType": "in"`.
- `lookupLead()` trả null → side effect bị skip. Check console có warning `[sepay] No lead found` không.
- `sendTelegramNotification` swallow error silently. Check console có `[telegram] Send failed` log không.

**Fix theo log**:
- Nếu lookup null: hard-code lead trong test (skip lookup) hoặc seed DB.
- Nếu telegram error: chạy lại Test 1 (curl direct) để confirm bot hoạt động trước.

---

## C. Production deploy bị fail

### C1. Local OK nhưng production không nhận Telegram

**Cause**: Env vars chưa add vào Vercel dashboard.

**Fix**:
1. Login Vercel dashboard → Project → Settings → Environment Variables.
2. Add `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID`, chọn environment Production (và Preview nếu cần).
3. **Quan trọng**: redeploy sau khi add env (Vercel KHÔNG hot-reload env). Trigger qua `vercel --prod` hoặc git push.

### C2. Sepay dashboard hiện webhook fail (5xx)

**Cause**: Webhook handler crash trong production. Check Vercel logs:
```bash
vercel logs --follow
```

Common production-only issues:
- Cold start timeout (first request mất 5-10s) → Sepay timeout → marked fail. Optional: dùng Vercel Pro warmup, hoặc accept retry.
- Module import fail (production build khác dev). → Check `next build` local trước khi deploy.

### C3. Webhook nhận đúng nhưng Telegram bị duplicate

**Cause**: Sepay retry vì webhook trả non-200. **Fix**: ensure code throw nothing — wrap entire handler trong try/catch return 200 nếu cần.

```typescript
export async function POST(req: Request) {
  try {
    // [actual logic]
    return Response.json({ success: true });
  } catch (err) {
    console.error('[webhook] Unhandled error:', err);
    // Vẫn trả 200 — nếu trả 500 Sepay sẽ retry, gây duplicate
    return Response.json({ success: false, error: String(err) }, { status: 200 });
  }
}
```

(Trade-off: nếu lỗi thật, payment vẫn được record nhưng anh/chị không biết. Acceptable cho most case nếu có alerting trên Vercel logs.)

---

## D. Telegram rate limit

Telegram giới hạn:
- 30 messages/giây tổng (per bot)
- 1 message/giây per chat
- 20 messages/phút trong group

Nếu landing page có spike traffic (vd 100 đơn/phút), bot có thể bị rate-limited. Telegram trả `{"ok":false,"error_code":429,"parameters":{"retry_after":15}}`.

**Fix** (chỉ áp dụng nếu volume lớn — most landing page không cần):
- Implement queue: gom 10 đơn → batch thành 1 message "10 ĐƠN HÀNG MỚI" mỗi 30s.
- Hoặc dùng background worker (Vercel queue, Upstash) để smooth out.

Skill **không** default implement cái này — premature optimization. Chỉ add nếu user gặp 429 thật.

---

## E. Message format hiện sai trên Telegram

| Symptom | Cause | Fix |
|---|---|---|
| Tag `<b>...</b>` hiện literal text, không bold | Quên `parse_mode: "HTML"` | Add `parse_mode: 'HTML'` vào sendMessage body |
| Tin nhắn xuống dòng dồn vào 1 dòng | Dùng `<br>` | Telegram HTML không support `<br>`. Dùng `\n` (literal newline trong JSON) |
| Emoji hiện thành ký tự lạ | Encoding issue (rare) | Đảm bảo `Content-Type: application/json; charset=utf-8` và source file UTF-8 |
| Số tiền hiện `499000đ` thay vì `499.000đ` | `toLocaleString` không có locale | `amount.toLocaleString('vi-VN')` (đảm bảo Node 18+ có ICU full) |

Nếu Node version < 18 hoặc thiếu ICU data, format fallback có thể sai. Quick fix:
```typescript
function formatVND(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}
```
