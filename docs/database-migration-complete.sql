-- =============================================================================
-- COMPLETE DATABASE MIGRATION - Issue #43
-- Database Schema Updates for User Preferences
-- 
-- This script automatically detects your database state and applies the
-- correct migration approach. It's designed to be fail-safe and idempotent.
--
-- IMPORTANT: 
-- 1. Backup your database before running this script
-- 2. Run this entire script in your Supabase SQL Editor
-- 3. Review the verification queries at the end
-- =============================================================================

-- =============================================================================
-- PHASE 1: CREATE USER_PREFERENCES TABLE (Always Safe)
-- =============================================================================

DO $$
BEGIN
  -- Check if user_preferences table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_preferences') THEN
    RAISE NOTICE 'Creating user_preferences table...';
    
    CREATE TABLE user_preferences (
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

    -- Enable RLS
    ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

    -- Create RLS Policies
    CREATE POLICY "Users can view own preferences" ON user_preferences
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert own preferences" ON user_preferences
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own preferences" ON user_preferences
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete own preferences" ON user_preferences
      FOR DELETE USING (auth.uid() = user_id);

    RAISE NOTICE 'user_preferences table created successfully';
  ELSE
    RAISE NOTICE 'user_preferences table already exists, skipping creation';
  END IF;
END
$$;

-- =============================================================================
-- PHASE 2: HANDLE CATEGORIES TABLE (Scenario Detection)
-- =============================================================================

DO $$
DECLARE
  category_count INTEGER;
  has_is_active BOOLEAN;
  user_id_type TEXT;
BEGIN
  -- Get current categories table info
  SELECT COUNT(*) INTO category_count FROM categories;
  
  -- Check if is_active column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'is_active'
  ) INTO has_is_active;
  
  -- Check user_id column data type
  SELECT data_type INTO user_id_type 
  FROM information_schema.columns 
  WHERE table_name = 'categories' AND column_name = 'user_id';

  RAISE NOTICE 'Categories table analysis:';
  RAISE NOTICE '- Row count: %', category_count;
  RAISE NOTICE '- Has is_active column: %', has_is_active;
  RAISE NOTICE '- user_id data type: %', user_id_type;

  -- SCENARIO A: Fresh database (no data) - Recreate with UUID structure
  IF category_count = 0 THEN
    RAISE NOTICE 'SCENARIO A: Fresh database detected - recreating categories table with UUID structure';
    
    -- Drop and recreate categories table
    DROP TABLE IF EXISTS categories CASCADE;
    
    CREATE TABLE categories (
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

    -- Enable RLS
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

    -- RLS Policies for UUID-based categories
    CREATE POLICY "Users can view own and default categories" ON categories
      FOR SELECT USING (auth.uid() = user_id OR is_default = true);
    
    CREATE POLICY "Users can insert own categories" ON categories
      FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);
    
    CREATE POLICY "Users can update own categories" ON categories
      FOR UPDATE USING (auth.uid() = user_id AND is_default = false);
    
    CREATE POLICY "Users can delete own categories" ON categories
      FOR DELETE USING (auth.uid() = user_id AND is_default = false);

    -- Insert default categories (NULL user_id for system categories)
    INSERT INTO categories (user_id, name, color, icon, is_default, is_active) VALUES
      (NULL, 'Food & Dining', '#ef4444', 'restaurant-outline', true, true),
      (NULL, 'Transportation', '#3b82f6', 'car-outline', true, true),
      (NULL, 'Shopping', '#8b5cf6', 'bag-outline', true, true),
      (NULL, 'Entertainment', '#f59e0b', 'game-controller-outline', true, true),
      (NULL, 'Bills & Utilities', '#10b981', 'document-text-outline', true, true),
      (NULL, 'Healthcare', '#ec4899', 'medical-outline', true, true),
      (NULL, 'Education', '#06b6d4', 'school-outline', true, true),
      (NULL, 'Other', '#6b7280', 'ellipse-outline', true, true);

    RAISE NOTICE 'Categories table recreated with UUID structure and default categories';

  -- SCENARIO B: Existing database with data - Update existing structure
  ELSE
    RAISE NOTICE 'SCENARIO B: Existing database detected - updating existing categories table';
    
    -- Add is_active column if it doesn't exist
    IF NOT has_is_active THEN
      ALTER TABLE categories ADD COLUMN is_active BOOLEAN DEFAULT true;
      UPDATE categories SET is_active = true WHERE is_active IS NULL;
      RAISE NOTICE 'Added is_active column to categories table';
    END IF;

    -- Add system categories using TEXT user_id marker
    INSERT INTO categories (user_id, name, color, icon, is_default, is_active) VALUES
      ('__SYSTEM__', 'Food & Dining', '#ef4444', 'restaurant-outline', true, true),
      ('__SYSTEM__', 'Transportation', '#3b82f6', 'car-outline', true, true),
      ('__SYSTEM__', 'Shopping', '#8b5cf6', 'bag-outline', true, true),
      ('__SYSTEM__', 'Entertainment', '#f59e0b', 'game-controller-outline', true, true),
      ('__SYSTEM__', 'Bills & Utilities', '#10b981', 'document-text-outline', true, true),
      ('__SYSTEM__', 'Healthcare', '#ec4899', 'medical-outline', true, true),
      ('__SYSTEM__', 'Education', '#06b6d4', 'school-outline', true, true),
      ('__SYSTEM__', 'Other', '#6b7280', 'ellipse-outline', true, true)
    ON CONFLICT (user_id, name) DO NOTHING;

    -- Update RLS policies for TEXT user_id structure with system categories
    DROP POLICY IF EXISTS "Users can view own categories" ON categories;
    DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
    DROP POLICY IF EXISTS "Users can update own categories" ON categories;
    DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
    DROP POLICY IF EXISTS "Users can view own and default categories" ON categories;
    DROP POLICY IF EXISTS "Users can view own and system categories" ON categories;

    CREATE POLICY "Users can view own and system categories" ON categories
      FOR SELECT USING (
        user_id = (select current_setting('request.jwt.claims', true)::json->>'sub') 
        OR user_id = '__SYSTEM__'
      );

    CREATE POLICY "Users can insert own categories" ON categories
      FOR INSERT WITH CHECK (
        user_id = (select current_setting('request.jwt.claims', true)::json->>'sub') 
        AND user_id != '__SYSTEM__'
      );

    CREATE POLICY "Users can update own categories" ON categories
      FOR UPDATE USING (
        user_id = (select current_setting('request.jwt.claims', true)::json->>'sub') 
        AND user_id != '__SYSTEM__'
      );

    CREATE POLICY "Users can delete own categories" ON categories
      FOR DELETE USING (
        user_id = (select current_setting('request.jwt.claims', true)::json->>'sub') 
        AND user_id != '__SYSTEM__'
      );

    RAISE NOTICE 'Updated categories table with system categories and RLS policies';
  END IF;
