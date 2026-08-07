import { createClient } from '@/lib/supabase/server'
import DebtsManager from '@/components/DebtsManager'

export default async function DebtsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: debts }, { data: profile }] = await Promise.all([
    supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('currency').eq('id', user.id).single(),
  ])

  return (
    <DebtsManager
      initialDebts={debts ?? []}
      userId={user.id}
      currency={profile?.currency ?? 'ETB'}
    />
  )
}
