# ORM Migration Guide: From Database Triggers to Prisma

This guide explains how to migrate from database triggers to Prisma ORM for automatic timestamp management and user preferences creation.

## Overview

The migration replaces database-level triggers with application-level logic using Prisma ORM, providing:

- ✅ **Type Safety**: Full TypeScript integration with database schema
- ✅ **Automatic Timestamps**: `@updatedAt` decorator handles timestamp updates
- ✅ **Application Logic**: User preferences creation handled in service layer
- ✅ **Better Testing**: Easier to mock and test ORM operations
- ✅ **Modern Stack**: Industry-standard ORM practices

## Files Created

### 1. Core ORM Infrastructure
- `prisma/schema.prisma` - Database schema with Prisma models
- `src/lib/database.ts` - Database service layer with business logic
- `src/services/userService.ts` - User management service (replaces triggers)

### 2. Enhanced Composables
- `src/composables/useSpendingStoreORM.ts` - Type-safe spending operations
- `src/composables/useCategoryStoreORM.ts` - Category management with ORM
- `src/composables/useAuthORM.ts` - Auth with automatic user initialization

### 3. Migration Scripts
- `docs/remove-database-triggers.sql` - Remove existing triggers and functions

## Migration Steps

### Step 1: Database Setup

1. **Update environment variables**:
   ```bash
   # Update .env with your Supabase database password
   DATABASE_URL="postgresql://postgres:[YOUR_DB_PASSWORD]@db.ielwsurzojvcjikzikxc.supabase.co:5432/postgres"
   ```

2. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

3. **Remove database triggers**:
   ```sql
   -- Run in Supabase SQL Editor
   -- See: docs/remove-database-triggers.sql
   ```

### Step 2: Code Migration

Replace existing composables with ORM versions:

```typescript
// OLD: Direct Supabase queries
import { useSpendingStore } from '@/composables/useSpendingStore'
import { useCategoryStore } from '@/composables/useCategoryStore'
import { useAuth } from '@/composables/useAuth'

// NEW: ORM-based composables
import { useSpendingStoreORM } from '@/composables/useSpendingStoreORM'
import { useCategoryStoreORM } from '@/composables/useCategoryStoreORM'
import { useAuthORM } from '@/composables/useAuthORM'
```

### Step 3: Component Updates

Update your Vue components to use the new composables:

```vue
<script setup lang="ts">
// Update imports
import { useSpendingStoreORM } from '@/composables/useSpendingStoreORM'
import { useAuthORM } from '@/composables/useAuthORM'

// Same API, enhanced functionality
const { entries, addEntry, deleteEntry } = useSpendingStoreORM()
const { user, signUpWithEmail } = useAuthORM()
</script>
```

## Key Benefits

### Automatic Timestamp Management
```typescript
// OLD: Database trigger updates timestamps
// NEW: Prisma @updatedAt decorator handles this automatically
model UserPreference {
  updatedAt DateTime @updatedAt @map("updated_at")
}
```

### User Preferences Creation
```typescript
// OLD: Database trigger on auth.users insert
// NEW: Application service layer
await UserService.initializeUserData(userId)
```

### Type Safety
```typescript
// OLD: Manual type definitions
interface SpendingEntry { ... }

// NEW: Generated from Prisma schema
import type { SpendingEntry } from '@/lib/prisma'
```

### Better Error Handling
```typescript
// OLD: Database errors are generic
// NEW: Application-level validation and errors
if (existingCategory) {
  throw new Error(`Category "${name}" already exists`)
}
```

## API Compatibility

The new ORM composables maintain the same API as the original ones:

| Operation | Old API | New API | Status |
|-----------|---------|---------|---------|
| Load entries | `loadEntries()` | `loadEntries()` | ✅ Compatible |
| Add entry | `addEntry(data)` | `addEntry(data)` | ✅ Compatible |
| Delete entry | `deleteEntry(id)` | `deleteEntry(id)` | ✅ Compatible |
| User auth | `signUpWithEmail()` | `signUpWithEmail()` | ✅ Enhanced |

## Testing the Migration

1. **Build check**:
   ```bash
   npm run build
   ```

2. **Development server**:
   ```bash
   npm run dev
   ```

3. **Test user signup** - Should automatically create preferences
4. **Test spending entry creation** - Should have automatic timestamps
5. **Test category management** - Should work with type safety

## Rollback Plan

If issues occur, you can temporarily:

1. Revert to old composables by updating imports
2. Re-run the original database migration script
3. Keep both systems running in parallel during transition

## Performance Notes

- **Database calls**: Reduced due to better query optimization
- **Type checking**: Compile-time type safety prevents runtime errors
- **Bundle size**: Minimal increase due to Prisma client (~100KB gzipped)

## Next Steps

After successful migration:

1. Remove old composables (`useSpendingStore.ts`, `useCategoryStore.ts`)
2. Update all components to use ORM versions
3. Add integration tests for ORM operations
4. Consider adding database connection pooling for production

## Support

For issues during migration:
- Check Prisma documentation: https://prisma.io/docs
- Verify database connection strings
- Test ORM operations in isolation first