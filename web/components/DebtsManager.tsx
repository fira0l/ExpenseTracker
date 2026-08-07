'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StaggerGroup, StaggerItem } from './Stagger'
import {
  TrendingDown,
  ShieldAlert,
  Plus,
  Trash2,
  DollarSign,
  Percent,
  ArrowDownRight,
  CheckCircle2,
  Zap,
  Flame,
  Calendar,
  Sparkles,
} from 'lucide-react'

interface Debt {
  id: string
  name: string
  amount: number
  interest_rate: number
  color: string
}

interface DebtsManagerProps {
  initialDebts: Debt[]
  userId: string
  currency?: string
}

type PayoffStrategy = 'avalanche' | 'snowball'

export default function DebtsManager({ initialDebts, userId, currency = 'ETB' }: DebtsManagerProps) {
  const [debts, setDebts] = useState<Debt[]>(initialDebts)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [payModalDebt, setPayModalDebt] = useState<Debt | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [strategy, setStrategy] = useState<PayoffStrategy>('avalanche')
  const [monthlyPaymentTarget, setMonthlyPaymentTarget] = useState('500')

  // Add Debt Form State
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState('')
  const [color, setColor] = useState('#ef4444')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Aggregates
  const totalDebt = debts.reduce((sum, d) => sum + Number(d.amount), 0)
  const totalAnnualInterest = debts.reduce((sum, d) => sum + Number(d.amount) * (Number(d.interest_rate) / 100), 0)

  // Prioritization Order
  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === 'avalanche') {
      return Number(b.interest_rate) - Number(a.interest_rate) // Highest APR first
    } else {
      return Number(a.amount) - Number(b.amount) // Smallest balance first
    }
  })

  // Estimated Months to Debt-Free
  const paymentNum = parseFloat(monthlyPaymentTarget) || 500
  const estimatedMonthsToDebtFree = totalDebt > 0 && paymentNum > 0
    ? Math.ceil(totalDebt / paymentNum)
    : 0

  async function handleAddDebt(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !amount) return
    const amt = parseFloat(amount)
    if (isNaN(amt)) return
    const r = parseFloat(rate) || 0
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('debts')
        .insert({
          user_id: userId,
          name: name.trim(),
          amount: amt,
          interest_rate: r,
          color,
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setDebts([data, ...debts])
        setIsAddOpen(false)
        setName('')
        setAmount('')
        setRate('')
        router.refresh()
      }
    } catch (err: any) {
      alert(`Error adding debt liability: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handlePaydown(e: React.FormEvent) {
    e.preventDefault()
    if (!payModalDebt || !payAmount) return
    const payment = parseFloat(payAmount)
    if (isNaN(payment) || payment <= 0) return

    const newAmount = Math.max(0, Number(payModalDebt.amount) - payment)

    try {
      if (newAmount === 0) {
        await supabase.from('debts').delete().eq('id', payModalDebt.id)
        setDebts(prev => prev.filter(d => d.id !== payModalDebt.id))
        alert(`🎉 Congratulations! You have fully paid off "${payModalDebt.name}"!`)
      } else {
        const { error } = await supabase
          .from('debts')
          .update({ amount: newAmount })
          .eq('id', payModalDebt.id)

        if (error) throw error

        setDebts(prev => prev.map(d => (d.id === payModalDebt.id ? { ...d, amount: newAmount } : d)))
      }

      // Log expense transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'expense',
        amount: payment,
        description: `[Debt Payment] ${payModalDebt.name}`,
        transaction_date: new Date().toISOString().split('T')[0],
        source_type: 'manual',
      })

      setPayModalDebt(null)
      setPayAmount('')
      router.refresh()
    } catch (err: any) {
      alert(`Error applying payment: ${err.message}`)
    }
  }

  async function handleDeleteDebt(id: string) {
    if (!confirm('Are you sure you want to remove this debt record?')) return

    try {
      const { error } = await supabase.from('debts').delete().eq('id', id)
      if (error) throw error

      setDebts(debts.filter(d => d.id !== id))
      router.refresh()
    } catch (err: any) {
      alert(`Error deleting debt: ${err.message}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingDown style={{ color: '#ef4444' }} size={26} /> Debt Payoff Command Center
          </h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: 14 }}>
            Accelerate debt freedom using Avalanche or Snowball payoff strategies
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            border: 'none',
            borderRadius: 12,
            padding: '10px 20px',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
          }}
        >
          <Plus size={18} /> Add Liability
        </button>
      </div>

      {/* Hero Metrics Dashboard */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(245,158,11,0.05) 100%)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 20,
          padding: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
        }}
      >
        <div>
          <span style={{ fontSize: 12, color: '#fca5a5', fontWeight: 600, letterSpacing: '0.05em' }}>TOTAL OUTSTANDING LIABILITIES</span>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#ef4444', marginTop: 4, letterSpacing: '-0.02em' }}>
            {totalDebt.toLocaleString()} {currency}
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'block' }}>
            Across {debts.length} active credit lines & loans
          </span>
        </div>

        <div>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>ESTIMATED ANNUAL INTEREST COST</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>
            ~{Math.round(totalAnnualInterest).toLocaleString()} {currency} / yr
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'block' }}>
            Based on APR rates
          </span>
        </div>

        <div>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>ESTIMATED TIME TO DEBT-FREE</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#D9FF5B', marginTop: 4 }}>
            {estimatedMonthsToDebtFree > 0 ? `~${estimatedMonthsToDebtFree} Months` : 'Debt Free! 🎉'}
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'block' }}>
            At {paymentNum.toLocaleString()} {currency}/mo total allocation
          </span>
        </div>
      </div>

      {/* Payoff Strategy Selector Bar */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame style={{ color: '#f59e0b' }} size={18} /> Payoff Strategy Prioritization
          </span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Order your debt cards to maximize interest savings or quick wins</span>
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setStrategy('avalanche')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: strategy === 'avalanche' ? '#ef4444' : 'transparent',
              color: strategy === 'avalanche' ? '#fff' : '#cbd5e1',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ⚡ Avalanche (Highest APR)
          </button>
          <button
            onClick={() => setStrategy('snowball')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: strategy === 'snowball' ? '#3b82f6' : 'transparent',
              color: strategy === 'snowball' ? '#fff' : '#cbd5e1',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ❄️ Snowball (Smallest Balance)
          </button>
        </div>
      </div>

      {/* Debts Grid */}
      <StaggerGroup className="stats-grid">
        {debts.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <CheckCircle2 size={44} style={{ color: '#10b981', marginBottom: 12 }} />
            <h3 style={{ color: '#f8fafc', margin: '0 0 6px 0' }}>You Are 100% Debt Free!</h3>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>No outstanding loans or credit liabilities logged. Keep building your wealth!</p>
          </div>
        ) : (
          sortedDebts.map((debt, index) => {
            const annualInterest = debt.amount * (debt.interest_rate / 100)
            const isPriorityTarget = index === 0

            return (
              <StaggerItem
                key={debt.id}
                className="stat-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 16,
                  border: isPriorityTarget ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: isPriorityTarget ? 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(15,23,42,0.8) 100%)' : 'rgba(255,255,255,0.03)',
                  position: 'relative',
                }}
              >
                {isPriorityTarget && (
                  <div style={{ position: 'absolute', top: -10, right: 14, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, letterSpacing: '0.05em' }}>
                    #{index + 1} PRIORITY TARGET
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: debt.color, boxShadow: `0 0 12px ${debt.color}80` }} />
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>{debt.name}</h3>
                    </div>
                    <button
                      onClick={() => handleDeleteDebt(debt.id)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Outstanding Balance</span>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#ef4444', marginTop: 2 }}>
                      {debt.amount.toLocaleString()} {currency}
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '3px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                        {debt.interest_rate}% APR
                      </span>
                      {debt.interest_rate > 0 && (
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                          ~{Math.round(annualInterest).toLocaleString()} {currency}/yr interest
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setPayModalDebt(debt); setPayAmount(''); }}
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    color: '#22c55e',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    width: '100%',
                  }}
                >
                  <ArrowDownRight size={16} /> Log Payment / Reduce Balance
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
            <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: 18 }}>Add Debt Liability</h3>
            <form onSubmit={handleAddDebt} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Debt / Loan Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chase Credit Card, Auto Loan"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Outstanding Balance ({currency})</label>
                  <input
                    type="number"
                    placeholder="2500"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Interest Rate (APR %)</label>
                  <input
                    type="number"
                    placeholder="18.5"
                    step="0.1"
                    value={rate}
                    onChange={e => setRate(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Color Badge</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'].map(c => (
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
                  style={{ background: '#ef4444', border: 'none', borderRadius: 10, padding: '8px 18px', color: '#fff', fontWeight: 700 }}
                >
                  Save Debt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payoff Payment Modal */}
      {payModalDebt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: 380, background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 24 }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#f8fafc', fontSize: 16 }}>Make Payment on {payModalDebt.name}</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px 0' }}>
              Current balance: <strong>{payModalDebt.amount.toLocaleString()} {currency}</strong>
            </p>

            <form onSubmit={handlePaydown} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Payment Amount ({currency})</label>
                <input
                  type="number"
                  placeholder="500"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  required
                  autoFocus
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 18 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setPayModalDebt(null)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 16px', color: '#cbd5e1' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#22c55e', border: 'none', borderRadius: 10, padding: '8px 18px', color: '#080A09', fontWeight: 700 }}
                >
                  Apply Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
