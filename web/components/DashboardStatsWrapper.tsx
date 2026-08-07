'use client'
import React, { useState } from 'react'
import CreditCardDisplay from '@/components/CreditCardDisplay'
import SpendingChart from '@/components/SpendingChart'
import { StaggerGroup, StaggerItem } from '@/components/Stagger'
import type { TransactionWithCategory } from '@/lib/types'
import Link from 'next/link'
import { format } from 'date-fns'

interface Props {
  balance: number
  thisExpenses: number
  thisIncome: number
  monthlyIncome: number
  thisMonthTxCount: number
  savingsRate: number
  expenseChange: number
  currency: string
  cardholderName: string
  recentTx: TransactionWithCategory[]
  goals: any[]
  recurring: any[]
  chartData: any[]
}

export default function DashboardStatsWrapper({
  balance,
  thisExpenses,
  thisIncome,
  monthlyIncome,
  thisMonthTxCount,
  savingsRate,
  expenseChange,
  currency,
  cardholderName,
  recentTx,
  goals,
  recurring,
  chartData,
}: Props) {
  const [showNumbers, setShowNumbers] = useState(true)

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n)

  const mask = (valStr: string) => (showNumbers ? valStr : '$••••••')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Metallic Bank Credit / Debit Card Display */}
      <CreditCardDisplay
        balance={balance}
        income={monthlyIncome + thisIncome}
        expenses={thisExpenses}
        currency={currency}
        cardholderName={cardholderName}
        showNumbers={showNumbers}
        onToggleShowNumbers={() => setShowNumbers(!showNumbers)}
      />

      {/* Stats Grid */}
      <StaggerGroup className="stats-grid">
        <StaggerItem className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="stat-label">Monthly Balance</p>
              <p className="stat-value" style={{ color: balance >= 0 ? '#10b981' : '#f43f5e' }}>
                {mask(fmt(balance))}
              </p>
              <span className={`stat-change ${savingsRate >= 0 ? 'positive' : 'negative'}`}>
                {savingsRate >= 0 ? '↑' : '↓'} {Math.abs(savingsRate)}% savings rate
              </span>
            </div>
            <div style={{ fontSize: 28, opacity: 0.6 }}>💰</div>
          </div>
        </StaggerItem>

        <StaggerItem className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="stat-label">Total Expenses</p>
              <p className="stat-value" style={{ color: '#f43f5e' }}>{mask(fmt(thisExpenses))}</p>
              <span className={`stat-change ${expenseChange <= 0 ? 'positive' : 'negative'}`}>
                {expenseChange <= 0 ? '↓' : '↑'} {Math.abs(expenseChange)}% vs last month
              </span>
            </div>
            <div style={{ fontSize: 28, opacity: 0.6 }}>💸</div>
          </div>
        </StaggerItem>

        <StaggerItem className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="stat-label">Monthly Income</p>
              <p className="stat-value" style={{ color: '#10b981' }}>{mask(fmt(monthlyIncome + thisIncome))}</p>
              <span className="stat-change positive">↑ Logged income</span>
            </div>
            <div style={{ fontSize: 28, opacity: 0.6 }}>📈</div>
          </div>
        </StaggerItem>

        <StaggerItem className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="stat-label">Transactions</p>
              <p className="stat-value">{thisMonthTxCount}</p>
              <span className="stat-change positive">This month</span>
            </div>
            <div style={{ fontSize: 28, opacity: 0.6 }}>📋</div>
          </div>
        </StaggerItem>
      </StaggerGroup>

      {/* Main Content Grid */}
      <StaggerGroup className="content-grid" delay={0.2}>
        {/* Recent Transactions */}
        <StaggerItem className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 className="section-title">Recent Transactions</h2>
            <Link href="/dashboard/transactions" className="btn btn-ghost btn-sm">View all →</Link>
          </div>

          {recentTx.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧾</div>
              <p className="empty-title">No transactions yet</p>
              <p className="empty-description">Add your first expense or income to get started</p>
            </div>
          ) : (
            <div>
              {recentTx.map(tx => (
                <div key={tx.id} className="transaction-item">
                  <div
                    className="transaction-icon"
                    style={{ background: `${tx.categories?.color ?? '#6b7280'}20` }}
                  >
                    {tx.categories?.icon ?? '📌'}
                  </div>
                  <div className="transaction-info">
                    <p className="transaction-name">{tx.description || tx.categories?.name || 'Transaction'}</p>
                    <p className="transaction-date">
                      {format(new Date(tx.transaction_date + 'T00:00:00'), 'MMM d, yyyy')}
                      {tx.source_type !== 'manual' && (
                        <span style={{ marginLeft: 8, fontSize: 10, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: 99 }}>
                          {tx.source_type}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className={`transaction-amount ${tx.type}`}>
                    {tx.type === 'expense' ? '-' : '+'}{mask(fmt(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </StaggerItem>

        {/* Right Column Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Active Savings Goals Widget */}
          <StaggerItem className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🎯</span> Active Savings Goals
              </h2>
              <Link href="/dashboard/goals" className="btn btn-ghost btn-sm">All Goals →</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {goals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: 13 }}>
                  No savings goals set. <Link href="/dashboard/goals" style={{ color: '#D9FF5B' }}>Create a goal →</Link>
                </div>
              ) : (
                goals.map((g: any) => {
                  const current = Number(g.current_amount || 0)
                  const target = Number(g.target_amount || 1)
                  const pct = Math.min(100, Math.round((current / target) * 100))

                  return (
                    <div key={g.id} style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{g.icon || '🎯'} {g.name}</span>
                        <span style={{ fontSize: 12, color: '#D9FF5B', fontWeight: 600 }}>{pct}% ({mask(fmt(current))})</span>
                      </div>
                      <div className="progress-bar-track" style={{ height: 6 }}>
                        <div className="progress-bar-fill safe" style={{ width: `${pct}%`, background: g.color || '#10b981' }} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </StaggerItem>

          {/* Upcoming Recurring Items Widget */}
          <StaggerItem className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🔄</span> Recurring & Bills
              </h2>
              <Link href="/dashboard/recurring" className="btn btn-ghost btn-sm">Schedule →</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recurring.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: 13 }}>
                  No recurring schedules. <Link href="/dashboard/recurring" style={{ color: '#D9FF5B' }}>Add schedule →</Link>
                </div>
              ) : (
                recurring.map((r: any) => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{r.description}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>Due: {r.next_due_date} ({r.frequency})</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: r.type === 'income' ? '#10b981' : '#f8fafc' }}>
                      {r.type === 'income' ? '+' : '-'}{mask(fmt(r.amount))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </StaggerItem>

          {/* Category Chart */}
          {chartData.length > 0 && (
            <StaggerItem className="card">
              <h2 className="section-title" style={{ marginBottom: 16 }}>Category Spending</h2>
              <SpendingChart data={chartData} />
            </StaggerItem>
          )}
        </div>
      </StaggerGroup>
    </div>
  )
}
