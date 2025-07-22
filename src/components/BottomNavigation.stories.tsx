import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import BottomNavigation from './BottomNavigation'

const meta = {
  title: 'Components/BottomNavigation',
  component: BottomNavigation,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Mobile View</h1>
            <p className="text-gray-600 dark:text-gray-400">
              The bottom navigation only appears on mobile devices (screens smaller than sm breakpoint).
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Resize your browser window or use the viewport controls to see the navigation.
            </p>
          </div>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof BottomNavigation>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const HomeActive: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
          <div className="p-4">
            <h1 className="text-2xl font-bold">Home Page</h1>
          </div>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
}

export const JournalActive: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/journal']}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
          <div className="p-4">
            <h1 className="text-2xl font-bold">Journal Page</h1>
          </div>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
}

export const BrainDumpActive: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/braindump']}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
          <div className="p-4">
            <h1 className="text-2xl font-bold">Brain Dump Page</h1>
          </div>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
}

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="min-h-screen bg-gray-900 relative dark">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-white">Dark Mode</h1>
            <p className="text-gray-400">Bottom navigation in dark mode</p>
          </div>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
}