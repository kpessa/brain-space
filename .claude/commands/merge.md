# Merge Pull Request

Help merge a pull request safely with proper checks and procedures.

1. **Identify PR**:
   - Ask for PR number or URL
   - If not provided, list open PRs with `gh pr list`
   - Show PR details with `gh pr view <number>`

2. **Pre-Merge Checks**:
   - Check PR status with `gh pr checks <number>`
   - Verify all CI checks are passing
   - Check if PR has required approvals
   - Show any merge conflicts

3. **Review Status**:
   - Show review status and comments
   - List any unresolved conversations
   - Confirm all requested changes have been addressed

4. **Final Verification**:
   - Show summary of changes one more time
   - List commits that will be merged
   - Confirm the base branch is correct

5. **Choose Merge Strategy**:
   - Ask user for merge method:
     - **Merge commit**: Preserves all commits (default)
     - **Squash and merge**: Combines into single commit
     - **Rebase and merge**: Linear history
   - Explain the implications of each choice

6. **Prepare Merge**:
   - For squash merge, help craft a combined commit message
   - Ensure commit message follows project conventions
   - Add any final notes or references

7. **Execute Merge**:
   - Perform the merge with chosen strategy:
     - `gh pr merge <number> --merge` (merge commit)
     - `gh pr merge <number> --squash` (squash and merge)
     - `gh pr merge <number> --rebase` (rebase and merge)
   - Add `--delete-branch` flag if user wants to clean up

8. **Post-Merge Actions**:
   - Confirm merge was successful
   - Ask if user wants to:
     - Delete the remote branch
     - Switch back to main branch
     - Pull latest changes
     - Start a new feature branch

## Safety Checks:

Before merging, ensure:
- ✅ All CI checks are green
- ✅ PR has been approved
- ✅ No merge conflicts exist
- ✅ Changes have been tested
- ✅ Documentation is updated if needed

## Example Merge Messages:

### For Squash Merge:
```
feat(todos): implement unified todo system (#123)

* Add todo database schema and migrations
* Create todo service with CRUD operations
* Integrate todos with BrainDump, Journal, and Routines
* Add todo dashboard with Eisenhower matrix view
* Fix migration errors and improve error handling

Co-authored-by: [PR Author] <email>
```

### For Merge Commit:
```
Merge pull request #123 from feature/unified-todos

Implement unified todo system across all features
```