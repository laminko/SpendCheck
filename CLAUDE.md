# SpendCheck Project Configuration

This file contains the project-specific configuration for Claude Code.

## Import Guidelines

@import ./docs/git-best-practices.md
@import ./docs/development-workflow.md

## Project-Specific Rules

- **ALWAYS test build before committing**: Run `npm run build` to catch TypeScript errors
- **Fix TypeScript warnings**: Remove unused variables (e.g., diffDays error in History.vue)  
- **Verify clean build output**: Ensure no TS errors or build failures before push

## Branch Workflow

**IMPORTANT BRANCH STRUCTURE:**
- **dev** = Main development/working branch (use for all development work)
- **main** = Production/release branch ONLY (no direct development)
- **Each feature or issue should be branched from dev, then PR back to dev**

## Issue/Feature Handling Workflow

When a human reports a bug or requests a feature, follow this workflow:
1. **Create a GitHub issue** for the bug report or feature request
2. **Switch to dev branch** and fetch updates
3. **Create a new branch** for the issue
4. **Think and plan** the solution
5. **Ask for implementation approval** before proceeding
6. **Work on the fix/feature** until the issue is resolved
7. **After issue is resolved**, switch back to dev branch and fetch updates
8. **Wait for human's approval** before closing the GitHub issue

## Release Workflow

For production releases:
1. **Bump version** in package.json on dev branch
2. **Create PR from dev to main** when ready for release
3. **Create GitHub release** with release notes after PR is merged
4. **Merge main back to dev** to keep branches synchronized

## Current Project Status

**Project Overview:**
- Simple spending tracker web app built with Vue 3 + TypeScript + Ionic Vue
- Backend: Supabase (PostgreSQL with real-time capabilities)
- Live at: https://spend-check-eta.vercel.app
- Mobile-ready with Capacitor for iOS/Android

**Current Branch Status:**
- Working on `dev` branch (main development branch)
- Latest commit: `09f35f4` - Version bump to 1.3.0 for release
- Working directory clean, all changes committed
- Pull Request #50 updated: "Release v1.3.0: Major authentication and user management features"

**Recent Key Issues Resolved:**
1. **Authentication System** - Implemented complete Supabase authentication (email/password, OAuth)
2. **Apple Design System** - Enhanced authentication UI with Apple-style components
3. **Settings Page** - Complete refactor with proper Ionic components
4. **Currency Picker** - Replaced custom modal with existing CurrencyPicker component
5. **History.vue Import Issues** - Fixed missing `useSpendingStore` and `useDateUtils` imports
6. **Facebook OAuth UI** - Temporarily hidden Facebook sign-in button (commit 939a395)

**Technical Architecture:**
- **Frontend:** Vue 3 Composition API + TypeScript + Ionic Vue
- **State Management:** Composables (useSpendingStore, useCurrency, useDateUtils, etc.)
- **Charts:** Chart.js + vue-chartjs for data visualization
- **Database:** Supabase with RLS authentication
- **Build:** Vite + vue-tsc for TypeScript checking
- **Deployment:** Vercel with auto-deploy from main branch

**Key Components:**
- `Home.vue` - Main spending tracking interface
- `History.vue` - Last 7 days spending history with precise timestamps
- `Graph.vue` - Charts and analytics
- `SpendingDialog.vue` - Category selection modal
- `SpendingChart.vue` - GitHub-style spending grid

**Key Composables:**
- `useSpendingStore.ts` - Spending data management
- `useCurrency.ts` - 21 supported currencies
- `useDateUtils.ts` - Date formatting and utilities
- `useAuth.ts` - Anonymous authentication

**Current Build Commands:**
- `npm run dev` - Development server
- `npm run build` - Production build with TypeScript check
- `npm run typecheck` - TypeScript validation only
- Mobile: `npm run build:mobile` + Capacitor commands

## Outstanding Implementation Work

**Settings Page Authentication (Issue #37) - COMPLETED:**

**Authentication System (IMPLEMENTED):**
- ✅ Complete Supabase authentication system implemented
- ✅ Email/password authentication with proper validation
- ✅ Google OAuth integration (`signInWithGoogle`)
- ⚠️ Facebook OAuth integration (temporarily hidden in UI) 
- ✅ Apple OAuth integration (`signInWithApple`)
- ✅ Real authentication state management in `useAuth.ts`
- ✅ Enhanced UI with Apple design system components
- ✅ Proper error handling and loading states

**Remaining Tasks:**
- Phone SMS verification (`signInWithPhone`) - Supabase setup required
- Category Management System:
  - Create new categories
  - Edit existing categories  
  - Delete categories
  - Category validation
- User Preferences Storage - Currency saving for authenticated users
- **Data Migration - Moving guest data to authenticated accounts (COMPLETED - Issue #48):**
  - **✅ RESOLVED**: Spending data migration successfully implemented
  - **SOLUTION**: migrateAnonymousSpendingData() function preserves all spending history
  - **IMPLEMENTATION**: Automatic migration triggered during authentication flow
  - **TESTING**: Verified with email/password authentication - seamless data preservation
  - **IMPACT**: Users can now upgrade from anonymous to authenticated without losing data

**Current Status:** Core authentication system is fully implemented with modern UI. Phone verification and category management remain as next implementation targets.

## Important Instruction Reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Security Guidelines

**CRITICAL: Never include sensitive information in public content:**
- ❌ NO emails, passwords, or credentials in README files
- ❌ NO sensitive data in GitHub issues or comments
- ❌ NO personal information in commit messages
- ❌ NO test credentials in public documentation
- ✅ Keep sensitive information only in private memory (CLAUDE.md)
- ✅ Use placeholder text like "test@example.com" in public examples
- ✅ Sanitize all public-facing content before committing

## Development Resources

- Use ionic components and its docs is https://ionicframework.com/docs/components
