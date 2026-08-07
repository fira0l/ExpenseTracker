'use client'
import React, { useState, useRef, useEffect } from 'react'
import type { AdvisorChatMessage, Profile } from '@/lib/types'

interface AdvisorChatProps {
  profile: Profile | null
}

const QUICK_PROMPTS = [
  '📊 Summarize my overall spending & net worth',
  '🎯 Am I on track with my monthly budget limits?',
  '💡 Give me personalized recommendations to save money',
  '📈 How can I reduce my highest spending category?',
]

/* ---- Lightweight Markdown & Formatted Text Renderer ---- */
function FormattedMarkdown({ text, isUser }: { text: string; isUser: boolean }) {
  if (isUser) {
    return <span>{text}</span>
  }

  const lines = text.split('\n')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={idx} style={{ height: 4 }} />

        // Header: ### or ## or #
        if (trimmed.startsWith('# ')) {
          return <h3 key={idx} style={{ margin: '8px 0 4px 0', fontSize: 16, fontWeight: 700, color: '#D9FF5B' }}>{renderInline(trimmed.slice(2))}</h3>
        }
        if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
          const headerText = trimmed.replace(/^#{2,3}\s+/, '')
          return <h4 key={idx} style={{ margin: '6px 0 2px 0', fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>{renderInline(headerText)}</h4>
        }

        // Callout / Tip box
        if (trimmed.startsWith('💡') || trimmed.startsWith('⚠️') || trimmed.startsWith('🚨')) {
          return (
            <div
              key={idx}
              style={{
                background: 'rgba(217, 255, 91, 0.08)',
                borderLeft: '3px solid #D9FF5B',
                borderRadius: '0 8px 8px 0',
                padding: '8px 12px',
                margin: '4px 0',
                fontSize: 13,
                color: '#e2e8f0',
              }}
            >
              {renderInline(trimmed)}
            </div>
          )
        }

        // Bullet point: • or - or *
        if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletText = trimmed.replace(/^(?:•|-|\*)\s*/, '')
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingLeft: 4 }}>
              <span style={{ color: '#D9FF5B', fontSize: 12, marginTop: 3 }}>•</span>
              <div style={{ flex: 1 }}>{renderInline(bulletText)}</div>
            </div>
          )
        }

        // Numbered list: 1. 2.
        const numMatch = trimmed.match(/^(\d+\.)\s+(.*)/)
        if (numMatch) {
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingLeft: 4 }}>
              <span style={{ color: '#D9FF5B', fontSize: 12, fontWeight: 700 }}>{numMatch[1]}</span>
              <div style={{ flex: 1 }}>{renderInline(numMatch[2])}</div>
            </div>
          )
        }

        // Normal paragraph
        return <div key={idx}>{renderInline(line)}</div>
      })}
    </div>
  )
}

function renderInline(text: string) {
  // Regex to parse **bold**, *italic*, `code`
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Bold **text**
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/)
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.substring(0, boldMatch.index))
      }
      parts.push(
        <strong key={key++} style={{ color: '#f8fafc', fontWeight: 700 }}>
          {boldMatch[1]}
        </strong>
      )
      remaining = remaining.substring(boldMatch.index + boldMatch[0].length)
      continue
    }

    // Italic *text*
    const italicMatch = remaining.match(/\*(.*?)\*/)
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(remaining.substring(0, italicMatch.index))
      }
      parts.push(
        <em key={key++} style={{ color: '#cbd5e1', fontStyle: 'italic' }}>
          {italicMatch[1]}
        </em>
      )
      remaining = remaining.substring(italicMatch.index + italicMatch[0].length)
      continue
    }

    // Code `text`
    const codeMatch = remaining.match(/`(.*?)`/)
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(remaining.substring(0, codeMatch.index))
      }
      parts.push(
        <code key={key++} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color: '#D9FF5B' }}>
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.substring(codeMatch.index + codeMatch[0].length)
      continue
    }

    // No matches left
    parts.push(remaining)
    break
  }

  return <>{parts}</>
}

export default function AdvisorChat({ profile }: AdvisorChatProps) {
  const [messages, setMessages] = useState<AdvisorChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello ${profile?.full_name || 'there'}! I am your **AI Financial Advisor** in SpendWise.\n\n` +
        `I analyze your real-time transactions, budgets, net worth, assets, and debts to provide personalized financial insights and actionable saving advice.\n\n` +
        `How can I help you optimize your finances today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(textToSend?: string) {
    const text = textToSend || input
    if (!text.trim() || loading) return

    const userMsg: AdvisorChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    if (!textToSend) setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages }),
      })

      const data = await res.json()
      if (res.ok) {
        const assistantMsg: AdvisorChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages(prev => [...prev, assistantMsg])
      } else {
        throw new Error(data.error || 'Failed to generate response')
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Sorry, I encountered an issue connecting to your advisor service: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #D9FF5B 0%, #00f2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            🤖
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>AI Financial Advisor</h3>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Live context-aware financial intelligence</span>
          </div>
        </div>
        <span style={{ fontSize: 12, background: 'rgba(217,255,91,0.1)', color: '#D9FF5B', border: '1px solid rgba(217,255,91,0.3)', padding: '4px 10px', borderRadius: 20 }}>
          Online
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                background: msg.role === 'user' ? '#D9FF5B' : 'rgba(255,255,255,0.06)',
                color: msg.role === 'user' ? '#080A09' : '#f1f5f9',
                fontSize: 14,
                lineHeight: '1.6',
                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(217,255,91,0.2)' : 'none',
              }}
            >
              <FormattedMarkdown text={msg.content} isUser={msg.role === 'user'} />
            </div>
            <span style={{ fontSize: 10, color: '#64748b', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', padding: '0 4px' }}>
              {msg.timestamp}
            </span>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '12px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: 14 }}>
            🤖 Analyzing your finances...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts */}
      <div style={{ padding: '8px 24px', display: 'flex', gap: 8, overflowX: 'auto', background: 'rgba(0,0,0,0.2)' }}>
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp)}
            disabled={loading}
            style={{
              whiteSpace: 'nowrap',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12,
              color: '#cbd5e1',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault()
          handleSend()
        }}
        style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 12, background: 'rgba(255,255,255,0.02)' }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask your AI Advisor anything about your spending, budget, or saving goals..."
          disabled={loading}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            padding: '12px 16px',
            color: '#f1f5f9',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            background: 'linear-gradient(135deg, #D9FF5B 0%, #b3ff00 100%)',
            border: 'none',
            borderRadius: 12,
            padding: '0 24px',
            color: '#080A09',
            fontWeight: 600,
            fontSize: 14,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          Send ➔
        </button>
      </form>
    </div>
  )
}
