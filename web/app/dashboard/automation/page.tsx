import { createClient } from '@/lib/supabase/server'
import AutomationManager from '@/components/AutomationManager'

export default async function AutomationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: sources } = await supabase
    .from('automation_sources')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Automation 🤖</h1>
          <p className="page-subtitle">Configure SMS/Email parsers and future bank connections</p>
        </div>
      </div>
      <AutomationManager sources={sources ?? []} userId={user.id} />
    </div>
  )
}
