# Create Pull Request

You are going to help create a pull request for the current branch. Follow these steps:

1. **Check Prerequisites**:
   - Verify `gh` CLI is available
   - Check current git branch (must not be main/master)
   - Check for uncommitted changes

2. **Gather Information**:
   - Get the current branch name
   - Get the base/default branch (usually main or master)
   - List all commits that will be included in the PR (between base and current branch)

3. **Create Commit if Needed**:
   - If there are uncommitted changes, ask the user if they want to commit them
   - If yes, create a commit with a proper message

4. **Prepare PR Details**:
   - Ask for PR title (suggest based on branch name or recent commits)
   - Ask for PR type: feature, fix, refactor, docs, or other
   - Build PR body with:
     - Summary section
     - Changes list (from commits)
     - Test plan checklist
     - Any additional notes

5. **Create the PR**:
   - Push the branch if not already pushed
   - Use `gh pr create` with the gathered information
   - Show the PR URL when created

6. **Follow-up**:
   - Ask if user wants to open PR in browser
   - Provide the PR URL for reference

## Example PR Body Format:

```markdown
## Summary
Brief description of what this PR does

## Changes
- Change 1 from commit
- Change 2 from commit
- Additional changes

## Test Plan
- [ ] Tested locally
- [ ] All tests pass
- [ ] No console errors
- [ ] Feature works as expected

## Notes
Any additional context or notes

---
🤖 Generated with Claude Code
```

When executing this command:
- Be conversational and guide the user through each step
- Provide clear feedback about what's happening
- Handle errors gracefully and suggest fixes
- Make the process smooth and efficient