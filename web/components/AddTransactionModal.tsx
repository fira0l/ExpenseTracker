'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Category } from '@/lib/types'
import { parseBankSMS } from '@/lib/parser'
import ReceiptScannerModal from '@/components/ReceiptScannerModal'
import type { ReceiptScanResult } from '@/lib/types'
import {
  Plus,
  X,
  Camera,
  Clipboard,
  Calendar,
  FileText,
  DollarSign,
  Check,
  Tag,
} from 'lucide-react'

interface Props {
  categories: Category[]
  userId: string
  currency: string
}

export default function AddTransactionModal({ categories, userId, currency }: Props) {
  const [open, setOpen] = useState(false)
  const [scanModalOpen, setScanModalOpen] = useState(false)
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, startTransition] = useTransition()
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function reset() {
    setAmount('')
    setDescription('')
    setCategoryId('')
    setNotes('')
    setDate(new Date().toISOString().split('T')[0])
    setError('')
    setType('expense')
  }

  function handleScanComplete(result: ReceiptScanResult) {
    if (result.amount) setAmount(result.amount.toString())
    if (result.merchant) setDescription(result.merchant)
    if (result.date) setDate(result.date)
    if (result.type) setType(result.type)

    if (result.categoryName && categories.length > 0) {
      const matchedCat = categories.find(c =>
        c.name.toLowerCase().includes(result.categoryName!.toLowerCase())
      )
      if (matchedCat) setCategoryId(matchedCat.id)
    }

    if (result.rawText) {
      setNotes(`Scanned Receipt Text:\n${result.rawText}`)
    }
  }

  async function handlePasteSMS() {
    try {
      const text = await navigator.clipboard.readText()
      if (!text) {
        setError('Clipboard is empty')
        return
      }

      const parsed = parseBankSMS(text)
      if (parsed.amount) setAmount(parsed.amount.toString())
      setType(parsed.type)
      if (parsed.description && parsed.description !== 'Parsed Transaction') {
        setDescription(parsed.description)
      } else {
        setDescription(text.substring(0, 40) + '...')
      }
      if (parsed.date) {
        setNotes(`Date in SMS: ${parsed.date}\nRaw: ${text}`)
      } else {
        setNotes(`Raw SMS: ${text}`)
      }
      setError('')
    } catch (err) {
      setError('Please allow clipboard access to paste SMS automatically.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    setError('')

    startTransition(async () => {
      const { error: err } = await supabase.from('transactions').insert({
        user_id: userId,
        type,
        amount: parseFloat(amount),
        description: description || null,
        category_id: categoryId || null,
        notes: notes || null,
        transaction_date: date,
        source_type: 'manual',
      })
      if (err) {
        setError(err.message)
        return
      }
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  return (
    <>
      <button
        id="add-transaction-btn"
        className="btn btn-primary"
        onClick={() => setOpen(true)}
        style={{
          background: 'linear-gradient(135deg, #D9FF5B 0%, #b3ff00 100%)',
          color: '#080A09',
          fontWeight: 700,
          borderRadius: 12,
          padding: '10px 18px',
          boxShadow: '0 4px 16px rgba(217, 255, 91, 0.25)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Plus size={18} /> Add Transaction
      </button>

      <ReceiptScannerModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onScanComplete={handleScanComplete}
      />

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={e => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 500,
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 24,
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>
                  Log New Transaction
                </h2>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  Record an expense or income entry
                </span>
              </div>
              <button
                id="close-modal-btn"
                onClick={() => {
                  setOpen(false)
                  reset()
                }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Automation Actions */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => setScanModalOpen(true)}
                style={{
                  flex: 1,
                  background: 'rgba(217,255,91,0.1)',
                  border: '1px dashed #D9FF5B',
                  color: '#D9FF5B',
                  padding: '10px 14px',
                  borderRadius: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'all 0.2s',
                }}
              >
                <Camera size={16} /> Scan Receipt
              </button>

              <button
                type="button"
                onClick={handlePasteSMS}
                style={{
                  flex: 1,
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px dashed #6366f1',
                  color: '#a78bfa',
                  padding: '10px 14px',
                  borderRadius: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'all 0.2s',
                }}
              >
                <Clipboard size={16} /> Paste SMS
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Type Toggle Segmented Control */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 14,
                  padding: 4,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <button
                  id="toggle-expense"
                  type="button"
                  onClick={() => setType('expense')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 10,
                    border: 'none',
                    background: type === 'expense' ? '#ef4444' : 'transparent',
                    color: type === 'expense' ? '#fff' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  💸 Expense
                </button>
                <button
                  id="toggle-income"
                  type="button"
                  onClick={() => setType('income')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 10,
                    border: 'none',
                    background: type === 'income' ? '#10b981' : 'transparent',
                    color: type === 'income' ? '#fff' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  💰 Income
                </button>
              </div>

              {/* Amount Input Block */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16,
                  padding: '16px 20px',
                }}
              >
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
                  AMOUNT ({currency})
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: type === 'expense' ? '#ef4444' : '#10b981' }}>
                    {type === 'expense' ? '-' : '+'}
                  </span>
                  <input
                    id="amount-input"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: '#f8fafc',
                      fontSize: 32,
                      fontWeight: 800,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
                  DESCRIPTION / MERCHANT
                </label>
                <input
                  id="description-input"
                  type="text"
                  placeholder="e.g. Supermarket, Kaldi's Coffee, Salary..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: '#f8fafc',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Category Picker */}
              {categories.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>
                    CATEGORY
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                      gap: 8,
                      maxHeight: 150,
                      overflowY: 'auto',
                      paddingRight: 4,
                    }}
                  >
                    {categories.map(cat => {
                      const isSelected = categoryId === cat.id
                      return (
                        <button
                          key={cat.id}
                          id={`cat-${cat.name.toLowerCase().replace(/\s/g, '-')}`}
                          type="button"
                          onClick={() => setCategoryId(isSelected ? '' : cat.id)}
                          style={{
                            background: isSelected ? 'rgba(217, 255, 91, 0.15)' : 'rgba(255,255,255,0.04)',
                            border: isSelected ? '1.5px solid #D9FF5B' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 12,
                            padding: '8px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{cat.icon}</span>
                          <span style={{ fontSize: 12, color: isSelected ? '#D9FF5B' : '#cbd5e1', fontWeight: isSelected ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cat.name.split(' ')[0]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Date & Notes */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
                    DATE
                  </label>
                  <input
                    id="date-input"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      padding: '10px 12px',
                      color: '#f8fafc',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
                  NOTES (OPTIONAL)
                </label>
                <textarea
                  id="notes-input"
                  rows={2}
                  placeholder="Additional memo or raw text..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    color: '#f8fafc',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              {error && (
                <div style={{ color: '#fca5a5', fontSize: 13, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', padding: '10px 14px', borderRadius: 10 }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                id="submit-transaction-btn"
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: type === 'expense'
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: 14,
                  padding: 14,
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: loading ? 'wait' : 'pointer',
                  boxShadow: type === 'expense'
                    ? '0 4px 16px rgba(239, 68, 68, 0.3)'
                    : '0 4px 16px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s',
                  marginTop: 4,
                }}
              >
                {loading ? 'Saving...' : `Confirm & Save ${type === 'expense' ? 'Expense' : 'Income'}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
