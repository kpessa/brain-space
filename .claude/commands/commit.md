# Create Git Commit

Help create a well-formatted git commit following best practices.

1. **Check Status**:
   - Run `git status` to see changes
   - Show the user what files have been modified

2. **Review Changes**:
   - Run `git diff` to show uncommitted changes
   - Help user understand what's being committed

3. **Stage Files**:
   - Ask which files to include (all or specific)
   - Use `git add` appropriately

4. **Create Commit Message**:
   - Suggest commit type: feat, fix, refactor, docs, style, test, chore
   - Help write a conventional commit message:
     - Format: `type(scope): subject`
     - Example: `feat(todos): add migration for unified todo system`
   - Add body if needed for complex changes

5. **Commit**:
   - Create the commit with the formatted message
   - Add co-author: `Co-Authored-By: Claude <noreply@anthropic.com>`

## Commit Message Examples:

- `feat(todos): implement unified todo system across all features`
- `fix(auth): resolve Google OAuth disconnect issue`
- `refactor(braindump): improve node synchronization performance`
- `docs(scripts): add PR creation documentation`

Remember to:
- Keep subject line under 50 characters
- Use imperative mood ("add" not "added")
- Reference issues if applicable
- Explain the "why" in the body for complex changes