# Brain Space - Project Preferences

## Development Philosophy
- **Rapid Development First** - Prioritize fast iteration and developer experience
- **Visual Component Development** - Use Storybook to visualize all components
- **Modern PWA Architecture** - Build for offline-first, installable web apps

## Technical Preferences

### Logging / Debugging / Troubleshooting
- When trying to troubleshoot a problem in a webapp, i prefer to have a logging service, that I can easily download the logs with a shortcut key, CTRL+SHIFT+L, and then reference to agent after to make progress instead of the agent trying to open a development server.
- After making progress, want to clean up log statements to keep webapp clean and only focusing on issue currently.

### CLI Tools
- I want to always use the CLI tools to develop.  If they do not work because they require user input, I would like claude code to prompt me to use the CLI tool.

### Refactoring
- Always look for opportunities to refactor and make code cleaner and more maintainable.  If a file becomes greater than a few hundred lines, look into refactoring and offer a solution if available.

### Package Management
- **pnpm** - Default package manager (not npm or yarn)

### Code Quality
- **ESLint** - Configured for rapid development with lenient rules:
  - Warnings instead of errors for most rules
  - Allow `any` types with warnings
  - Allow console.log with warnings
  - Unused variables as warnings
- **Prettier** - Auto-format on save with:
  - Single quotes
  - No semicolons
  - 2-space indentation
  - 100 character line width

### Testing & Quality Commands
```bash
pnpm run lint:fix      # Auto-fix linting issues
pnpm run format        # Format code with Prettier
pnpm run type-check    # TypeScript type checking
```

## Tech Stack

### Core
- **React 18** with TypeScript
- **Vite** for lightning-fast development
- **Tailwind CSS** with custom Brain Space design system
- **Storybook** for component visualization

### Design System
- **Colors**: Custom brain (purple) and space (blue) palettes
- **Typography**: Inter font family
- **Components**: Tailwind-based with class-variance-authority
- **Animations**: Smooth transitions with custom keyframes

### State & Data (Planned)
- **Zustand** for lightweight state management
- **React Query (TanStack Query)** for server state
- **Supabase** for backend services

### UI Components (Planned)
- **Radix UI** for accessible, unstyled components
- Custom components built on top of Radix primitives

## Project Structure
```
brain-space/
├── src/
│   ├── components/     # Reusable UI components with .stories.tsx files
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities (cn function, etc.)
│   ├── pages/         # Page components
│   ├── store/         # Zustand stores
│   └── types/         # TypeScript types
├── .storybook/        # Storybook configuration
└── public/            # Static assets, PWA manifest
```

## Key Features to Implement
1. **PWA Support** - Manifest, service worker, offline functionality
2. **TypeScript Path Aliases** - @/components, @/hooks, @/lib
3. **Dark Mode** - Already set up in CSS variables
4. **Authentication** - Via Supabase
5. **Real-time Sync** - For collaborative features

## Development Workflow
1. Create component in `src/components/`
2. Add Storybook story in `ComponentName.stories.tsx`
3. Use Tailwind classes with custom design tokens
4. Run `pnpm run storybook` to develop visually
5. Keep components pure and composable

## Important Notes
- Always use **pnpm** instead of npm/yarn
- Prefer editing existing files over creating new ones
- ESLint is intentionally lenient for rapid prototyping
- All components should have corresponding Storybook stories
- Use the custom `cn()` utility for merging Tailwind classes