# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login
3. Click "New Project"
4. Choose your organization
5. Enter project name: "SpendCheck"
6. Generate a secure password
7. Choose your region
8. Click "Create new project"

## 2. Create the Database Table

### Option A: Using the Dashboard (Recommended)

1. Go to your project dashboard
2. Click on "Table Editor" in the sidebar
3. Click "Create a new table"
4. Table name: `spending_entries`
5. Enable "Row Level Security (RLS)"
6. Add the following columns:

| Column Name | Type | Default | Primary | Not Null | Unique |
|-------------|------|---------|---------|----------|--------|
| id | uuid | gen_random_uuid() | ✓ | ✓ | ✓ |
| user_id | text | | | ✓ | |
| amount | numeric | | | ✓ | |
| currency | text | 'USD' | | ✓ | |
| category | text | | | | |
| date | date | | | ✓ | |
| created_at | timestamptz | now() | | ✓ | |

7. Click "Save"

### Option B: Using SQL Editor

1. Go to "SQL Editor" in the sidebar
2. Click "New query"
3. Paste this SQL:

```sql
-- Create the spending_entries table
CREATE TABLE public.spending_entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    amount numeric NOT NULL,
    currency text DEFAULT 'USD' NOT NULL,
    category text,
    date date NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the user_preferences table
CREATE TABLE public.user_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    currency_code text NOT NULL DEFAULT 'USD',
    currency_symbol text NOT NULL DEFAULT '$',
    currency_name text NOT NULL DEFAULT 'US Dollar',
    theme text DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
    notifications_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create the categories table with UUID references
CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    icon text DEFAULT 'folder-outline',
    color text DEFAULT '#3b82f6',
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW(),
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_user_id_name_key UNIQUE (user_id, name)
);

-- Create index for categories
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories USING btree (user_id);

-- Add category reference to spending_entries
ALTER TABLE public.spending_entries ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE public.spending_entries ADD CONSTRAINT fk_spending_entries_category 
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.spending_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own data
CREATE POLICY "Users can view own spending entries" ON public.spending_entries
    FOR SELECT USING (user_id = (select current_setting('request.jwt.claims', true)::json->>'sub'));

-- Create policy to allow users to insert their own data
CREATE POLICY "Users can insert own spending entries" ON public.spending_entries
    FOR INSERT WITH CHECK (user_id = (select current_setting('request.jwt.claims', true)::json->>'sub'));

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update own spending entries" ON public.spending_entries
    FOR UPDATE USING (user_id = (select current_setting('request.jwt.claims', true)::json->>'sub'));

-- Create policy to allow users to delete their own data
CREATE POLICY "Users can delete own spending entries" ON public.spending_entries
    FOR DELETE USING (user_id = (select current_setting('request.jwt.claims', true)::json->>'sub'));

-- Create policies for user_preferences table
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON public.user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for categories table (allow access to own categories and default categories)
CREATE POLICY "Users can view own and default categories" ON public.categories
    FOR SELECT USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can insert own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to create default user preferences
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user signup
CREATE TRIGGER create_user_preferences_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_user_preferences();

-- Insert default categories (available to all users)
INSERT INTO public.categories (user_id, name, color, icon, is_default, is_active) VALUES
  (NULL, 'Food & Dining', '#ef4444', 'restaurant-outline', true, true),
  (NULL, 'Transportation', '#3b82f6', 'car-outline', true, true),
  (NULL, 'Shopping', '#8b5cf6', 'bag-outline', true, true),
  (NULL, 'Entertainment', '#f59e0b', 'game-controller-outline', true, true),
  (NULL, 'Bills & Utilities', '#10b981', 'document-text-outline', true, true),
  (NULL, 'Healthcare', '#ec4899', 'medical-outline', true, true),
  (NULL, 'Education', '#06b6d4', 'school-outline', true, true),
  (NULL, 'Other', '#6b7280', 'ellipse-outline', true, true)
ON CONFLICT (user_id, name) DO NOTHING;

-- Create user preferences for existing users
INSERT INTO public.user_preferences (user_id)
SELECT id 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_default ON public.categories(is_default);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_spending_entries_category_id ON public.spending_entries(category_id);
```

4. Click "Run"

### Updating Existing Policies

If you already have RLS policies defined and need to update them (e.g., for performance optimization), you'll need to drop and recreate them:

```sql
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own spending entries" ON public.spending_entries;
DROP POLICY IF EXISTS "Users can insert own spending entries" ON public.spending_entries;
DROP POLICY IF EXISTS "Users can update own spending entries" ON public.spending_entries;
DROP POLICY IF EXISTS "Users can delete own spending entries" ON public.spending_entries;

DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;

-- Then run the CREATE POLICY statements above
```

**Note:** The `(select ...)` wrapper around `current_setting()` is important for performance - it prevents the function from being re-evaluated for each row, which can cause slow queries at scale.

## 3. Get Your API Keys

1. Go to "Settings" → "API" in the sidebar
2. Copy your:
   - Project URL
   - `anon` `public` key

## 4. Configure Environment Variables

1. Create a `.env` file in your project root
2. Add your credentials:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 5. Test the Connection

Run your app with `npm run dev` and try logging a spending entry. Check the Supabase dashboard under "Table Editor" to see if data appears.

## Notes

- The policies allow only authenticated users to access their own data via JWT claims
- RLS ensures users can only see/modify their own spending entries, categories, and preferences
- The `amount` field stores currency values as numeric type for precision
- The `currency` field stores the 3-letter currency code (USD, EUR, etc.)
- The `category` field stores spending categories (optional, for backward compatibility)
- The `category_id` field references the new categories table (UUID foreign key)
- The `user_preferences` table stores user-specific settings (currency, theme, notifications)
- The `categories` table stores both user-created and default system categories
- Default categories are available to all users (is_default = true, user_id = NULL)
- User-created categories are private to each user (is_default = false, user_id = user's UUID)
- Mixed currencies are supported - each entry can have its own currency
- Categories have a unique constraint per user to prevent duplicates
- Auto-created user preferences for new signups via database trigger
- Automatic timestamp updates for user_preferences and categories tables