'use client'
import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Area, AreaChart
} from 'recharts'

interface Props {
  monthlySummary: { month: string; expenses: number; income: number; savings: number }[]
  categoryData: { id: string; name: string; icon: string; color: string; total: number }[]
  dailySpending: Record<string, number>
  currency: string
}

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(10, 12, 10, 0.85)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    color: '#f1f5f9',
    fontSize: 13,
    boxShadow: '0 16px 32px rgba(0,0,0,0.5)',
  },
  itemStyle: { color: '#f1f5f9', fontWeight: 600 }
}

// 3D Tilt Card Component
function TiltCard({ children, delay = 0, className = '' }: { children: React.ReactNode, delay?: number, className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 })
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7deg', '7deg'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    
    x.set(xPct)
    y.set(yPct)
    
    // Update CSS variable for the glow effect
    ref.current.style.setProperty('--mouse-x', `${mouseX}px`)
    ref.current.style.setProperty('--mouse-y', `${mouseY}px`)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div 
      className={`ag-card-wrapper ${className}`}
      initial={{ opacity: 0, y: 50, scale: 0.95, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={{ duration: 0.8, delay, type: 'spring', bounce: 0.4 }}
      style={{ rotateX, rotateY }}
    >
      <div 
        ref={ref}
        className="ag-card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="ag-card-content">
          {children}
        </div>
      </div>
    </motion.div>
  )
}


