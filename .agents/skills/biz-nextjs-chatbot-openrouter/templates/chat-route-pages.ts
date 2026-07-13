// pages/api/chat.ts — Pages Router API route. Streaming SSE qua Node res.write().
// Lưu ý: Pages API routes mặc định Node.js runtime. Streaming cần config.api.responseLimit = false.

import type { NextApiRequest, NextApiResponse } from 'next'
import { systemPrompt } from '@/lib/chatbot-knowledge'

const MODEL = '__MODEL_ID__'

export const config = {
  api: {
    responseLimit: false,
  },
}

type Msg = { role: 'user' | 'assistant'; content: string }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'OPENROUTER_API_KEY chưa được set trong .env.local' })
    return
  }

  const messages: Msg[] | undefined = req.body?.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Invalid messages payload' })
    return
  }

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
    res.status(502).json({ error: `OpenRouter error: ${upstream.status} ${errText}` })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(decoder.decode(value, { stream: true }))
    }
  } catch (err) {
    // Client disconnected hoặc upstream error — silently end.
  } finally {
    res.end()
  }
}
