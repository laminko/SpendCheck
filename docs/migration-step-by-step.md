# Database Migration Guide - Issue #43

## Overview
This guide provides step-by-step instructions for implementing the database schema updates for user preferences.

## Current State Analysis
- ✅ `spending_entries` table exists with TEXT user_id
- ✅ `categories` table exists with TEXT user_id  
- ❌ No `user_preferences` table
- ❌ No UUID-based user references
- ❌ No default categories for all users

## Migration Strategy

### Step 1: Create user_preferences table
This is safe to run as it's a new table.

```sql
-- Run this first in Supabase SQL Editor
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

-- RLS Policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);
```

### Step 2: Create triggers and functions

```sql
-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_preferences
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default user preferences
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new user signup
CREATE TRIGGER create_user_preferences_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_user_preferences();
```

### Step 3: Create default user preferences for existing users

```sql
-- Create preferences for existing users
INSERT INTO user_preferences (user_id)
SELECT id 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;
```

### Step 4: Update categories table structure

Since the existing categories table uses TEXT user_id, we need to be careful. The safest approach is to:

1. **Check if you have existing category data:**
```sql
SELECT COUNT(*) FROM categories;
```

2. **If no data exists, drop and recreate:**
```sql
-- Only if categories table is empty
DROP TABLE IF EXISTS categories;

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

-- RLS Policies
CREATE POLICY "Users can view own and default categories" ON categories
  FOR SELECT USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- Trigger for categories
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 5: Insert default categories

```sql
-- Insert default categories available to all users
INSERT INTO categories (user_id, name, color, icon, is_default, is_active) VALUES
  (NULL, 'Food & Dining', '#ef4444', 'restaurant-outline', true, true),
  (NULL, 'Transportation', '#3b82f6', 'car-outline', true, true),
  (NULL, 'Shopping', '#8b5cf6', 'bag-outline', true, true),
  (NULL, 'Entertainment', '#f59e0b', 'game-controller-outline', true, true),
  (NULL, 'Bills & Utilities', '#10b981', 'document-text-outline', true, true),
  (NULL, 'Healthcare', '#ec4899', 'medical-outline', true, true),
  (NULL, 'Education', '#06b6d4', 'school-outline', true, true),
  (NULL, 'Other', '#6b7280', 'ellipse-outline', true, true)
ON CONFLICT (user_id, name) DO NOTHING;
```

### Step 6: Add category reference to spending_entries

```sql
-- Add category_id column to spending_entries
ALTER TABLE spending_entries 
ADD COLUMN IF NOT EXISTS category_id UUID;

-- Add foreign key constraint
ALTER TABLE spending_entries 
ADD CONSTRAINT fk_spending_entries_category 
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_spending_entries_category_id ON spending_entries(category_id);
```

### Step 7: Create indexes for performance

```sql
-- Indexes for user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_default ON categories(is_default);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
```

## Verification

After running the migration, verify everything works:

```sql
-- Check table creation
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
AND tablename IN ('user_preferences', 'categories');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' 
AND tablename IN ('user_preferences', 'categories');

-- Check default categories
SELECT name, color, icon, is_default FROM categories WHERE is_default = true;

-- Check user preferences
SELECT COUNT(*) FROM user_preferences;

-- Check triggers
SELECT trigger_name, event_object_table FROM information_schema.triggers 
WHERE trigger_name LIKE '%user_preferences%' OR trigger_name LIKE '%categories%';
```

## Next Steps

After this migration is complete:
1. Update application code to use new schema (Issue #41, #42)
2. Test user preferences functionality
3. Verify RLS policies work correctly
4. Consider migrating existing category strings to new category references

## Rollback Plan

If something goes wrong:
1. Drop the new tables: `DROP TABLE user_preferences, categories;`
2. Restore from backup
3. The existing spending_entries table will be unaffected (only category_id column added)