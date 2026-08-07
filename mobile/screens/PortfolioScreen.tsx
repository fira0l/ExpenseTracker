import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'

export default function PortfolioScreen({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true)
  const [banks, setBanks] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [debts, setDebts] = useState<any[]>([])

  // Modal States
  const [addAssetModal, setAddAssetModal] = useState(false)
  const [assetName, setAssetName] = useState('')
  const [assetValue, setAssetValue] = useState('')
  const [assetColor, setAssetColor] = useState('#10b981')

  const [addDebtModal, setAddDebtModal] = useState(false)
  const [debtName, setDebtName] = useState('')
  const [debtAmount, setDebtAmount] = useState('')
  const [debtRate, setDebtRate] = useState('')
  const [debtColor, setDebtColor] = useState('#ef4444')

  const [payModal, setPayModal] = useState<any>(null)
  const [payAmount, setPayAmount] = useState('')

  async function loadData() {
    setLoading(true)
    const [{ data: b }, { data: i }, { data: d }] = await Promise.all([
      supabase.from('automation_sources').select('*').eq('user_id', session.user.id).eq('type', 'bank_api'),
      supabase.from('investments').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('debts').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
    ])
    setBanks(b ?? [])
    setInvestments(i ?? [])
    setDebts(d ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const totalInvestments = investments.reduce((sum, inv) => sum + Number(inv.value), 0)
  const totalDebts = debts.reduce((sum, d) => sum + Number(d.amount), 0)
  const netWorth = totalInvestments - totalDebts

  async function handleAddAsset() {
    if (!assetName.trim() || !assetValue) return
    const val = parseFloat(assetValue)
    if (isNaN(val)) return

    const { error } = await supabase.from('investments').insert({
      user_id: session.user.id,
      name: assetName.trim(),
      value: val,
      color: assetColor,
    })

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    setAddAssetModal(false)
    setAssetName('')
    setAssetValue('')
    loadData()
  }

  async function handleAddDebt() {
    if (!debtName.trim() || !debtAmount) return
    const amt = parseFloat(debtAmount)
    if (isNaN(amt)) return
    const r = parseFloat(debtRate) || 0

    const { error } = await supabase.from('debts').insert({
      user_id: session.user.id,
      name: debtName.trim(),
      amount: amt,
      interest_rate: r,
      color: debtColor,
    })

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    setAddDebtModal(false)
    setDebtName('')
    setDebtAmount('')
    setDebtRate('')
    loadData()
  }

  async function handlePayDebt() {
    if (!payModal || !payAmount) return
    const payment = parseFloat(payAmount)
    if (isNaN(payment) || payment <= 0) return

    const newAmount = Math.max(0, Number(payModal.amount) - payment)

    if (newAmount === 0) {
      await supabase.from('debts').delete().eq('id', payModal.id)
      Alert.alert('🎉 Paid Off!', `You fully paid off ${payModal.name}!`)
    } else {
      await supabase.from('debts').update({ amount: newAmount }).eq('id', payModal.id)
    }

    setPayModal(null)
    setPayAmount('')
    loadData()
  }

  async function deleteItem(table: string, id: string) {
    Alert.alert('Delete Entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from(table).delete().eq('id', id)
          loadData()
        },
      },
    ])
  }

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
        <LinearGradient colors={['rgba(217, 255, 91, 0.08)', 'transparent']} style={styles.orb1} />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Portfolio & Wealth</Text>
        <Text style={styles.subtitle}>Track net portfolio assets and debt liabilities</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Net Portfolio Summary Banner */}
        <BlurView intensity={25} tint="dark" style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOTAL ASSET VALUE</Text>
          <Text style={styles.summaryValue}>${totalInvestments.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summarySubLabel}>DEBT LIABILITIES</Text>
              <Text style={[styles.summarySubValue, { color: '#ef4444' }]}>-${totalDebts.toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.summarySubLabel}>NET POSITION</Text>
              <Text style={[styles.summarySubValue, { color: netWorth >= 0 ? '#10b981' : '#ef4444' }]}>
                ${netWorth.toLocaleString()}
              </Text>
            </View>
          </View>
        </BlurView>

        {/* Investments Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Investments 📈</Text>
          <TouchableOpacity style={styles.addBtnSmall} onPress={() => setAddAssetModal(true)}>
            <Text style={styles.addBtnText}>+ Add Asset</Text>
          </TouchableOpacity>
        </View>

        <BlurView intensity={20} tint="dark" style={styles.card}>
          {investments.length === 0 ? (
            <Text style={styles.empty}>No investments added yet</Text>
          ) : (
            investments.map(i => (
              <View key={i.id} style={styles.row}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: i.color || '#10b981' }} />
                  <Text style={styles.name}>{i.name}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <Text style={styles.amount}>${Number(i.value).toLocaleString()}</Text>
                  <TouchableOpacity onPress={() => deleteItem('investments', i.id)}>
                    <Text style={styles.deleteBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </BlurView>

        {/* Debts Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Debts & Liabilities 📉</Text>
          <TouchableOpacity style={[styles.addBtnSmall, { backgroundColor: 'rgba(239,68,68,0.2)', borderColor: '#ef4444' }]} onPress={() => setAddDebtModal(true)}>
            <Text style={[styles.addBtnText, { color: '#ef4444' }]}>+ Add Debt</Text>
          </TouchableOpacity>
        </View>

        <BlurView intensity={20} tint="dark" style={styles.card}>
          {debts.length === 0 ? (
            <Text style={styles.empty}>No debts logged 🎉</Text>
          ) : (
            debts.map(d => (
              <View key={d.id} style={styles.row}>
                <View>
                  <Text style={styles.name}>{d.name}</Text>
                  <Text style={styles.subname}>{d.interest_rate}% APR</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={[styles.amount, { color: '#ef4444' }]}>${Number(d.amount).toLocaleString()}</Text>
                  <TouchableOpacity style={styles.payBtn} onPress={() => setPayModal(d)}>
                    <Text style={styles.payBtnText}>Pay</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteItem('debts', d.id)}>
                    <Text style={styles.deleteBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </BlurView>

        {/* Banks */}
        <Text style={styles.sectionTitle}>Connected Banks 🏦</Text>
        <BlurView intensity={20} tint="dark" style={styles.card}>
          {banks.length === 0 ? (
            <Text style={styles.empty}>No bank feeds synced</Text>
          ) : (
            banks.map(b => (
              <View key={b.id} style={styles.row}>
                <View>
                  <Text style={styles.name}>{b.name}</Text>
                  <Text style={styles.subname}>{b.config?.institution || 'Bank API Feed'}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteItem('automation_sources', b.id)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </BlurView>
      </ScrollView>

      {/* Add Asset Modal */}
      <Modal visible={addAssetModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Investment Asset</Text>
            <TextInput
              style={styles.input}
              placeholder="Asset Name (e.g. Stocks, Bitcoin)"
              placeholderTextColor="#64748b"
              value={assetName}
              onChangeText={setAssetName}
            />
            <TextInput
              style={styles.input}
              placeholder="Current Value ($)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={assetValue}
              onChangeText={setAssetValue}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddAssetModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddAsset}>
                <Text style={styles.saveText}>Save Asset</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* Add Debt Modal */}
      <Modal visible={addDebtModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Debt Liability</Text>
            <TextInput
              style={styles.input}
              placeholder="Debt Name (e.g. Credit Card)"
              placeholderTextColor="#64748b"
              value={debtName}
              onChangeText={setDebtName}
            />
            <TextInput
              style={styles.input}
              placeholder="Balance ($)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={debtAmount}
              onChangeText={setDebtAmount}
            />
            <TextInput
              style={styles.input}
              placeholder="Interest Rate (APR %)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={debtRate}
              onChangeText={setDebtRate}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddDebtModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#ef4444' }]} onPress={handleAddDebt}>
                <Text style={[styles.saveText, { color: '#fff' }]}>Save Debt</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* Pay Debt Modal */}
      <Modal visible={!!payModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pay Down {payModal?.name}</Text>
            <Text style={{ color: '#94a3b8', marginBottom: 12, fontSize: 13 }}>
              Current balance: ${Number(payModal?.amount || 0).toLocaleString()}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Payment Amount ($)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={payAmount}
              onChangeText={setPayAmount}
              autoFocus
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#10b981' }]} onPress={handlePayDebt}>
                <Text style={[styles.saveText, { color: '#fff' }]}>Apply Payment</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080A09' },
  background: { position: 'absolute', inset: 0, zIndex: 0 },
  orb1: { position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: 150 },
  header: { padding: 20, paddingTop: 60, paddingBottom: 10, zIndex: 10 },
  title: { fontSize: 24, fontWeight: '800', color: 'white' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  summaryCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(217,255,91,0.2)',
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.5 },
  summaryValue: { fontSize: 30, fontWeight: '800', color: '#D9FF5B', marginTop: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  summarySubLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  summarySubValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: 'white' },
  addBtnSmall: { backgroundColor: 'rgba(217,255,91,0.15)', borderWidth: 1, borderColor: '#D9FF5B', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  addBtnText: { color: '#D9FF5B', fontSize: 12, fontWeight: '700' },
  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  name: { fontSize: 15, fontWeight: '600', color: 'white' },
  subname: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700', color: 'white' },
  empty: { color: '#94a3b8', fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  deleteBtn: { color: '#64748b', fontSize: 16, padding: 4 },
  payBtn: { backgroundColor: 'rgba(34, 197, 94, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  payBtnText: { color: '#22c55e', fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 15, marginBottom: 12 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { padding: 10 },
  cancelText: { color: '#cbd5e1', fontSize: 14 },
  saveBtn: { backgroundColor: '#D9FF5B', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  saveText: { color: '#080A09', fontWeight: '700', fontSize: 14 },
})
