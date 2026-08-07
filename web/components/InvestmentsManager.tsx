'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StaggerGroup, StaggerItem } from './Stagger'
import { Briefcase, TrendingUp, Plus, Trash2, Edit3, DollarSign, PieChart, ShieldCheck } from 'lucide-react'

interface Investment {
  id: string
  name: string
  value: number
  color: string
}

interface InvestmentsManagerProps {
  initialInvestments: Investment[]
  userId: string
  currency?: string
}

export default function InvestmentsManager({ initialInvestments, userId, currency = 'ETB' }: InvestmentsManagerProps) {
  const [investments, setInvestments] = useState<Investment[]>(initialInvestments)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editModalAsset, setEditModalAsset] = useState<Investment | null>(null)
  const [editValue, setEditValue] = useState('')

  // Form State
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [color, setColor] = useState('#10b981')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const totalValue = investments.reduce((sum, inv) => sum + Number(inv.value), 0)

  // Compound growth projection (5 years at 7% return)
  const projected5Years = totalValue * Math.pow(1 + 0.07, 5)

  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !value) return
    const val = parseFloat(value)
    if (isNaN(val)) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('investments')
        .insert({
          user_id: userId,
          name: name.trim(),
          value: val,
          color,
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setInvestments([data, ...investments])
        setIsAddOpen(false)
        setName('')
        setValue('')
        router.refresh()
      }
    } catch (err: any) {
      alert(`Error adding asset: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateAssetValue(e: React.FormEvent) {
    e.preventDefault()
    if (!editModalAsset || !editValue) return
    const newVal = parseFloat(editValue)
    if (isNaN(newVal)) return

    try {
      const { error } = await supabase
        .from('investments')
        .update({ value: newVal })
        .eq('id', editModalAsset.id)

      if (error) throw error

      setInvestments(prev => prev.map(i => (i.id === editModalAsset.id ? { ...i, value: newVal } : i)))
      setEditModalAsset(null)
      setEditValue('')
      router.refresh()
    } catch (err: any) {
      alert(`Error updating asset value: ${err.message}`)
    }
  }

  async function handleDeleteAsset(id: string) {
    if (!confirm('Are you sure you want to remove this investment asset from your portfolio?')) return

    try {
      const { error } = await supabase.from('investments').delete().eq('id', id)
      if (error) throw error

      setInvestments(investments.filter(i => i.id !== id))
      router.refresh()
    } catch (err: any) {
      alert(`Error deleting asset: ${err.message}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Briefcase style={{ color: '#D9FF5B' }} size={26} /> Investment Portfolio
          </h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: 14 }}>
            Track assets, asset allocation, and projected compound growth
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #D9FF5B 0%, #b3ff00 100%)',
            border: 'none',
            borderRadius: 12,
            padding: '10px 20px',
            color: '#080A09',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={18} /> Add Asset
        </button>
      </div>

      {/* Portfolio Overview Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(217,255,91,0.08) 0%, rgba(16,185,129,0.04) 100%)',
          border: '1px solid rgba(217,255,91,0.2)',
          borderRadius: 20,
          padding: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
        }}
      >
        <div>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>TOTAL ASSET VALUE</span>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#D9FF5B', marginTop: 4, letterSpacing: '-0.02em' }}>
            {totalValue.toLocaleString()} {currency}
          </div>
          <span style={{ fontSize: 12, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <TrendingUp size={14} /> Active Portfolio Asset Pool
          </span>
        </div>

        <div>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>5-YEAR COMPOUND PROJECTION</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
            ~{Math.round(projected5Years).toLocaleString()} {currency}
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'block' }}>
            Assuming 7% avg annual growth
          </span>
        </div>

        <div>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>TOTAL ASSETS LOGGED</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
            {investments.length} Holdings
          </div>
          <span style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4, display: 'block' }}>
            {investments.length > 0 ? 'Diversified Portfolio' : 'No assets added yet'}
          </span>
        </div>
      </div>

      {/* Asset Allocation Bar */}
      {totalValue > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
              <PieChart size={16} style={{ color: '#D9FF5B' }} /> Asset Allocation Breakdown
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>100% Total Share</span>
          </div>

          <div style={{ width: '100%', height: 12, borderRadius: 6, display: 'flex', overflow: 'hidden', gap: 2 }}>
            {investments.map(inv => {
              const pct = ((inv.value / totalValue) * 100).toFixed(1)
              return (
                <div
                  key={inv.id}
                  title={`${inv.name}: ${pct}%`}
                  style={{ width: `${pct}%`, height: '100%', background: inv.color, transition: 'all 0.3s' }}
                />
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14 }}>
            {investments.map(inv => {
              const pct = ((inv.value / totalValue) * 100).toFixed(1)
              return (
                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: inv.color }} />
                  <span style={{ color: '#cbd5e1' }}>{inv.name}: <strong>{pct}%</strong></span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Assets Grid */}
      <StaggerGroup className="stats-grid">
        {investments.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Briefcase size={40} style={{ color: '#64748b', marginBottom: 12 }} />
            <h3 style={{ color: '#f8fafc', margin: '0 0 6px 0' }}>No Investment Assets Tracked</h3>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Add stocks, crypto, real estate, or cash deposits to view your complete wealth portfolio.</p>
          </div>
        ) : (
          investments.map(inv => {
            const sharePct = totalValue > 0 ? ((inv.value / totalValue) * 100).toFixed(1) : '0'

            return (
              <StaggerItem key={inv.id} className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: inv.color, boxShadow: `0 0 12px ${inv.color}80` }} />
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>{inv.name}</h3>
                    </div>
                    <button
                      onClick={() => handleDeleteAsset(inv.id)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
                      {inv.value.toLocaleString()} {currency}
                    </div>
                    <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'block' }}>
                      {sharePct}% of total portfolio
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => { setEditModalAsset(inv); setEditValue(inv.value.toString()); }}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    color: '#cbd5e1',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Edit3 size={14} /> Update Value
                </button>
              </StaggerItem>
            )
          })
        )}
      </StaggerGroup>

      {/* Add Modal */}
      {isAddOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: 440, background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: 18 }}>Add Investment Asset</h3>
            <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Asset Name</label>
                <input
                  type="text"
                  placeholder="e.g. S&P 500 ETF, Real Estate, Bitcoin"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Current Asset Value ({currency})</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  required
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Color Badge</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#0ea5e9'].map(c => (
                    <div
                      key={c}
                      onClick={() => setColor(c)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: c,
                        cursor: 'pointer',
                        border: color === c ? '2px solid #fff' : '2px solid transparent',
                        boxShadow: color === c ? `0 0 12px ${c}` : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 16px', color: '#cbd5e1' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: '#D9FF5B', border: 'none', borderRadius: 10, padding: '8px 18px', color: '#080A09', fontWeight: 700 }}
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Value Modal */}
      {editModalAsset && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: 380, background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 24 }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#f8fafc', fontSize: 16 }}>Update Value: {editModalAsset.name}</h3>
            <form onSubmit={handleUpdateAssetValue} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Updated Value ({currency})</label>
                <input
                  type="number"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  required
                  autoFocus
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 18 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditModalAsset(null)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 16px', color: '#cbd5e1' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#D9FF5B', border: 'none', borderRadius: 10, padding: '8px 18px', color: '#080A09', fontWeight: 700 }}
                >
                  Update Value
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
