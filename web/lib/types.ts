export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          currency: string
          monthly_income: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          monthly_income?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          monthly_income?: number
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          color: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string
          color?: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          icon?: string
          color?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          amount: number
          type: 'expense' | 'income'
          description: string | null
          notes: string | null
          transaction_date: string
          source_type: 'manual' | 'sms' | 'email' | 'bank_api'
          plaid_transaction_id: string | null
          merchant_name: string | null
          merchant_logo: string | null
          raw_message: string | null
          parsed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          amount: number
          type: 'expense' | 'income'
          description?: string | null
          notes?: string | null
          transaction_date?: string
          source_type?: 'manual' | 'sms' | 'email' | 'bank_api'
          plaid_transaction_id?: string | null
          merchant_name?: string | null
          merchant_logo?: string | null
          raw_message?: string | null
          parsed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          amount?: number
          type?: 'expense' | 'income'
          description?: string | null
          notes?: string | null
          transaction_date?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          month: number
          year: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          amount: number
          month: number
          year: number
          created_at?: string
        }
        Update: {
          amount?: number
        }
      }
      automation_sources: {
        Row: {
          id: string
          user_id: string
          type: 'sms' | 'email' | 'bank_api'
          name: string
          config: Json
          is_active: boolean
          last_synced: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'sms' | 'email' | 'bank_api'
          name: string
          config?: Json
          is_active?: boolean
          last_synced?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          config?: Json
          is_active?: boolean
          last_synced?: string | null
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Budget = Database['public']['Tables']['budgets']['Row']
export type AutomationSource = Database['public']['Tables']['automation_sources']['Row']

export type TransactionWithCategory = Transaction & {
  categories: Category | null
}

export interface RecurringTransaction {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  type: 'expense' | 'income'
  description: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  next_due_date: string
  is_active: boolean
  auto_post: boolean
  created_at: string
  categories?: Category | null
}

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  icon: string
  color: string
  created_at: string
}

export interface AdvisorChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ReceiptScanResult {
  merchant?: string | null
  amount?: number | null
  date?: string | null
  type?: 'expense' | 'income'
  categoryName?: string | null
  confidence?: number
  rawText?: string
}

