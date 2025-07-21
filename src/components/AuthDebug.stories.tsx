import type { Meta, StoryObj } from '@storybook/react-vite'
import { AuthDebug } from './AuthDebug'

const meta = {
  title: 'Components/AuthDebug',
  component: AuthDebug,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof AuthDebug>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
