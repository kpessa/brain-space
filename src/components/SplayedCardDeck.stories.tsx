import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { SplayedCardDeck } from './SplayedCardDeck'
import { TimeboxCardDeck } from './TimeboxCardDeck'
import type { HierarchyNode } from '@/lib/hierarchyUtils'

const meta = {
  title: 'Components/SplayedCardDeck',
  component: SplayedCardDeck,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SplayedCardDeck>

export default meta
type Story = StoryObj<typeof meta>

// Sample hierarchical data
const createSampleNode = (
  id: string,
  label: string,
  children: HierarchyNode[] = []
): HierarchyNode => ({
  id,
  type: 'thought',
  position: { x: 0, y: 0 },
  data: {
    label,
    taskStatus: 'pending',
    category: 'tasks',
    importance: 8,
    urgency: 7,
  },
  children,
  depth: 0,
  isExpanded: false,
  hasChildren: children.length > 0,
})

const sampleHierarchy: HierarchyNode = {
  ...createSampleNode('1', 'Plan project architecture'),
  children: [
    createSampleNode('2', 'Design database schema', [
      createSampleNode('3', 'Define user tables'),
      createSampleNode('4', 'Define relationship tables'),
    ]),
    createSampleNode('5', 'Set up API endpoints', [
      createSampleNode('6', 'Authentication endpoints'),
      createSampleNode('7', 'User management endpoints'),
      createSampleNode('8', 'Data endpoints'),
    ]),
    createSampleNode('9', 'Create UI components'),
  ],
}

export const Default: Story = {
  args: {
    node: sampleHierarchy,
    isSelected: false,
  },
}

export const WithTimeboxWrapper: Story = {
  render: args => {
    const [selectedNodeId, setSelectedNodeId] = React.useState<string>('5') // Pre-select a child node
    const [focusedNodeId, setFocusedNodeId] = React.useState<string | undefined>(undefined)

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Click the Layers button to splay out the cards. The selected card (ID: {selectedNodeId})
          will be prominently displayed.
        </p>
        <TimeboxCardDeck
          {...args}
          selectedNodeId={selectedNodeId}
          focusedNodeId={focusedNodeId}
          onNodeSelect={id => {
            console.log('Selected:', id)
            setSelectedNodeId(id)
          }}
          onNodeFocus={id => {
            console.log('Focused:', id)
            setFocusedNodeId(id)
          }}
        />
      </div>
    )
  },
  args: {
    node: sampleHierarchy,
  },
}

export const MultipleDecks: Story = {
  render: () => {
    const nodes = [
      {
        ...createSampleNode('task1', 'Write documentation'),
        children: [
          createSampleNode('task1-1', 'API documentation'),
          createSampleNode('task1-2', 'User guide'),
          createSampleNode('task1-3', 'Developer guide'),
        ],
      },
      {
        ...createSampleNode('task2', 'Testing suite'),
        children: [
          createSampleNode('task2-1', 'Unit tests'),
          createSampleNode('task2-2', 'Integration tests'),
        ],
      },
      createSampleNode('task3', 'Deploy to production'),
    ]

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Multiple Card Decks</h3>
        <p className="text-sm text-gray-600">
          Each parent task with children can be splayed independently
        </p>
        {nodes.map(node => (
          <TimeboxCardDeck
            key={node.id}
            node={node}
            onNodeSelect={id => console.log('Selected:', id)}
            onNodeFocus={id => console.log('Focused:', id)}
          />
        ))}
      </div>
    )
  },
}

export const DeepHierarchy: Story = {
  render: () => {
    const deepNode: HierarchyNode = {
      ...createSampleNode('root', 'Epic: User Authentication'),
      children: [
        {
          ...createSampleNode('feat1', 'Feature: Login System'),
          children: [
            {
              ...createSampleNode('task1', 'Task: Create login form'),
              children: [
                createSampleNode('sub1', 'Design form UI'),
                createSampleNode('sub2', 'Add validation'),
                createSampleNode('sub3', 'Connect to API'),
              ],
            },
            createSampleNode('task2', 'Task: Implement JWT'),
          ],
        },
        {
          ...createSampleNode('feat2', 'Feature: Password Reset'),
          children: [
            createSampleNode('task3', 'Send reset email'),
            createSampleNode('task4', 'Reset form'),
          ],
        },
      ],
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Deep Hierarchy Example</h3>
        <p className="text-sm text-gray-600">
          This shows how the splay feature works with deeply nested tasks
        </p>
        <TimeboxCardDeck node={deepNode} onNodeSelect={id => console.log('Selected:', id)} />
      </div>
    )
  },
}
