# Claude Code Slash Commands

This directory contains custom slash commands for Claude Code to help with common development tasks.

## Available Commands

### `/pr` - Create Pull Request
Creates a pull request for the current branch with proper formatting and all necessary details.

**Usage:** Type `/pr` in Claude Code

**Features:**
- Checks git status and branch
- Lists commits to be included
- Guides through PR creation
- Formats PR body with summary, changes, and test plan
- Uses GitHub CLI to create the PR

### `/review` - Review Pull Request
Performs a thorough code review of a pull request.

**Usage:** Type `/review` in Claude Code

**Features:**
- Fetches PR details and changes
- Reviews code for quality, logic, and security
- Runs local checks (linting, type checking)
- Provides structured feedback
- Submits review with approve/comment/request changes

### `/merge` - Merge Pull Request
Safely merges a pull request with proper checks.

**Usage:** Type `/merge` in Claude Code

**Features:**
- Verifies CI status and approvals
- Checks for merge conflicts
- Offers merge strategies (merge, squash, rebase)
- Helps craft merge commit messages
- Handles post-merge cleanup

### `/commit` - Create Git Commit
Helps create well-formatted git commits following conventional commit standards.

**Usage:** Type `/commit` in Claude Code

**Features:**
- Shows current changes
- Helps stage files
- Formats commit message properly
- Adds co-author attribution
- Follows conventional commit format

## How to Use Slash Commands

1. In Claude Code, simply type the slash command (e.g., `/pr`)
2. Claude will read the instructions from the corresponding `.md` file
3. Follow the interactive prompts to complete the task

## Adding New Commands

To create a new slash command:

1. Create a new `.md` file in this directory
2. Name it after your command (e.g., `deploy.md` for `/deploy`)
3. Write clear instructions for Claude to follow
4. The command will be available immediately

## Command Structure

Each command file should:
- Start with a clear title
- List step-by-step instructions
- Include examples where helpful
- Handle error cases
- Be conversational and user-friendly

## GitHub CLI Required

All PR-related commands (`/pr`, `/review`, `/merge`) require the GitHub CLI to be installed and authenticated:

```bash
# Install GitHub CLI
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Windows
scoop install gh
# or
choco install gh

# Authenticate
gh auth login
```

## Tips

- Keep commands focused on a single task
- Make them interactive and guide the user
- Include validation and error handling
- Provide clear feedback at each step
- Add examples to clarify usage