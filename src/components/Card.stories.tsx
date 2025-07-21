import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card'
import { Button } from './Button'

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Brain Space</CardTitle>
        <CardDescription>Your personal knowledge management system</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Organize your thoughts, ideas, and knowledge in one beautiful space.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Get Started</Button>
      </CardFooter>
    </Card>
  ),
}

export const SimpleCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Simple Card</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This is a simple card with minimal content.</p>
      </CardContent>
    </Card>
  ),
}

export const TaskCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Today's Tasks</CardTitle>
        <CardDescription>You have 3 tasks remaining</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span>Review project documentation</span>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span>Update component library</span>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span>Write unit tests</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
}

export const GradientCard: Story = {
  render: () => (
    <Card className="w-[350px] bg-gradient-to-br from-brain-50 to-space-50 border-brain-200">
      <CardHeader>
        <CardTitle className="text-brain-700">Premium Features</CardTitle>
        <CardDescription className="text-brain-600">
          Unlock the full potential of Brain Space
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-brain-700">
          <li>✓ Unlimited storage</li>
          <li>✓ Advanced AI features</li>
          <li>✓ Priority support</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="primary">
          Upgrade Now
        </Button>
      </CardFooter>
    </Card>
  ),
}
