'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import {
  LayoutDashboard,
  Bot,
  CreditCard,
  Target,
  Repeat,
  TrendingUp,
  Landmark,
  Briefcase,
  TrendingDown,
  Settings,
  Zap,
  BarChart3,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',              label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/dashboard/advisor',      label: 'AI Advisor',   icon: Bot },
  { href: '/dashboard/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/dashboard/budgets',      label: 'Budgets',      icon: Target },
  { href: '/dashboard/goals',        label: 'Savings Goals',icon: Target },
  { href: '/dashboard/recurring',    label: 'Recurring',    icon: Repeat },
  { href: '/dashboard/analytics',    label: 'Analytics',    icon: BarChart3 },
  { href: '/dashboard/banks',        label: 'Banks',        icon: Landmark },
  { href: '/dashboard/investments',  label: 'Investments',  icon: Briefcase },
  { href: '/dashboard/debts',        label: 'Debts',        icon: TrendingDown },
]

const SETTINGS_ITEMS = [
  { href: '/dashboard/settings',   label: 'Settings',   icon: Settings },
  { href: '/dashboard/automation', label: 'Automation', icon: Zap },
]

interface SidebarProps {
  user: User
  profile: Profile | null
}

export default function Sidebar({ user, profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  const initials = (profile?.full_name || user.email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href="/dashboard" className="sidebar-logo">
        <img
          src="/favicon-32x32.png"
          alt="SpendWise Logo"
          style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }}
        />
        <span className="sidebar-logo-text">SpendWise</span>
      </Link>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Menu</span>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon
                size={18}
                style={{
                  color: isActive ? '#D9FF5B' : '#94a3b8',
                  transition: 'color 0.2s',
                }}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <span className="sidebar-section-label" style={{ marginTop: 16 }}>Settings</span>
        {SETTINGS_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon
                size={18}
                style={{
                  color: isActive ? '#D9FF5B' : '#94a3b8',
                  transition: 'color 0.2s',
                }}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleSignOut} title="Sign out">
          <div
            className="sidebar-user-avatar"
            style={{ background: 'linear-gradient(135deg, #D9FF5B 0%, #b3ff00 100%)', color: '#080A09' }}
          >
            {initials}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{profile?.full_name || 'My Account'}</div>
            <div className="sidebar-user-email">{user.email}</div>
          </div>
          <LogOut size={14} style={{ color: '#D9FF5B', opacity: 0.7 }} />
        </div>
      </div>
    </aside>
  )
}