END
$$;

-- =============================================================================
-- PHASE 3: DATABASE FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_preferences auto-timestamps
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default user preferences on signup
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-creating user preferences
DROP TRIGGER IF EXISTS create_user_preferences_on_signup ON auth.users;
CREATE TRIGGER create_user_preferences_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_user_preferences();

-- =============================================================================
-- PHASE 4: SPENDING_ENTRIES UPDATES AND INDEXES
-- =============================================================================

-- Add category_id column for future category relationships
ALTER TABLE spending_entries ADD COLUMN IF NOT EXISTS category_id UUID;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_default ON categories(is_default);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_spending_entries_category_id ON spending_entries(category_id);

-- =============================================================================
-- PHASE 5: CREATE PREFERENCES FOR EXISTING USERS
-- =============================================================================

-- Create default preferences for existing authenticated users
INSERT INTO user_preferences (user_id)
SELECT id 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- MIGRATION COMPLETE - VERIFICATION QUERIES
-- =============================================================================

-- Display migration results
DO $$
DECLARE
  user_pref_count INTEGER;
  system_cat_count INTEGER;
  total_cat_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_pref_count FROM user_preferences;
  SELECT COUNT(*) INTO system_cat_count FROM categories WHERE is_default = true;
  SELECT COUNT(*) INTO total_cat_count FROM categories;
  SELECT COUNT(*) INTO user_count FROM auth.users;

  RAISE NOTICE '';
  RAISE NOTICE '=== MIGRATION COMPLETED SUCCESSFULLY ===';
  RAISE NOTICE 'User preferences created: % (should equal auth users: %)', user_pref_count, user_count;
  RAISE NOTICE 'System categories created: % (should be 8)', system_cat_count;
  RAISE NOTICE 'Total categories: %', total_cat_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run the verification queries below';
  RAISE NOTICE '2. Test user signup (should auto-create preferences)';
  RAISE NOTICE '3. Proceed with Issues #41 and #42';
  RAISE NOTICE '';
END
$$;

-- =============================================================================
-- VERIFICATION QUERIES (Run these to verify migration success)
-- =============================================================================

-- 1. Check tables exist and have RLS enabled
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_preferences', 'categories', 'spending_entries')
ORDER BY tablename;

-- 2. Check user_preferences structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_preferences'
ORDER BY ordinal_position;

-- 3. Check system categories were created
SELECT 
  name, 
  color, 
  icon, 
  is_default,
  CASE 
    WHEN user_id IS NULL THEN 'NULL (UUID System)'
    WHEN user_id = '__SYSTEM__' THEN '__SYSTEM__ (TEXT System)'
    ELSE 'User Category'
  END as category_type
FROM categories 
WHERE is_default = true 
ORDER BY name;

-- 4. Check counts
SELECT 
  (SELECT COUNT(*) FROM user_preferences) as user_preferences_count,
  (SELECT COUNT(*) FROM categories WHERE is_default = true) as system_categories_count,
  (SELECT COUNT(*) FROM categories) as total_categories_count,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count;

-- 5. Check triggers exist
SELECT 
  trigger_name, 
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE '%user_preferences%'
ORDER BY trigger_name;

-- 6. Verify RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname,
  cmd as policy_type
FROM pg_policies 
WHERE tablename IN ('user_preferences', 'categories')
ORDER BY tablename, policyname;