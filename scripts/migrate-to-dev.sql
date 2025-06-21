-- SpendCheck Database Migration Script
-- Run this on your development Supabase database

-- Create spending_entries table
CREATE TABLE IF NOT EXISTS spending_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  category text,
  category_id uuid REFERENCES categories(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  icon text,
  color text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE spending_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spending_entries
CREATE POLICY "Users can view own spending entries" ON spending_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spending entries" ON spending_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spending entries" ON spending_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spending entries" ON spending_entries
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for categories
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_spending_entries_user_id ON spending_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_entries_date ON spending_entries(date);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Insert default categories (optional)
INSERT INTO categories (user_id, name, icon, color, is_default) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Food & Dining', '🍽️', '#FF6B6B', true),
  ('00000000-0000-0000-0000-000000000000', 'Transportation', '🚗', '#4ECDC4', true),
  ('00000000-0000-0000-0000-000000000000', 'Shopping', '🛍️', '#45B7D1', true),
  ('00000000-0000-0000-0000-000000000000', 'Entertainment', '🎬', '#96CEB4', true),
  ('00000000-0000-0000-0000-000000000000', 'Bills & Utilities', '📋', '#FFEAB6', true),
  ('00000000-0000-0000-0000-000000000000', 'Healthcare', '🏥', '#DDA0DD', true),
  ('00000000-0000-0000-0000-000000000000', 'Other', '📌', '#C7C7C7', true)
ON CONFLICT DO NOTHING;