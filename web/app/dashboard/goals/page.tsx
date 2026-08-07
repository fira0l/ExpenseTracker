import { createClient } from '@/lib/supabase/server'
import SavingsGoalsManager from '@/components/SavingsGoalsManager'

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: goals }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user?.id).single(),
    supabase.from('savings_goals').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
  ])

  return (
    <SavingsGoalsManager
      initialGoals={goals || []}
      userId={user?.id || ''}
      currency={profile?.currency || 'ETB'}
    />
  )
}
