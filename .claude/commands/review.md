# Review Pull Request

Help review a pull request thoroughly and provide constructive feedback.

1. **Get PR Information**:
   - Ask for PR number or URL (or detect from current branch)
   - If no PR specified, list open PRs with `gh pr list`
   - Fetch PR details with `gh pr view <number>`

2. **Examine PR Overview**:
   - Show PR title, author, and description
   - List all changed files with `gh pr diff <number> --name-only`
   - Show statistics (additions, deletions, files changed)

3. **Review Changes**:
   - Go through significant changes file by file
   - Use `gh pr diff <number>` to see the full diff
   - For each major change:
     - Explain what the code does
     - Check for potential issues
     - Suggest improvements if needed

4. **Check Key Areas**:
   - **Code Quality**: Style consistency, naming conventions, DRY principles
   - **Logic**: Correctness, edge cases, error handling
   - **Performance**: Any potential bottlenecks or inefficiencies
   - **Security**: No exposed secrets, proper validation, safe operations
   - **Tests**: Adequate test coverage, test quality
   - **Documentation**: Comments, README updates, type definitions

5. **Run Local Checks** (if PR is checked out):
   - Run linting: `pnpm run lint`
   - Run type checking: `pnpm run type-check`
   - Run tests if available
   - Check for console errors

6. **Provide Feedback**:
   - Summarize findings in categories:
     - ✅ **Looks good**: What's done well
     - 💡 **Suggestions**: Non-blocking improvements
     - ⚠️ **Issues**: Things that should be addressed
     - ❓ **Questions**: Clarifications needed
   
7. **Submit Review**:
   - Ask user what type of review to submit:
     - **Approve**: Everything looks good
     - **Comment**: Neutral feedback
     - **Request Changes**: Issues need to be fixed
   - Submit with `gh pr review <number> --body "review comments" --approve/--comment/--request-changes`

## Example Review Format:

```markdown
## Code Review

### ✅ What looks good
- Clear implementation of the todo system
- Good error handling in migration functions
- Proper TypeScript types

### 💡 Suggestions
- Consider adding more detailed logging for debugging
- Could extract magic numbers to constants

### ⚠️ Issues to address
- Missing null check in line 45 of todoService.ts
- Need to handle the edge case when user has no todos

### ❓ Questions
- Why was this approach chosen over the alternative?
- Has this been tested with large datasets?

Overall: [Approve/Request Changes/Comment]
```