import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://jtdgnrkiwrovdielzqvy.supabase.co'
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_PWPw_bDyVHZX0_cgOMSYBg_IMkvS4XN'

export const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
