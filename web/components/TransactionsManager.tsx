'use client'
import React, { useState, useMemo } from 'react'
import type { TransactionWithCategory, Category } from '@/lib/types'
import DeleteTransactionBtn from '@/components/DeleteTransactionBtn'
import AddTransactionModal from '@/components/AddTransactionModal'
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'

interface Props {
  initialTransactions: TransactionWithCategory[]
  categories: Category[]
  userId: string
  currency: string
}

type DatePreset = 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom'
type ViewMode = 'grouped' | 'table'

export default function TransactionsManager({
  initialTransactions,
  categories,
  userId,
  currency,
}: Props) {
  // State for filters
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [datePreset, setDatePreset] = useState<DatePreset>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  // View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')

  // Formatters
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n)

  // Filter & Sort Logic
  const filteredTransactions = useMemo(() => {
    const now = new Date()

    return initialTransactions.filter(t => {
      // 1. Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false

      // 2. Category filter
      if (categoryFilter !== 'all' && t.category_id !== categoryFilter) return false

      // 3. Source filter
      if (sourceFilter !== 'all' && t.source_type !== sourceFilter) return false

      // 4. Search term (description, category name, notes)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchDesc = t.description?.toLowerCase().includes(q)
        const matchCat = t.categories?.name.toLowerCase().includes(q)
        const matchNotes = t.notes?.toLowerCase().includes(q)
        if (!matchDesc && !matchCat && !matchNotes) return false
      }

      // 5. Date filter
      if (datePreset === 'today') {
        const todayStr = format(now, 'yyyy-MM-dd')
        if (t.transaction_date !== todayStr) return false
      } else if (datePreset === 'this_week') {
        const weekAgo = subDays(now, 7)
        const tDate = parseISO(t.transaction_date)
        if (tDate < weekAgo) return false
      } else if (datePreset === 'this_month') {
        const startM = startOfMonth(now)
        const endM = endOfMonth(now)
        const tDate = parseISO(t.transaction_date)
        if (!isWithinInterval(tDate, { start: startM, end: endM })) return false
      } else if (datePreset === 'last_month') {
        const prevM = subMonths(now, 1)
        const startM = startOfMonth(prevM)
        const endM = endOfMonth(prevM)
        const tDate = parseISO(t.transaction_date)
        if (!isWithinInterval(tDate, { start: startM, end: endM })) return false
      } else if (datePreset === 'custom') {
        if (startDate && t.transaction_date < startDate) return false
        if (endDate && t.transaction_date > endDate) return false
      }

      return true
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return b.transaction_date.localeCompare(a.transaction_date) || b.created_at.localeCompare(a.created_at)
      } else if (sortBy === 'date_asc') {
        return a.transaction_date.localeCompare(b.transaction_date) || a.created_at.localeCompare(b.created_at)
      } else if (sortBy === 'amount_desc') {
        return b.amount - a.amount
      } else if (sortBy === 'amount_asc') {
        return a.amount - b.amount
      }
      return 0
    })
  }, [initialTransactions, typeFilter, categoryFilter, sourceFilter, searchTerm, datePreset, startDate, endDate, sortBy])

  // Summary Metrics based on Active Filters
  const totalExpenses = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
  }, [filteredTransactions])

  const totalIncome = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  }, [filteredTransactions])

  const netCashflow = totalIncome - totalExpenses

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredTransactions.slice(start, start + pageSize)
  }, [filteredTransactions, currentPage, pageSize])

  // Grouped by date for grouped view mode
  const groupedPaginated = useMemo(() => {
    return paginatedTransactions.reduce((acc: Record<string, TransactionWithCategory[]>, t) => {
      const key = t.transaction_date
      if (!acc[key]) acc[key] = []
      acc[key].push(t)
      return acc
    }, {})
  }, [paginatedTransactions])

  // Export CSV Handler
  function handleExportCSV() {
    if (filteredTransactions.length === 0) return

    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Currency', 'Source', 'Notes']
    const rows = filteredTransactions.map(t => [
      t.transaction_date,
      t.type,
      `"${t.categories?.name || 'Uncategorized'}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.amount,
      currency,
      t.source_type,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Transactions_Export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function resetFilters() {
    setSearchTerm('')
    setTypeFilter('all')
    setCategoryFilter('all')
    setSourceFilter('all')
    setDatePreset('all')
    setStartDate('')
    setEndDate('')
    setSortBy('date_desc')
    setCurrentPage(1)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#f1f5f9' }}>Transactions</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: 14 }}>
            Filter, search, export, and manage your income & expenses
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              padding: '10px 16px',
              color: '#cbd5e1',
              fontWeight: 600,
              fontSize: 14,
              cursor: filteredTransactions.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📥 Export CSV
          </button>
          <AddTransactionModal categories={categories} userId={userId} currency={currency} />
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18 }}>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>TOTAL EXPENSES</span>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444', marginTop: 4 }}>{fmt(totalExpenses)}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18 }}>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>TOTAL INCOME</span>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', marginTop: 4 }}>{fmt(totalIncome)}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18 }}>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>NET CASHFLOW</span>
          <div style={{ fontSize: 22, fontWeight: 700, color: netCashflow >= 0 ? '#10b981' : '#ef4444', marginTop: 4 }}>
            {netCashflow >= 0 ? '+' : ''}{fmt(netCashflow)}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18 }}>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>MATCHING RECORDS</span>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#D9FF5B', marginTop: 4 }}>{filteredTransactions.length}</div>
        </div>
      </div>

      {/* Filter Control Panel */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Search & Main Type Tabs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <input
              type="text"
              placeholder="🔍 Search by description, category, or notes..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: '10px 14px',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => { setTypeFilter('all'); setCurrentPage(1); }}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: typeFilter === 'all' ? '#D9FF5B' : 'transparent', color: typeFilter === 'all' ? '#080A09' : '#cbd5e1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              All
            </button>
            <button
              onClick={() => { setTypeFilter('expense'); setCurrentPage(1); }}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: typeFilter === 'expense' ? '#ef4444' : 'transparent', color: typeFilter === 'expense' ? '#fff' : '#cbd5e1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              💸 Expenses
            </button>
            <button
              onClick={() => { setTypeFilter('income'); setCurrentPage(1); }}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: typeFilter === 'income' ? '#10b981' : 'transparent', color: typeFilter === 'income' ? '#fff' : '#cbd5e1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              💰 Income
            </button>
          </div>
        </div>

        {/* Date Preset Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Date Range:</span>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'custom', label: 'Custom Range' },
          ].map(dp => (
            <button
              key={dp.id}
              onClick={() => { setDatePreset(dp.id as DatePreset); setCurrentPage(1); }}
              style={{
                background: datePreset === dp.id ? 'rgba(217, 255, 91, 0.15)' : 'rgba(255,255,255,0.04)',
                border: datePreset === dp.id ? '1px solid #D9FF5B' : '1px solid rgba(255,255,255,0.08)',
                color: datePreset === dp.id ? '#D9FF5B' : '#cbd5e1',
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {dp.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs if Custom Date Selected */}
        {datePreset === 'custom' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13 }}
              />
            </div>
          </div>
        )}

        {/* Dropdown Filters & Sorting Bar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 12px', color: '#cbd5e1', fontSize: 13 }}
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>

            {/* Source Dropdown */}
            <select
              value={sourceFilter}
              onChange={e => { setSourceFilter(e.target.value); setCurrentPage(1); }}
              style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 12px', color: '#cbd5e1', fontSize: 13 }}
            >
              <option value="all">All Sources</option>
              <option value="manual">Manual Entry</option>
              <option value="sms">SMS Parser</option>
              <option value="email">Email Import</option>
              <option value="bank_api">Bank API</option>
            </select>

            {/* Sort By Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 12px', color: '#cbd5e1', fontSize: 13 }}
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="amount_desc">Amount: Highest First</option>
              <option value="amount_asc">Amount: Lowest First</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={resetFilters}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer' }}
            >
              ↺ Reset Filters
            </button>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 2 }}>
              <button
                onClick={() => setViewMode('grouped')}
                style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: viewMode === 'grouped' ? 'rgba(255,255,255,0.15)' : 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer' }}
                title="Grouped Timeline View"
              >
                📅 Grouped
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: viewMode === 'table' ? 'rgba(255,255,255,0.15)' : 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer' }}
                title="Data Table View"
              >
                📋 Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Transactions List / Table */}
      {paginatedTransactions.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
          <span style={{ fontSize: 40 }}>🧾</span>
          <h3 style={{ color: '#f8fafc', margin: '12px 0 6px 0' }}>No Transactions Found</h3>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Try adjusting your filters, date range, or search keyword.</p>
        </div>
      ) : viewMode === 'grouped' ? (
        /* Grouped Timeline View */
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
          {Object.entries(groupedPaginated).map(([dateStr, txns]) => {
            const dayExpenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
            const dayIncome = txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)

            return (
              <div key={dateStr}>
                <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
                    {format(parseISO(dateStr), 'EEEE, MMMM d, yyyy')}
                  </span>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                    {dayExpenses > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>-{fmt(dayExpenses)}</span>}
                    {dayIncome > 0 && <span style={{ color: '#10b981', fontWeight: 600 }}>+{fmt(dayIncome)}</span>}
                  </div>
                </div>

                {txns.map(tx => (
                  <div
                    key={tx.id}
                    style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${tx.categories?.color || '#6b7280'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        {tx.categories?.icon || '📌'}
                      </div>
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: 15 }}>
                          {tx.description || tx.categories?.name || 'Transaction'}
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{tx.categories?.name || 'Uncategorized'}</span>
                          {tx.notes && <span style={{ color: '#64748b' }}>• {tx.notes}</span>}
                          {tx.source_type !== 'manual' && (
                            <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '1px 6px', borderRadius: 6, fontSize: 10, textTransform: 'uppercase' }}>
                              {tx.source_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: tx.type === 'income' ? '#10b981' : '#f8fafc' }}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                      </span>
                      <DeleteTransactionBtn id={tx.id} />
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ) : (
        /* Data Table View */
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: 12 }}>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Description</th>
                <th style={{ padding: '12px 16px' }}>Source</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map(tx => (
                <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 16px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{tx.transaction_date}</td>
                  <td style={{ padding: '14px 16px', color: '#f8fafc' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span>{tx.categories?.icon || '📌'}</span>
                      <span>{tx.categories?.name || 'Uncategorized'}</span>
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#f8fafc' }}>
                    <div>{tx.description || 'Transaction'}</div>
                    {tx.notes && <div style={{ fontSize: 11, color: '#64748b' }}>{tx.notes}</div>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 10, fontSize: 11, color: '#cbd5e1', textTransform: 'capitalize' }}>
                      {tx.source_type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: tx.type === 'income' ? '#10b981' : '#f8fafc' }}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <DeleteTransactionBtn id={tx.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredTransactions.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8' }}>
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '4px 8px', color: '#fff', fontSize: 12 }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span style={{ marginLeft: 8 }}>
              Showing {Math.min(filteredTransactions.length, (currentPage - 1) * pageSize + 1)} - {Math.min(filteredTransactions.length, currentPage * pageSize)} of {filteredTransactions.length}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '6px 14px',
                color: '#cbd5e1',
                fontSize: 13,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.4 : 1,
              }}
            >
              ← Previous
            </button>

            <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600, padding: '0 8px' }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '6px 14px',
                color: '#cbd5e1',
                fontSize: 13,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.4 : 1,
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
