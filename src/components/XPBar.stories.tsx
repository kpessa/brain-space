import type { Meta, StoryObj } from '@storybook/react-vite'
import { XPBar } from './XPBar'

const meta = {
  title: 'Gamification/XPBar',
  component: XPBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    currentXP: { control: { type: 'range', min: 0, max: 100, step: 5 } },
    maxXP: { control: { type: 'number' } },
    level: { control: { type: 'number', min: 1, max: 5 } },
  },
} satisfies Meta<typeof XPBar>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    currentXP: 0,
    maxXP: 100,
    level: 1,
  },
}

export const PartiallyFilled: Story = {
  args: {
    currentXP: 45,
    maxXP: 100,
    level: 1,
  },
}

export const AlmostComplete: Story = {
  args: {
    currentXP: 90,
    maxXP: 100,
    level: 1,
  },
}

export const HighLevel: Story = {
  args: {
    currentXP: 750,
    maxXP: 1000,
    level: 4,
  },
}

export const MaxLevel: Story = {
  args: {
    currentXP: 2500,
    maxXP: 5000,
    level: 5,
  },
}
