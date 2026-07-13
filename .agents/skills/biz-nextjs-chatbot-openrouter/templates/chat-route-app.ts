// app/api/chat/route.ts — App Router API route, proxy gọi OpenRouter với streaming.
// KHÔNG expose OPENROUTER_API_KEY ra client. Mọi request từ widget đi qua route này.

import { systemPrompt } from '@/lib/chatbot-knowledge'

// Edge runtime — fast cold start, hỗ trợ streaming tốt. Đổi thành 'nodejs' nếu cần
// access các Node-only API (filesystem, postgres native driver...).
export const runtime = 'edge'

// Đổi model giữa Gemini ↔ Sonnet ở đây:
// - 'google/gemini-3-flash-preview' (mặc định, nhanh + rẻ)
// - 'anthropic/claude-sonnet-4.6' (chất lượng cao hơn)
const MODEL = '__MODEL_ID__'

type Msg = { role: 'user' | 'assistant'; content: string }

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'OPENROUTER_API_KEY chưa được set trong .env.local' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let messages: Msg[]
  try {
    const body = await req.json()
    messages = body.messages
    if (!Array.isArray(messages) || messages.length === 0) throw new Error('empty messages')
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid messages payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Giới hạn lịch sử 20 turn cuối để tránh tốn token + vượt context window.
  const trimmed = messages.slice(-20)

  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
      'X-Title': '__BRAND_NAME__ Chatbot',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...trimmed],
      stream: true,
      temperature: 0.7,
      max_tokens: 800,
    }),
  })

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => 'Unknown OpenRouter error')
    return new Response(
      JSON.stringify({ error: `OpenRouter error: ${upstream.status} ${errText}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Pass-through SSE stream từ OpenRouter về client.
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
