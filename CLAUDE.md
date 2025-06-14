# SpendCheck Project Configuration

This file contains the project-specific configuration for Claude Code.

## Import Guidelines

@import ./docs/git-best-practices.md
@import ./docs/development-workflow.md

## Project-Specific Rules

- **ALWAYS test build before committing**: Run `npm run build` to catch TypeScript errors
- **Fix TypeScript warnings**: Remove unused variables (e.g., diffDays error in History.vue)  
- **Verify clean build output**: Ensure no TS errors or build failures before push

## Bug Handling Workflow

When a human reports a bug, follow this workflow:
1. **Create an issue** for the bug report
2. **Switch to dev branch** and fetch updates
3. **Create a new branch** for the issue
4. **Think and plan** the solution
5. **Ask for implementation approval** before proceeding
6. **Work on the fix** until the issue is resolved
7. **After issue is resolved**, switch back to dev branch and fetch updates

## Important Instruction Reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.