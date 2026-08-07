import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import BudgetManager from '@/components/BudgetManager'

export default async function BudgetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd')

  const [{ data: categories }, { data: budgets }, { data: transactions }, { data: profile }] = await Promise.all([
    supabase.from('categories').select('*').eq('user_id', user.id),
    supabase.from('budgets').select('*').eq('user_id', user.id).eq('month', month).eq('year', year),
    supabase.from('transactions')
      .select('category_id, amount, type')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('transaction_date', monthStart)
      .lte('transaction_date', monthEnd),
    supabase.from('profiles').select('currency').eq('id', user.id).single(),
  ])

  const currency = profile?.currency ?? 'USD'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">{format(now, 'MMMM yyyy')} — Set limits and track your spending</p>
        </div>
      </div>
      <BudgetManager
        categories={categories ?? []}
        budgets={budgets ?? []}
        transactions={transactions ?? []}
        userId={user.id}
        month={month}
        year={year}
        currency={currency}
      />
    </div>
  )
}
