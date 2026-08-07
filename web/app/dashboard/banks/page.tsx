import { createClient } from '@/lib/supabase/server'
import BanksManager from '@/components/BanksManager'

export default async function BanksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: banks } = await supabase
    .from('automation_sources')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'bank_api')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Banks 🏦</h1>
          <p className="page-subtitle">Manage connected institutions and accounts</p>
        </div>
      </div>
      <BanksManager initialBanks={banks ?? []} userId={user.id} />
    </div>
  )
}
