import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      spending_entries: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          currency: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          date?: string
          created_at?: string
        }
      }
    }
  }
}

export interface SpendingEntry {
  id: string
  user_id: string
  amount: number
  currency: string
  date: string
  created_at: string
}