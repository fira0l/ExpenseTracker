import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { PieChart, LineChart } from 'react-native-chart-kit'

const { width } = Dimensions.get('window')

export default function AnalyticsScreen({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([])
  const [lineData, setLineData] = useState<{ labels: string[]; expense: number[]; income: number[] }>({
    labels: [],
    expense: [],
    income: [],
  })

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const now = new Date()
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

      const { data: txs } = await supabase
        .from('transactions')
        .select('*, categories(name, icon, color)')
        .eq('user_id', session.user.id)
        .gte('transaction_date', monthStart)
        .order('transaction_date', { ascending: true })

      let inc = 0
      let exp = 0
      const catMap: Record<string, { name: string; amount: number; color: string }> = {}
      const grouped: Record<string, { exp: number; inc: number }> = {}

      txs?.forEach(tx => {
        const d = tx.transaction_date.substring(5, 10) // MM-DD
        if (!grouped[d]) grouped[d] = { exp: 0, inc: 0 }

        if (tx.type === 'expense') {
          exp += tx.amount
          grouped[d].exp += tx.amount

          const catName = tx.categories?.name || 'Other'
          const catColor = tx.categories?.color || '#8b5cf6'
          if (!catMap[catName]) {
            catMap[catName] = { name: catName, amount: 0, color: catColor }
          }
          catMap[catName].amount += tx.amount
        } else {
          inc += tx.amount
          grouped[d].inc += tx.amount
        }
      })

      setTotalIncome(inc)
      setTotalExpense(exp)

      let labels = Object.keys(grouped).slice(-6)
      let expenseLine = labels.map(l => grouped[l].exp)
      let incomeLine = labels.map(l => grouped[l].inc)

      if (labels.length === 0) {
        labels = ['Day 1', 'Day 2', 'Day 3']
        expenseLine = [0, 0, 0]
        incomeLine = [0, 0, 0]
      }

      setLineData({ labels, expense: expenseLine, income: incomeLine })

      const breakdown = Object.values(catMap).map((item, i) => ({
        name: item.name,
        value: item.amount,
        color: item.color,
        legendFontColor: '#cbd5e1',
        legendFontSize: 12,
      }))

      setCategoryBreakdown(breakdown)
      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#D9FF5B" />
      </View>
    )
  }

  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0

  const chartConfig = {
    backgroundGradientFrom: 'rgba(0,0,0,0)',
    backgroundGradientTo: 'rgba(0,0,0,0)',
    color: (opacity = 1) => `rgba(217, 255, 91, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    strokeWidth: 3,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#D9FF5B',
    },
  }

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <LinearGradient colors={['rgba(99, 102, 241, 0.08)', 'transparent']} style={styles.orb1} />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Analytics & Health</Text>
        <Text style={styles.subtitle}>Financial intelligence and spending performance</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Health Scorecard */}
        <BlurView intensity={25} tint="dark" style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>SAVINGS RATE THIS MONTH</Text>
          <Text style={[styles.summaryValue, { color: savingsRate >= 20 ? '#10b981' : '#f59e0b' }]}>
            {savingsRate}%
          </Text>
          <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            {savingsRate >= 20 ? '🎉 Excellent savings discipline' : '💡 Tip: Keep expenses under 80% of income'}
          </Text>

          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summarySubLabel}>MONTHLY INCOME</Text>
              <Text style={[styles.summarySubValue, { color: '#10b981' }]}>+${totalIncome.toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.summarySubLabel}>MONTHLY EXPENSES</Text>
              <Text style={[styles.summarySubValue, { color: '#ef4444' }]}>-${totalExpense.toLocaleString()}</Text>
            </View>
          </View>
        </BlurView>

        {/* Income vs Expense Line Chart */}
        <Text style={styles.sectionTitle}>Daily Velocity Trend 📈</Text>
        <BlurView intensity={20} tint="dark" style={styles.card}>
          <LineChart
            data={{
              labels: lineData.labels,
              datasets: [
                {
                  data: lineData.income,
                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                },
                {
                  data: lineData.expense,
                  color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                },
              ],
            }}
            width={width - 50}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{ marginVertical: 8, borderRadius: 16, marginLeft: -12 }}
            withDots={true}
            withInnerLines={false}
          />
          <View style={styles.legend}>
            <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '700' }}>● Income</Text>
            <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>● Expenses</Text>
          </View>
        </BlurView>

        {/* Category Breakdown Chart */}
        {categoryBreakdown.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Expense Category Distribution 📊</Text>
            <BlurView intensity={20} tint="dark" style={styles.card}>
              <PieChart
                data={categoryBreakdown}
                width={width - 50}
                height={190}
                chartConfig={chartConfig}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[0, 0]}
                absolute
              />
            </BlurView>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080A09' },
  background: { position: 'absolute', inset: 0, zIndex: 0 },
  orb1: { position: 'absolute', top: -100, left: -50, width: 300, height: 300, borderRadius: 150 },
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
  },
  summaryLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.5 },
  summaryValue: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  summarySubLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  summarySubValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: 'white', marginHorizontal: 20, marginBottom: 12, marginTop: 20 },
  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 },
})
