import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: categories }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('categories').select('*').eq('user_id', user.id).order('created_at'),
  ])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your profile, income, and expense categories</p>
        </div>
      </div>
      <SettingsForm
        profile={profile}
        categories={categories ?? []}
        userId={user.id}
        email={user.email ?? ''}
      />
    </div>
  )
}
