import type { Meta, StoryObj } from '@storybook/react-vite'
import { SupabaseTest } from './SupabaseTest'

const meta = {
  title: 'Components/SupabaseTest',
  component: SupabaseTest,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SupabaseTest>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
