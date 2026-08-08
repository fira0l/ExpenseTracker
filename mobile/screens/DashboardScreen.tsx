import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

export default function DashboardScreen({ session, navigation }: { session: Session; navigation: any }) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showNumbers, setShowNumbers] = useState(true)
  const [cardType, setCardType] = useState<'debit' | 'credit'>('debit')
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview')
  const [search, setSearch] = useState('')

  const userSuffix = useMemo(() => {
    const uid = session?.user?.id || '8842'
    return uid.slice(-4).toUpperCase()
  }, [session])

  const fmt = useCallback(
    (n: number) => {
      try {
        const cur = profile?.currency || 'ETB'
        if (cur === 'ETB') {
          return `ETB ${n.toLocaleString('en-US')}`
        }
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: cur,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(n)
      } catch (e) {
        return `${profile?.currency || 'ETB'} ${n}`
      }
    },
    [profile]
  )

  async function loadData() {
    if (!session?.user?.id) return
    const userId = session.user.id

    try {
      const [{ data: txs }, { data: prof }, { data: gData }] = await Promise.all([
        supabase
          .from('transactions')
          .select('*, categories(name, icon, color)')
          .eq('user_id', userId)
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('full_name, monthly_income, currency').eq('id', userId).single(),
        supabase.from('savings_goals').select('*').eq('user_id', userId).limit(3),
      ])

      setTransactions(txs ?? [])
      setProfile(prof ?? null)
      setGoals(gData ?? [])
    } catch (err) {
      console.log('Error loading mobile dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [session])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const thisMonthExpenses = useMemo(
    () => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0),
    [transactions]
  )

  const thisMonthIncome = useMemo(
    () => transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0),
    [transactions]
  )

  const balance = useMemo(
    () => (profile?.monthly_income ?? 0) + thisMonthIncome - thisMonthExpenses,
    [profile, thisMonthIncome, thisMonthExpenses]
  )

  const budgetPct = profile?.monthly_income ? Math.min((thisMonthExpenses / profile.monthly_income) * 100, 100) : 0

  const filteredTxs = useMemo(() => {
    if (!search.trim()) return transactions
    return transactions.filter(
      t =>
        (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.categories?.name || '').toLowerCase().includes(search.toLowerCase())
    )
  }, [transactions, search])

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#D9FF5B" />
        <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 12 }}>Syncing database...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Background Ambient Orbs */}
      <View style={styles.background}>
        <LinearGradient colors={['rgba(217, 255, 91, 0.08)', 'transparent']} style={styles.orb1} />
        <LinearGradient colors={['rgba(6, 182, 212, 0.08)', 'transparent']} style={styles.orb2} />
      </View>

      {/* Clean Top Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#D9FF5B' }}>
              {(profile?.full_name || session?.user?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.greeting}>
              Hey, {profile?.full_name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.eyeToggleBtn} onPress={() => setShowNumbers(!showNumbers)}>
          <Ionicons name={showNumbers ? "eye-outline" : "eye-off-outline"} size={18} color="#cbd5e1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D9FF5B" />}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
      >
        {/* Card Switcher Pill */}
        <View style={styles.cardTypeRow}>
          <TouchableOpacity
            style={[styles.cardTypeTab, cardType === 'debit' && styles.cardTypeTabActive]}
            onPress={() => setCardType('debit')}
          >
            <Text style={[styles.cardTypeText, cardType === 'debit' && styles.cardTypeTextActive]}>Debit Vault</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cardTypeTab, cardType === 'credit' && styles.cardTypeTabActive]}
            onPress={() => setCardType('credit')}
          >
            <Text style={[styles.cardTypeText, cardType === 'credit' && styles.cardTypeTextActive]}>Platinum Credit</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Metallic Bank Card */}
        <LinearGradient
          colors={cardType === 'debit' ? ['#0f172a', '#1e293b', '#090d16'] : ['#1e1b4b', '#312e81', '#0f172a']}
          style={[
            styles.bankCard,
            { borderColor: cardType === 'debit' ? 'rgba(217, 255, 91, 0.3)' : 'rgba(129, 140, 248, 0.35)' },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.emvChip}>
                <View style={styles.emvChipInner} />
              </View>
              <Ionicons name="wifi-outline" size={16} color="#94a3b8" style={{ transform: [{ rotate: '90deg' }] }} />
            </View>
            <Text style={[styles.cardBrand, { color: cardType === 'debit' ? '#D9FF5B' : '#a78bfa' }]}>
              {cardType === 'debit' ? 'SPENDWISE DEBIT' : 'SPENDWISE PLATINUM'}
            </Text>
          </View>

          <View style={{ marginVertical: 14 }}>
            <Text style={styles.cardLabel}>
              {cardType === 'debit' ? 'AVAILABLE CHECKING BALANCE' : 'CREDIT LIMIT AVAILABLE'}
            </Text>
            <Text style={[styles.cardBalance, { color: balance >= 0 ? '#fff' : '#f43f5e' }]}>
              {showNumbers ? fmt(balance) : '$••••••••'}
            </Text>
            <Text style={styles.cardNumber}>
              {showNumbers ? `•••• •••• •••• ${userSuffix}` : '•••• •••• •••• ••••'}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardFooterLabel}>CARDHOLDER</Text>
              <Text style={styles.cardFooterValue}>
                {(profile?.full_name || session?.user?.email || 'VALUED MEMBER').toUpperCase()}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.cardFooterLabel}>EXPIRES</Text>
              <Text style={styles.cardFooterValue}>12/28</Text>
            </View>
          </View>
        </LinearGradient>

        {/* 4 Premium Quick Action Buttons */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Add')}>
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(217,255,91,0.15)', borderColor: '#D9FF5B' }]}>
              <Ionicons name="add" size={22} color="#D9FF5B" />
            </View>
            <Text style={styles.actionLabel}>Add Tx</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Advisor')}>
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(6,182,212,0.15)', borderColor: '#06b6d4' }]}>
              <Ionicons name="sparkles" size={20} color="#06b6d4" />
            </View>
            <Text style={styles.actionLabel}>AI Coach</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Goals')}>
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(167,139,250,0.15)', borderColor: '#a78bfa' }]}>
              <Ionicons name="trophy" size={20} color="#a78bfa" />
            </View>
            <Text style={styles.actionLabel}>Goals</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Analytics')}>
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10b981' }]}>
              <Ionicons name="stats-chart" size={20} color="#10b981" />
            </View>
            <Text style={styles.actionLabel}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* View Segment Switcher (Overview vs Activity) */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'overview' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.segmentText, activeTab === 'overview' && styles.segmentTextActive]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'activity' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={[styles.segmentText, activeTab === 'activity' && styles.segmentTextActive]}>
              Recent Activity ({transactions.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Overview Widgets */}
        {activeTab === 'overview' && (
          <View style={{ gap: 14 }}>
            {/* Monthly Cash Flow Summary */}
            <View style={styles.cleanCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#f8fafc' }}>Monthly Cash Flow</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>{new Date().toLocaleDateString('en-US', { month: 'short' })}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Income Pool</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#10b981', marginTop: 2 }}>
                    {showNumbers ? fmt((profile?.monthly_income ?? 0) + thisMonthIncome) : '$••••'}
                  </Text>
                </View>
                <View style={{ width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Expenses</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#f43f5e', marginTop: 2 }}>
                    {showNumbers ? fmt(thisMonthExpenses) : '$••••'}
                  </Text>
                </View>
              </View>

              {(profile?.monthly_income ?? 0) > 0 && (
                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>Budget Usage</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: budgetPct >= 80 ? '#f43f5e' : '#D9FF5B' }}>
                      {Math.round(budgetPct)}%
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${budgetPct}%`, backgroundColor: budgetPct >= 80 ? '#f43f5e' : '#D9FF5B' }]} />
                  </View>
                </View>
              )}
            </View>

            {/* Savings Milestones */}
            {goals.length > 0 && (
              <View style={styles.cleanCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Savings Goals</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
                    <Text style={{ fontSize: 11, color: '#D9FF5B', fontWeight: '600' }}>Manage →</Text>
                  </TouchableOpacity>
                </View>

                {goals.map(g => {
                  const current = Number(g.current_amount || 0)
                  const target = Number(g.target_amount || 1)
                  const pct = Math.min(100, Math.round((current / target) * 100))

                  return (
                    <View key={g.id} style={{ marginTop: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 13, color: '#e2e8f0', fontWeight: '600' }}>{g.icon || '🎯'} {g.name}</Text>
                        <Text style={{ fontSize: 12, color: '#D9FF5B', fontWeight: '700' }}>{pct}%</Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: g.color || '#10b981' }]} />
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        )}

        {/* Tab 2: Activity List */}
        {activeTab === 'activity' && (
          <View style={{ gap: 10 }}>
            {/* Search Input */}
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search activity..."
              placeholderTextColor="#64748b"
              value={search}
              onChangeText={setSearch}
            />

            {filteredTxs.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={32} color="#64748b" />
                <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>No recent transactions found</Text>
              </View>
            ) : (
              filteredTxs.map(tx => (
                <View key={tx.id} style={styles.txRow}>
                  <View style={[styles.txIconBg, { backgroundColor: `${tx.categories?.color ?? '#6b7280'}20` }]}>
                    <Ionicons
                      name={tx.type === 'expense' ? "arrow-up" : "arrow-down"}
                      size={18}
                      color={tx.type === 'expense' ? '#f43f5e' : '#10b981'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txTitle} numberOfLines={1}>
                      {tx.description || tx.categories?.name || 'Transaction'}
                    </Text>
                    <Text style={styles.txSub}>{tx.categories?.name ?? 'Uncategorized'}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.type === 'expense' ? '#f43f5e' : '#10b981' }]}>
                    {tx.type === 'expense' ? '-' : '+'}
                    {showNumbers ? fmt(tx.amount) : '$••••'}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080A09' },
  background: { position: 'absolute', inset: 0 },
  orb1: { position: 'absolute', top: -80, left: -40, width: 260, height: 260, borderRadius: 130 },
  orb2: { position: 'absolute', bottom: -40, right: -40, width: 260, height: 260, borderRadius: 130 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16 },
  avatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(217,255,91,0.15)', borderWidth: 1, borderColor: 'rgba(217,255,91,0.3)', justifyContent: 'center', alignItems: 'center' },
  greeting: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  subtitle: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  eyeToggleBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  cardTypeRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3, marginVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardTypeTab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8 },
  cardTypeTabActive: { backgroundColor: '#D9FF5B' },
  cardTypeText: { fontSize: 11, fontWeight: '700', color: '#cbd5e1' },
  cardTypeTextActive: { color: '#080A09' },
  bankCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emvChip: { width: 30, height: 22, borderRadius: 4, backgroundColor: '#d97706', borderWidth: 1, borderColor: '#fef08a', justifyContent: 'center', alignItems: 'center' },
  emvChipInner: { width: '80%', height: '60%', borderWidth: 1, borderColor: 'rgba(0,0,0,0.3)', borderRadius: 2 },
  cardBrand: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cardLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.5 },
  cardBalance: { fontSize: 30, fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },
  cardNumber: { fontSize: 11, color: '#94a3b8', letterSpacing: 2, marginTop: 4, fontFamily: 'monospace' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  cardFooterLabel: { fontSize: 8, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.5 },
  cardFooterValue: { fontSize: 11, fontWeight: '700', color: '#f8fafc', letterSpacing: 0.5 },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  actionItem: { alignItems: 'center', width: (width - 64) / 4 },
  actionIconBg: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 11, color: '#cbd5e1', fontWeight: '600' },
  segmentContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 3, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  segmentBtnActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  segmentText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  segmentTextActive: { color: '#D9FF5B', fontWeight: '700' },
  cleanCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  searchInput: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10, color: '#fff', fontSize: 13, marginBottom: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  txRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 6 },
  txIconBg: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  txTitle: { fontSize: 13, fontWeight: '600', color: '#f1f5f9' },
  txSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
})
