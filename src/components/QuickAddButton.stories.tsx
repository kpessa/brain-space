import type { Meta, StoryObj } from '@storybook/react'
import { QuickAddButton } from './QuickAddButton'
import { BrowserRouter } from 'react-router-dom'

const meta: Meta<typeof QuickAddButton> = {
  title: 'Components/QuickAddButton',
  component: QuickAddButton,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <BrowserRouter>
        <div className="h-screen bg-gray-100 dark:bg-gray-900 relative">
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Sample Page Content</h1>
            <p className="text-gray-600 dark:text-gray-400">
              The Quick Add button should appear as a floating action button in the bottom right
              corner.
            </p>
          </div>
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithCustomClass: Story = {
  args: {
    className: 'bg-red-500 hover:bg-red-600',
  },
}

export const ContextExamples: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-2">Brain Dump Context</h2>
        <p className="text-sm text-gray-600 mb-4">
          Navigate to /braindump to see context-aware defaults for brain dump creation.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Matrix Context</h2>
        <p className="text-sm text-gray-600 mb-4">
          Navigate to /matrix to see high priority defaults for quick task capture.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Timebox Context</h2>
        <p className="text-sm text-gray-600 mb-4">
          Navigate to /timebox to see scheduled task defaults with date/time.
        </p>
      </div>

      <QuickAddButton />
    </div>
  ),
}
