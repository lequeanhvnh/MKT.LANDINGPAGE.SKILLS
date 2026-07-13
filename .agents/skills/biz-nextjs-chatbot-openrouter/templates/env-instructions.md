# Hướng dẫn lấy OpenRouter API Key

OpenRouter là gateway giúp anh/chị gọi 100+ LLM (Gemini, Claude, Llama, GPT...) qua **1 API key duy nhất**, **1 file billing duy nhất**. Pricing pay-per-token, không phí cố định.

## Bước 1 — Đăng ký tài khoản

1. Vào **https://openrouter.ai**
2. Click **Sign in** góc trên phải
3. Login bằng Google / GitHub / Email (Google nhanh nhất)

## Bước 2 — Nạp credit

OpenRouter dùng prepaid credit. Phải nạp ít nhất $5 để bắt đầu.

1. Vào **https://openrouter.ai/credits**
2. Click **Add Credits**
3. Chọn $5 (đủ chạy ~10,000 câu chat với Gemini 3 Flash)
4. Thanh toán bằng thẻ Visa / Mastercard / crypto

**Ước tính chi phí**:
- `google/gemini-3-flash-preview`: ~$0.075/1M input + $0.30/1M output → **1 câu chat ~$0.0005** (1 USD = 2,000 câu chat)
- `anthropic/claude-sonnet-4.6`: ~$3/1M input + $15/1M output → **1 câu chat ~$0.02** (1 USD = 50 câu chat)

→ Với chatbot support landing page, **Gemini 3 Flash** là lựa chọn rẻ + nhanh + đủ tốt cho 95% case. Chỉ đổi sang Sonnet nếu thấy chất lượng câu trả lời chưa đạt.

## Bước 3 — Tạo API Key

1. Vào **https://openrouter.ai/keys**
2. Click **Create Key**
3. Đặt tên (vd. "landing-page-chatbot")
4. Optional: set **Credit Limit** (vd. $10) để tránh runaway cost nếu key bị leak
5. Click **Create**
6. **Copy key ngay** (dạng `sk-or-v1-xxxxxxxxxxxxxxxxxxxx`) — không hiển thị lại

## Bước 4 — Paste vào .env.local

Mở file `.env.local` ở root project Next.js, paste key vào:

```env
OPENROUTER_API_KEY=sk-or-v1-paste-key-vào-đây
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Production**: khi deploy lên Vercel, vào project Settings → Environment Variables → thêm `OPENROUTER_API_KEY` với cùng value, và `NEXT_PUBLIC_SITE_URL` = domain thật (vd. `https://aimastery.vn`).

## Bước 5 — Restart dev server

```bash
# Ctrl+C để stop server cũ
npm run dev
# (hoặc pnpm dev / yarn dev tuỳ project)
```

Mở `http://localhost:3000` → click bong bóng góc dưới phải → test gửi câu hỏi.

## Troubleshoot

- **"OPENROUTER_API_KEY chưa được set"**: Restart dev server sau khi sửa `.env.local`. Next.js không hot-reload env vars.
- **401 Unauthorized**: Key sai hoặc đã bị revoke. Tạo key mới.
- **402 Payment Required**: Hết credit. Nạp thêm ở https://openrouter.ai/credits.
- **429 Rate Limited**: Free tier rate limit. Nạp credit hoặc đợi 1 phút.
- **Response chậm**: Bình thường với Sonnet (3-5s). Gemini Flash phải <2s. Nếu Gemini chậm → thử gọi lại, có thể là cold start của OpenRouter.
- **Câu trả lời sai/bịa**: Mở `lib/chatbot-knowledge.ts` → bổ sung FAQ + product info chi tiết hơn. System prompt càng rõ, model càng ít bịa.
