import type { Meta, StoryObj } from '@storybook/react-vite'
import { LevelDisplay } from './LevelDisplay'

const meta = {
  title: 'Gamification/LevelDisplay',
  component: LevelDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    level: { control: { type: 'select', options: [1, 2, 3, 4, 5] } },
    size: { control: { type: 'select', options: ['sm', 'md', 'lg'] } },
    showTitle: { control: 'boolean' },
  },
} satisfies Meta<typeof LevelDisplay>

export default meta
type Story = StoryObj<typeof meta>

export const Novice: Story = {
  args: {
    level: 1,
    showTitle: true,
    size: 'md',
  },
}

export const BraveWanderer: Story = {
  args: {
    level: 2,
    showTitle: true,
    size: 'md',
  },
}

export const LegendaryHero: Story = {
  args: {
    level: 5,
    showTitle: true,
    size: 'md',
  },
}

export const CompactDisplay: Story = {
  args: {
    level: 3,
    showTitle: false,
    size: 'sm',
  },
}

export const LargeDisplay: Story = {
  args: {
    level: 4,
    showTitle: true,
    size: 'lg',
  },
}
