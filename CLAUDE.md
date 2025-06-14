# SpendCheck Project Configuration

This file contains the project-specific configuration for Claude Code.

## Import Guidelines

@import ./docs/git-best-practices.md
@import ./docs/development-workflow.md

## Project-Specific Rules

- **ALWAYS test build before committing**: Run `npm run build` to catch TypeScript errors
- **Fix TypeScript warnings**: Remove unused variables (e.g., diffDays error in History.vue)  
- **Verify clean build output**: Ensure no TS errors or build failures before push

## Important Instruction Reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.