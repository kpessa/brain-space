import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div className="min-h-screen bg-background p-4">
        <Story />
      </div>
    ),
  ],
}

export default preview
