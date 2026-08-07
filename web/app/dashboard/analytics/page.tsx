import { createClient } from '@/lib/supabase/server'
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import AnalyticsCharts from '@/components/AnalyticsCharts'
import './analytics.css'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const sixMonthsAgo = startOfMonth(subMonths(now, 5))

  const [{ data: transactions }, { data: categories }, { data: profile }] = await Promise.all([
    supabase.from('transactions')
      .select('*, categories(*)')
      .eq('user_id', user.id)
      .gte('transaction_date', format(sixMonthsAgo, 'yyyy-MM-dd'))
      .order('transaction_date', { ascending: true }),
    supabase.from('categories').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('currency, monthly_income').eq('id', user.id).single(),
  ])

  const currency = profile?.currency ?? 'USD'
  const monthlyIncome = profile?.monthly_income ?? 0

  // Build monthly summary for last 6 months
  const monthlySummary = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i)
    const start = format(startOfMonth(d), 'yyyy-MM-dd')
    const end   = format(endOfMonth(d), 'yyyy-MM-dd')
    const monthTx = (transactions ?? []).filter(t => t.transaction_date >= start && t.transaction_date <= end)
    const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const income   = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    return {
      month: format(d, 'MMM'),
      expenses,
      income: monthlyIncome + income,
      savings: monthlyIncome + income - expenses,
    }
  })

  // Category breakdown (all time from 6 months)
  const catBreakdown = (transactions ?? [])
    .filter(t => t.type === 'expense')
    .reduce((acc: Record<string, { id: string; name: string; icon: string; color: string; total: number }>, t: any) => {
      const cat = t.categories
      const key = cat?.id ?? 'other'
      if (!acc[key]) acc[key] = { id: key, name: cat?.name ?? 'Other', icon: cat?.icon ?? '📌', color: cat?.color ?? '#6b7280', total: 0 }
      acc[key].total += t.amount
      return acc
    }, {})

  const categoryData = Object.values(catBreakdown)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  // Daily spending (last 30 days)
  const thirtyDaysAgo = format(subMonths(now, 1), 'yyyy-MM-dd')
  const dailyTx = (transactions ?? []).filter(t => t.transaction_date >= thirtyDaysAgo && t.type === 'expense')
  const dailySpending = dailyTx.reduce((acc: Record<string, number>, t) => {
    acc[t.transaction_date] = (acc[t.transaction_date] ?? 0) + t.amount
    return acc
  }, {})

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <AnalyticsCharts
        monthlySummary={monthlySummary}
        categoryData={categoryData}
        dailySpending={dailySpending}
        currency={currency}
      />
    </div>
  )
}
