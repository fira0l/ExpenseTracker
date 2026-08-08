import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'

const API_URL = 'https://expense-tracker-phi-indol-24.vercel.app/api/receipt/scan'

export default function AddTransactionScreen({ session, navigation }: { session: Session; navigation: any }) {
  const [txType, setTxType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCat, setSelectedCat] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', session.user.id)
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  // Real Mobile OCR Receipt Scanner (Camera or Gallery Upload)
  async function handleScanReceipt() {
    Alert.alert(
      '📷 Scan Receipt / Invoice',
      'Choose source to scan paper receipt:',
      [
        { text: '🖼️ Choose Photo from Gallery', onPress: () => pickImage('library') },
        { text: '📸 Take Photo with Camera', onPress: () => pickImage('camera') },
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  async function pickImage(source: 'library' | 'camera') {
    try {
      let result: ImagePicker.ImagePickerResult

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to take a receipt photo.')
          return
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: true,
          quality: 0.8,
        })
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Media library permission is needed to choose a receipt photo.')
          return
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: true,
          quality: 0.8,
        })
      }

      if (result.canceled || !result.assets?.[0]?.base64) {
        return
      }

      setScanning(true)
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`

      // Send real base64 image to OCR API
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ imageBase64: base64Image }),
      })

      const ocrData = await res.json()
      setScanning(false)

      if (ocrData.error) {
        Alert.alert('OCR Error', ocrData.error)
        return
      }

      // Auto-populate form fields from REAL OCR Result
      if (ocrData.amount) setAmount(String(ocrData.amount))
      if (ocrData.merchant) setDescription(ocrData.merchant)
      if (ocrData.type) setTxType(ocrData.type)

      // Auto-select category if matched
      if (ocrData.categoryName && categories.length > 0) {
        const matched = categories.find(c => c.name.toLowerCase().includes(ocrData.categoryName.toLowerCase()))
        if (matched) setSelectedCat(matched.id)
      }

      Alert.alert(
        'Receipt Scanned! 🧾',
        `Extracted Merchant: ${ocrData.merchant}\nExtracted Amount: $${ocrData.amount}`
      )
    } catch (err: any) {
      setScanning(false)
      Alert.alert('Scan Failed', err.message || 'Could not process receipt image.')
    }
  }

  async function submitTransaction() {
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('transactions').insert({
      user_id: session.user.id,
      type: txType,
      amount: parsedAmount,
      description: description.trim() || null,
      category_id: selectedCat || null,
      transaction_date: new Date().toISOString().split('T')[0],
      source_type: 'manual',
    })

    setSubmitting(false)
    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    setAmount('')
    setDescription('')
    setSelectedCat('')
    navigation.navigate('Home')
  }

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <LinearGradient colors={['rgba(217, 255, 91, 0.08)', 'transparent']} style={styles.orb1} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.title}>New Transaction</Text>

        {/* Real OCR Receipt Scanner Trigger */}
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={handleScanReceipt}
          disabled={scanning}
        >
          {scanning ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#D9FF5B" />
              <Text style={{ color: '#D9FF5B', fontWeight: '700', fontSize: 13 }}>Scanning Receipt with OCR AI...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="camera-outline" size={20} color="#D9FF5B" />
              <Text style={{ color: '#D9FF5B', fontWeight: '700', fontSize: 14 }}>Scan Paper Receipt / Invoice (Real OCR)</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, txType === 'expense' && styles.typeBtnExpense]}
            onPress={() => setTxType('expense')}
          >
            <Text style={[styles.typeBtnText, txType === 'expense' && { color: '#f43f5e' }]}>💸 Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, txType === 'income' && styles.typeBtnIncome]}
            onPress={() => setTxType('income')}
          >
            <Text style={[styles.typeBtnText, txType === 'income' && { color: '#10b981' }]}>💰 Income</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor="#475569"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <TextInput
          style={styles.descInput}
          placeholder="Description (e.g. Grocery, Netflix...)"
          placeholderTextColor="#475569"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.catLabel}>Category</Text>
        <View style={{ height: 60, marginBottom: 20 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCat(selectedCat === cat.id ? '' : cat.id)}
                style={[
                  styles.catChip,
                  selectedCat === cat.id && { borderColor: '#D9FF5B', backgroundColor: 'rgba(217, 255, 91, 0.12)' },
                ]}
              >
                <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                <Text style={[styles.catChipText, selectedCat === cat.id && { color: '#D9FF5B' }]}>
                  {cat.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={submitTransaction}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#080A09" />
          ) : (
            <LinearGradient colors={['#D9FF5B', '#b3ff00']} style={styles.btnGradient}>
              <Text style={styles.submitBtnText}>Save {txType === 'expense' ? 'Expense' : 'Income'}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080A09' },
  background: { position: 'absolute', inset: 0, zIndex: 0 },
  orb1: { position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: 150 },
  content: { padding: 24, paddingTop: 60, flexGrow: 1, zIndex: 1, paddingBottom: 160 },
  title: { fontSize: 28, fontWeight: '800', color: 'white', marginBottom: 24 },
  scanBtn: {
    backgroundColor: 'rgba(217,255,91,0.12)',
    borderWidth: 1.5,
    borderColor: '#D9FF5B',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  typeToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 4, gap: 4, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  typeBtnExpense: { backgroundColor: 'rgba(244,63,94,0.1)', borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)' },
  typeBtnIncome: { backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  typeBtnText: { fontWeight: '700', fontSize: 15, color: '#94a3b8' },
  amountRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, marginBottom: 16 },
  currencySymbol: { fontSize: 32, fontWeight: '800', color: '#D9FF5B', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 40, fontWeight: '800', color: 'white', paddingVertical: 20 },
  descInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 16, color: 'white', fontSize: 16, marginBottom: 24 },
  catLabel: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', marginRight: 10 },
  catChipText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  submitBtn: { borderRadius: 16, overflow: 'hidden' },
  btnGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#080A09', fontSize: 17, fontWeight: '800' },
})
