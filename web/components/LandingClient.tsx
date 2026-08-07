'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useMotionValue, useInView } from 'framer-motion'
import { ArrowRight, Zap, TrendingUp, ShieldCheck, Smartphone, Sparkles, ChevronRight, BarChart3, Bell } from 'lucide-react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

/* ---- Animated Counter ---- */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start = 0
    const dur = 1800
    const step = Math.ceil(target / (dur / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setDisplay(target); clearInterval(timer) }
      else setDisplay(start)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target])

  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>
}

/* ---- Fade Up variant ---- */
const fadeUp = (delay = 0) => ({
  initial:  { opacity: 0, y: 32 },
  animate:  { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
})

/* ---- Stagger container ---- */
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } }
}

const staggerChild = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
}

/* ---- Bento card hover effect ---- */
function BentoCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      ref={cardRef}
      className={`lp-bento-card ${className}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -4 }}
    >
      {children}
    </motion.div>
  )
}

/* ---- Main Component ---- */
export default function LandingClient({ user }: { user: User | null }) {
  const { scrollYProgress } = useScroll()
  const previewY = useTransform(scrollYProgress, [0, 0.3], [0, -60])
  const previewOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.6])

  const smsMsgs = [
    { sender: 'CBE', msg: 'Your account has been debited ETB 1,450.00 at Edna Mall on 04/08/26.', parsed: 'ETB 1,450.00 · Grocery' },
    { sender: 'Awash', msg: 'Purchase of ETB 350.00 at Kaldi\'s Coffee. Balance: ETB 12,340.', parsed: 'ETB 350.00 · Coffee' },
    { sender: 'CBE', msg: 'You received ETB 25,000.00 salary from COMPANY Ltd.', parsed: 'ETB 25,000.00 · Income' },
  ]

  const transactions = [
    { icon: '🛒', name: 'Edna Mall', date: 'Today, 2:30 PM', amount: '-ETB 1,450', type: 'expense', sms: true },
    { icon: '☕', name: "Kaldi's Coffee", date: 'Today, 9:15 AM', amount: '-ETB 350', type: 'expense', sms: true },
    { icon: '💰', name: 'Salary Deposit', date: 'Aug 1, 2026', amount: '+ETB 25,000', type: 'income', sms: false },
  ]

  const chartBars = [
    { h: 40, color: 'rgba(217,255,91,0.4)' },
    { h: 65, color: 'rgba(217,255,91,0.5)' },
    { h: 45, color: 'rgba(217,255,91,0.4)' },
    { h: 80, color: 'rgba(217,255,91,0.7)' },
    { h: 55, color: 'rgba(217,255,91,0.5)' },
    { h: 100, color: '#D9FF5B' },
    { h: 70, color: 'rgba(217,255,91,0.6)' },
  ]

  return (
    <div className="lp">
      {/* Background Effects */}
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />
      <div className="lp-grid" />

      {/* ── NAVBAR ── */}
      <motion.nav
        className="lp-nav"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lp-nav-inner">
          <Link href="/" className="lp-logo">
            <img src="/favicon-32x32.png" alt="SpendWise" className="lp-logo-img" />
            <span className="lp-logo-text">SpendWise</span>
          </Link>

          <div className="lp-nav-links">
            {user ? (
              <Link href="/dashboard" className="lp-nav-cta">
                Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link href="/auth" className="lp-nav-link">Sign In</Link>
                <Link href="/auth" className="lp-nav-cta">
                  Get Started <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <motion.div className="lp-badge" {...fadeUp(0.1)}>
          <span className="lp-badge-dot" />
          AI-Powered Expense Tracking
        </motion.div>

        <motion.h1 className="lp-headline" {...fadeUp(0.2)}>
          <span className="lp-headline-accent">Track every penny.</span><br />
          Without lifting a finger.
        </motion.h1>

        <motion.p className="lp-subheadline" {...fadeUp(0.3)}>
          SpendWise automatically parses your bank SMS notifications, categorizes expenses, and turns raw data into beautiful financial insights.
        </motion.p>

        <motion.div className="lp-hero-actions" {...fadeUp(0.4)}>
          <Link href={user ? '/dashboard' : '/auth'} className="lp-btn-primary">
            {user ? 'Launch Dashboard' : 'Start Tracking Free'}
            <ArrowRight size={17} />
          </Link>
          <Link href="#features" className="lp-btn-secondary">
            See how it works
          </Link>
        </motion.div>

        <motion.div className="lp-hero-stats" {...fadeUp(0.55)}>
          <div className="lp-hero-stat">
            <div className="lp-hero-stat-value"><Counter target={12400} suffix="+" /></div>
            <div className="lp-hero-stat-label">Expenses Tracked</div>
          </div>
          <div className="lp-hero-stat-divider" />
          <div className="lp-hero-stat">
            <div className="lp-hero-stat-value"><Counter target={98} suffix="%" /></div>
            <div className="lp-hero-stat-label">Parse Accuracy</div>
          </div>
          <div className="lp-hero-stat-divider" />
          <div className="lp-hero-stat">
            <div className="lp-hero-stat-value"><Counter target={3} suffix="s" /></div>
            <div className="lp-hero-stat-label">Avg Parse Time</div>
          </div>
        </motion.div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <motion.div
        className="lp-preview-wrapper"
        style={{ y: previewY, opacity: previewOpacity }}
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lp-preview-glow" />
        <div className="lp-preview-frame">
          <div className="lp-preview-inner">
            {/* Browser chrome */}
            <div className="lp-preview-topbar">
              <div className="lp-preview-dot" style={{ background: '#ff5f57' }} />
              <div className="lp-preview-dot" style={{ background: '#febc2e' }} />
              <div className="lp-preview-dot" style={{ background: '#28c840' }} />
              <div className="lp-preview-url">
                <span className="lp-preview-url-text">app.spendwise.io/dashboard</span>
              </div>
            </div>

            {/* App body */}
            <div className="lp-preview-body">
              {/* Sidebar */}
              <div className="lp-preview-sidebar">
                <div className="lp-preview-sidebar-logo">
                  <img src="/favicon-32x32.png" alt="logo" className="lp-preview-logo-img" />
                  <span className="lp-preview-logo-name">SpendWise</span>
                </div>
                {['Dashboard', 'Transactions', 'Budgets', 'Analytics'].map((item, i) => (
                  <div key={item} className={`lp-preview-nav-item ${i === 0 ? 'active' : ''}`}>
                    <div className={`lp-preview-nav-dot ${i === 0 ? 'active' : ''}`} />
                    {item}
                  </div>
                ))}
              </div>

              {/* Content */}
              <div className="lp-preview-content">
                <div className="lp-preview-header">
                  <div className="lp-preview-title">Good morning 👋</div>
                  <div className="lp-preview-cta-pill">+ Add</div>
                </div>

                {/* Stats */}
                <div className="lp-preview-stats">
                  <div className="lp-preview-stat">
                    <div className="lp-preview-stat-label">Balance</div>
                    <div className="lp-preview-stat-value green">ETB 18,200</div>
                  </div>
                  <div className="lp-preview-stat">
                    <div className="lp-preview-stat-label">Expenses</div>
                    <div className="lp-preview-stat-value red">ETB 6,800</div>
                  </div>
                  <div className="lp-preview-stat">
                    <div className="lp-preview-stat-label">Budget Used</div>
                    <div className="lp-preview-stat-value brand">34%</div>
                  </div>
                </div>

                {/* Chart */}
                <div className="lp-preview-chart">
                  <div className="lp-preview-chart-label">Monthly Spending</div>
                  <div className="lp-preview-chart-bars">
                    {chartBars.map((bar, i) => (
                      <motion.div
                        key={i}
                        className="lp-preview-bar"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.8 + i * 0.06, duration: 0.5, ease: 'easeOut' }}
                        style={{ background: bar.color, height: `${bar.h}%`, transformOrigin: 'bottom' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Transactions */}
                <div className="lp-preview-transactions">
                  {transactions.map((tx, i) => (
                    <motion.div
                      key={i}
                      className="lp-preview-tx"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 + i * 0.1, duration: 0.4 }}
                    >
                      <div className="lp-preview-tx-icon" style={{ background: tx.type === 'expense' ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)' }}>
                        {tx.icon}
                      </div>
                      <div className="lp-preview-tx-info">
                        <div className="lp-preview-tx-name">{tx.name}</div>
                        <div className="lp-preview-tx-date">
                          {tx.date}
                          {tx.sms && <span className="lp-preview-tx-badge" style={{ marginLeft: 6 }}>SMS</span>}
                        </div>
                      </div>
                      <div className={`lp-preview-tx-amount ${tx.type}`}>{tx.amount}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── FEATURES BENTO ── */}
      <section className="lp-section" id="features">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="lp-section-eyebrow">Features</div>
          <h2 className="lp-section-title">Everything you need. <span style={{ color: 'var(--text-lo)' }}>Nothing you don't.</span></h2>
          <p className="lp-section-subtitle">Designed for speed, clarity, and total control over your finances — from mobile to web.</p>
        </motion.div>

        <div className="lp-bento">

          {/* Card 1 — SMS Parsing (large) */}
          <BentoCard className="lp-bento-c1" delay={0}>
            <div className="lp-bento-glow" style={{ top: -40, right: -40, width: 220, height: 220, background: 'rgba(217,255,91,0.08)' }} />
            <div className="lp-bento-tag"><Zap size={12} /> Core Feature</div>
            <div className="lp-bento-icon"><Zap size={22} /></div>
            <div className="lp-bento-title">Magic SMS Auto-Parsing</div>
            <div className="lp-bento-desc">
              Your bank sends an SMS. SpendWise reads it instantly — extracting merchant, amount, and category using advanced pattern matching. No manual entry ever.
            </div>

            {/* Animated SMS ticker */}
            <div className="lp-sms-ticker">
              {smsMsgs.map((sms, i) => (
                <motion.div
                  key={i}
                  className="lp-sms-item"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                >
                  <span className="lp-sms-label">SMS</span>
                  <span style={{ flex: 1 }}>{sms.msg}</span>
                  <motion.span
                    style={{ color: '#D9FF5B', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 + 0.4 }}
                  >
                    → {sms.parsed}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </BentoCard>

          {/* Card 2 — Mobile App */}
          <BentoCard className="lp-bento-c2" delay={0.1}>
            <div className="lp-bento-glow" style={{ bottom: -40, left: -20, width: 180, height: 180, background: 'rgba(139,92,246,0.08)' }} />
            <div className="lp-bento-icon violet"><Smartphone size={22} /></div>
            <div className="lp-bento-title">Native Mobile App</div>
            <div className="lp-bento-desc">
              Expo React Native app that syncs real-time with your web dashboard. Background SMS listener and push notifications included.
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Android', 'iOS', 'Real-time sync', 'Push notifications'].map(tag => (
                <span key={tag} style={{ padding: '4px 10px', borderRadius: 100, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>
                  {tag}
                </span>
              ))}
            </div>
          </BentoCard>

          {/* Card 3 — Analytics */}
          <BentoCard className="lp-bento-c3" delay={0.15}>
            <div className="lp-bento-glow" style={{ top: -20, right: -20, width: 140, height: 140, background: 'rgba(6,182,212,0.08)' }} />
            <div className="lp-bento-icon cyan"><BarChart3 size={22} /></div>
            <div className="lp-bento-title">Stunning Analytics</div>
            <div className="lp-bento-desc">
              Beautiful Recharts visualizations that turn your raw data into actionable insights — category breakdowns, trends, and more.
            </div>
          </BentoCard>

          {/* Card 4 — Smart Budgets */}
          <BentoCard className="lp-bento-c4" delay={0.2}>
            <div className="lp-bento-glow" style={{ bottom: -30, right: -30, width: 150, height: 150, background: 'rgba(245,158,11,0.08)' }} />
            <div className="lp-bento-icon amber"><TrendingUp size={22} /></div>
            <div className="lp-bento-title">Smart Budgets</div>
            <div className="lp-bento-desc">
              Set category budgets and get real-time progress bars. Notifications fire when you're approaching your limits.
            </div>
          </BentoCard>

          {/* Card 5 — Security */}
          <BentoCard className="lp-bento-c5" delay={0.25}>
            <div className="lp-bento-glow" style={{ top: -20, left: -20, width: 140, height: 140, background: 'rgba(16,185,129,0.06)' }} />
            <div className="lp-bento-icon" style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.2)', color: '#34d399' }}>
              <ShieldCheck size={22} />
            </div>
            <div className="lp-bento-title">Bank-Level Security</div>
            <div className="lp-bento-desc">
              Supabase Row Level Security ensures your data is yours — always. PostgreSQL reliability, real-time sync.
            </div>
          </BentoCard>

          {/* Card 6 — AI Financial Advisor */}
          <BentoCard className="lp-bento-c2" delay={0.3}>
            <div className="lp-bento-glow" style={{ top: -20, right: -20, width: 160, height: 160, background: 'rgba(217,255,91,0.08)' }} />
            <div className="lp-bento-icon"><Sparkles size={22} /></div>
            <div className="lp-bento-title">RAG AI Financial Advisor</div>
            <div className="lp-bento-desc">
              Context-aware AI coach analyzing your live database. Ask instant questions like *"Am I over budget?"* or *"How to save $200?"*.
            </div>
          </BentoCard>

          {/* Card 7 — Receipt OCR Scanner */}
          <BentoCard className="lp-bento-c3" delay={0.35}>
            <div className="lp-bento-glow" style={{ bottom: -20, right: -20, width: 160, height: 160, background: 'rgba(6,182,212,0.08)' }} />
            <div className="lp-bento-icon cyan"><Smartphone size={22} /></div>
            <div className="lp-bento-title">OCR Receipt Scanner</div>
            <div className="lp-bento-desc">
              Snap a paper receipt. Vision AI extracts merchant name, date, total amount, and category instantly into your ledger.
            </div>
          </BentoCard>

        </div>
      </section>

      {/* ── STATS ROW ── */}
      <div className="lp-stats-row">
        <div className="lp-stats-grid">
          {[
            { value: 12400, suffix: '+', label: 'Expenses Tracked', sub: 'Across all users this month' },
            { value: 98, suffix: '%', label: 'SMS Parse Accuracy', sub: 'For Ethiopian bank formats' },
            { value: 100, suffix: '%', label: 'Free Forever', sub: 'No hidden fees, no paywalls' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="lp-stat-block"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div className="lp-stat-block-value">
                <Counter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="lp-stat-block-label">{stat.label}</div>
              <div className="lp-stat-block-sub">{stat.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="lp-cta-section">
        <div className="lp-cta-inner">
          <div className="lp-cta-glow" />
          <motion.div
            className="lp-cta-card"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="lp-cta-content">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className="lp-badge" style={{ display: 'inline-flex', marginBottom: 24 }}>
                  <span className="lp-badge-dot" />
                  Ready to take control?
                </div>
              </motion.div>
              <motion.h2
                className="lp-cta-title"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                Take control of your money today.
              </motion.h2>
              <motion.p
                className="lp-cta-sub"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                Join the future of personal finance. Completely free, endlessly powerful.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
              >
                <Link href={user ? '/dashboard' : '/auth'} className="lp-btn-primary" style={{ fontSize: 16, padding: '16px 36px' }}>
                  {user ? 'Go to Dashboard' : 'Create Free Account'}
                  <ArrowRight size={18} />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <Link href="/" className="lp-footer-logo">
            <img src="/favicon-32x32.png" alt="SpendWise" style={{ width: 20, height: 20, borderRadius: 4 }} />
            <span className="lp-footer-logo-text">SpendWise</span>
          </Link>
          <p className="lp-footer-copy">© {new Date().getFullYear()} SpendWise. Built with Next.js, Framer Motion & Supabase.</p>
          <div className="lp-footer-links">
            <Link href="/auth" className="lp-footer-link">Sign In</Link>
            <Link href="/dashboard" className="lp-footer-link">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
