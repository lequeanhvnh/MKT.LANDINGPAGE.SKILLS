'use client'

// Floating chatbot widget — phiên bản KHÔNG Tailwind, dùng CSS module.
// Đi kèm với templates/chatbot.module.css.
// Logic giống Chatbot.tsx, chỉ khác styling.

import { useEffect, useRef, useState } from 'react'
import styles from './chatbot.module.css'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTED_QUESTIONS = [
  'Khóa học này phù hợp với ai?',
  'Học phí bao nhiêu?',
  'Có hoàn tiền không?',
  'Lộ trình học như thế nào?',
]

const WELCOME = 'Em chào anh/chị 👋 Em là trợ lý AI của __BRAND_NAME__. Anh/chị cần em hỗ trợ gì ạ?'

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streaming])

  useEffect(() => {
    if (open && typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  async function send(text: string) {
    if (!text.trim() || streaming) return
    setError(null)
    const userMsg: Msg = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errBody.error || `HTTP ${res.status}`)
      }
      if (!res.body) throw new Error('No response body')

      setMessages((m) => [...m, { role: 'assistant', content: '' }])

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const json = JSON.parse(data)
            const delta = json.choices?.[0]?.delta?.content
            if (delta) {
              setMessages((m) => {
                const last = m[m.length - 1]
                if (last.role !== 'assistant') return m
                return [...m.slice(0, -1), { ...last, content: last.content + delta }]
              })
            }
          } catch {
            /* noop */
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định'
      setError(msg)
      setMessages((m) => (m[m.length - 1]?.role === 'assistant' && !m[m.length - 1].content ? m.slice(0, -1) : m))
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Mở chatbot hỗ trợ" className={styles.bubble}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M12 2C6.48 2 2 6.04 2 11c0 2.28.93 4.36 2.5 6L3 21l4.4-1.42c1.4.65 2.97 1.02 4.6 1.02 5.52 0 10-4.04 10-9S17.52 2 12 2z" />
          </svg>
        </button>
      )}

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Chatbot hỗ trợ">
          <div className={styles.header}>
            <div>
              <div className={styles.title}>Trợ lý __BRAND_NAME__</div>
              <div className={styles.subtitle}>Trả lời trong vài giây</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Đóng chatbot" className={styles.closeBtn}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div ref={scrollRef} className={styles.messages}>
            {messages.length === 0 && (
              <>
                <div className={`${styles.bubble_msg} ${styles.assistant}`}>{WELCOME}</div>
                <div className={styles.suggestions}>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button key={q} onClick={() => send(q)} className={styles.suggestionChip}>
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`${styles.bubble_msg} ${m.role === 'user' ? styles.user : styles.assistant}`}
              >
                {m.content || (streaming && i === messages.length - 1 ? <TypingDots /> : '')}
              </div>
            ))}

            {error && <div className={styles.errorBox}>Lỗi: {error}. Anh/chị thử lại sau ít phút giúp em ạ.</div>}
          </div>

          <div className={styles.inputBar}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi..."
              rows={1}
              disabled={streaming}
              className={styles.textarea}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              aria-label="Gửi tin nhắn"
              className={styles.sendBtn}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function TypingDots() {
  return (
    <span className={styles.typing}>
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </span>
  )
}
