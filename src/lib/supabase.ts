import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      user_preferences: {
        Row: {
          id: string
          user_id: string
          currency_code: string
          currency_symbol: string
          currency_name: string
          theme: string
          notifications_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          currency_code?: string
          currency_symbol?: string
          currency_name?: string
          theme?: string
          notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          currency_code?: string
          currency_symbol?: string
          currency_name?: string
          theme?: string
          notifications_enabled?: boolean
          updated_at?: string
        }
      }
      spending_entries: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          category: string | null
          category_id: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          currency: string
          category?: string | null
          category_id?: string | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          category?: string | null
          category_id?: string | null
          date?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string | null
          color: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string | null
          color?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string | null
          color?: string | null
          is_default?: boolean
          created_at?: string
        }
      }
    }
  }
}

export interface UserPreference {
  id: string
  user_id: string
  currency_code: string
  currency_symbol: string
  currency_name: string
  theme: string
  notifications_enabled: boolean
  created_at: string
  updated_at: string
}

export interface SpendingEntry {
  id: string
  user_id: string
  amount: number
  currency: string
  category?: string | null
  category_id?: string | null
  date: string
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  icon?: string | null
  color?: string | null
  is_default: boolean
  created_at: string
}