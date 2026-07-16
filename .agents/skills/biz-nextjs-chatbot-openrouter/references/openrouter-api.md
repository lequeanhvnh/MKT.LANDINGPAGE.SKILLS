# OpenRouter API — Reference cho chatbot widget

Doc gốc: https://openrouter.ai/docs

## Endpoint

`POST https://openrouter.ai/api/v1/chat/completions`

OpenAI-compatible — schema giống OpenAI Chat Completions, nên các SDK OpenAI cũng work nếu chỉ đổi base URL.

## Headers

| Header | Bắt buộc | Mô tả |
|---|---|---|
| `Authorization: Bearer <key>` | ✅ | API key dạng `sk-or-v1-...` |
| `Content-Type: application/json` | ✅ | |
| `HTTP-Referer: <url>` | Khuyến nghị | Site URL — giúp OpenRouter tracking + ưu tiên rate limit |
| `X-Title: <name>` | Khuyến nghị | Tên app — hiển thị trong dashboard analytics của OpenRouter |

## Request body

```json
{
  "model": "google/gemini-3-flash-preview",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 800,
  "top_p": 1
}
```

**Field quan trọng**:
- `model`: ID model dạng `provider/model-name`. Xem danh sách: https://openrouter.ai/models
- `messages`: Array roles `system | user | assistant`. System message đặt đầu, áp cho cả conversation.
- `stream`: `true` → trả SSE từng chunk. `false` → trả nguyên JSON.
- `temperature`: 0-2. Chatbot support: 0.3-0.7 (nhất quán). Brainstorm: 0.8-1.2.
- `max_tokens`: Giới hạn output. Chatbot support: 500-1000 đủ. Đặt lower để control cost.

## Streaming response (SSE format)

Mỗi chunk là 1 dòng dạng:
```
data: {"id":"...","choices":[{"delta":{"content":"Em "},"index":0}]}\n\n
data: {"id":"...","choices":[{"delta":{"content":"chào "},"index":0}]}\n\n
...
data: [DONE]\n\n
```

**Parse pattern (client-side)**:
```ts
const reader = res.body.getReader()
const decoder = new TextDecoder()
let buffer = ''
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })
  const lines = buffer.split('\n')
  buffer = lines.pop() ?? '' // giữ dòng cuối chưa xong cho lần sau
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue
    const data = line.slice(6).trim()
    if (data === '[DONE]') return
    const json = JSON.parse(data)
    const delta = json.choices?.[0]?.delta?.content
    if (delta) appendToMessage(delta)
  }
}
```

**Lưu ý**:
- Buffer dòng chưa hoàn chỉnh, không assume mỗi `read()` là 1 chunk hoàn chỉnh.
- Bỏ qua dòng `: keep-alive` (SSE comment) bằng cách check `startsWith('data: ')`.
- Bắt `JSON.parse` lỗi và bỏ qua chunk lỗi (đôi khi có chunk partial).

## Models phổ biến cho chatbot support

| Model | Strength | Pricing input/output (per 1M tokens) | Khi dùng |
|---|---|---|---|
| `google/gemini-3-flash-preview` | Nhanh, rẻ, fluent VN | $0.075 / $0.30 | Mặc định cho support bot |
| `google/gemini-2.5-flash` | Stable hơn (đã GA) | $0.075 / $0.30 | Nếu Gemini 3 preview unstable |
| `anthropic/claude-sonnet-4.6` | Nhất quán, nuanced | $3 / $15 | High-stakes, cần chính xác |
| `anthropic/claude-haiku-4.5` | Cân bằng giá / chất lượng | ~$1 / $5 | Trung gian Gemini-Sonnet |
| `meta-llama/llama-3.3-70b-instruct` | Open weight, rẻ | $0.13 / $0.40 | Backup nếu prefer non-proprietary |
| `qwen/qwen-2.5-72b-instruct` | Tốt cho Châu Á | $0.13 / $0.40 | VN, TQ context |

## Rate limits

- Free tier (chưa nạp credit): 20 req/phút
- Sau khi nạp credit: 200+ req/phút (tùy model, scale theo balance)

Chi tiết: https://openrouter.ai/docs/limits

## Error response format

```json
{
  "error": {
    "message": "...",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

Status code phổ biến:
- `400`: Bad request (messages malformed, model invalid)
- `401`: API key sai/expired
- `402`: Out of credits → user phải nạp thêm
- `429`: Rate limited
- `500/502`: OpenRouter hoặc upstream provider lỗi → retry với exponential backoff

## Cost monitoring

Mọi request được log trong dashboard: https://openrouter.ai/activity

Có thể filter theo model, date range, key. Hữu ích để debug cost spike.

## Khi nào nên đổi từ system prompt sang RAG

Nếu knowledge base > 15K token (≈ 60-80 câu FAQ + 10 trang course curriculum), system prompt sẽ:
- Tốn token mỗi request (Gemini 3 Flash: $0.075 × 15K/1M = $0.001 mỗi câu chỉ riêng system prompt)
- Vượt context window của một số model nhỏ
- Model có thể "lười" trả lời chính xác vì context dài

Lúc đó nên switch sang RAG:
1. Embed FAQ entries thành vectors (OpenAI `text-embedding-3-small` hoặc Cohere `embed-multilingual-v3`)
2. Lưu vào Supabase `pgvector` hoặc Pinecone
3. Khi user hỏi → embed query → retrieve top-5 FAQs gần nhất → inject vào prompt
4. System prompt rút gọn, chỉ giữ tone + nhiệm vụ

Skill base này không setup RAG để giữ tối giản, chỉ phù hợp ≤ 15K token kiến thức.
