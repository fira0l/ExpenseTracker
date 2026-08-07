'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { StaggerGroup, StaggerItem } from '@/components/Stagger'
import type { AutomationSource } from '@/lib/types'

const SOURCE_TYPES = [
  { type: 'sms',      icon: '📱', label: 'SMS Parser',  desc: 'Parse bank SMS messages to auto-log transactions', status: 'available' },
  { type: 'email',    icon: '📧', label: 'Email Parser', desc: 'Parse bank email receipts to auto-log transactions', status: 'available' },
  { type: 'bank_api', icon: '🏦', label: 'Bank API',     desc: 'Connect directly via Plaid for automatic syncing', status: 'available' },
]

interface Props {
  sources: AutomationSource[]
  userId: string
}

export default function AutomationManager({ sources, userId }: Props) {
  const [adding, setAdding] = useState<string | null>(null)
  const [plaidState, setPlaidState] = useState<'intro' | 'connecting' | 'success'>('intro')
  const [name, setName] = useState('')
  const [keywords, setKeywords] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  function closeAdding() {
    setAdding(null)
    setTimeout(() => setPlaidState('intro'), 300)
  }

  async function connectMockBank() {
    setPlaidState('connecting')
    setTimeout(async () => {
      setPlaidState('success')
      const config = { institution: 'Chase Bank', type: 'Checking ending in 1234' }
      await supabase.from('automation_sources').insert({
        user_id: userId, type: 'bank_api', name: 'Chase Checking', config, is_active: true,
      })
      setTimeout(() => {
        closeAdding()
        router.refresh()
      }, 2000)
    }, 2500)
  }

  async function addSource(type: string) {
    if (!name.trim()) return
    const config = {
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      description: `Parses ${type} messages for transactions`,
    }
    startTransition(async () => {
      await supabase.from('automation_sources').insert({
        user_id: userId, type, name: name.trim(), config, is_active: true,
      })
      closeAdding()
      setName('')
      setKeywords('')
      router.refresh()
    })
  }

  async function toggleSource(id: string, current: boolean) {
    await supabase.from('automation_sources').update({ is_active: !current }).eq('id', id)
    router.refresh()
  }

  async function deleteSource(id: string) {
    if (!confirm('Remove this automation source?')) return
    await supabase.from('automation_sources').delete().eq('id', id)
    router.refresh()
  }

  return (
    <StaggerGroup delay={0.1} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Info Banner */}
      <StaggerItem className="card card-glow" style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 32 }}>🤖</span>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Automation Sources</h2>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              Configure SMS and email parsers to automatically log transactions, or connect your bank securely using the Bank API (Plaid) integration for fully automated syncing.
            </p>
          </div>
        </div>
      </StaggerItem>

      {/* Source Type Cards */}
      <StaggerGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {SOURCE_TYPES.map(s => (
          <StaggerItem key={s.type} className="card" style={{ position: 'relative' }}>
            {s.status === 'coming_soon' && (
              <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(245,158,11,0.2)' }}>
                COMING SOON
              </div>
            )}
            <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>{s.label}</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>{s.desc}</p>
            {s.status === 'available' && (
              <button
                id={`add-${s.type}-btn`}
                className="btn btn-secondary btn-sm"
                onClick={() => setAdding(s.type)}
              >
                + Configure
              </button>
            )}
          </StaggerItem>
        ))}
      </StaggerGroup>

      {/* Add Form */}
      {adding && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeAdding()}>
          <div className="modal animate-slide-up" style={{ maxWidth: adding === 'bank_api' ? 400 : 500, background: adding === 'bank_api' ? '#ffffff' : undefined, color: adding === 'bank_api' ? '#111827' : undefined }}>
            
            {adding === 'bank_api' ? (
              // --- PLAID MOCK UI ---
              <div style={{ padding: '24px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ marginBottom: 24, fontSize: 32 }}>🏦</div>
                
                {plaidState === 'intro' && (
                  <>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 12 }}>SpendWise uses Plaid to link your bank</h2>
                    <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.5, marginBottom: 32 }}>
                      Securely connect your institution to automatically sync balances and transactions.
                    </p>
                    <button 
                      onClick={connectMockBank}
                      style={{ width: '100%', padding: '14px', background: '#111827', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Continue
                    </button>
                    <button 
                      onClick={closeAdding}
                      style={{ width: '100%', padding: '14px', background: 'transparent', color: '#6b7280', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {plaidState === 'connecting' && (
                  <>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Connecting to Chase...</h2>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, marginBottom: 20 }}>
                      <span className="loading-dots" style={{ filter: 'invert(1)' }}>
                        <span /><span /><span />
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: '#4b5563' }}>Authenticating your credentials securely</p>
                  </>
                )}

                {plaidState === 'success' && (
                  <>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 32, marginBottom: 16 }}>✓</div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Successfully Linked!</h2>
                    <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 20 }}>Chase Checking ending in 1234</p>
                  </>
                )}
              </div>
            ) : (
              // --- NORMAL SMS/EMAIL FORM ---
              <>
                <div className="modal-header">
                  <h2 className="modal-title">Configure {SOURCE_TYPES.find(s => s.type === adding)?.label}</h2>
                  <button className="btn btn-icon btn-ghost" onClick={closeAdding}>✕</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Source Name</label>
                    <input id="source-name" type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder={`e.g. My Bank ${adding === 'sms' ? 'SMS' : 'Email'}`} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Keywords (comma-separated)</label>
                    <input id="source-keywords" type="text" className="form-input" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="e.g. debited, charged, payment" />
                    <p style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                      Messages containing these keywords will be flagged for automatic parsing.
                    </p>
                  </div>
                  <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: 12 }}>
                    <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                      <strong style={{ color: '#a78bfa' }}>ℹ️ How it works:</strong> Once configured, you can paste received SMS/email content into the parser and SpendWise will extract the amount, merchant, and date automatically.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button id="save-source-btn" className="btn btn-primary" style={{ flex: 1 }} onClick={() => addSource(adding!)} disabled={pending || !name}>
                      {pending ? 'Saving...' : 'Save Source'}
                    </button>
                    <button className="btn btn-ghost" onClick={closeAdding}>Cancel</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Active Sources */}
      {sources.length > 0 && (
        <StaggerItem className="card">
          <h2 className="section-title" style={{ marginBottom: 16 }}>Active Sources</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sources.map(src => (
              <div key={src.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: 14, borderRadius: 12,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'
              }}>
                <span style={{ fontSize: 22 }}>{SOURCE_TYPES.find(s => s.type === src.type)?.icon ?? '📌'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{src.name}</p>
                  <p style={{ fontSize: 12, color: '#475569', textTransform: 'capitalize' }}>{src.type.replace('_', ' ')}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div
                    id={`toggle-${src.id.slice(0,8)}`}
                    onClick={() => toggleSource(src.id, src.is_active)}
                    style={{
                      width: 40, height: 22, borderRadius: 11,
                      background: src.is_active ? '#6366f1' : 'rgba(255,255,255,0.1)',
                      cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3,
                      left: src.is_active ? 20 : 3,
                      width: 16, height: 16, borderRadius: '50%',
                      background: 'white', transition: 'left 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }} />
                  </div>
                  <button
                    id={`del-source-${src.id.slice(0,8)}`}
                    className="btn btn-icon btn-ghost"
                    style={{ color: '#f43f5e', opacity: 0.6, fontSize: 14 }}
                    onClick={() => deleteSource(src.id)}
                  >🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </StaggerItem>
      )}
    </StaggerGroup>
  )
}
