import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface Props {
  session: Session | null
}

export default function GoalsScreen({ session }: Props) {
  const [goals, setGoals] = useState<any[]>([])
  const [recurring, setRecurring] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [addGoalModal, setAddGoalModal] = useState(false)
  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')

  const [depositModal, setDepositModal] = useState<any>(null)
  const [depositAmt, setDepositAmt] = useState('')

  const [addRecurringModal, setAddRecurringModal] = useState(false)
  const [recDesc, setRecDesc] = useState('')
  const [recAmt, setRecAmt] = useState('')
  const [recFreq, setRecFreq] = useState('monthly')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    if (!session?.user?.id) return
    setLoading(true)

    try {
      const [{ data: gData }, { data: rData }] = await Promise.all([
        supabase.from('savings_goals').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('recurring_transactions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      ])

      if (gData) setGoals(gData)
      if (rData) setRecurring(rData)
    } catch (err) {
      console.log('Error loading goals:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddGoal() {
    if (!goalName.trim() || !goalTarget) return
    const tgt = parseFloat(goalTarget)
    if (isNaN(tgt)) return

    const { error } = await supabase.from('savings_goals').insert({
      user_id: session?.user?.id,
      name: goalName.trim(),
      target_amount: tgt,
      current_amount: 0,
      icon: '🎯',
      color: '#10b981',
    })

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    setAddGoalModal(false)
    setGoalName('')
    setGoalTarget('')
    fetchData()
  }

  async function handleDeposit() {
    if (!depositModal || !depositAmt) return
    const val = parseFloat(depositAmt)
    if (isNaN(val) || val <= 0) return

    const newAmt = Number(depositModal.current_amount || 0) + val

    const { error } = await supabase
      .from('savings_goals')
      .update({ current_amount: newAmt })
      .eq('id', depositModal.id)

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    setDepositModal(null)
    setDepositAmt('')
    fetchData()
  }

  async function handleAddRecurring() {
    if (!recDesc.trim() || !recAmt) return
    const amt = parseFloat(recAmt)
    if (isNaN(amt)) return

    const { error } = await supabase.from('recurring_transactions').insert({
      user_id: session?.user?.id,
      description: recDesc.trim(),
      amount: amt,
      type: 'expense',
      frequency: recFreq,
      next_due_date: new Date().toISOString().split('T')[0],
      is_active: true,
    })

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    setAddRecurringModal(false)
    setRecDesc('')
    setRecAmt('')
    fetchData()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Goals & Recurring Vault</Text>
        <Text style={styles.subtitle}>Track savings milestones & recurring schedules</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100, gap: 20 }}>
        {/* Savings Goals Section */}
        <View>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Savings Goals ({goals.length})</Text>
            <TouchableOpacity style={styles.addBtnSmall} onPress={() => setAddGoalModal(true)}>
              <Text style={styles.addBtnText}>+ New Goal</Text>
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyText}>No Savings Goals Set Yet</Text>
            </View>
          ) : (
            goals.map(g => {
              const current = Number(g.current_amount || 0)
              const target = Number(g.target_amount || 1)
              const pct = Math.min(100, Math.round((current / target) * 100))

              return (
                <View key={g.id} style={styles.goalCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#f1f5f9' }}>{g.icon || '🎯'} {g.name}</Text>
                    <Text style={{ fontSize: 12, color: '#D9FF5B', fontWeight: '700' }}>{pct}% Complete</Text>
                  </View>

                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: g.color || '#10b981' }]} />
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#cbd5e1' }}>
                      Saved: <Text style={{ fontWeight: '700', color: '#fff' }}>${current.toLocaleString()}</Text> / ${target.toLocaleString()}
                    </Text>
                    <TouchableOpacity style={styles.depositBtn} onPress={() => setDepositModal(g)}>
                      <Text style={styles.depositBtnText}>+ Deposit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })
          )}
        </View>

        {/* Recurring Schedules Section */}
        <View>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Recurring Schedules ({recurring.length})</Text>
            <TouchableOpacity style={[styles.addBtnSmall, { borderColor: '#a78bfa' }]} onPress={() => setAddRecurringModal(true)}>
              <Text style={[styles.addBtnText, { color: '#a78bfa' }]}>+ Add Bill</Text>
            </TouchableOpacity>
          </View>

          {recurring.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔄</Text>
              <Text style={styles.emptyText}>No Recurring Bills or Subscriptions</Text>
            </View>
          ) : (
            recurring.map(r => (
              <View key={r.id} style={styles.goalCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#f1f5f9' }}>{r.description}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: r.type === 'income' ? '#22c55e' : '#ef4444' }}>
                    {r.type === 'income' ? '+' : '-'}${Number(r.amount).toLocaleString()}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, textTransform: 'capitalize' }}>
                  Frequency: {r.frequency} • Next Due: {r.next_due_date || 'Upcoming'}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={addGoalModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Savings Goal</Text>
            <TextInput
              style={styles.input}
              placeholder="Goal Name (e.g. Vacation)"
              placeholderTextColor="#64748b"
              value={goalName}
              onChangeText={setGoalName}
            />
            <TextInput
              style={styles.input}
              placeholder="Target Amount ($)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={goalTarget}
              onChangeText={setGoalTarget}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddGoalModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddGoal}>
                <Text style={styles.saveText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deposit Modal */}
      <Modal visible={!!depositModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Deposit to {depositModal?.name}</Text>
            <TextInput
              style={styles.input}
              placeholder="Deposit Amount ($)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={depositAmt}
              onChangeText={setDepositAmt}
              autoFocus
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDepositModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleDeposit}>
                <Text style={styles.saveText}>Deposit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Recurring Modal */}
      <Modal visible={addRecurringModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Recurring Bill / Subscription</Text>
            <TextInput
              style={styles.input}
              placeholder="Description (e.g. Netflix, Gym)"
              placeholderTextColor="#64748b"
              value={recDesc}
              onChangeText={setRecDesc}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount ($)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={recAmt}
              onChangeText={setRecAmt}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddRecurringModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#a78bfa' }]} onPress={handleAddRecurring}>
                <Text style={[styles.saveText, { color: '#fff' }]}>Save Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080A09', padding: 16 },
  header: { marginBottom: 16, marginTop: 10 },
  title: { fontSize: 22, fontWeight: '700', color: '#f1f5f9' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc' },
  addBtnSmall: { backgroundColor: 'rgba(217,255,91,0.15)', borderWidth: 1, borderColor: '#D9FF5B', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  addBtnText: { color: '#D9FF5B', fontSize: 12, fontWeight: '700' },
  emptyCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, alignItems: 'center' },
  emptyIcon: { fontSize: 32 },
  emptyText: { color: '#94a3b8', fontSize: 13, marginTop: 8 },
  goalCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, marginVertical: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  depositBtn: { backgroundColor: 'rgba(217, 255, 91, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  depositBtnText: { color: '#D9FF5B', fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0f172a', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 15, marginBottom: 12 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { padding: 10 },
  cancelText: { color: '#cbd5e1', fontSize: 14 },
  saveBtn: { backgroundColor: '#D9FF5B', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  saveText: { color: '#080A09', fontWeight: '700', fontSize: 14 },
})
