import { createClient } from '@/lib/supabase/server'
import RecurringManager from '@/components/RecurringManager'

export default async function RecurringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: items }, { data: categories }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user?.id).single(),
    supabase.from('recurring_transactions').select('*, categories(*)').eq('user_id', user?.id).order('created_at', { ascending: false }),
    supabase.from('categories').select('*').eq('user_id', user?.id),
  ])

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#f1f5f9' }}>Recurring Transactions</h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: 14 }}>
          Manage subscriptions, salaries, rent, and scheduled expenses.
        </p>
      </div>

      <RecurringManager
        initialItems={items || []}
        categories={categories || []}
        userId={user?.id || ''}
        currency={profile?.currency || 'ETB'}
      />
    </div>
  )
}
