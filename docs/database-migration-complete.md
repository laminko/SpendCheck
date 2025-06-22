# Complete Database Migration Guide - Issue #43
## Database Schema Updates for User Preferences

### ⚠️ IMPORTANT: Pre-Migration Checklist

**BEFORE STARTING:**
1. **Backup your database** - Go to Supabase Dashboard → Settings → Database → Create Backup
2. **Test on development database first** if available
3. **Have rollback plan ready** (documented below)
4. **Run during low-traffic time** if this is production

### 🔍 Database Assessment

**Step 1: Check your current database structure**

Run this in Supabase SQL Editor to understand your current setup:

```sql
-- Check if user_preferences table already exists
SELECT EXISTS (
   SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_preferences'
) as user_preferences_exists;

-- Check categories table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;

-- Check if categories table has data
SELECT COUNT(*) as category_count FROM categories;

-- Check spending_entries structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'spending_entries' AND column_name IN ('category_id', 'category');
```

### 📋 Migration Scenarios

Based on your assessment results, choose the appropriate scenario:

## Scenario A: Fresh Database (No existing categories data)
*Use if category_count = 0*

## Scenario B: Existing Database with Data (MOST COMMON)
*Use if category_count > 0 or you got the "is_active column does not exist" error*

---

## 🚀 SCENARIO A: Fresh Database Migration

### A1: Create user_preferences table
```sql
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

### A2: Recreate categories table with UUID structure
```sql
-- Drop existing empty categories table
DROP TABLE IF EXISTS categories;

-- Create new categories table with UUID user_id
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
```

### A3: Continue to "Common Steps" below

---

## 🔧 SCENARIO B: Existing Database Migration (RECOMMENDED)

### B1: Create user_preferences table (SAFE - new table)
```sql
-- This is always safe as it's a new table
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

### B2: Update existing categories table structure
```sql
-- Add missing columns to existing categories table (safe operations)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update any NULL values (safe)
UPDATE categories SET is_active = true WHERE is_active IS NULL;

-- Verify column was added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'categories' AND column_name = 'is_active';
```

### B3: Add system categories to existing table
```sql
-- Add default system categories using special TEXT user_id marker
-- This works with existing TEXT user_id structure
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

-- Verify system categories were added
SELECT name, is_default FROM categories WHERE user_id = '__SYSTEM__';
```

### B4: Update categories RLS policies for system categories
```sql
-- SAFE: Drop existing policies (they'll be recreated)
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

-- Create new policies that handle system categories
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
```

---

## 🔄 COMMON STEPS (Run for both scenarios)

### C1: Database Functions and Triggers
```sql
-- Function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_preferences auto-timestamps
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
```

### C2: Add category reference to spending_entries
```sql
-- Add category_id column for future category relationships
ALTER TABLE spending_entries ADD COLUMN IF NOT EXISTS category_id UUID;

-- Add index for performance (no foreign key constraint due to different user_id types)
CREATE INDEX IF NOT EXISTS idx_spending_entries_category_id ON spending_entries(category_id);
```

### C3: Performance indexes
```sql
-- Indexes for user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_is_default ON categories(is_default);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
```

### C4: Create preferences for existing users
```sql
-- Create default preferences for existing authenticated users
INSERT INTO user_preferences (user_id)
SELECT id 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;
```

---

## ✅ VERIFICATION STEPS

**Run these queries to verify the migration worked:**

```sql
-- 1. Check tables exist and have RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_preferences', 'categories', 'spending_entries');

-- 2. Check user_preferences structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_preferences';

-- 3. Check system categories were created
SELECT name, color, icon, is_default, user_id 
FROM categories 
WHERE is_default = true 
ORDER BY name;

-- 4. Check user preferences count
SELECT COUNT(*) as user_preferences_count FROM user_preferences;

-- 5. Check triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%user_preferences%';

-- 6. Verify RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('user_preferences', 'categories');
```

**Expected Results:**
- `user_preferences` table: RLS enabled, 8 columns
- System categories: 8 categories with `is_default = true`
- Triggers: 2 triggers (update timestamp, create preferences)
- Policies: 4 policies per table

---

## 🚨 ROLLBACK PLAN

**If something goes wrong, follow these steps:**

### Emergency Rollback
```sql
-- 1. Drop new table (spending_entries and categories are preserved)
DROP TABLE IF EXISTS user_preferences CASCADE;

-- 2. Drop new functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_default_user_preferences() CASCADE;

-- 3. Remove added column from spending_entries (optional)
ALTER TABLE spending_entries DROP COLUMN IF EXISTS category_id;

-- 4. Remove added column from categories (optional - only if you added it)
-- ALTER TABLE categories DROP COLUMN IF EXISTS is_active;

-- 5. Restore original RLS policies for categories (if needed)
-- You may need to restore these from your backup
```

### Restore from Backup
1. Go to Supabase Dashboard → Settings → Database
2. Find your backup created before migration
3. Click "Restore" and follow prompts

---

## 📝 POST-MIGRATION NOTES

### What Changed:
- ✅ Added `user_preferences` table for user settings
- ✅ Added `is_active` column to `categories` table
- ✅ Added 8 default system categories
- ✅ Added `category_id` column to `spending_entries`
- ✅ Updated RLS policies for system category access
- ✅ Auto-create user preferences on signup

### What Stayed the Same:
- ✅ All existing data preserved
- ✅ Existing application code continues to work
- ✅ Current category strings in spending_entries still work
- ✅ User data security maintained with RLS

### Next Steps:
1. **Test the migration** - Create a test user and verify preferences are created
2. **Implement Issue #41** - Currency preference storage
3. **Implement Issue #42** - Backend integration
4. **Update application code** to use new schema features

---

## 🔧 TROUBLESHOOTING

### Common Issues:

**"column is_active does not exist"**
- You have existing database → Use Scenario B

**"permission denied for table auth.users"**
- Run in Supabase SQL Editor, not as regular user

**"relation user_preferences already exists"**
- Table already created → Skip user_preferences creation

**"unique constraint violation"**
- System categories already exist → Use `ON CONFLICT DO NOTHING`

**RLS policy errors**
- Check if you're authenticated in Supabase dashboard
- Verify `auth.uid()` function is available

### Getting Help:
- Check Supabase Dashboard → Settings → Database → Logs
- Test queries in SQL Editor with authenticated user
- Verify environment variables in application