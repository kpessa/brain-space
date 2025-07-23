import type { Meta, StoryObj } from '@storybook/react'
import { GoogleCalendarTest } from './GoogleCalendarTest'

const meta = {
  title: 'Integrations/GoogleCalendarTest',
  component: GoogleCalendarTest,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof GoogleCalendarTest>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}