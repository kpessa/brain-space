# Brain Space 🧠

A modern PWA-first personal knowledge management system built with React, TypeScript, and Tailwind CSS.

## Features

- **Modern Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS
- **Component Library**: Custom components with Storybook for visualization
- **Rapid Development**: ESLint configured for fast iteration
- **Beautiful Design**: Custom Brain Space color palette and smooth animations
- **PWA Ready**: Set up for offline-first progressive web app features

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Start Storybook
pnpm run storybook
```

## Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run storybook` - Start Storybook for component development
- `pnpm run lint` - Run ESLint
- `pnpm run lint:fix` - Fix ESLint errors
- `pnpm run format` - Format code with Prettier
- `pnpm run type-check` - Run TypeScript type checking

## Project Structure

```
brain-space/
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/          # Utilities and helpers
│   ├── pages/        # Page components
│   ├── store/        # State management (Zustand)
│   ├── styles/       # Global styles
│   └── types/        # TypeScript types
├── public/           # Static assets
├── .storybook/       # Storybook configuration
└── tests/           # Test files
```

## Design System

The app uses a custom color palette inspired by "brain" and "space" themes:

- **Brain colors**: Purple shades for primary actions
- **Space colors**: Blue shades for secondary actions
- **Neutral colors**: Gray scale for UI elements

## Next Steps

- [ ] Install and configure Radix UI for accessible components
- [ ] Set up Zustand for state management
- [ ] Configure React Query for server state
- [ ] Implement PWA features (manifest, service worker)
- [ ] Set up TypeScript path aliases
- [ ] Add Supabase integration

## License

MIT