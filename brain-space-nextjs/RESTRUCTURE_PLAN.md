# Restructuring Plan: Remove Route Groups

## Current Issue
- Route groups `(dashboard)` with layout.tsx and page.tsx cause Vercel deployment issues
- Community reports that having these files in route groups causes problems

## Solution: Flatten Structure + Dashboard Wrapper Component

### Step 1: Create DashboardWrapper Component ✅
- Created `/components/DashboardWrapper.tsx` with all dashboard layout logic
- This component handles auth, navigation, sidebar, etc.

### Step 2: Move All Routes to Root Level
Move from:
```
app/
  (dashboard)/
    layout.tsx ❌
    page.tsx ❌
    journal/page.tsx
    todos/page.tsx
    ...
```

To:
```
app/
  journal/page.tsx        # Wraps content in <DashboardWrapper>
  todos/page.tsx          # Wraps content in <DashboardWrapper>
  braindump/page.tsx      # Wraps content in <DashboardWrapper>
  matrix/page.tsx         # Wraps content in <DashboardWrapper>
  ...
```

### Step 3: Update Each Page
Each dashboard page needs to:
1. Import `DashboardWrapper`
2. Wrap its content with `<DashboardWrapper>`
3. Remove any duplicate auth checks (DashboardWrapper handles this)

Example:
```tsx
import { DashboardWrapper } from '@/components/DashboardWrapper'

export default function JournalPage() {
  return (
    <DashboardWrapper>
      {/* Page content here */}
    </DashboardWrapper>
  )
}
```

### Step 4: Clean Up
- Remove `app/(dashboard)/layout.tsx`
- Remove route group folder entirely
- Ensure all navigation links already point to clean URLs (/journal, /todos, etc.)

## Benefits
- No route groups = No Vercel deployment issues
- Clean URLs maintained (/journal instead of /dashboard/journal)
- Shared layout logic in one reusable component
- Each page explicitly declares it needs the dashboard wrapper

## Migration Commands
```bash
# Move all pages to root
mv app/\(dashboard\)/journal app/
mv app/\(dashboard\)/todos app/
mv app/\(dashboard\)/braindump app/
# ... etc for all routes

# Remove route group
rm -rf app/\(dashboard\)

# Update imports in each page to use DashboardWrapper
```