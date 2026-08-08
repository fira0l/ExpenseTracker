'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import {
  ArrowRight,
  Zap,
  TrendingUp,
  ShieldCheck,
  Smartphone,
  Sparkles,
  BarChart3,
  CreditCard,
  Camera,
  Layers,
  Calculator,
  CheckCircle2,
  DollarSign,
  Lock,
} from 'lucide-react'
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
      if (start >= target) {
        setDisplay(target)
        clearInterval(timer)
      } else setDisplay(start)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target])

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  )
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
})

/* ---- Bento Card Component ---- */
function BentoCard({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={`lp-bento-card ${className}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
    >
      {children}
    </motion.div>
  )
}

export default function LandingClient({ user }: { user: User | null }) {
  const { scrollYProgress } = useScroll()
  const previewY = useTransform(scrollYProgress, [0, 0.3], [0, -40])
  const previewOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.8])

  // Interactive SMS Parser Simulator
  const [activeSmsIndex, setActiveSmsIndex] = useState(0)
  const smsSamples = [
    {
      bank: 'CBE Bank',
      msg: 'Your account 1000***4521 has been debited ETB 1,850.00 at Supermarket Mall on 08/02/26.',
      merchant: 'Supermarket Mall',
      amount: 'ETB 1,850.00',
      category: 'Groceries',
      color: '#D9FF5B',
    },
    {
      bank: 'Awash Bank',
      msg: 'Purchase of ETB 450.00 at Kaldi Coffee. Available Balance: ETB 18,240.00.',
      merchant: 'Kaldi Coffee',
      amount: 'ETB 450.00',
      category: 'Food & Dining',
      color: '#06b6d4',
    },
    {
      bank: 'Telebirr',
      msg: 'You paid ETB 800.00 to Ride Transport for trip ID #8841.',
      merchant: 'Ride Transport',
      amount: 'ETB 800.00',
      category: 'Transportation',
      color: '#a78bfa',
    },
  ]

  // Interactive Wealth Calculator State
  const [monthlySave, setMonthlySave] = useState(500)
  const estimatedYearlyWealth = monthlySave * 12 * 1.08 // 8% return

  return (
    <div className="lp">
      {/* Background Glows & Grid */}
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
                <Link href="/auth" className="lp-nav-link">
                  Sign In
                </Link>
                <Link href="/auth" className="lp-nav-cta">
                  Get Started Free <ArrowRight size={14} />
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
          Autonomous AI & SMS Expense Management
        </motion.div>

        <motion.h1 className="lp-headline" {...fadeUp(0.2)}>
          Master your money.<br />
          <span className="lp-headline-accent">Without friction.</span>
        </motion.h1>

        <motion.p className="lp-subheadline" {...fadeUp(0.3)}>
          SpendWise automatically parses bank SMS notifications, scans paper receipts, tracks investments & debts, and gives you a personal RAG AI Financial Coach.
        </motion.p>

        <motion.div className="lp-hero-actions" {...fadeUp(0.4)}>
          <Link href={user ? '/dashboard' : '/auth'} className="lp-btn-primary">
            {user ? 'Launch Dashboard' : 'Start Free Account'}
            <ArrowRight size={17} />
          </Link>
          <a href="#features" className="lp-btn-secondary">
            Explore Features
          </a>
        </motion.div>

        <motion.div className="lp-hero-stats" {...fadeUp(0.55)}>
          <div className="lp-hero-stat">
            <div className="lp-hero-stat-value">
              <Counter target={18400} suffix="+" />
            </div>
            <div className="lp-hero-stat-label">Transactions Parsed</div>
          </div>
          <div className="lp-hero-stat-divider" />
          <div className="lp-hero-stat">
            <div className="lp-hero-stat-value">
              <Counter target={99} suffix="%" />
            </div>
            <div className="lp-hero-stat-label">OCR & SMS Accuracy</div>
          </div>
          <div className="lp-hero-stat-divider" />
          <div className="lp-hero-stat">
            <div className="lp-hero-stat-value">100%</div>
            <div className="lp-hero-stat-label">Free & Private</div>
          </div>
        </motion.div>
      </section>

      {/* ── DASHBOARD SHOWCASE PREVIEW ── */}
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
            {/* Top Bar */}
            <div className="lp-preview-topbar">
              <div className="lp-preview-dot" style={{ background: '#ff5f57' }} />
              <div className="lp-preview-dot" style={{ background: '#febc2e' }} />
              <div className="lp-preview-dot" style={{ background: '#28c840' }} />
              <div className="lp-preview-url">
                <span className="lp-preview-url-text">https://expense-tracker-phi-indol-24.vercel.app/dashboard</span>
              </div>
            </div>

            {/* Dashboard Content Mock */}
            <div className="lp-preview-body">
              <div className="lp-preview-sidebar">
                <div className="lp-preview-sidebar-logo">
                  <img src="/favicon-32x32.png" alt="logo" className="lp-preview-logo-img" />
                  <span className="lp-preview-logo-name">SpendWise</span>
                </div>
                {['Dashboard', 'AI Advisor', 'Transactions', 'Budgets', 'Goals', 'Portfolio'].map((item, i) => (
                  <div key={item} className={`lp-preview-nav-item ${i === 0 ? 'active' : ''}`}>
                    <div className={`lp-preview-nav-dot ${i === 0 ? 'active' : ''}`} />
                    {item}
                  </div>
                ))}
              </div>

              <div className="lp-preview-content">
                {/* Hero Metallic Credit Card Mock */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #090d16 0%, #1e293b 50%, #0f172a 100%)',
                    border: '1px solid rgba(217, 255, 91, 0.35)',
                    borderRadius: 16,
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>AVAILABLE CHECKING BALANCE</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#D9FF5B', marginTop: 2 }}>$14,850.00</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontFamily: 'monospace' }}>•••• •••• •••• 8842</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#D9FF5B', letterSpacing: 1 }}>SPENDWISE PLATINUM</span>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>EXPIRES 12/28</div>
                  </div>
                </div>

                {/* AI Coach Banner */}
                <div
                  style={{
                    background: 'rgba(217,255,91,0.08)',
                    border: '1px solid rgba(217,255,91,0.2)',
                    borderRadius: 12,
                    padding: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Sparkles size={20} color="#D9FF5B" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>AI Financial Coach Active</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>"You saved $320 more than last month. Want to deposit into Vacation Goal?"</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── INTERACTIVE DEMO: SMS PARSER SIMULATOR ── */}
      <section className="lp-section" id="sms-demo">
        <div className="lp-section-eyebrow">Interactive Demo</div>
        <h2 className="lp-section-title">See SMS Auto-Parsing in Action</h2>
        <p className="lp-section-subtitle">Select a bank notification below to test how SpendWise instantly categorizes raw messages into structured ledger items.</p>

        <div className="lp-sms-sim-container">
          <div className="lp-sms-tabs">
            {smsSamples.map((sample, idx) => (
              <button
                key={sample.bank}
                onClick={() => setActiveSmsIndex(idx)}
                className={`lp-sms-tab-btn ${activeSmsIndex === idx ? 'active' : ''}`}
              >
                {sample.bank}
              </button>
            ))}
          </div>

          <div className="lp-sms-sim-card">
            <div className="lp-sms-raw-box">
              <span className="lp-sms-tag">INCOMING SMS</span>
              <p className="lp-sms-msg-text">"{smsSamples[activeSmsIndex].msg}"</p>
            </div>

            <div className="lp-sms-arrow">➔</div>

            <div className="lp-sms-parsed-box" style={{ borderColor: smsSamples[activeSmsIndex].color }}>
              <span className="lp-sms-tag-success">INSTANTLY PARSED</span>
              <div className="lp-sms-parsed-details">
                <div>
                  <span className="lp-sms-detail-label">Merchant</span>
                  <span className="lp-sms-detail-val">{smsSamples[activeSmsIndex].merchant}</span>
                </div>
                <div>
                  <span className="lp-sms-detail-label">Amount</span>
                  <span className="lp-sms-detail-val" style={{ color: smsSamples[activeSmsIndex].color }}>
                    {smsSamples[activeSmsIndex].amount}
                  </span>
                </div>
                <div>
                  <span className="lp-sms-detail-label">Category</span>
                  <span className="lp-sms-detail-val">{smsSamples[activeSmsIndex].category}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES GRID ── */}
      <section className="lp-section" id="features">
        <div className="lp-section-eyebrow">Core Engine</div>
        <h2 className="lp-section-title">
          Built for speed, clarity & total control.
        </h2>

        <div className="lp-bento">
          <BentoCard className="lp-bento-c1" delay={0}>
            <div className="lp-bento-icon"><Zap size={22} /></div>
            <div className="lp-bento-title">Automatic Bank SMS Engine</div>
            <div className="lp-bento-desc">
              Background Android & Web SMS listeners capture transaction notifications from CBE, Awash, Telebirr, Dashen, and BOA automatically.
            </div>
          </BentoCard>

          <BentoCard className="lp-bento-c2" delay={0.1}>
            <div className="lp-bento-icon violet"><Sparkles size={22} /></div>
            <div className="lp-bento-title">RAG AI Financial Coach</div>
            <div className="lp-bento-desc">
              Queries your real live database to answer questions about budget velocity, recurring bills, and savings milestones.
            </div>
          </BentoCard>

          <BentoCard className="lp-bento-c3" delay={0.15}>
            <div className="lp-bento-icon cyan"><Camera size={22} /></div>
            <div className="lp-bento-title">OCR Paper Receipt Scanner</div>
            <div className="lp-bento-desc">
              Snap a paper receipt photo. Multi-modal vision AI extracts merchant, amount, date, and category automatically.
            </div>
          </BentoCard>

          <BentoCard className="lp-bento-c4" delay={0.2}>
            <div className="lp-bento-icon amber"><CreditCard size={22} /></div>
            <div className="lp-bento-title">Metallic Bank Card & Privacy Eye</div>
            <div className="lp-bento-desc">
              Ultra-sleek Debit / Platinum Credit switcher with a 1-tap Privacy Eye button that hides all amounts across the dashboard.
            </div>
          </BentoCard>

          <BentoCard className="lp-bento-c5" delay={0.25}>
            <div className="lp-bento-icon" style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.2)', color: '#34d399' }}>
              <ShieldCheck size={22} />
            </div>
            <div className="lp-bento-title">Supabase Row-Level Security</div>
            <div className="lp-bento-desc">
              PostgreSQL encryption with strict RLS policies ensures your financial data is strictly accessible by you alone.
            </div>
          </BentoCard>
        </div>
      </section>

      {/* ── WEALTH CALCULATOR SIMULATOR ── */}
      <section className="lp-section" id="calculator">
        <div className="lp-section-eyebrow">Wealth Growth</div>
        <h2 className="lp-section-title">See your 12-month savings potential</h2>
        <p className="lp-section-subtitle">Adjust the monthly savings slider below to project your estimated net worth growth.</p>

        <div className="lp-calc-box">
          <div className="lp-calc-slider-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 700, marginBottom: 8 }}>
              <span>Monthly Savings Goal:</span>
              <span style={{ color: '#D9FF5B', fontSize: 20 }}>${monthlySave}/mo</span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={monthlySave}
              onChange={e => setMonthlySave(Number(e.target.value))}
              className="lp-calc-slider"
            />
          </div>

          <div className="lp-calc-result">
            <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>ESTIMATED 12-MONTH WEALTH ACCUMULATION</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: '#D9FF5B', marginTop: 4 }}>
              ${Math.round(estimatedYearlyWealth).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Based on automated budget tracking & 8% compound yield strategy.</div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="lp-cta-section">
        <div className="lp-cta-inner">
          <div className="lp-cta-card">
            <h2 className="lp-cta-title">Start tracking your finances today.</h2>
            <p className="lp-cta-sub">Join SpendWise for weightless, automated expense intelligence. 100% free forever.</p>
            <Link href={user ? '/dashboard' : '/auth'} className="lp-btn-primary" style={{ fontSize: 16, padding: '16px 36px' }}>
              {user ? 'Go to Dashboard' : 'Create Free Account'}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <Link href="/" className="lp-footer-logo">
            <img src="/favicon-32x32.png" alt="SpendWise" style={{ width: 20, height: 20, borderRadius: 4 }} />
            <span className="lp-footer-logo-text">SpendWise</span>
          </Link>
          <p className="lp-footer-copy">© {new Date().getFullYear()} SpendWise. Built with Next.js, React Native & Supabase.</p>
          <div className="lp-footer-links">
            <Link href="/auth" className="lp-footer-link">
              Sign In
            </Link>
            <Link href="/dashboard" className="lp-footer-link">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
