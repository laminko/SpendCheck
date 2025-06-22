-- =============================================================================
-- REMOVE DATABASE TRIGGERS - Migration to ORM
-- This script removes database triggers that are replaced by ORM logic
-- =============================================================================

-- Remove trigger for auto-updating timestamps
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;

-- Remove trigger for auto-creating user preferences on signup
DROP TRIGGER IF EXISTS create_user_preferences_on_signup ON auth.users;

-- Remove the functions that were used by triggers
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS create_default_user_preferences();

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check that triggers are removed
SELECT 
  trigger_name, 
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE '%user_preferences%'
ORDER BY trigger_name;

-- Check that functions are removed
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('update_updated_at_column', 'create_default_user_preferences')
AND routine_schema = 'public';

-- Display results
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== DATABASE TRIGGERS REMOVAL COMPLETED ===';
  RAISE NOTICE 'Triggers and functions have been removed.';
  RAISE NOTICE 'Timestamp management and user preferences creation';
  RAISE NOTICE 'are now handled by the ORM (Prisma) in application code.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update application code to use new ORM services';
  RAISE NOTICE '2. Test user signup flow with ORM-based preferences creation';
  RAISE NOTICE '3. Verify automatic timestamp updates work via ORM';
  RAISE NOTICE '';
END
$$;