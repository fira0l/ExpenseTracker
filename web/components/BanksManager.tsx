'use client'
import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StaggerGroup, StaggerItem } from './Stagger'

interface Bank {
  id: string
  name: string
  config: any
  is_active: boolean
}

export default function BanksManager({ initialBanks, userId }: { initialBanks: Bank[], userId: string }) {
  const [banks, setBanks] = useState<Bank[]>(initialBanks)
  const [adding, setAdding] = useState(false)
  const [plaidState, setPlaidState] = useState<'intro' | 'connecting' | 'success'>('intro')
  const [pending, startTransition] = useTransition()
  
  const router = useRouter()
  const supabase = createClient()

  function closeAdding() {
    setAdding(false)
    setTimeout(() => setPlaidState('intro'), 300)
  }

  async function connectMockBank() {
    setPlaidState('connecting')
    setTimeout(async () => {
      setPlaidState('success')
      const config = { institution: 'Chase Bank', type: 'Checking ending in 1234', balance: 4500.50 }
      const { data } = await supabase.from('automation_sources').insert({
        user_id: userId, type: 'bank_api', name: 'Chase Checking', config, is_active: true,
      }).select().single()
      
      if (data) {
        setBanks([data, ...banks])
      }

      setTimeout(() => {
        closeAdding()
        router.refresh()
      }, 2000)
    }, 2500)
  }

  async function deleteBank(id: string) {
    await supabase.from('automation_sources').delete().eq('id', id)
    setBanks(banks.filter(b => b.id !== id))
    router.refresh()
  }

  return (
    <div className="ag-container">
      {/* Background Depth Orbs */}
      <div className="ag-orb ag-orb-1" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 70%)' }} />
      <div className="ag-orb ag-orb-2" />

      <StaggerGroup className="ag-grid ag-grid-3">
        <StaggerItem className="card" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Connected Institutions</h2>
            <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
              Securely syncing with Plaid
            </div>
          </div>
          <button className="btn btn-primary" style={{ background: 'white', color: '#000' }} onClick={() => setAdding(true)}>+ Connect Bank</button>
        </StaggerItem>

        {banks.map(bank => (
          <StaggerItem key={bank.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 24 }}>🏦</div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{bank.name}</h3>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{bank.config?.institution || 'Bank'}</div>
                </div>
              </div>
              <button 
                onClick={() => deleteBank(bank.id)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}
              >
                ✕
              </button>
            </div>
            <div style={{ marginTop: 24, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Status</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                 <div style={{ width: 8, height: 8, borderRadius: '50%', background: bank.is_active ? '#10b981' : '#ef4444' }} />
                 <span style={{ fontSize: 14, color: '#f8fafc', fontWeight: 500 }}>{bank.is_active ? 'Actively Syncing' : 'Disconnected'}</span>
               </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>

      {/* Add Modal */}
      {adding && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeAdding()}>
          <div className="modal animate-slide-up" style={{ maxWidth: 400, background: '#ffffff', color: '#111827' }}>
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
          </div>
        </div>
      )}
    </div>
  )
}
