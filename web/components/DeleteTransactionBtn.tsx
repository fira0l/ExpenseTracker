'use client'
import { useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DeleteTransactionBtn({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  function handleDelete() {
    if (!confirm('Delete this transaction?')) return
    startTransition(async () => {
      await supabase.from('transactions').delete().eq('id', id)
      router.refresh()
    })
  }

  return (
    <button
      id={`delete-tx-${id.slice(0, 8)}`}
      className="btn btn-icon btn-ghost"
      onClick={handleDelete}
      disabled={pending}
      style={{ fontSize: 14, opacity: pending ? 0.5 : 0.6, color: '#f43f5e' }}
      title="Delete transaction"
    >
      {pending ? '⏳' : '🗑️'}
    </button>
  )
}
