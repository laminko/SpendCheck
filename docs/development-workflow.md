# Complete Development Workflow

## 1. Issue Planning Phase
- **Check open issues first**: `gh issue list --state open`
- **Review issue requirements** and acceptance criteria
- **Plan implementation approach** and break down tasks

## 2. Branch Creation Phase  
- **Create branch with issue number**: `git checkout -b feat/issue-description` or `fix/issue-description`
- **Always branch from `dev`**: Ensure you're on latest dev branch before creating feature branch

## 3. Development Phase
- **Implement features** following requirements
- **Test build frequently**: `npm run build` to catch TypeScript errors early
- **Commit atomically**: Small, focused commits with clear messages

## 4. Pre-Commit Verification
- **MANDATORY: Test build**: `npm run build` before every commit
- **Fix any TypeScript warnings/errors**
- **Verify functionality works as expected**

## 5. PR Creation Phase
- **Push branch**: `git push -u origin branch-name`
- **Create PR**: `gh pr create` with comprehensive description
- **Link to issues**: Reference issue numbers in PR description
- **Add test plan**: Checklist of tested functionality

## 6. Post-Merge Workflow
- **Check PR/issue status**: `gh pr list` and `gh issue list`
- **Verify merge completion**: Ensure PR shows as MERGED
- **Verify issue closure**: Related issues should be CLOSED
- **Return to dev branch**: `git checkout dev`
- **Fetch updates**: `git fetch --all && git pull origin dev`
- **Plan next work**: Review remaining open issues

## 7. Next Steps Planning
- **Review open issues**: Prioritize remaining work
- **Check foundations**: See what previous work enables
- **Ask for direction**: Confirm next priorities with stakeholder