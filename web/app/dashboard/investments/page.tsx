import { createClient } from '@/lib/supabase/server'
import InvestmentsManager from '@/components/InvestmentsManager'

export default async function InvestmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: investments }, { data: profile }] = await Promise.all([
    supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('currency').eq('id', user.id).single(),
  ])

  return (
    <InvestmentsManager
      initialInvestments={investments ?? []}
      userId={user.id}
      currency={profile?.currency ?? 'ETB'}
    />
  )
}
