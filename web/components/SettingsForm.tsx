'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { StaggerGroup, StaggerItem } from '@/components/Stagger'
import type { Profile, Category } from '@/lib/types'
import {
  User,
  Tag,
  ShieldCheck,
  Download,
  Bell,
  Check,
  Plus,
  Trash2,
  Lock,
  Globe,
  DollarSign,
  Sparkles,
} from 'lucide-react'

const CURRENCIES = ['ETB', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'PKR', 'INR', 'TRY', 'EGP']
const CATEGORY_ICONS = ['🍔','🚗','💡','🛍️','🎬','🏥','📚','✈️','🏦','📌','☕','🍕','🎮','💊','🏋️','🎵','💇','🐾','🏠','📱']
const CATEGORY_COLORS = ['#f59e0b','#3b82f6','#ef4444','#8b5cf6','#ec4899','#10b981','#0ea5e9','#f97316','#22c55e','#6b7280','#e11d48','#7c3aed','#0891b2','#16a34a','#9333ea']

interface Props {
  profile: Profile | null
  categories: Category[]
  userId: string
  email: string
}

type TabType = 'profile' | 'categories' | 'security'

export default function SettingsForm({ profile, categories, userId, email }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  // Profile Form State
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [income, setIncome] = useState(String(profile?.monthly_income ?? ''))
  const [currency, setCurrency] = useState(profile?.currency ?? 'ETB')
  const [saved, setSaved] = useState(false)
  const [profilePending, startProfileTransition] = useTransition()

  // New Category State
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📌')
  const [newCatColor, setNewCatColor] = useState('#6b7280')
  const [catPending, startCatTransition] = useTransition()
  const [catMsg, setCatMsg] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const initials = (fullName || email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    startProfileTransition(async () => {
      await supabase.from('profiles').update({
        full_name: fullName.trim(),
        monthly_income: parseFloat(income) || 0,
        currency,
        updated_at: new Date().toISOString(),
      }).eq('id', userId)

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    })
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatName.trim()) return

    startCatTransition(async () => {
      const { error } = await supabase.from('categories').insert({
        user_id: userId,
        name: newCatName.trim(),
        icon: newCatIcon,
        color: newCatColor,
      })

      if (error) {
        setCatMsg('Error: ' + error.message)
        return
      }

      setNewCatName('')
      setCatMsg('Category created!')
      setTimeout(() => setCatMsg(''), 2500)
      router.refresh()
    })
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category? Existing transactions will remain in your database.')) return
    await supabase.from('categories').delete().eq('id', id)
    router.refresh()
  }

  async function handleExportCSV() {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })

    if (!transactions || transactions.length === 0) {
      alert('No transactions available to export.')
      return
    }

    const headers = ['ID', 'Date', 'Type', 'Amount', 'Description', 'Source']
    const rows = transactions.map(t => [
      t.id,
      t.transaction_date,
      t.type,
      t.amount,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.source_type,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `SpendWise_Export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <StaggerGroup delay={0.1} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Profile Header Badge */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(217,255,91,0.08) 0%, rgba(99,102,241,0.04) 100%)',
          border: '1px solid rgba(217,255,91,0.2)',
          borderRadius: 20,
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #D9FF5B 0%, #b3ff00 100%)',
            color: '#080A09',
            fontSize: 24,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(217, 255, 91, 0.25)',
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>
            {fullName || 'My Profile'}
          </h2>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{email}</span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 10, fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
            Currency: <strong>{currency}</strong>
          </span>
          <span style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 12px', borderRadius: 10, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
            Active Account
          </span>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            border: 'none',
            background: activeTab === 'profile' ? '#D9FF5B' : 'transparent',
            color: activeTab === 'profile' ? '#080A09' : '#cbd5e1',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <User size={16} /> Profile & Income
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            border: 'none',
            background: activeTab === 'categories' ? '#D9FF5B' : 'transparent',
            color: activeTab === 'categories' ? '#080A09' : '#cbd5e1',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Tag size={16} /> Expense Categories
        </button>

        <button
          onClick={() => setActiveTab('security')}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            border: 'none',
            background: activeTab === 'security' ? '#D9FF5B' : 'transparent',
            color: activeTab === 'security' ? '#080A09' : '#cbd5e1',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ShieldCheck size={16} /> Security & Export
        </button>
      </div>

      {/* TAB 1: Profile & Preferences */}
      {activeTab === 'profile' && (
        <StaggerItem className="card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} style={{ color: '#D9FF5B' }} /> Account Details & Preferences
          </h3>

          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                id="setting-name"
                type="text"
                className="form-input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Email (Verified)</label>
              <input
                type="email"
                className="form-input"
                value={email}
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Base Monthly Income</label>
                <input
                  id="setting-income"
                  type="number"
                  className="form-input"
                  value={income}
                  onChange={e => setIncome(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Primary Currency</label>
                <select
                  id="setting-currency"
                  className="form-select"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
              <button id="save-profile-btn" type="submit" className="btn btn-primary" disabled={profilePending}>
                {profilePending ? 'Saving...' : 'Save Profile Changes'}
              </button>
              {saved && (
                <span style={{ fontSize: 13, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={16} /> Preferences Saved!
                </span>
              )}
            </div>
          </form>
        </StaggerItem>
      )}

      {/* TAB 2: Categories */}
      {activeTab === 'categories' && (
        <StaggerItem className="card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag size={18} style={{ color: '#D9FF5B' }} /> Active Categories ({categories.length})
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {categories.map(cat => (
              <div
                key={cat.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${cat.color || '#64748b'}40`,
                }}
              >
                <span style={{ fontSize: 16 }}>{cat.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{cat.name}</span>
                {!cat.is_default && (
                  <button
                    id={`del-cat-${cat.id.slice(0, 8)}`}
                    onClick={() => deleteCategory(cat.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      opacity: 0.7,
                      marginLeft: 4,
                      padding: 0,
                    }}
                    title="Delete Category"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />

          {/* Add Category Form */}
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 14 }}>
            Create Custom Category
          </h4>

          <form onSubmit={addCategory} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Category Name</label>
              <input
                id="new-cat-name"
                type="text"
                className="form-input"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="e.g. Subscriptions, Gaming, Education"
              />
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: 8 }}>Select Icon</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORY_ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewCatIcon(icon)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      border: `2px solid ${newCatIcon === icon ? '#D9FF5B' : 'rgba(255,255,255,0.08)'}`,
                      background: newCatIcon === icon ? 'rgba(217, 255, 91, 0.15)' : 'transparent',
                      fontSize: 18,
                      cursor: 'pointer',
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: 8 }}>Accent Color</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORY_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCatColor(color)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: color,
                      border: `2px solid ${newCatColor === color ? 'white' : 'transparent'}`,
                      cursor: 'pointer',
                      boxShadow: newCatColor === color ? `0 0 12px ${color}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
              <button
                id="add-cat-btn"
                type="submit"
                className="btn btn-primary"
                disabled={catPending || !newCatName}
              >
                {catPending ? 'Adding...' : '+ Add Category'}
              </button>
              {catMsg && (
                <span style={{ fontSize: 13, color: catMsg.startsWith('Error') ? '#ef4444' : '#10b981' }}>
                  {catMsg}
                </span>
              )}
            </div>
          </form>
        </StaggerItem>
      )}

      {/* TAB 3: Security & Export */}
      {activeTab === 'security' && (
        <StaggerItem className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} style={{ color: '#10b981' }} /> Security & Data Privacy
            </h3>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: 13 }}>
              Your financial transactions are secured with Row Level Security (RLS) on Supabase.
            </p>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={16} style={{ color: '#D9FF5B' }} /> Export Financial Ledger
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, display: 'block' }}>
                Download all your expense and income records as a CSV file.
              </span>
            </div>

            <button
              onClick={handleExportCSV}
              style={{
                background: 'rgba(217, 255, 91, 0.15)',
                border: '1px solid rgba(217, 255, 91, 0.3)',
                borderRadius: 10,
                padding: '8px 16px',
                color: '#D9FF5B',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Download size={14} /> Download CSV
            </button>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: 16,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={16} style={{ color: '#6366f1' }} /> Password & Authentication
            </span>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0 0' }}>
              Your account uses Supabase Auth with OAuth & JWT encryption. To change your password, request a password reset email from the auth screen.
            </p>
          </div>
        </StaggerItem>
      )}
    </StaggerGroup>
  )
}
