'use client'
import React, { useState } from 'react'
import { Eye, EyeOff, Wifi } from 'lucide-react'

interface Props {
  balance: number
  income: number
  expenses: number
  currency: string
  cardholderName?: string
  showNumbers?: boolean
  onToggleShowNumbers?: () => void
}

export default function CreditCardDisplay({
  balance,
  income,
  expenses,
  currency,
  cardholderName = 'VALUED MEMBER',
  showNumbers = true,
  onToggleShowNumbers,
}: Props) {
  const [activeCardType, setActiveCardType] = useState<'debit' | 'credit'>('debit')

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)

  const maskedBalance = '$••••••••'
  const displayAmount = showNumbers ? fmt(balance) : maskedBalance

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Card Type Switcher & Privacy Toggle Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setActiveCardType('debit')}
            style={{
              padding: '4px 12px',
              borderRadius: 7,
              border: 'none',
              background: activeCardType === 'debit' ? '#D9FF5B' : 'transparent',
              color: activeCardType === 'debit' ? '#080A09' : '#cbd5e1',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Debit / Checking
          </button>
          <button
            onClick={() => setActiveCardType('credit')}
            style={{
              padding: '4px 12px',
              borderRadius: 7,
              border: 'none',
              background: activeCardType === 'credit' ? '#3b82f6' : 'transparent',
              color: activeCardType === 'credit' ? '#fff' : '#cbd5e1',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Credit Platinum
          </button>
        </div>

        {/* Global Privacy Toggle Eye */}
        {onToggleShowNumbers && (
          <button
            onClick={onToggleShowNumbers}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '6px 12px',
              color: '#cbd5e1',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title={showNumbers ? 'Hide sensitive balance info' : 'Show balance info'}
          >
            {showNumbers ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>{showNumbers ? 'Hide Info' : 'Show Info'}</span>
          </button>
        )}
      </div>

      {/* Glassmorphic Bank Card */}
      <div
        style={{
          width: '100%',
          minHeight: 210,
          background: activeCardType === 'debit'
            ? 'linear-gradient(135deg, #090d16 0%, #1e293b 50%, #0f172a 100%)'
            : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)',
          border: activeCardType === 'debit' ? '1px solid rgba(217, 255, 91, 0.35)' : '1px solid rgba(129, 140, 248, 0.4)',
          borderRadius: 24,
          padding: 24,
          boxShadow: activeCardType === 'debit'
            ? '0 12px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(217, 255, 91, 0.3)'
            : '0 12px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(129, 140, 248, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Gloss Line */}
        <div
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: activeCardType === 'debit'
              ? 'radial-gradient(circle, rgba(217,255,91,0.15) 0%, rgba(217,255,91,0) 70%)'
              : 'radial-gradient(circle, rgba(129,140,248,0.2) 0%, rgba(129,140,248,0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        {/* Card Header: Brand & Wireless Chip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Metallic Gold EMV Chip */}
            <div
              style={{
                width: 38,
                height: 28,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: '1px solid #fef08a',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: '80%', height: '60%', border: '1px solid rgba(0,0,0,0.3)', borderRadius: 2 }} />
            </div>
            <Wifi size={18} style={{ color: '#94a3b8', transform: 'rotate(90deg)' }} />
          </div>

          <span style={{ fontSize: 13, fontWeight: 800, color: activeCardType === 'debit' ? '#D9FF5B' : '#a78bfa', letterSpacing: '0.1em' }}>
            {activeCardType === 'debit' ? 'SPENDWISE DEBIT' : 'SPENDWISE PLATINUM'}
          </span>
        </div>

        {/* Middle: Main Balance & Masked Card Number */}
        <div style={{ margin: '14px 0' }}>
          <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            {activeCardType === 'debit' ? 'AVAILABLE CHECKING BALANCE' : 'CREDIT LIMIT AVAILABLE'}
          </span>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginTop: 2 }}>
            {displayAmount}
          </div>

          <div style={{ fontSize: 13, color: '#94a3b8', letterSpacing: '0.25em', marginTop: 8, fontFamily: 'monospace' }}>
            {showNumbers ? '•••• •••• •••• 8842' : '•••• •••• •••• ••••'}
          </div>
        </div>

        {/* Card Footer: Cardholder & Expiry */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <span style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>CARDHOLDER</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.05em' }}>
              {cardholderName.toUpperCase()}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>EXPIRES</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.05em' }}>
              12/28
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