export default function AnalyticsCharts({ monthlySummary, categoryData, dailySpending, currency }: Props) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(n)

  const totalExpenses = categoryData.reduce((s, c) => s + c.total, 0)

  const pieData = categoryData.map(c => ({
    id: c.id,
    name: `${c.icon} ${c.name}`,
    value: c.total,
    color: c.color,
    pct: totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 100) : 0,
  }))

  const dailyEntries = Object.entries(dailySpending)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, amount]) => ({
      date: date.slice(5),
      amount,
    }))

  const axisStyle = { fill: '#64748b', fontSize: 11, fontWeight: 500 }

  return (
    <div className="ag-container">
      {/* Background Depth Orbs */}
      <div className="ag-orb ag-orb-1" />
      <div className="ag-orb ag-orb-2" />

      <div className="ag-grid" style={{ marginBottom: 24 }}>
        {/* Income vs Expenses Bar Chart */}
        <TiltCard delay={0.1}>
          <h2 className="ag-title">Cash Flow Overview</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlySummary} barGap={6} barCategoryGap={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={n => fmt(n)} width={70} dx={-10} />
              <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v) => [fmt(Number(v ?? 0)), '']} />
              <Legend wrapperStyle={{ paddingTop: 20 }} formatter={v => <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>{v}</span>} />
              <Bar dataKey="income" name="Income" radius={[6,6,0,0]} fill="url(#incomeGrad)" />
              <Bar dataKey="expenses" name="Expenses" radius={[6,6,0,0]} fill="url(#expenseGrad)" />
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D9FF5B" stopOpacity={1} />
                  <stop offset="100%" stopColor="#D9FF5B" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.2} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </TiltCard>
      </div>

      <div className="ag-grid ag-grid-2">
        {/* Savings Trend Area Chart */}
        <TiltCard delay={0.2}>
          <h2 className="ag-title">Savings Trajectory</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlySummary}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={n => fmt(n)} width={70} dx={-10} />
              <Tooltip {...tooltipStyle} formatter={(v) => [fmt(Number(v ?? 0)), 'Savings']} />
              <Area type="monotone" dataKey="savings" stroke="#6366f1" strokeWidth={3} fill="url(#savingsGrad)" dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: '#fff', stroke: '#6366f1', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </TiltCard>

        {/* Category Pie Chart */}
        <TiltCard delay={0.3}>
          <h2 className="ag-title">Spending Breakdown</h2>
          {pieData.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              No data yet
            </div>
          ) : (
            <div style={{ display: 'flex', height: 220, alignItems: 'center' }}>
              <div style={{ flex: 1, height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={50} dataKey="value" paddingAngle={4} stroke="none">
                      {pieData.map((entry, i) => (
                        <Cell key={entry.id} fill={entry.color} style={{ filter: `drop-shadow(0px 4px 8px ${entry.color}40)` }} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v) => [fmt(Number(v ?? 0)), '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 10 }}>
                {pieData.slice(0, 5).map((d, i) => (
                  <motion.div 
                    key={d.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color, boxShadow: `0 0 10px ${d.color}80` }} />
                      <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>{d.name.split(' ')[1]}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{fmt(d.value)}</span>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{d.pct}%</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </TiltCard>
      </div>

      <div className="ag-grid ag-grid-2" style={{ marginTop: 24 }}>
        {/* Daily Spending */}
        <TiltCard delay={0.4}>
          <h2 className="ag-title">Daily Velocity (14 Days)</h2>
          {dailyEntries.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dailyEntries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={n => fmt(n)} width={65} dx={-10} />
                <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v) => [fmt(Number(v ?? 0)), 'Spent']} />
                <defs>
                  <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <Bar dataKey="amount" radius={[4,4,0,0]} fill="url(#dailyGrad)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </TiltCard>

        {/* Debt Overview (Placeholder) */}
        <TiltCard delay={0.5}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <h2 className="ag-title" style={{ marginBottom: 0 }}>Debt vs Assets</h2>
          </div>
          <div style={{ height: 240, position: 'relative' }}>
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={[
                 { month: 'Mar', assets: 2000, debt: 4800 },
                 { month: 'Apr', assets: 2780, debt: 3908 },
                 { month: 'May', assets: 4890, debt: 3800 },
                 { month: 'Jun', assets: 6390, debt: 2800 },
                 { month: 'Jul', assets: 8390, debt: 2100 },
                 { month: 'Aug', assets: 10400, debt: 1500 },
               ]}>
                 <defs>
                   <linearGradient id="assetsGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                     <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                   </linearGradient>
                   <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                     <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                 <XAxis dataKey="month" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                 <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={50} dx={-10} tickFormatter={n => `$${n}`} />
                 <Tooltip {...tooltipStyle} />
                 <Area type="monotone" dataKey="assets" stroke="#10b981" strokeWidth={2} fill="url(#assetsGrad)" />
                 <Area type="monotone" dataKey="debt" stroke="#ef4444" strokeWidth={2} fill="url(#debtGrad)" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </TiltCard>
      </div>

      <div className="ag-grid ag-grid-2" style={{ marginTop: 24 }}>
        {/* Upcoming Bills (Placeholder) */}
        <TiltCard delay={0.6}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
             <h2 className="ag-title" style={{ marginBottom: 0 }}>Upcoming Bills</h2>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
             {[
               { name: 'Netflix', date: 'Aug 12', amount: 15.99, icon: '🎬', color: '#e50914' },
               { name: 'Electricity', date: 'Aug 15', amount: 84.50, icon: '⚡', color: '#f59e0b' },
               { name: 'Internet', date: 'Aug 20', amount: 65.00, icon: '🌐', color: '#3b82f6' },
             ].map((bill, i) => (
               <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                   <div style={{ fontSize: 24 }}>{bill.icon}</div>
                   <div>
                     <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: 15 }}>{bill.name}</div>
                     <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>Due {bill.date}</div>
                   </div>
                 </div>
                 <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: 16 }}>
                   ${bill.amount.toFixed(2)}
                 </div>
               </div>
             ))}
           </div>
        </TiltCard>

        {/* Investment Portfolio (Placeholder) */}
        <TiltCard delay={0.7}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
             <h2 className="ag-title" style={{ marginBottom: 0 }}>Investments</h2>
           </div>
           <div style={{ display: 'flex', height: 200, alignItems: 'center', justifyContent: 'center' }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={[
                   { name: 'S&P 500', value: 4500, color: '#3b82f6' },
                   { name: 'Crypto', value: 1200, color: '#8b5cf6' },
                   { name: 'Bonds', value: 800, color: '#10b981' },
                 ]} cx="50%" cy="50%" outerRadius={70} innerRadius={55} dataKey="value" paddingAngle={5} stroke="none">
                   {
                     [
                       { name: 'S&P 500', value: 4500, color: '#3b82f6' },
                       { name: 'Crypto', value: 1200, color: '#8b5cf6' },
                       { name: 'Bonds', value: 800, color: '#10b981' },
                     ].map((entry, i) => (
                       <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0px 4px 8px ${entry.color}40)` }} />
                     ))
                   }
                 </Pie>
                 <Tooltip {...tooltipStyle} />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 12 }}>
             Connect your brokerage to track assets.
           </div>
        </TiltCard>
      </div>
    </div>
  )
}
