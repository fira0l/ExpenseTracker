import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import AddTransactionModal from '@/components/AddTransactionModal'
import DashboardStatsWrapper from '@/components/DashboardStatsWrapper'
import type { TransactionWithCategory } from '@/lib/types'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd')
  const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
  const lastMonthEnd   = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')

  const [
    { data: profile },
    { data: thisMonthTx },
    { data: lastMonthTx },
    { data: recentTx },
    { data: categories },
    { data: goals },
    { data: recurring },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('transactions')
      .select('*, categories(*)')
      .eq('user_id', user.id)
      .gte('transaction_date', monthStart)
      .lte('transaction_date', monthEnd),
    supabase.from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .gte('transaction_date', lastMonthStart)
      .lte('transaction_date', lastMonthEnd),
    supabase.from('transactions')
      .select('*, categories(*)')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('categories').select('*').eq('user_id', user.id),
    supabase.from('savings_goals').select('*').eq('user_id', user.id).limit(3),
    supabase.from('recurring_transactions').select('*, categories(*)').eq('user_id', user.id).eq('is_active', true).limit(3),
  ])

  const monthlyIncome = profile?.monthly_income ?? 0
  const currency = profile?.currency ?? 'ETB'

  const currencySymbol = new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 0
  }).formatToParts(0).find(p => p.type === 'currency')?.value ?? '$'

  const fmt = (n: number) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(n)

  const thisExpenses = (thisMonthTx ?? []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const thisIncome   = (thisMonthTx ?? []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const lastExpenses = (lastMonthTx ?? []).filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)
  const balance = monthlyIncome + thisIncome - thisExpenses
  const savingsRate = monthlyIncome > 0 ? Math.round((balance / monthlyIncome) * 100) : 0
  const expenseChange = lastExpenses > 0 ? Math.round(((thisExpenses - lastExpenses) / lastExpenses) * 100) : 0

  // Category breakdown for chart
  const categoryBreakdown = (thisMonthTx ?? [])
    .filter(t => t.type === 'expense')
    .reduce((acc: Record<string, { id: string; name: string; icon: string; color: string; total: number }>, t) => {
      const cat = (t as TransactionWithCategory).categories
      const key = cat?.id ?? 'other'
      if (!acc[key]) acc[key] = { id: key, name: cat?.name ?? 'Other', icon: cat?.icon ?? '📌', color: cat?.color ?? '#6b7280', total: 0 }
      acc[key].total += t.amount
      return acc
    }, {})

  const chartData = Object.values(categoryBreakdown)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'} 👋
          </h1>
          <p className="page-subtitle">{format(now, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <AddTransactionModal categories={categories ?? []} userId={user.id} currency={currencySymbol} />
      </div>

      {/* AI Financial Advisor Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(217,255,91,0.12) 0%, rgba(0,242,254,0.06) 100%)',
        border: '1px solid rgba(217,255,91,0.25)',
        borderRadius: 18,
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #D9FF5B 0%, #00f2fe 100%)', color: '#080A09', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>
            🤖
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>AI Financial Coach Ready</h3>
              <span style={{ fontSize: 11, background: 'rgba(217,255,91,0.2)', color: '#D9FF5B', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>RAG-Powered</span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#94a3b8' }}>
              Ask your AI coach how to optimize your spending or save more this month!
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/advisor"
          style={{
            background: '#D9FF5B',
            color: '#080A09',
            padding: '10px 18px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Ask AI Advisor ➔
        </Link>
      </div>

      {/* Interactive Dashboard Stats & Credit Card Wrapper */}
      <DashboardStatsWrapper
        balance={balance}
        thisExpenses={thisExpenses}
        thisIncome={thisIncome}
        monthlyIncome={monthlyIncome}
        thisMonthTxCount={(thisMonthTx ?? []).length}
        savingsRate={savingsRate}
        expenseChange={expenseChange}
        currency={currency}
        cardholderName={profile?.full_name || user.email || 'VALUED MEMBER'}
        recentTx={(recentTx as TransactionWithCategory[]) ?? []}
        goals={goals ?? []}
        recurring={recurring ?? []}
        chartData={chartData}
      />
    </div>
  )
}
