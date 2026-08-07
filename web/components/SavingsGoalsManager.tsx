'use client'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { SavingsGoal } from '@/lib/types'
import { StaggerGroup, StaggerItem } from './Stagger'
import {
  Target,
  PiggyBank,
  TrendingUp,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react'

interface SavingsGoalsManagerProps {
  initialGoals: SavingsGoal[]
  userId: string
  currency: string
}

const EMOJI_OPTIONS = ['🎯', '🚗', '🏡', '💻', '✈️', '🎓', '💍', '🏖️', '🏥', '🚀', '🏦', '📱']
const COLOR_OPTIONS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#0ea5e9', '#D9FF5B']

export default function SavingsGoalsManager({ initialGoals, userId, currency }: SavingsGoalsManagerProps) {
  const [goals, setGoals] = useState<SavingsGoal[]>(initialGoals)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [depositModalGoal, setDepositModalGoal] = useState<SavingsGoal | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositType, setDepositType] = useState<'deposit' | 'withdraw'>('deposit')

  // Form State
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [icon, setIcon] = useState('🎯')
  const [color, setColor] = useState('#10b981')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Aggregates
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount), 0)
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0)
  const overallPercentage = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0
  const completedCount = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !targetAmount) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .insert({
          user_id: userId,
          name: name.trim(),
          target_amount: parseFloat(targetAmount),
          current_amount: currentAmount ? parseFloat(currentAmount) : 0,
          target_date: targetDate || null,
          icon,
          color,
        })
        .select('*')
        .single()

      if (error) throw error

      setGoals(prev => [data, ...prev])
      setIsAddOpen(false)
      setName('')
      setTargetAmount('')
      setCurrentAmount('')
      setTargetDate('')
      router.refresh()
    } catch (err: any) {
      alert(`Error creating savings goal: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateFunds(e: React.FormEvent) {
    e.preventDefault()
    if (!depositModalGoal || !depositAmount) return
    const val = parseFloat(depositAmount)
    if (isNaN(val) || val <= 0) return

    const currentVal = Number(depositModalGoal.current_amount)
    const newCurrent = depositType === 'deposit'
      ? currentVal + val
      : Math.max(0, currentVal - val)

    try {
      const { error } = await supabase
        .from('savings_goals')
        .update({ current_amount: newCurrent })
        .eq('id', depositModalGoal.id)

      if (error) throw error

      setGoals(prev => prev.map(g => (g.id === depositModalGoal.id ? { ...g, current_amount: newCurrent } : g)))
      setDepositModalGoal(null)
      setDepositAmount('')
      router.refresh()
    } catch (err: any) {
      alert(`Error updating funds: ${err.message}`)
    }
  }

  async function handleDeleteGoal(id: string) {
    if (!confirm('Are you sure you want to delete this savings goal?')) return

    try {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id)
      if (error) throw error

      setGoals(prev => prev.filter(g => g.id !== id))
      router.refresh()
    } catch (err: any) {
      alert(`Error deleting goal: ${err.message}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <PiggyBank style={{ color: '#D9FF5B' }} size={26} /> Savings & Milestone Vault
          </h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: 14 }}>
            Set, deposit, and track progress toward financial freedom targets
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
            boxShadow: '0 4px 14px rgba(217, 255, 91, 0.25)',
          }}
        >
          <Plus size={18} /> New Savings Goal
        </button>
      </div>

      {/* Hero Overview Banner */}
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
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>TOTAL FUNDS SAVED</span>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#D9FF5B', marginTop: 4, letterSpacing: '-0.02em' }}>
            {totalSaved.toLocaleString()} {currency}
          </div>
          <span style={{ fontSize: 12, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <TrendingUp size={14} /> Overall Target: {totalTarget.toLocaleString()} {currency}
          </span>
        </div>

        <div>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>OVERALL SAVINGS COMPLETION</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
            {overallPercentage}% Reached
          </div>
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: `${overallPercentage}%`, height: '100%', background: '#D9FF5B', borderRadius: 3 }} />
          </div>
        </div>

        <div>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>MILESTONES ACHIEVED</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
            {completedCount} of {goals.length} Goals Completed
          </div>
          <span style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4, display: 'block' }}>
            {goals.length - completedCount} active goals in progress
          </span>
        </div>
      </div>

      {/* Goals Grid */}
      <StaggerGroup className="stats-grid">
        {goals.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Target size={44} style={{ color: '#64748b', marginBottom: 12 }} />
            <h3 style={{ color: '#f8fafc', margin: '0 0 6px 0' }}>No Savings Goals Set Yet</h3>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Create your first milestone like "Emergency Fund", "New Laptop", or "Vacation".</p>
          </div>
        ) : (
          goals.map(goal => {
            const current = Number(goal.current_amount)
            const target = Number(goal.target_amount)
            const percent = Math.min(100, Math.round((current / target) * 100))
            const isCompleted = current >= target
            const remaining = Math.max(0, target - current)

            return (
              <StaggerItem
                key={goal.id}
                className="stat-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 16,
                  border: isCompleted ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: isCompleted ? 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(15,23,42,0.8) 100%)' : 'rgba(255,255,255,0.03)',
                  position: 'relative',
                }}
              >
                {isCompleted && (
                  <div style={{ position: 'absolute', top: -10, right: 14, background: '#10b981', color: '#080A09', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, letterSpacing: '0.05em' }}>
                    🎉 GOAL REACHED!
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: `${goal.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                        {goal.icon}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, color: '#f8fafc', fontSize: 16, fontWeight: 700 }}>{goal.name}</h3>
                        {goal.target_date && (
                          <span style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Calendar size={12} /> Target: {goal.target_date}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Progress Bar & Stats */}
                  <div style={{ marginTop: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                      <span style={{ color: '#cbd5e1' }}>Saved: <strong>{current.toLocaleString()} {currency}</strong></span>
                      <span style={{ color: '#94a3b8' }}>Target: {target.toLocaleString()} {currency}</span>
                    </div>

                    <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: goal.color, borderRadius: 5, transition: 'width 0.5s ease' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                      <span style={{ color: goal.color, fontWeight: 600 }}>{percent}% Complete</span>
                      <span>{isCompleted ? 'Target Achieved' : `Remaining: ${remaining.toLocaleString()} ${currency}`}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setDepositModalGoal(goal); setDepositType('deposit'); setDepositAmount(''); }}
                    style={{
                      flex: 1,
                      background: 'rgba(217, 255, 91, 0.15)',
                      border: '1px solid rgba(217, 255, 91, 0.3)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      color: '#D9FF5B',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <ArrowUpRight size={14} /> Deposit
                  </button>

                  <button
                    onClick={() => { setDepositModalGoal(goal); setDepositType('withdraw'); setDepositAmount(''); }}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      color: '#94a3b8',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ArrowDownLeft size={14} /> Withdraw
                  </button>
                </div>
              </StaggerItem>
            )
          })
        )}
      </StaggerGroup>

      {/* Create Goal Modal */}
      {isAddOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: 440, background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: 18 }}>Create Savings Goal</h3>
            <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vacation Fund, Laptop Savings"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Target Amount ({currency})</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    required
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Starting Amount</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={currentAmount}
                    onChange={e => setCurrentAmount(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Target Completion Date (Optional)</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff' }}
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Icon</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {EMOJI_OPTIONS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setIcon(e)}
                      style={{
                        fontSize: 18,
                        background: icon === e ? 'rgba(217, 255, 91, 0.2)' : 'rgba(255,255,255,0.04)',
                        border: icon === e ? '1px solid #D9FF5B' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        padding: '4px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Theme Accent</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {COLOR_OPTIONS.map(c => (
                    <div
                      key={c}
                      onClick={() => setColor(c)}
                      style={{
                        width: 26,
                        height: 26,
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
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit / Withdraw Modal */}
      {depositModalGoal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: 380, background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 24 }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#f8fafc', fontSize: 16 }}>
              {depositType === 'deposit' ? '➕ Deposit Funds to' : '➖ Withdraw Funds from'} {depositModalGoal.name}
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px 0' }}>
              Current saved: <strong>{Number(depositModalGoal.current_amount).toLocaleString()} {currency}</strong>
            </p>

            <form onSubmit={handleUpdateFunds} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Amount ({currency})</label>
                <input
                  type="number"
                  placeholder="100"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  required
                  autoFocus
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 18 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setDepositModalGoal(null)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 16px', color: '#cbd5e1' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: depositType === 'deposit' ? '#D9FF5B' : '#ef4444', border: 'none', borderRadius: 10, padding: '8px 18px', color: depositType === 'deposit' ? '#080A09' : '#fff', fontWeight: 700 }}
                >
                  Confirm {depositType === 'deposit' ? 'Deposit' : 'Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
