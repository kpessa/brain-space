#!/usr/bin/env node

/**
 * Custom script to create a pull request
 * Usage: node scripts/create-pr.js
 */

const { execSync } = require('child_process');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Helper to execute commands
function exec(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', ...options }).trim();
  } catch (error) {
    if (!options.silent) {
      console.error(`${colors.red}Error executing: ${cmd}${colors.reset}`);
      console.error(error.message);
    }
    return null;
  }
}

// Helper to ask questions
function question(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${prompt}${colors.reset} `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Check if gh CLI is installed
function checkGHCLI() {
  const ghVersion = exec('gh --version', { silent: true });
  if (!ghVersion) {
    console.error(`${colors.red}Error: GitHub CLI (gh) is not installed.${colors.reset}`);
    console.log(`Please install it from: ${colors.blue}https://cli.github.com/${colors.reset}`);
    process.exit(1);
  }
  return true;
}

// Get current branch
function getCurrentBranch() {
  return exec('git branch --show-current');
}

// Get default branch
function getDefaultBranch() {
  // Try to get from remote
  let defaultBranch = exec('git symbolic-ref refs/remotes/origin/HEAD', { silent: true });
  if (defaultBranch) {
    return defaultBranch.replace('refs/remotes/origin/', '');
  }
  
  // Fallback to common defaults
  const branches = exec('git branch -r', { silent: true });
  if (branches) {
    if (branches.includes('origin/main')) return 'main';
    if (branches.includes('origin/master')) return 'master';
  }
  
  return 'main'; // Default fallback
}

// Check for uncommitted changes
function checkUncommittedChanges() {
  const status = exec('git status --porcelain');
  if (status) {
    console.log(`${colors.yellow}You have uncommitted changes:${colors.reset}`);
    console.log(status);
    return true;
  }
  return false;
}

// Get recent commits
function getRecentCommits(baseBranch) {
  const commits = exec(`git log ${baseBranch}..HEAD --pretty=format:"%h %s" --reverse`);
  return commits ? commits.split('\n') : [];
}

