'use client'
import React, { useState, useTransition, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { StaggerGroup, StaggerItem } from '@/components/Stagger'
import type { Category, Budget } from '@/lib/types'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Plus,
  Trash2,
  Edit3,
  BarChart3,
  PieChart as PieIcon,
  Zap,
} from 'lucide-react'

interface Props {
  categories: Category[]
  budgets: Budget[]
  transactions: { category_id: string | null; amount: number; type: string }[]
  userId: string
  month: number
  year: number
  currency: string
}

export default function BudgetManager({
  categories,
  budgets,
  transactions,
  userId,
  month,
  year,
  currency,
}: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n)

  // Map category spent and budgets
  const spentByCat = useMemo(() => {
    return transactions.reduce((acc: Record<string, number>, t) => {
      if (t.category_id && t.type === 'expense') {
        acc[t.category_id] = (acc[t.category_id] ?? 0) + Number(t.amount)
      }
      return acc
    }, {})
  }, [transactions])

  const budgetByCat = useMemo(() => {
    return budgets.reduce((acc: Record<string, Budget>, b) => {
      if (b.category_id) acc[b.category_id] = b
      return acc
    }, {})
  }, [budgets])

  // Aggregates
  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0)
  const totalSpent = Object.values(spentByCat).reduce((s, n) => s + n, 0)
  const totalRemaining = Math.max(0, totalBudget - totalSpent)
  const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
  const overallStatus = overallPct < 75 ? 'safe' : overallPct < 90 ? 'warning' : 'danger'

  // Chart Data preparation
  const chartData = useMemo(() => {
    return categories
      .map(cat => {
        const spent = spentByCat[cat.id] ?? 0
        const limit = budgetByCat[cat.id]?.amount ?? 0
        return {
          name: cat.name.split(' ')[0],
          fullName: cat.name,
          Budget: limit,
          Spent: spent,
          color: cat.color || '#6366f1',
        }
      })
      .filter(item => item.Budget > 0 || item.Spent > 0)
  }, [categories, spentByCat, budgetByCat])

  // Pie Chart Data (Category Budget Distribution)
  const pieData = useMemo(() => {
    return chartData
      .filter(item => item.Budget > 0)
      .map(item => ({
        name: item.fullName,
        value: item.Budget,
        color: item.color,
      }))
  }, [chartData])

  async function saveBudget(categoryId: string) {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) return
    const existing = budgetByCat[categoryId]

    startTransition(async () => {
      if (existing) {
        await supabase.from('budgets').update({ amount: parsed }).eq('id', existing.id)
      } else {
        await supabase
          .from('budgets')
          .insert({ user_id: userId, category_id: categoryId, amount: parsed, month, year })
      }
      setEditing(null)
      setAmount('')
      router.refresh()
    })
  }

  async function deleteBudget(categoryId: string) {
    const existing = budgetByCat[categoryId]
    if (!existing) return

    startTransition(async () => {
      await supabase.from('budgets').delete().eq('id', existing.id)
      router.refresh()
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Target style={{ color: '#D9FF5B' }} size={26} /> Monthly Budget Intelligence
          </h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: 14 }}>
            Set category limits, monitor real-time spending velocity, and prevent budget overruns
          </p>
        </div>
      </div>

      {/* Hero Overview Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(217,255,91,0.08) 0%, rgba(99,102,241,0.04) 100%)',
          border: '1px solid rgba(217,255,91,0.2)',
          borderRadius: 20,
          padding: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
        }}
      >
        <div>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>TOTAL MONTHLY BUDGET</span>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#D9FF5B', marginTop: 4, letterSpacing: '-0.02em' }}>
            {fmt(totalBudget)}
          </div>
          <span style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4, display: 'block' }}>
            Across {budgets.length} configured category targets
          </span>
        </div>

        <div>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>ACTUAL SPENT THIS MONTH</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: overallStatus === 'danger' ? '#ef4444' : '#f8fafc', marginTop: 4 }}>
            {fmt(totalSpent)}
          </div>
          <span style={{ fontSize: 12, color: overallStatus === 'danger' ? '#ef4444' : '#10b981', marginTop: 4, display: 'block' }}>
            {totalBudget > 0 ? `${Math.round(overallPct)}% of total budget limit used` : 'No limits set'}
          </span>
        </div>

        <div>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>REMAINING SAFE SPEND</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
            {fmt(totalRemaining)}
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'block' }}>
            Remaining allowance for current month
          </span>
        </div>
      </div>

      {/* Charts Section */}
      {chartData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {/* Bar Chart: Budget vs Actual Spent */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BarChart3 size={18} style={{ color: '#D9FF5B' }} />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>Budget vs. Actual Spending</h3>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff' }}
                    formatter={(val: any) => fmt(Number(val))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="Budget" fill="rgba(217,255,91,0.4)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Budget Distribution */}
          {pieData.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <PieIcon size={18} style={{ color: '#6366f1' }} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>Category Allocation Distribution</h3>
              </div>
              <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff' }}
                      formatter={(val: any) => fmt(Number(val))}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Budgets Grid */}
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>
          Category Limits ({categories.length})
        </h3>

        <StaggerGroup className="full-grid" style={{ gap: 14 }}>
          {categories.map(cat => {
            const spent = spentByCat[cat.id] ?? 0
            const budget = budgetByCat[cat.id]
            const limit = budget?.amount ?? 0
            const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
            const isOver = limit > 0 && spent > limit
            const status = isOver ? 'danger' : pct > 80 ? 'warning' : 'safe'
            const isEdit = editing === cat.id

            return (
              <StaggerItem key={cat.id} className="budget-item">
                <div className="budget-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: `${cat.color || '#6366f1'}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                      }}
                    >
                      {cat.icon || '📌'}
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>{cat.name}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0 0' }}>
                        {fmt(spent)} spent
                        {limit > 0 && (
                          <span style={{ color: isOver ? '#ef4444' : '#64748b' }}>
                            {' '}/ {fmt(limit)} limit
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {limit > 0 && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: isOver ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981',
                          background: isOver ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.06)',
                          padding: '2px 8px',
                          borderRadius: 8,
                        }}
                      >
                        {isOver ? '🚨 Over Budget' : `${Math.round(pct)}%`}
                      </span>
                    )}

                    <button
                      id={`edit-budget-${cat.id.slice(0, 8)}`}
                      onClick={() => {
                        setEditing(cat.id)
                        setAmount(limit > 0 ? String(limit) : '')
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        padding: '6px 12px',
                        color: '#cbd5e1',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {limit > 0 ? 'Edit' : '+ Set Limit'}
                    </button>

                    {limit > 0 && (
                      <button
                        id={`del-budget-${cat.id.slice(0, 8)}`}
                        onClick={() => deleteBudget(cat.id)}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}
                        title="Remove Limit"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {limit > 0 && (
                  <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginTop: 12, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: isOver ? '#ef4444' : status === 'warning' ? '#f59e0b' : cat.color || '#10b981',
                        borderRadius: 4,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                )}

                {isEdit && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <input
                      id={`budget-amount-${cat.id.slice(0, 8)}`}
                      type="number"
                      placeholder="Enter limit amount"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      min="1"
                      autoFocus
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        color: '#fff',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                    <button
                      id={`save-budget-${cat.id.slice(0, 8)}`}
                      onClick={() => saveBudget(cat.id)}
                      disabled={pending}
                      style={{
                        background: '#D9FF5B',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 14px',
                        color: '#080A09',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Save
                    </button>
                    <button
                      id={`cancel-budget-${cat.id.slice(0, 8)}`}
                      onClick={() => setEditing(null)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 12px',
                        color: '#cbd5e1',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </StaggerItem>
            )
          })}
        </StaggerGroup>
      </div>
    </div>
  )
}
