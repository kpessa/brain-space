#!/bin/bash

# Quick PR creation script
# Usage: ./scripts/quick-pr.sh "PR Title" "Brief description"

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")

echo -e "${BLUE}Creating PR from ${YELLOW}$CURRENT_BRANCH${BLUE} to ${YELLOW}$DEFAULT_BRANCH${NC}\n"

# Check if we're on the default branch
if [ "$CURRENT_BRANCH" = "$DEFAULT_BRANCH" ]; then
    echo -e "${RED}Error: You're on the default branch ($DEFAULT_BRANCH).${NC}"
    echo "Please create and switch to a feature branch first."
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}You have uncommitted changes:${NC}"
    git status -s
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Push branch if needed
if ! git ls-remote --heads origin "$CURRENT_BRANCH" | grep -q .; then
    echo -e "${YELLOW}Pushing branch to remote...${NC}"
    git push -u origin "$CURRENT_BRANCH"
fi

# Get PR title from argument or prompt
if [ -z "$1" ]; then
    read -p "PR Title: " PR_TITLE
else
    PR_TITLE="$1"
fi

if [ -z "$PR_TITLE" ]; then
    echo -e "${RED}Error: PR title is required.${NC}"
    exit 1
fi

# Get description from argument or prompt
if [ -z "$2" ]; then
    read -p "Brief description (optional): " PR_DESC
else
    PR_DESC="$2"
fi

# Get commits since base branch
COMMITS=$(git log $DEFAULT_BRANCH..HEAD --pretty=format:"- %s" --reverse)

# Build PR body
PR_BODY="## Summary

${PR_DESC:-This PR includes the changes listed below.}

## Changes

$COMMITS

## Test Plan

- [ ] Tested locally
- [ ] All tests pass
- [ ] No console errors

---
🤖 Generated with quick-pr script"

# Create the PR
echo -e "\n${BLUE}Creating pull request...${NC}"

PR_URL=$(gh pr create \
    --title "$PR_TITLE" \
    --body "$PR_BODY" \
    --base "$DEFAULT_BRANCH" \
    2>&1)

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Pull request created successfully!${NC}"
    echo -e "${BLUE}PR URL: $PR_URL${NC}"
    
    # Ask to open in browser
    read -p "Open in browser? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gh pr view --web
    fi
else
    echo -e "\n${RED}Failed to create pull request.${NC}"
    echo "Error: $PR_URL"
    echo "You can try manually with: gh pr create"
    exit 1
fi