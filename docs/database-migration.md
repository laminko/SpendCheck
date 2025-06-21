# Database Migration Guide: Production → Development

This guide helps you migrate your Supabase production database to a development environment for safe testing and feature development.

## Current Database Schema

Your production database contains:
- `spending_entries` table (id, user_id, amount, currency, category, category_id, date, created_at)
- `categories` table (id, user_id, name, icon, color, is_default, created_at)
- Row Level Security (RLS) policies for user data isolation

## Migration Options

### Option 1: Manual SQL Migration (Recommended)

#### Step 1: Set up Environment Files

Environment files have been created:
- `.env.development` - Development database credentials
- `.env.production` - Production database credentials

**Configure your credentials:**
```bash
# Edit .env.development with your dev database info
VITE_SUPABASE_URL=your_development_supabase_url
VITE_SUPABASE_ANON_KEY=your_development_supabase_anon_key

# For development work, copy dev config:
cp .env.development .env
```

#### Step 2: Create Development Database Schema

1. Go to your **development** Supabase dashboard
2. Navigate to **SQL Editor**
3. Run the complete migration script from `scripts/migrate-to-dev.sql`

This script creates:
- All necessary tables with proper structure
- RLS policies for data security
- Performance indexes
- Default categories

#### Step 3: Export Production Data

In your **production** Supabase SQL Editor, run:

```sql
-- Export spending entries
COPY (SELECT * FROM spending_entries ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Export categories  
COPY (SELECT * FROM categories ORDER BY created_at) TO STDOUT WITH CSV HEADER;
```

**Alternative - Query and copy manually:**
```sql
-- Get spending entries (copy results)
SELECT * FROM spending_entries ORDER BY created_at;

-- Get categories (copy results)
SELECT * FROM categories ORDER BY created_at;
```

#### Step 4: Import Data to Development

In your **development** Supabase SQL Editor:

```sql
-- Example INSERT for spending entries
INSERT INTO spending_entries (id, user_id, amount, currency, category, category_id, date, created_at)
VALUES 
  ('your-uuid-1', 'user-uuid-1', 25.50, 'USD', 'Food', null, '2024-01-15', '2024-01-15T10:30:00Z'),
  ('your-uuid-2', 'user-uuid-1', 12.00, 'USD', 'Transport', null, '2024-01-16', '2024-01-16T14:20:00Z');

-- Example INSERT for categories
INSERT INTO categories (id, user_id, name, icon, color, is_default, created_at)
VALUES
  ('cat-uuid-1', 'user-uuid-1', 'Custom Food', '🍕', '#FF6B6B', false, '2024-01-10T09:00:00Z');
```

### Option 2: Supabase CLI (Advanced)

#### Prerequisites
```bash
# Install Supabase CLI
npm install -g supabase
# or
brew install supabase/cli/supabase
```

#### Migration Steps
```bash
# 1. Login to Supabase
supabase login

# 2. Link to production project
supabase link --project-ref your-production-project-ref

# 3. Export schema
supabase db dump --schema-only > production_schema.sql

# 4. Export data
supabase db dump --data-only --table spending_entries --table categories > production_data.sql

# 5. Switch to development project and apply
supabase link --project-ref your-development-project-ref
supabase db reset # applies schema
psql "your-dev-connection-string" -f production_data.sql # apply data
```

### Option 3: Database URL Direct Connection

If you have direct PostgreSQL access:

```bash
# Export from production
pg_dump "postgresql://postgres:[prod-password]@[prod-host]:5432/postgres" \
  --table=spending_entries --table=categories \
  --data-only --inserts > production_data.sql

# Import to development  
psql "postgresql://postgres:[dev-password]@[dev-host]:5432/postgres" \
  -f scripts/migrate-to-dev.sql  # schema first
psql "postgresql://postgres:[dev-password]@[dev-host]:5432/postgres" \
  -f production_data.sql         # then data
```

## Migration Files Reference

### `scripts/migrate-to-dev.sql`
Complete database schema with:
- Table definitions matching production
- RLS policies for security
- Performance indexes
- Default categories for testing

### Environment Files
- `.env.development` - Development database configuration
- `.env.production` - Production database configuration
- `.env.example` - Template for new setups

## Verification Steps

After migration, verify in your development database:

```sql
-- Check table structure
\d spending_entries
\d categories

-- Verify data migration
SELECT COUNT(*) FROM spending_entries;
SELECT COUNT(*) FROM categories;

-- Test RLS policies
SELECT * FROM spending_entries WHERE user_id = 'test-user-id';
```

## Development Workflow

1. **Use development database** for all feature development
2. **Test migrations** safely without affecting production
3. **Switch environments** using environment files:
   ```bash
   # Development
   cp .env.development .env
   
   # Production  
   cp .env.production .env
   ```

## Next Steps

After successful migration:
1. Test existing functionality with development database
2. Implement new authentication features safely
3. Add new tables (user_profiles, custom_categories) to development first
4. Test thoroughly before production deployment

## Troubleshooting

**Common Issues:**
- **Permission errors**: Ensure your development database user has necessary privileges
- **UUID conflicts**: Use `gen_random_uuid()` for new records
- **RLS policy errors**: Make sure auth context is properly set up
- **Foreign key issues**: Import data in correct order (categories before spending_entries)

**Getting Help:**
- Check Supabase dashboard logs
- Use SQL Editor for direct database queries
- Verify environment variables are correctly loaded