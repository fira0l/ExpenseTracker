import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Dimensions
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { supabase } from '../lib/supabase'

const { width, height } = Dimensions.get('window')

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return }
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) Alert.alert('Sign In Error', error.message)
    } else {
      if (!fullName) { Alert.alert('Error', 'Please enter your name'); setLoading(false); return }
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } }
      })
      if (error) Alert.alert('Sign Up Error', error.message)
      else Alert.alert('Check your email', 'We sent you a confirmation link!')
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Animated Background Orbs */}
      <View style={styles.background}>
        <LinearGradient
          colors={['rgba(217, 255, 91, 0.15)', 'transparent']}
          style={styles.orb1}
        />
        <LinearGradient
          colors={['rgba(6, 182, 212, 0.15)', 'transparent']}
          style={styles.orb2}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>💸</Text>
          <Text style={styles.appName}>SpendWise</Text>
          <Text style={styles.tagline}>Welcome to the future of finance</Text>
        </View>

        {/* Glassmorphic Card */}
        <BlurView intensity={20} tint="dark" style={styles.card}>
          {/* Tab Toggle */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === 'login' && styles.tabActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'signup' && styles.tabActive]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.cardTitle}>
            {mode === 'login' ? 'Welcome back.' : 'Join the future.'}
          </Text>

          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#475569"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#475569"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#475569"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#080A09" />
            ) : (
              <LinearGradient
                colors={['#D9FF5B', '#b3ff00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btnGradient}
              >
                <Text style={styles.btnText}>{mode === 'login' ? 'Sign In →' : 'Create Account →'}</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </BlurView>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080A09' },
  background: { position: 'absolute', inset: 0, zIndex: 0 },
  orb1: { position: 'absolute', top: -150, left: -100, width: 400, height: 400, borderRadius: 200 },
  orb2: { position: 'absolute', bottom: -100, right: -150, width: 500, height: 500, borderRadius: 250 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, zIndex: 1 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 48, marginBottom: 12 },
  appName: { fontWeight: '800', fontSize: 32, color: 'white', letterSpacing: -0.5 },
  tagline: { color: '#94a3b8', fontSize: 15, marginTop: 6 },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 99,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 99, alignItems: 'center' },
  tabActive: { backgroundColor: 'rgba(217, 255, 91, 0.15)', borderWidth: 1, borderColor: 'rgba(217, 255, 91, 0.3)' },
  tabText: { color: '#94a3b8', fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: '#D9FF5B' },
  cardTitle: { color: 'white', fontSize: 24, fontWeight: '700', marginBottom: 24, letterSpacing: -0.5 },
  inputGroup: { marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    color: 'white',
    fontSize: 16,
  },
  btn: { marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  btnDisabled: { opacity: 0.6 },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#080A09', fontWeight: '800', fontSize: 16 },
})
