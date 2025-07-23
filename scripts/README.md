# PR Creation Scripts

This directory contains custom scripts to help create pull requests quickly and consistently.

## Prerequisites

You need to have the GitHub CLI (`gh`) installed:
- Install from: https://cli.github.com/
- After installing, authenticate with: `gh auth login`

## Available Scripts

### 1. Interactive PR Creator (`create-pr.js`)

A comprehensive Node.js script that guides you through creating a PR with all the details.

**Usage:**
```bash
pnpm run pr
# or
node scripts/create-pr.js
```

**Features:**
- Checks for uncommitted changes
- Shows commits that will be included
- Prompts for PR type (feature, bug fix, refactor, etc.)
- Helps build a detailed PR description
- Automatically pushes branch if needed
- Opens PR in browser (optional)

### 2. Quick PR Creator (`quick-pr.sh`)

A bash script for creating PRs quickly with minimal prompts.

**Usage:**
```bash
pnpm run pr:quick
# or
./scripts/quick-pr.sh "PR Title" "Brief description"
```

**Examples:**
```bash
# Interactive mode
pnpm run pr:quick

# With arguments
pnpm run pr:quick "feat: Add todo migration" "Implements unified todo system"

# Just title
pnpm run pr:quick "fix: Resolve authentication issue"
```

**Features:**
- Minimal prompts
- Auto-generates change list from commits
- Includes standard test plan checklist
- Quick and simple

## PR Best Practices

1. **Commit First**: Make sure all your changes are committed before creating a PR
2. **Branch Naming**: Use descriptive branch names like:
   - `feat/todo-system`
   - `fix/auth-issue`
   - `refactor/braindump-performance`
3. **PR Titles**: Follow conventional commit format:
   - `feat: Add new feature`
   - `fix: Resolve bug`
   - `docs: Update README`
   - `refactor: Improve code structure`
4. **Small PRs**: Keep PRs focused on a single feature or fix

## Troubleshooting

### "gh: command not found"
Install GitHub CLI from https://cli.github.com/

### "Not authenticated"
Run `gh auth login` and follow the prompts

### "Failed to push branch"
Make sure you have push permissions to the repository

### Script permission denied
Make scripts executable:
```bash
chmod +x scripts/create-pr.js
chmod +x scripts/quick-pr.sh
```