# SpendCheck Project Configuration

This file contains the project-specific configuration for Claude Code.

## Import Guidelines

@import ./docs/git-best-practices.md
@import ./docs/development-workflow.md

## Project-Specific Rules

- **ALWAYS test build before committing**: Run `npm run build` to catch TypeScript errors
- **Fix TypeScript warnings**: Remove unused variables (e.g., diffDays error in History.vue)  
- **Verify clean build output**: Ensure no TS errors or build failures before push

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

## Current Project Status

**Project Overview:**
- Simple spending tracker web app built with Vue 3 + TypeScript + Ionic Vue
- Backend: Supabase (PostgreSQL with real-time capabilities)
- Live at: https://spend-check-eta.vercel.app
- Mobile-ready with Capacitor for iOS/Android

**Current Branch Status:**
- Working on `dev` branch (main development branch)
- Latest commit: `bb74916` - Fixed missing imports in History.vue
- Clean working directory, all changes committed and pushed

**Recent Key Issues Resolved:**
1. **History.vue Import Issues** - Fixed missing `useSpendingStore` and `useDateUtils` imports
2. **Toast Implementation** - Verified proper Ionic color usage (`success`, `danger`)
3. **TypeScript Warnings** - Removed unused `formatTimeAgo` variable
4. **DateTime Format** - Recently improved History page timestamp display
5. **Daily Spending Popover** - Recently added to GitHub-style grid

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

## Important Instruction Reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.