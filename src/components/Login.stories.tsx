import type { Meta, StoryObj } from '@storybook/react-vite'
import { Login } from './Login'
import { AuthProvider } from '@/contexts/AuthContext'

const meta = {
  title: 'Components/Login',
  component: Login,
  decorators: [
    Story => (
      <AuthProvider>
        <Story />
      </AuthProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Login>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
