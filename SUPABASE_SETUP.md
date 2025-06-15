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

-- Create the categories table
CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    name text NOT NULL,
    icon text NULL,
    color text NULL,
    is_default boolean NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_user_id_name_key UNIQUE (user_id, name)
);

-- Create index for categories
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories USING btree (user_id);

-- Enable RLS on both tables
ALTER TABLE public.spending_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own data
CREATE POLICY "Users can view own spending entries" ON public.spending_entries
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id LIKE 'anon_%');

-- Create policy to allow users to insert their own data
CREATE POLICY "Users can insert own spending entries" ON public.spending_entries
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id LIKE 'anon_%');

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update own spending entries" ON public.spending_entries
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id LIKE 'anon_%');

-- Create policy to allow users to delete their own data
CREATE POLICY "Users can delete own spending entries" ON public.spending_entries
    FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id LIKE 'anon_%');

-- Create policies for categories table
CREATE POLICY "Users can view own categories" ON public.categories
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id LIKE 'anon_%');

CREATE POLICY "Users can insert own categories" ON public.categories
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id LIKE 'anon_%');

CREATE POLICY "Users can update own categories" ON public.categories
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id LIKE 'anon_%');

CREATE POLICY "Users can delete own categories" ON public.categories
    FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id LIKE 'anon_%');
```

4. Click "Run"

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

- The policies allow anonymous users (with IDs starting with 'anon_') to access their own data
- RLS ensures users can only see/modify their own spending entries and categories
- The `amount` field stores currency values as numeric type for precision
- The `currency` field stores the 3-letter currency code (USD, EUR, etc.)
- The `category` field stores spending categories (optional, nullable for backward compatibility)
- The `categories` table stores custom user categories with optional icons and colors
- Mixed currencies are supported - each entry can have its own currency
- Categories have a unique constraint per user to prevent duplicates