// Main function
async function main() {
  console.log(`${colors.bright}${colors.blue}🚀 Create Pull Request Script${colors.reset}\n`);
  
  // Check prerequisites
  checkGHCLI();
  
  // Get branch info
  const currentBranch = getCurrentBranch();
  const defaultBranch = getDefaultBranch();
  
  console.log(`${colors.green}Current branch:${colors.reset} ${currentBranch}`);
  console.log(`${colors.green}Default branch:${colors.reset} ${defaultBranch}\n`);
  
  // Check if on default branch
  if (currentBranch === defaultBranch) {
    console.error(`${colors.red}Error: You're on the default branch (${defaultBranch}).${colors.reset}`);
    console.log('Please create and switch to a feature branch first.');
    process.exit(1);
  }
  
  // Check for uncommitted changes
  if (checkUncommittedChanges()) {
    const proceed = await question('\nDo you want to commit these changes first? (y/n)');
    if (proceed.toLowerCase() === 'y') {
      console.log(`\n${colors.yellow}Please commit your changes and run this script again.${colors.reset}`);
      console.log(`You can use: ${colors.cyan}git add . && git commit -m "your message"${colors.reset}`);
      process.exit(0);
    }
  }
  
  // Get commits that will be in the PR
  const commits = getRecentCommits(defaultBranch);
  if (commits.length === 0) {
    console.log(`${colors.yellow}No commits found between ${defaultBranch} and ${currentBranch}.${colors.reset}`);
    const proceed = await question('Continue anyway? (y/n)');
    if (proceed.toLowerCase() !== 'y') {
      process.exit(0);
    }
  } else {
    console.log(`${colors.green}Commits to be included in PR:${colors.reset}`);
    commits.forEach(commit => console.log(`  ${commit}`));
    console.log();
  }
  
  // Check if branch is pushed to remote
  const remoteBranch = exec(`git ls-remote --heads origin ${currentBranch}`, { silent: true });
  if (!remoteBranch) {
    console.log(`${colors.yellow}Branch not pushed to remote. Pushing now...${colors.reset}`);
    const pushResult = exec(`git push -u origin ${currentBranch}`);
    if (!pushResult && pushResult !== '') {
      console.error(`${colors.red}Failed to push branch to remote.${colors.reset}`);
      process.exit(1);
    }
    console.log(`${colors.green}✓ Branch pushed successfully${colors.reset}\n`);
  }
  
  // Get PR details
  console.log(`${colors.bright}Enter PR details:${colors.reset}`);
  const title = await question('PR Title:');
  if (!title.trim()) {
    console.error(`${colors.red}Error: PR title is required.${colors.reset}`);
    process.exit(1);
  }
  
  // Ask for PR type
  console.log(`\n${colors.cyan}PR Type:${colors.reset}`);
  console.log('1. Feature');
  console.log('2. Bug Fix');
  console.log('3. Refactor');
  console.log('4. Documentation');
  console.log('5. Other');
  const typeChoice = await question('Select type (1-5):');
  
  const prTypes = {
    '1': 'feat',
    '2': 'fix',
    '3': 'refactor',
    '4': 'docs',
    '5': 'other'
  };
  const prType = prTypes[typeChoice] || 'other';
  
  // Build PR body
  console.log(`\n${colors.cyan}Creating PR body...${colors.reset}`);
  
  let body = '## Summary\n\n';
  
  // Add type-specific prompts
  if (prType === 'feat') {
    const feature = await question('Briefly describe the new feature:');
    body += `This PR adds: ${feature}\n\n`;
  } else if (prType === 'fix') {
    const issue = await question('What issue does this fix?');
    body += `This PR fixes: ${issue}\n\n`;
  } else if (prType === 'refactor') {
    const refactor = await question('What was refactored?');
    body += `This PR refactors: ${refactor}\n\n`;
  }
  
  // Add changes section
  body += '## Changes\n\n';
  console.log('List the main changes (press Enter twice to finish):');
  let change;
  while ((change = await question('- ')) !== '') {
    body += `- ${change}\n`;
  }
  body += '\n';
  
  // Add testing section
  const needsTesting = await question('Does this PR need testing? (y/n)');
  if (needsTesting.toLowerCase() === 'y') {
    body += '## Testing\n\n';
    const testInstructions = await question('How should this be tested? ');
    body += `${testInstructions}\n\n`;
  }
  
  // Add notes section
  const hasNotes = await question('Any additional notes? (y/n)');
  if (hasNotes.toLowerCase() === 'y') {
    body += '## Notes\n\n';
    const notes = await question('Enter notes: ');
    body += `${notes}\n\n`;
  }
  
  // Add auto-generated footer
  body += '---\n';
  body += `🤖 Generated with create-pr script\n`;
  
  // Create the PR
  console.log(`\n${colors.cyan}Creating pull request...${colors.reset}`);
  
  const prCmd = `gh pr create --title "${title}" --body "${body.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" --base ${defaultBranch}`;
  
  const prUrl = exec(prCmd);
  if (prUrl) {
    console.log(`\n${colors.green}✅ Pull request created successfully!${colors.reset}`);
    console.log(`${colors.blue}PR URL: ${prUrl}${colors.reset}`);
    
    // Ask if user wants to open in browser
    const openPR = await question('\nOpen PR in browser? (y/n)');
    if (openPR.toLowerCase() === 'y') {
      exec(`gh pr view --web`);
    }
  } else {
    console.error(`\n${colors.red}Failed to create pull request.${colors.reset}`);
    console.log('You can try creating it manually with:');
    console.log(`${colors.cyan}gh pr create${colors.reset}`);
  }
}

// Run the script
main().catch((error) => {
  console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
  process.exit(1);
});