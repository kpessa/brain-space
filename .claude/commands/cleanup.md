# Clean Up Repository

Help clean up the repository by identifying and removing unnecessary files that were created during development but aren't needed for the final functionality.

1. **Analyze Current State**:
   - Run `git status` to see uncommitted files
   - List all untracked files
   - Check for common temporary/development files

2. **Identify Cleanup Candidates**:
   Look for and list:
   - Temporary test files (e.g., `test-*.tsx`, `Test*.tsx`, `Debug*.tsx`)
   - Development/debugging components not used in production
   - Duplicate or backup files (e.g., `*.backup`, `*.old`, `*.original`)
   - Log files or debug outputs
   - Unused imports or dead code
   - Development-only routes or pages
   - Temporary migration or fix scripts that have been applied
   - Any files with "temp", "tmp", "debug", "test" in the name (unless they're actual tests)

3. **Review with User**:
   - Show list of files suggested for removal
   - Group by category (temp files, debug files, etc.)
   - Ask user to confirm each group or individual file
   - Explain why each file is suggested for removal

4. **Check for Dependencies**:
   Before removing any file:
   - Search for imports of that file
   - Check if it's referenced in any routes
   - Verify it's not needed by other components

5. **Clean Up Process**:
   For confirmed files:
   - If tracked by git: `git rm <file>`
   - If untracked: `rm <file>`
   - Remove any related imports
   - Clean up routes if applicable

6. **Additional Cleanup**:
   Ask if user wants to:
   - Remove unused dependencies from package.json
   - Clean up console.log statements
   - Remove commented-out code
   - Optimize imports

7. **Final Steps**:
   - Show summary of what was cleaned
   - Suggest running `pnpm install` if package.json was modified
   - Remind to test the application
   - Create a commit with the cleanup changes

## Example Output:

```
🧹 Repository Cleanup Analysis

Found the following cleanup candidates:

📁 Temporary/Debug Files:
- src/pages/TestJournalFix.tsx (debug page)
- src/pages/DebugJournal.tsx (debug page)
- src/pages/AuthTest.tsx (test page)
- fix-todo-rls.sql (already applied migration)

📁 Backup/Old Files:
- src/components/BrainDumpFlow.original.tsx

📁 Development Scripts:
- scripts/run-migration.js (one-time use)

Would you like to remove these files? (yes/no/select)
```

## Safety Checks:
- Never remove actual test files in __tests__ or *.test.* or *.spec.*
- Keep all migration files in supabase/migrations/
- Preserve all production components and features
- Keep configuration files (.env.example, etc.)