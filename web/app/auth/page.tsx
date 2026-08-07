'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/dashboard')
      router.refresh()
    } else {
      const redirectUrl = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
        ? `${window.location.origin}/dashboard`
        : 'https://expense-tracker-phi-indol-24.vercel.app/dashboard'

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: redirectUrl,
        },
      })
      if (error) { setError(error.message); setLoading(false); return }
      setMessage('Check your email for a confirmation link!')
      setLoading(false)
    }
  }

  return (
    <div className="split-layout">
      {/* Left Panel: The Action Zone */}
      <motion.div 
        className="left-panel"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="left-content">
          <div className="brand-header">
            <Image src="/android-chrome-192x192.png" alt="Logo" width={40} height={40} style={{ borderRadius: 10, boxShadow: '0 4px 20px rgba(217,255,91,0.2)' }} />
            <span style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Outfit' }}>SpendWise</span>
          </div>

          <div className="form-wrapper">
            <h1 className="auth-hero-title">
              {mode === 'login' ? 'Welcome back.' : 'Join the future.'}
            </h1>
            <p className="auth-hero-subtitle">
              {mode === 'login' 
                ? 'Sign in to access your intelligent dashboard.'
                : 'Experience weightless financial tracking today.'}
            </p>

            <div className="pill-toggle">
              <div 
                className="pill-bg"
                style={{
                  transform: `translateX(${mode === 'login' ? '0%' : '100%'})`
                }}
              />
              <button 
                className={`pill-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => setMode('login')}
              >Sign In</button>
              <button 
                className={`pill-btn ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => setMode('signup')}
              >Sign Up</button>
            </div>

            <form onSubmit={handleSubmit} className="ag-form">
              {mode === 'signup' && (
                <div className="ag-input-group">
                  <label className="ag-label" htmlFor="full-name">Full Name</label>
                  <div className="ag-input-wrapper">
                    <span className="ag-input-icon">👤</span>
                    <input
                      id="full-name"
                      type="text"
                      className="ag-input"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="ag-input-group">
                <label className="ag-label" htmlFor="email">Email Address</label>
                <div className="ag-input-wrapper">
                  <span className="ag-input-icon">✉️</span>
                  <input
                    id="email"
                    type="email"
                    className="ag-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="ag-input-group">
                <label className="ag-label" htmlFor="password">Password</label>
                <div className="ag-input-wrapper">
                  <span className="ag-input-icon">🔒</span>
                  <input
                    id="password"
                    type="password"
                    className="ag-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && <div className="form-error"><span>⚠️</span> {error}</div>}
              {message && <div className="form-success"><span>✅</span> {message}</div>}

              <button 
                type="submit" 
                className="hero-btn"
                disabled={loading}
              >
                {loading ? 'Processing...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
              </button>
            </form>
          </div>

          <div className="footer-links">
            <p style={{ color: '#64748b', fontSize: 12 }}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Right Panel: The Visual Showcase */}
      <motion.div 
        className="right-panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.2 }}
      >
        <div className="right-bg-orb right-orb-1" />
        <div className="right-bg-orb right-orb-2" />
        <div className="right-bg-orb right-orb-3" />

        <div className="right-mesh-overlay" />

        <div className="floating-showcase">
          <motion.div 
            className="showcase-card showcase-main"
            animate={{ y: [0, -20, 0], rotateX: [10, 15, 10], rotateY: [-10, -5, -10] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>Net Worth</span>
              <span style={{ fontSize: 14, color: '#D9FF5B' }}>+12.5%</span>
            </div>
            <div style={{ fontSize: 42, fontWeight: 700, fontFamily: 'Outfit', color: 'white' }}>
              $124,500
            </div>
            <div style={{ height: 60, marginTop: 20, background: 'linear-gradient(to top, rgba(217,255,91,0.2), transparent)', borderBottom: '2px solid #D9FF5B' }} />
          </motion.div>

          <motion.div 
            className="showcase-card showcase-sub"
            animate={{ y: [0, 15, 0], rotateZ: [-5, -2, -5] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                🛒
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Whole Foods</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Groceries</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 700, color: '#f43f5e' }}>
                -$142.50
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <style>{`
        .split-layout {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: #080A09;
          overflow: hidden;
        }

        /* --- LEFT PANEL --- */
        .left-panel {
          width: 40%;
          min-width: 400px;
          display: flex;
          flex-direction: column;
          background: #080A09;
          position: relative;
          z-index: 10;
          box-shadow: 20px 0 60px rgba(0,0,0,0.5);
        }
        .left-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px;
          max-width: 560px;
          margin: 0 auto;
          width: 100%;
        }
        .brand-header {
          position: absolute;
          top: 40px;
          left: 60px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .auth-hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: 40px;
          font-weight: 700;
          color: white;
          line-height: 1.1;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .auth-hero-subtitle {
          font-size: 15px;
          color: #94a3b8;
          margin-bottom: 32px;
        }
        
        .form-wrapper {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5), 
                      15px 15px 50px rgba(217, 255, 91, 0.15),
                      inset 0 1px 0 rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          transform-style: preserve-3d;
          perspective: 1000px;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
        }
        .form-wrapper:hover {
          transform: translateY(-8px) rotateX(2deg) rotateY(2deg);
          box-shadow: 0 40px 100px rgba(0,0,0,0.6), 
                      25px 25px 80px rgba(217, 255, 91, 0.35),
                      inset 0 1px 0 rgba(255,255,255,0.2);
        }

        /* Pill Toggle */
        .pill-toggle {
          display: flex;
          position: relative;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 99px;
          padding: 4px;
          margin-bottom: 40px;
          width: fit-content;
        }
        .pill-bg {
          position: absolute;
          width: 50%;
          height: calc(100% - 8px);
          background: rgba(217, 255, 91, 0.15);
          border: 1px solid rgba(217, 255, 91, 0.3);
          border-radius: 99px;
          transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .pill-btn {
          width: 120px;
          padding: 10px 0;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: #94a3b8;
          background: transparent;
          border: none;
          cursor: pointer;
          position: relative;
          z-index: 2;
          transition: color 0.3s;
        }
        .pill-btn.active {
          color: #D9FF5B;
        }

        /* AG Form */
        .ag-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .ag-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ag-label {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          padding-left: 4px;
        }
        .ag-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .ag-input-icon {
          position: absolute;
          left: 18px;
          font-size: 18px;
          opacity: 0.4;
          pointer-events: none;
          transition: opacity 0.3s;
          filter: grayscale(100%);
        }
        .ag-input-wrapper:focus-within .ag-input-icon {
          opacity: 1;
          filter: grayscale(0%);
        }
        .ag-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          color: white;
          font-size: 16px;
          padding: 16px 20px 16px 48px;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        .ag-input::placeholder {
          color: rgba(255,255,255,0.2);
        }
        .ag-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(217, 255, 91, 0.4);
          box-shadow: 0 0 20px rgba(217, 255, 91, 0.15), inset 0 2px 4px rgba(0,0,0,0.2);
        }

        .hero-btn {
          margin-top: 24px;
          background: linear-gradient(135deg, #D9FF5B, #b3ff00);
          color: #080A09;
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 16px;
          border: none;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(217,255,91,0.2);
          transition: all 0.3s ease;
        }
        .hero-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(217,255,91,0.35);
        }

        .form-error {
          color: #f43f5e; font-size: 14px; display: flex; gap: 8px; align-items: center;
        }
        .form-success {
          color: #10b981; font-size: 14px; display: flex; gap: 8px; align-items: center;
        }
        .footer-links {
          position: absolute;
          bottom: 40px;
          left: 60px;
          max-width: 300px;
        }

        /* --- RIGHT PANEL --- */
        .right-panel {
          flex: 1;
          position: relative;
          background: #0f1020;
          overflow: hidden;
          perspective: 1500px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .right-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          animation: slowFloat 20s infinite alternate;
        }
        .right-orb-1 {
          width: 800px; height: 800px;
          background: rgba(217,255,91,0.12);
          top: -200px; right: -100px;
        }
        .right-orb-2 {
          width: 600px; height: 600px;
          background: rgba(6,182,212,0.15);
          bottom: -100px; left: -100px;
          animation-direction: alternate-reverse;
          animation-duration: 25s;
        }
        .right-orb-3 {
          width: 500px; height: 500px;
          background: rgba(99,102,241,0.1);
          top: 40%; left: 30%;
          animation-duration: 15s;
        }

        .right-mesh-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 0%, #080A09 100%);
          z-index: 1;
        }

        .floating-showcase {
          position: relative;
          z-index: 5;
          transform-style: preserve-3d;
          width: 100%;
          max-width: 600px;
        }
        .showcase-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .showcase-main {
          width: 100%;
          height: 300px;
          transform: rotateX(10deg) rotateY(-10deg);
        }
        .showcase-sub {
          position: absolute;
          bottom: -40px;
          right: -40px;
          width: 320px;
          padding: 20px;
          background: rgba(15,16,32,0.8);
        }

        @keyframes slowFloat {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, 50px) scale(1.1); }
        }

        /* Responsiveness */
        @media (max-width: 900px) {
          .split-layout { flex-direction: column; }
          .left-panel { width: 100%; min-height: 100vh; }
          .right-panel { display: none; } /* Hide visuals on mobile */
          .left-content { padding: 40px 24px; }
          .brand-header { top: 24px; left: 24px; }
          .footer-links { bottom: 24px; left: 24px; }
        }
      `}</style>
    </div>
  )
}
