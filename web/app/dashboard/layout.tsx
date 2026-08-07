import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="app-layout">
      <div className="ag-orb ag-orb-1" />
      <div className="ag-orb ag-orb-2" />
      <Sidebar user={user} profile={profile} />
      <main className="main-content">
        <div className="page-container animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
