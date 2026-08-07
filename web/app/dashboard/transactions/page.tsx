import { createClient } from '@/lib/supabase/server'
import TransactionsManager from '@/components/TransactionsManager'
import type { TransactionWithCategory } from '@/lib/types'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: transactions }, { data: categories }, { data: profile }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, categories(*)')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('currency').eq('id', user.id).single(),
  ])

  return (
    <TransactionsManager
      initialTransactions={(transactions ?? []) as TransactionWithCategory[]}
      categories={categories ?? []}
      userId={user.id}
      currency={profile?.currency ?? 'ETB'}
    />
  )
}
