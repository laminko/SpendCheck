-- Database Schema Migration for Issue #43
-- Database Schema Updates for User Preferences
-- 
-- This migration creates the user_preferences table and updates the categories table
-- to support the new user preferences system.
--
-- IMPORTANT: Run this in your Supabase SQL Editor
-- Make sure to backup your database before running this migration!

-- =============================================================================
-- PHASE 1: Create user_preferences table
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  currency_symbol TEXT NOT NULL DEFAULT '$',
  currency_name TEXT NOT NULL DEFAULT 'US Dollar',
  theme TEXT DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- =============================================================================
-- PHASE 2: Update categories table to support UUIDs and proper RLS
-- =============================================================================

-- First, let's check if categories table needs to be updated for UUID user_id
-- Note: The existing categories table uses TEXT user_id, we need to update it

-- Drop existing categories table constraints and recreate with proper UUID references
-- This is safe because we'll migrate the data

-- Create new categories table with proper UUID references
CREATE TABLE IF NOT EXISTS categories_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'folder-outline',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

-- Add category reference to spending_entries if it doesn't exist
-- Note: The existing spending_entries table uses TEXT user_id, we need to handle this
ALTER TABLE spending_entries 
ADD COLUMN IF NOT EXISTS category_id UUID;

-- =============================================================================
-- PHASE 3: Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- User preferences RLS policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on new categories table
ALTER TABLE categories_new ENABLE ROW LEVEL SECURITY;

-- Categories RLS policies (allow access to own categories and default categories)
CREATE POLICY "Users can view own and default categories" ON categories_new
  FOR SELECT USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can insert own categories" ON categories_new
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update own categories" ON categories_new
  FOR UPDATE USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete own categories" ON categories_new
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- =============================================================================
-- PHASE 4: Database Functions & Triggers
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories_new
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences on user signup
DROP TRIGGER IF EXISTS create_user_preferences_on_signup ON auth.users;
CREATE TRIGGER create_user_preferences_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_user_preferences();

-- =============================================================================
-- PHASE 5: Default Categories Setup
-- =============================================================================

-- Insert default spending categories (these will be available to all users)
INSERT INTO categories_new (user_id, name, color, icon, is_default, is_active) VALUES
  (NULL, 'Food & Dining', '#ef4444', 'restaurant-outline', true, true),
  (NULL, 'Transportation', '#3b82f6', 'car-outline', true, true),
  (NULL, 'Shopping', '#8b5cf6', 'bag-outline', true, true),
  (NULL, 'Entertainment', '#f59e0b', 'game-controller-outline', true, true),
  (NULL, 'Bills & Utilities', '#10b981', 'document-text-outline', true, true),
  (NULL, 'Healthcare', '#ec4899', 'medical-outline', true, true),
  (NULL, 'Education', '#06b6d4', 'school-outline', true, true),
  (NULL, 'Other', '#6b7280', 'ellipse-outline', true, true)
ON CONFLICT (user_id, name) DO NOTHING;

-- =============================================================================
-- PHASE 6: Create indexes for performance
-- =============================================================================

-- Indexes for user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Indexes for categories_new
CREATE INDEX IF NOT EXISTS idx_categories_new_user_id ON categories_new(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_new_is_default ON categories_new(is_default);
CREATE INDEX IF NOT EXISTS idx_categories_new_is_active ON categories_new(is_active);

-- Index for spending_entries category_id
CREATE INDEX IF NOT EXISTS idx_spending_entries_category_id ON spending_entries(category_id);

-- =============================================================================
-- PHASE 7: Create default user preferences for existing users
-- =============================================================================

-- Create default preferences for any existing authenticated users
-- This will be handled by the trigger for new users going forward
INSERT INTO user_preferences (user_id)
SELECT id 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- IMPORTANT NOTES FOR MANUAL MIGRATION
-- =============================================================================

/*
MANUAL STEPS REQUIRED AFTER RUNNING THIS SCRIPT:

1. DATA MIGRATION: 
   - The existing categories table uses TEXT user_id, but the new table uses UUID
   - You'll need to migrate existing category data manually if you have any
   - The spending_entries table also uses TEXT user_id, which needs to be converted to UUID

2. TABLE REPLACEMENT:
   - After data migration, you can replace the old categories table:
   - DROP TABLE categories;
   - ALTER TABLE categories_new RENAME TO categories;

3. FOREIGN KEY CONSTRAINTS:
   - Add foreign key constraint to spending_entries.category_id:
   - ALTER TABLE spending_entries ADD CONSTRAINT fk_spending_entries_category 
     FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

4. CLEANUP:
   - Remove the old category TEXT column from spending_entries after migration:
   - ALTER TABLE spending_entries DROP COLUMN IF EXISTS category;

5. TESTING:
   - Test user preferences creation for new signups
   - Test category access with RLS policies
   - Verify data integrity after migration
*/

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check if tables were created successfully
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_preferences', 'categories_new');

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_preferences', 'categories_new');

-- Check default categories
SELECT name, color, icon, is_default FROM categories_new WHERE is_default = true;

-- Check if triggers exist
SELECT trigger_name, event_object_table FROM information_schema.triggers 
WHERE trigger_name IN ('update_user_preferences_updated_at', 'update_categories_updated_at', 'create_user_preferences_on_signup');