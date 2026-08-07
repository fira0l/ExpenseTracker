import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { LinearGradient } from 'expo-linear-gradient'

export default function HistoryScreen({ session }: { session: Session }) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currency, setCurrency] = useState('ETB')

  const loadData = useCallback(async () => {
    const userId = session.user.id
    const [{ data: txs }, { data: prof }] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, categories(name, icon, color)')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('profiles').select('currency').eq('id', userId).single(),
    ])

    setTransactions(txs ?? [])
    if (prof) setCurrency(prof.currency)
    setLoading(false)
  }, [session])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Transaction', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('transactions').delete().eq('id', id)
          loadData()
        },
      },
    ])
  }

  const fmt = (n: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n)
  }

  // Filtered transactions
  const filteredTxs = transactions.filter(t => {
    const matchesSearch =
      !search.trim() ||
      (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.categories?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || t.type === filterType
    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#D9FF5B" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <LinearGradient colors={['rgba(99, 102, 241, 0.08)', 'transparent']} style={styles.orb1} />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Transactions Ledger</Text>
        <Text style={styles.subtitle}>Filter, search, and manage your history</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search merchant, category..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'all' && styles.filterActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>All ({transactions.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'expense' && styles.filterActive]}
          onPress={() => setFilterType('expense')}
        >
          <Text style={[styles.filterText, filterType === 'expense' && styles.filterTextActive]}>Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'income' && styles.filterActive]}
          onPress={() => setFilterType('income')}
        >
          <Text style={[styles.filterText, filterType === 'income' && styles.filterTextActive]}>Income</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D9FF5B" />}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {filteredTxs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No matching transactions</Text>
          </View>
        ) : (
          Object.entries(
            filteredTxs.reduce((acc, tx) => {
              const date = tx.transaction_date
              if (!acc[date]) acc[date] = []
              acc[date].push(tx)
              return acc
            }, {} as Record<string, any[]>)
          ).map(([date, txs]: [string, any]) => (
            <View key={date} style={{ marginBottom: 16 }}>
              <Text style={styles.dateHeader}>
                {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
              <View style={styles.txList}>
                {txs.map((tx: any, idx: number) => (
                  <TouchableOpacity
                    key={tx.id}
                    onLongPress={() => handleDelete(tx.id, tx.description || tx.categories?.name || 'Transaction')}
                    style={[styles.txItem, idx === txs.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <View style={[styles.txIcon, { backgroundColor: `${tx.categories?.color ?? '#6b7280'}25` }]}>
                      <Text style={{ fontSize: 18 }}>{tx.categories?.icon ?? '📌'}</Text>
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txName} numberOfLines={1}>
                        {tx.description || tx.categories?.name || 'Transaction'}
                      </Text>
                      <Text style={styles.txDate}>{tx.categories?.name ?? 'Uncategorized'}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: tx.type === 'expense' ? '#ef4444' : '#10b981' }]}>
                      {tx.type === 'expense' ? '-' : '+'}
                      {fmt(tx.amount)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080A09' },
  background: { position: 'absolute', inset: 0, zIndex: 0 },
  orb1: { position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: 150 },
  header: { padding: 20, paddingTop: 60, paddingBottom: 10, zIndex: 10 },
  title: { fontSize: 24, fontWeight: '800', color: 'white' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  searchRow: { marginHorizontal: 16, marginBottom: 10 },
  searchInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, color: '#fff', fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  filterActive: { backgroundColor: 'rgba(217,255,91,0.15)', borderColor: '#D9FF5B' },
  filterText: { fontSize: 12, color: '#cbd5e1', fontWeight: '600' },
  filterTextActive: { color: '#D9FF5B', fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.5 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#94a3b8' },
  dateHeader: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginHorizontal: 24, marginBottom: 8, marginTop: 10, textTransform: 'uppercase' },
  txList: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  txItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  txIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txName: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  txDate: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  txAmount: { fontSize: 16, fontWeight: '700' },
})
