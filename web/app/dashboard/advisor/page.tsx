import { createClient } from '@/lib/supabase/server'
import AdvisorChat from '@/components/AdvisorChat'

export default async function AdvisorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#f1f5f9' }}>AI Financial Advisor</h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: 14 }}>
          Get instant data-backed answers, budget audits, and custom savings strategies.
        </p>
      </div>

      <AdvisorChat profile={profile} />
    </div>
  )
}
