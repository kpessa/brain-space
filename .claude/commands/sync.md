# Sync with Main Branch

Help sync the current worktree branch with the latest changes from main branch to ensure you're building on the most up-to-date code.

1. **Check Current State**:
   - Show current branch name
   - Check for uncommitted changes
   - Verify remote configuration

2. **Stash Changes if Needed**:
   If there are uncommitted changes:
   - Ask user if they want to stash them
   - Run `git stash push -m "Stashing before sync with main"`
   - Note the stash reference

3. **Fetch Latest Changes**:
   - Run `git fetch origin main`
   - Show how many commits behind/ahead the current branch is

4. **Choose Sync Method**:
   Ask user preference:
   - **Merge** (default): Preserves all commit history
   - **Rebase**: Creates linear history
   - Explain the differences briefly

5. **Perform Sync**:
   
   **For Merge:**
   ```bash
   git merge origin/main
   ```
   
   **For Rebase:**
   ```bash
   git rebase origin/main
   ```

6. **Handle Conflicts**:
   If conflicts occur:
   - List conflicted files
   - Provide guidance on resolving
   - Suggest using `git status` to track progress
   - For rebase: explain --continue, --abort options

7. **Restore Stashed Changes**:
   If changes were stashed:
   - Ask if user wants to apply stash
   - Run `git stash pop`
   - Handle any conflicts from stash

8. **Verify Success**:
   - Show updated branch status
   - List new commits that were pulled in
   - Suggest running tests/build to ensure everything works

9. **Push Updates** (if needed):
   If the branch was already pushed:
   - For merge: `git push`
   - For rebase: warn about force push need, ask confirmation
   - Explain implications of force push

## Example Flow:

```
📊 Current Status
Branch: feature/new-feature
Behind main: 5 commits
Uncommitted changes: Yes

Stashing your changes before sync...
✓ Changes stashed successfully

Fetching latest from main...
✓ Fetched 5 new commits

How would you like to sync?
1. Merge (recommended) - Preserves history
2. Rebase - Linear history

[User selects 1]

Merging origin/main into feature/new-feature...
✓ Merge successful!

New commits from main:
- abc1234 fix: Resolve authentication issue
- def5678 feat: Add new dashboard widget
- ghi9012 docs: Update README
- jkl3456 refactor: Improve performance
- mno7890 test: Add unit tests

Would you like to restore your stashed changes? (yes/no)
```

## Important Notes:
- Always fetch before merging/rebasing
- Warn about force push implications for rebased branches
- Remind about testing after sync
- Suggest creating a backup branch if changes are significant