'use client'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { RecurringTransaction, Category } from '@/lib/types'

interface RecurringManagerProps {
  initialItems: RecurringTransaction[]
  categories: Category[]
  userId: string
  currency: string
}

export default function RecurringManager({ initialItems, categories, userId, currency }: RecurringManagerProps) {
  const [items, setItems] = useState<RecurringTransaction[]>(initialItems)
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Form fields
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  async function handleCreateRecurring(e: React.FormEvent) {
    e.preventDefault()
    if (!description || !amount) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({
          user_id: userId,
          type,
          description,
          amount: parseFloat(amount),
          category_id: categoryId || null,
          frequency,
          next_due_date: nextDueDate,
          is_active: true,
          auto_post: false,
        })
        .select('*, categories(*)')
        .single()

      if (error) throw error

      setItems(prev => [data, ...prev])
      setIsAddOpen(false)
      setDescription('')
      setAmount('')
      setCategoryId('')
      router.refresh()
    } catch (err: any) {
      alert(`Error creating recurring transaction: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handlePostNow(item: RecurringTransaction) {
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: userId,
        type: item.type,
        amount: item.amount,
        description: `[Recurring] ${item.description}`,
        category_id: item.category_id,
        transaction_date: new Date().toISOString().split('T')[0],
        source_type: 'manual',
      })

      if (error) throw error

      alert(`Posted transaction: ${item.description} (${item.amount} ${currency})`)
      router.refresh()
    } catch (err: any) {
      alert(`Error posting transaction: ${err.message}`)
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ is_active: !currentActive })
        .eq('id', id)

      if (error) throw error

      setItems(prev => prev.map(i => (i.id === id ? { ...i, is_active: !currentActive } : i)))
      router.refresh()
    } catch (err: any) {
      alert(`Error updating recurring status: ${err.message}`)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this recurring schedule?')) return

    try {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
      if (error) throw error
      setItems(prev => prev.filter(i => i.id !== id))
      router.refresh()
    } catch (err: any) {
      alert(`Error deleting recurring schedule: ${err.message}`)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#f1f5f9' }}>Recurring Transactions</h2>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Automate subscriptions, monthly rent, utilities, and recurring income</span>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #D9FF5B 0%, #b3ff00 100%)',
            border: 'none',
            borderRadius: 12,
            padding: '10px 18px',
            color: '#080A09',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          + Add Schedule
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 40 }}>🔄</span>
            <h3 style={{ color: '#f1f5f9', margin: '12px 0 6px 0' }}>No Recurring Schedules</h3>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Schedule monthly expenses like Netflix, Rent, Gym, or Salary payouts.</p>
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: item.type === 'income' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: item.type === 'income' ? '#22c55e' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  {item.type === 'income' ? '💰' : '💸'}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>{item.description}</h4>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' }}>
                      {item.frequency} • Next Due: {item.next_due_date}
                    </span>
                    {item.categories && (
                      <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 10, color: '#cbd5e1' }}>
                        {item.categories.icon} {item.categories.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: item.type === 'income' ? '#22c55e' : '#f8fafc' }}>
                  {item.type === 'income' ? '+' : '-'}{Number(item.amount).toLocaleString()} {currency}
                </span>

                <button
                  onClick={() => handlePostNow(item)}
                  style={{
                    background: 'rgba(217, 255, 91, 0.15)',
                    border: '1px solid rgba(217, 255, 91, 0.3)',
                    color: '#D9FF5B',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Post Now
                </button>

                <button
                  onClick={() => handleToggleActive(item.id, item.is_active)}
                  style={{
                    background: item.is_active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.06)',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 10px',
                    color: item.is_active ? '#22c55e' : '#64748b',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {item.is_active ? 'Active' : 'Paused'}
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: 440, background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: 18 }}>Schedule Recurring Transaction</h3>
            <form onSubmit={handleCreateRecurring} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  style={{ flex: 1, padding: 8, borderRadius: 8, border: 'none', background: type === 'expense' ? '#ef4444' : 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 600 }}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  style={{ flex: 1, padding: 8, borderRadius: 8, border: 'none', background: type === 'income' ? '#22c55e' : 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 600 }}
                >
                  Income
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Netflix Subscription"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Amount ({currency})</label>
                  <input
                    type="number"
                    placeholder="15"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Frequency</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as any)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff' }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Next Due Date</label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={e => setNextDueDate(e.target.value)}
                  required
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, color: '#fff' }}
                />
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
                  style={{ background: '#D9FF5B', border: 'none', borderRadius: 10, padding: '8px 18px', color: '#080A09', fontWeight: 600 }}
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
