import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { HierarchicalCard } from './HierarchicalCard'
import { SplayedCardDeck } from './SplayedCardDeck'
import { TimeboxCardDeck } from './TimeboxCardDeck'
import type { HierarchyNode } from '@/lib/hierarchyUtils'
import { buildHierarchy } from '@/lib/hierarchyUtils'
import { cn } from '@/lib/utils'

// Mock data for different hierarchy scenarios
const createMockNode = (
  id: string,
  label: string,
  options: {
    importance?: number
    urgency?: number
    status?: string
    taskStatus?: string
    taskType?: string
    currentStreak?: number
    category?: string
    depth?: number
    children?: HierarchyNode[]
    isExpanded?: boolean
    hasChildren?: boolean
    dueDate?: string
    attempts?: any[]
  } = {}
): HierarchyNode => ({
  id,
  type: 'thought',
  position: { x: 0, y: 0 },
  data: {
    label,
    importance: options.importance ?? 5,
    urgency: options.urgency ?? 5,
    status: options.status ?? 'pending',
    taskStatus: options.taskStatus,
    taskType: options.taskType,
    currentStreak: options.currentStreak,
    category: options.category,
    dueDate: options.dueDate,
    attempts: options.attempts,
  },
  children: options.children ?? [],
  depth: options.depth ?? 0,
  isExpanded: options.isExpanded ?? true,
  hasChildren: options.hasChildren ?? (options.children?.length ?? 0) > 0,
  parentNode: undefined,
})

// Helper to build proper hierarchy with ancestors
const buildTestHierarchy = (nodes: HierarchyNode[]) => {
  // Convert to BrainDumpNode format for buildHierarchy
  const brainDumpNodes = nodes.map(n => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
  }))

  // Build edges from parent-child relationships
  const edges: any[] = []
  nodes.forEach(parent => {
    if (parent.children) {
      parent.children.forEach(child => {
        edges.push({ source: parent.id, target: child.id })
      })
    }
  })

  // Build hierarchy with ancestors populated
  return buildHierarchy(brainDumpNodes, edges, new Set(['parent', 'root']))
}

// Create hierarchical test data
const singleTask = createMockNode('1', 'Complete project proposal', {
  importance: 8,
  urgency: 9,
  category: 'Work',
  dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
})

const taskWithSubtasks = createMockNode('parent', 'Launch new feature', {
  importance: 9,
  urgency: 7,
  category: 'Product',
  children: [
    createMockNode('child1', 'Design mockups', {
      depth: 1,
      importance: 7,
      urgency: 8,
      status: 'completed',
    }),
    createMockNode('child2', 'Implement backend API', {
      depth: 1,
      importance: 8,
      urgency: 6,
      status: 'in-progress',
      attempts: [
        { id: '1', outcome: 'partial' },
        { id: '2', outcome: 'blocked' },
      ],
    }),
    createMockNode('child3', 'Write tests', {
      depth: 1,
      importance: 6,
      urgency: 5,
    }),
  ],
  isExpanded: true,
  hasChildren: true,
})

// Stack effect examples with different depths
const smallStack = createMockNode('small-stack', 'Task with small stack', {
  importance: 6,
  urgency: 7,
  children: [
    createMockNode('child1', 'Subtask 1', { depth: 1 }),
    createMockNode('child2', 'Subtask 2', { depth: 1 }),
  ],
  isExpanded: false,
  hasChildren: true,
})

const mediumStack = createMockNode('medium-stack', 'Task with medium stack', {
  importance: 7,
  urgency: 6,
  children: [
    createMockNode('child1', 'Subtask 1', { depth: 1 }),
    createMockNode('child2', 'Subtask 2', { depth: 1 }),
    createMockNode('child3', 'Subtask 3', { depth: 1 }),
    createMockNode('child4', 'Subtask 4', { depth: 1 }),
  ],
  isExpanded: false,
  hasChildren: true,
})

const largeStack = createMockNode('large-stack', 'Task with large stack', {
  importance: 8,
  urgency: 8,
  children: Array.from({ length: 8 }, (_, i) =>
    createMockNode(`child${i + 1}`, `Subtask ${i + 1}`, { depth: 1 })
  ),
  isExpanded: false,
  hasChildren: true,
})

const deepHierarchy = createMockNode('root', 'Organize company retreat', {
  importance: 6,
  urgency: 4,
  category: 'Events',
  children: [
    createMockNode('venue', 'Book venue', {
      depth: 1,
      importance: 8,
      urgency: 7,
      children: [
        createMockNode('research', 'Research locations', {
          depth: 2,
          importance: 6,
          urgency: 8,
          status: 'completed',
        }),
        createMockNode('visits', 'Schedule site visits', {
          depth: 2,
          importance: 7,
          urgency: 6,
          children: [
            createMockNode('call1', 'Call Mountain Lodge', {
              depth: 3,
              importance: 5,
              urgency: 7,
            }),
            createMockNode('call2', 'Call Beach Resort', {
              depth: 3,
              importance: 5,
              urgency: 7,
            }),
          ],
          hasChildren: true,
        }),
      ],
      hasChildren: true,
      isExpanded: true,
    }),
    createMockNode('catering', 'Arrange catering', {
      depth: 1,
      importance: 7,
      urgency: 3,
    }),
  ],
  hasChildren: true,
  isExpanded: true,
})

const meta = {
  title: 'Components/HierarchicalCard',
  component: HierarchicalCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The HierarchicalCard displays tasks with parent-child relationships in a collapsible card format.
It supports multiple states, priority indicators, progress tracking, and hierarchy navigation.

Key features:
- Hierarchical display with depth-based indentation
- Expand/collapse functionality
- Priority-based color coding (Eisenhower Matrix)
- Progress tracking for parent tasks
- Drag and drop support
- Context menu integration
- Ancestor breadcrumb when focused
        `,
      },
    },
  },
  argTypes: {
    node: {
      description: 'The hierarchy node data to display',
    },
    isSelected: {
      control: 'boolean',
      description: 'Whether the card is selected',
    },
    isFocused: {
      control: 'boolean',
      description: 'Whether the card is focused (shows ancestor breadcrumb)',
    },
    showHierarchy: {
      control: 'boolean',
      description: 'Whether to show hierarchy indicators and indentation',
    },
    draggable: {
      control: 'boolean',
      description: 'Whether the card can be dragged',
    },
    onToggleExpand: {
      action: 'expand-toggled',
      description: 'Called when expand/collapse button is clicked',
    },
    onSelect: {
      action: 'selected',
      description: 'Called when card is clicked',
    },
    onContextMenu: {
      action: 'context-menu',
      description: 'Called when right-clicked',
    },
    onStatusToggle: {
      action: 'status-toggled',
      description: 'Called when completion checkbox is clicked',
    },
  },
} satisfies Meta<typeof HierarchicalCard>

export default meta
type Story = StoryObj<typeof meta>

// Basic states
export const Default: Story = {
  args: {
    node: singleTask,
    showHierarchy: true,
  },
}

export const Selected: Story = {
  args: {
    node: singleTask,
    isSelected: true,
    showHierarchy: true,
  },
}

export const Focused: Story = {
  args: {
    node: taskWithSubtasks.children[1], // Middle child task
    isFocused: true,
    showHierarchy: true,
  },
}

export const Completed: Story = {
  args: {
    node: createMockNode('completed', 'Completed task example', {
      status: 'completed',
      importance: 7,
      urgency: 6,
    }),
    showHierarchy: true,
  },
}

export const Draggable: Story = {
  args: {
    node: singleTask,
    draggable: true,
    showHierarchy: true,
  },
}

// Priority variations (Eisenhower Matrix quadrants)
export const DoFirst: Story = {
  args: {
    node: createMockNode('urgent', 'Critical bug fix needed', {
      importance: 9,
      urgency: 9,
      category: 'Bug Fix',
      dueDate: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    }),
    showHierarchy: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '🔥 **Do First** - Important & Urgent tasks that need immediate attention. Shows red priority indicators.',
      },
    },
  },
}

export const Schedule: Story = {
  args: {
    node: createMockNode('schedule', 'Plan Q2 strategy', {
      importance: 8,
      urgency: 3,
      category: 'Strategy',
    }),
    showHierarchy: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '📅 **Schedule** - Important but Not Urgent tasks for strategic planning. Shows blue priority indicators.',
      },
    },
  },
}

export const Delegate: Story = {
  args: {
    node: createMockNode('delegate', 'Update meeting notes', {
      importance: 3,
      urgency: 7,
      category: 'Admin',
    }),
    showHierarchy: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '👥 **Delegate** - Urgent but Not Important tasks that can be delegated. Shows yellow priority indicators.',
      },
    },
  },
}

export const Eliminate: Story = {
  args: {
    node: createMockNode('eliminate', 'Reorganize desk drawer', {
      importance: 2,
      urgency: 2,
      category: 'Personal',
    }),
    showHierarchy: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '🗑️ **Eliminate** - Neither Important nor Urgent tasks to avoid. Shows gray priority indicators.',
      },
    },
  },
}

// Hierarchy examples
export const WithSubtasks: Story = {
  args: {
    node: taskWithSubtasks,
    showHierarchy: true,
  },
}

export const ChildTask: Story = {
  render: args => {
    // Build proper hierarchy to get ancestors
    const nodes = [
      createMockNode('parent', 'Launch new feature', {
        importance: 9,
        urgency: 7,
        category: 'Product',
      }),
      createMockNode('child1', 'Design mockups', {
        depth: 1,
        importance: 7,
        urgency: 8,
        status: 'completed',
      }),
      createMockNode('child2', 'Implement backend API', {
        depth: 1,
        importance: 8,
        urgency: 6,
        status: 'in-progress',
        attempts: [
          { id: '1', outcome: 'partial' },
          { id: '2', outcome: 'blocked' },
        ],
      }),
    ]

    // Set up parent-child relationships
    nodes[0].children = [nodes[1], nodes[2]]

    const hierarchy = buildTestHierarchy(nodes)
    const childNode = hierarchy[0].children[1] // Get the second child with ancestors populated

    return (
      <div>
        <p className="text-sm text-gray-600 mb-4">
          This child task shows its ancestor breadcrumb ("Product / Launch new feature")
        </p>
        <HierarchicalCard {...args} node={childNode} showHierarchy={true} isFocused={true} />
      </div>
    )
  },
}

export const DeepHierarchy: Story = {
  render: args => {
    // Create a deep hierarchy with proper ancestors
    const nodes = [
      createMockNode('root', 'Organize company retreat', {
        importance: 6,
        urgency: 4,
        category: 'Events',
      }),
      createMockNode('venue', 'Book venue', {
        depth: 1,
        importance: 8,
        urgency: 7,
      }),
      createMockNode('research', 'Research locations', {
        depth: 2,
        importance: 6,
        urgency: 8,
        status: 'completed',
      }),
      createMockNode('visits', 'Schedule site visits', {
        depth: 2,
        importance: 7,
        urgency: 6,
      }),
      createMockNode('call1', 'Call Mountain Lodge', {
        depth: 3,
        importance: 5,
        urgency: 7,
      }),
      createMockNode('call2', 'Call Beach Resort', {
        depth: 3,
        importance: 5,
        urgency: 7,
      }),
      createMockNode('catering', 'Arrange catering', {
        depth: 1,
        importance: 7,
        urgency: 3,
      }),
    ]

    // Set up relationships
    nodes[0].children = [nodes[1], nodes[6]] // root -> venue, catering
    nodes[1].children = [nodes[2], nodes[3]] // venue -> research, visits
    nodes[3].children = [nodes[4], nodes[5]] // visits -> call1, call2

    const hierarchy = buildTestHierarchy(nodes)

    return (
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Deep hierarchy with ancestor breadcrumbs at each level
        </p>
        <HierarchicalCard {...args} node={hierarchy[0]} showHierarchy={true} />
      </div>
    )
  },
}

export const CollapsedParent: Story = {
  args: {
    node: {
      ...taskWithSubtasks,
      isExpanded: false,
    },
    showHierarchy: true,
  },
}

// Breadcrumb examples
export const CollapsedWithFocusedChild: Story = {
  args: {
    node: {
      ...taskWithSubtasks,
      isExpanded: false,
    },
    showHierarchy: true,
    focusedChildId: 'child2', // Shows "Implement backend API" in breadcrumb
  },
  parameters: {
    docs: {
      description: {
        story: 'Collapsed parent showing which child is focused via breadcrumb',
      },
    },
  },
}

export const CollapsedWithDifferentFocusedChildren: Story = {
  render: args => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Focused Child Breadcrumb Examples</h3>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">No focused child:</p>
          <HierarchicalCard
            {...args}
            node={{
              ...taskWithSubtasks,
              isExpanded: false,
            }}
          />
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">First child focused:</p>
          <HierarchicalCard
            {...args}
            node={{
              ...taskWithSubtasks,
              isExpanded: false,
            }}
            focusedChildId="child1"
          />
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">Second child focused:</p>
          <HierarchicalCard
            {...args}
            node={{
              ...taskWithSubtasks,
              isExpanded: false,
            }}
            focusedChildId="child2"
          />
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">Third child focused:</p>
          <HierarchicalCard
            {...args}
            node={{
              ...taskWithSubtasks,
              isExpanded: false,
            }}
            focusedChildId="child3"
          />
        </div>
      </div>

      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <p className="text-sm text-purple-800">
          <strong>Breadcrumb Display:</strong> When a parent card is collapsed but has a focused
          child, a breadcrumb appears showing which child is currently focused. This helps maintain
          context when switching between expanded and collapsed views.
        </p>
      </div>
    </div>
  ),
  args: {
    showHierarchy: true,
  },
}

// Special states
export const WithAttempts: Story = {
  args: {
    node: createMockNode('attempts', 'Difficult task with multiple attempts', {
      importance: 6,
      urgency: 8,
      attempts: [
        { id: '1', outcome: 'failed', notes: 'Network issues' },
        { id: '2', outcome: 'partial', notes: 'Got halfway through' },
        { id: '3', outcome: 'blocked', notes: 'Waiting for approval' },
      ],
    }),
    showHierarchy: true,
  },
}

export const NoHierarchy: Story = {
  args: {
    node: taskWithSubtasks,
    showHierarchy: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Card without hierarchy indicators - useful for simple list views',
      },
    },
  },
}

// Interactive examples
export const InteractiveHierarchy: Story = {
  args: {
    node: deepHierarchy,
    showHierarchy: true,
    draggable: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Full interactive example with drag and drop, expand/collapse, and all actions',
      },
    },
  },
}

// Stack effect examples
export const SmallStack: Story = {
  args: {
    node: smallStack,
    showHierarchy: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Stack effect with 1-2 children (single layer behind)',
      },
    },
  },
}

export const MediumStack: Story = {
  args: {
    node: mediumStack,
    showHierarchy: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Stack effect with 3-5 children (two layers behind)',
      },
    },
  },
}

export const LargeStack: Story = {
  args: {
    node: largeStack,
    showHierarchy: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Stack effect with 6+ children (three layers behind - maximum depth)',
      },
    },
  },
}

// Card deck visualization
export const StackComparison: Story = {
  render: args => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Stack Effect Comparison</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-600">Small Stack (2 children)</h4>
          <HierarchicalCard {...args} node={smallStack} />
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-600">Medium Stack (4 children)</h4>
          <HierarchicalCard {...args} node={mediumStack} />
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-600">Large Stack (8 children)</h4>
          <HierarchicalCard {...args} node={largeStack} />
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Visual Stack Depth:</strong> The visual stacking effect shows 1, 2, or 3 layers
          behind the parent card based on the number of children. Hover over the cards to see the
          fan-out effect!
        </p>
      </div>
    </div>
  ),
  args: {
    showHierarchy: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Comparison showing different stack depths based on children count',
      },
    },
  },
}

export const CardDeckExample: Story = {
  render: args => (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-4">Hierarchical Task Cards</h3>
      <HierarchicalCard {...args} node={deepHierarchy} />
      {deepHierarchy.isExpanded &&
        deepHierarchy.children.map((child, index) => (
          <HierarchicalCard key={child.id} {...args} node={child} isSelected={index === 1} />
        ))}
    </div>
  ),
  args: {
    showHierarchy: true,
    draggable: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of multiple cards showing hierarchy levels with stack effects',
      },
    },
  },
}

export const UnifiedNavigationComparison: Story = {
  render: () => {
    const [selectedNodeId, setSelectedNodeId] = React.useState<string>('modal')
    const [focusedNodeId, setFocusedNodeId] = React.useState<string>('modal')
    const [viewMode, setViewMode] = React.useState<'accordion' | 'splay'>('accordion')

    // Create test hierarchy
    const nodes = [
      createMockNode('project', 'Website Redesign', {
        importance: 9,
        urgency: 7,
        category: 'Project',
      }),
      createMockNode('design', 'Design Phase', {
        importance: 8,
        urgency: 8,
      }),
      createMockNode('wireframes', 'Create Wireframes', {
        importance: 7,
        urgency: 8,
        status: 'completed',
      }),
      createMockNode('mockups', 'Design Mockups', {
        importance: 8,
        urgency: 7,
        status: 'in-progress',
      }),
      createMockNode('develop', 'Development Phase', {
        importance: 9,
        urgency: 6,
      }),
      createMockNode('frontend', 'Frontend Implementation', {
        importance: 8,
        urgency: 6,
      }),
      createMockNode('backend', 'Backend API', {
        importance: 9,
        urgency: 7,
      }),
    ]

    // Set up relationships
    nodes[0].children = [nodes[1], nodes[4]] // project -> design, develop
    nodes[1].children = [nodes[2], nodes[3]] // design -> wireframes, mockups
    nodes[4].children = [nodes[5], nodes[6]] // develop -> frontend, backend

    const hierarchy = buildTestHierarchy(nodes)
    const rootNode = hierarchy[0]

    // Find the selected node in hierarchy
    const findNode = (node: HierarchyNode, id: string): HierarchyNode | null => {
      if (node.id === id) return node
      for (const child of node.children) {
        const found = findNode(child, id)
        if (found) return found
      }
      return null
    }

    const selectedNode = findNode(rootNode, selectedNodeId)

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Unified Navigation: Accordion vs Splay View
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Both views share the same focus state. Switch between them to see how breadcrumbs help
            maintain context.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('accordion')}
            className={cn(
              'px-4 py-2 rounded-md transition-colors',
              viewMode === 'accordion'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            )}
          >
            Accordion View
          </button>
          <button
            onClick={() => setViewMode('splay')}
            className={cn(
              'px-4 py-2 rounded-md transition-colors',
              viewMode === 'splay'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            )}
          >
            Splay View
          </button>
        </div>

        {/* Current selection info */}
        <div className="p-3 bg-purple-50 rounded-lg mb-4">
          <p className="text-sm text-purple-900">
            <strong>Currently selected:</strong> {selectedNode?.data.label || 'None'}
          </p>
          {selectedNode?.ancestors && selectedNode.ancestors.length > 0 && (
            <p className="text-sm text-purple-700 mt-1">
              <strong>Path:</strong> {selectedNode.ancestors.map(a => a.data.label).join(' → ')} →{' '}
              {selectedNode.data.label}
            </p>
          )}
        </div>

        {/* Render based on view mode */}
        {viewMode === 'accordion' ? (
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Accordion View (Hierarchical)</h4>
            <HierarchicalCard
              node={rootNode}
              isSelected={selectedNodeId === rootNode.id}
              isFocused={focusedNodeId === rootNode.id}
              showHierarchy={true}
              onToggleExpand={nodeId => {
                // In real implementation, this would update the hierarchy state
                console.log('Toggle expand:', nodeId)
              }}
              onSelect={setSelectedNodeId}
              onNodeFocus={setFocusedNodeId}
              showSplayButton={true}
              onSplay={node => {
                setViewMode('splay')
                setFocusedNodeId(node.id)
              }}
            />
          </div>
        ) : (
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Splay View (All Cards Visible)</h4>
            <div className="p-4 bg-gray-50 rounded-lg overflow-x-auto">
              <SplayedCardDeck
                node={rootNode}
                selectedNodeId={selectedNodeId}
                focusedNodeId={focusedNodeId}
                onNodeSelect={setSelectedNodeId}
                onNodeFocus={setFocusedNodeId}
              />
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Accordion View Benefits:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Preserves hierarchical context</li>
              <li>• Space-efficient for deep hierarchies</li>
              <li>• Shows relationships clearly</li>
              <li>• Ancestor breadcrumbs for orientation</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Splay View Benefits:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• All cards visible at once</li>
              <li>• Quick selection of any item</li>
              <li>• Good for comparing siblings</li>
              <li>• Keyboard navigation support</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
}

export const BreadcrumbNavigation: Story = {
  render: () => {
    // Create a rich hierarchy for breadcrumb demonstration
    const nodes = [
      createMockNode('project', 'Q1 2024 Product Launch', {
        importance: 9,
        urgency: 8,
        category: 'Product',
      }),
      createMockNode('frontend', 'Frontend Development', {
        importance: 8,
        urgency: 7,
        category: 'Engineering',
      }),
      createMockNode('components', 'Build UI Components', {
        importance: 7,
        urgency: 7,
      }),
      createMockNode('button', 'Design Button Component', {
        importance: 6,
        urgency: 6,
        status: 'completed',
      }),
      createMockNode('modal', 'Create Modal Component', {
        importance: 7,
        urgency: 8,
        status: 'in-progress',
      }),
      createMockNode('forms', 'Implement Form System', {
        importance: 8,
        urgency: 7,
      }),
      createMockNode('validation', 'Add Form Validation', {
        importance: 7,
        urgency: 6,
      }),
      createMockNode('backend', 'Backend API', {
        importance: 9,
        urgency: 8,
        category: 'Engineering',
      }),
      createMockNode('auth', 'Authentication System', {
        importance: 9,
        urgency: 9,
      }),
    ]

    // Set up complex relationships
    nodes[0].children = [nodes[1], nodes[7]] // project -> frontend, backend
    nodes[1].children = [nodes[2], nodes[5]] // frontend -> components, forms
    nodes[2].children = [nodes[3], nodes[4]] // components -> button, modal
    nodes[5].children = [nodes[6]] // forms -> validation
    nodes[7].children = [nodes[8]] // backend -> auth

    const hierarchy = buildTestHierarchy(nodes)

    // Get different nodes at various depths
    const rootNode = hierarchy[0]
    const level2Node = hierarchy[0].children[0].children[0] // components
    const level3Node = hierarchy[0].children[0].children[0].children[1] // modal

    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-2">Ancestor Breadcrumbs at Different Levels</h3>
          <p className="text-sm text-gray-600 mb-4">
            Each card shows its full path from the root. Deeper cards have longer breadcrumb trails.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Root Level (no breadcrumb):</p>
            <HierarchicalCard node={rootNode} showHierarchy={true} isExpanded={false} />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Level 2 (shows parent in breadcrumb):
            </p>
            <HierarchicalCard node={level2Node} showHierarchy={true} isFocused={true} />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Level 3 (shows full ancestor path):
            </p>
            <HierarchicalCard node={level3Node} showHierarchy={true} isFocused={true} />
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Breadcrumb Features:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ancestor breadcrumbs show the full path from root to current node</li>
            <li>• Breadcrumbs appear when a card is focused or at deeper levels</li>
            <li>• Each segment is truncated to prevent overflow</li>
            <li>• Categories are preserved in the parent nodes</li>
          </ul>
        </div>
      </div>
    )
  },
}

export const EisenhowerMatrixShowcase: Story = {
  render: () => {
    const quadrantExamples = [
      {
        title: 'Do First (Important & Urgent)',
        tasks: [
          createMockNode('do1', 'Fix production server outage', {
            importance: 10,
            urgency: 10,
            category: 'Critical',
          }),
          createMockNode('do2', 'Complete client presentation', {
            importance: 9,
            urgency: 8,
            category: 'Client Work',
            dueDate: new Date(Date.now() + 7200000).toISOString(),
          }),
          createMockNode('do3', 'Submit grant proposal', {
            importance: 8,
            urgency: 9,
            category: 'Funding',
          }),
        ],
      },
      {
        title: 'Schedule (Important & Not Urgent)',
        tasks: [
          createMockNode('sched1', 'Learn new programming language', {
            importance: 8,
            urgency: 2,
            category: 'Learning',
          }),
          createMockNode('sched2', 'Plan next quarter OKRs', {
            importance: 9,
            urgency: 3,
            category: 'Planning',
          }),
          createMockNode('sched3', 'Build personal portfolio', {
            importance: 7,
            urgency: 1,
            category: 'Personal',
          }),
        ],
      },
      {
        title: 'Delegate (Not Important & Urgent)',
        tasks: [
          createMockNode('del1', 'Schedule team lunch', {
            importance: 3,
            urgency: 7,
            category: 'Admin',
          }),
          createMockNode('del2', 'Update meeting notes', {
            importance: 2,
            urgency: 8,
            category: 'Documentation',
          }),
          createMockNode('del3', 'Order office supplies', {
            importance: 1,
            urgency: 9,
            category: 'Admin',
          }),
        ],
      },
      {
        title: 'Eliminate (Not Important & Not Urgent)',
        tasks: [
          createMockNode('elim1', 'Reorganize email folders', {
            importance: 2,
            urgency: 1,
            category: 'Organization',
          }),
          createMockNode('elim2', 'Browse social media', {
            importance: 1,
            urgency: 2,
            category: 'Distraction',
          }),
          createMockNode('elim3', 'Watch random videos', {
            importance: 0,
            urgency: 0,
            category: 'Time Waster',
          }),
        ],
      },
    ]

    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-2">Eisenhower Matrix Priority Showcase</h3>
          <p className="text-sm text-gray-600 mb-4">
            Cards are styled based on their importance and urgency values, showing different colors
            and indicators for each quadrant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {quadrantExamples.map((quadrant, index) => (
            <div key={index} className="space-y-4">
              <h4 className="font-medium text-gray-700">{quadrant.title}</h4>
              <div className="space-y-3">
                {quadrant.tasks.map(task => (
                  <HierarchicalCard
                    key={task.id}
                    node={task}
                    showHierarchy={true}
                    onContextMenu={(e, node) => {
                      e.preventDefault()
                      console.log('Context menu for:', node.data.label)
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Visual Priority Indicators:</h4>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Red strip & tint: Do First (Important & Urgent)</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Blue strip & tint: Schedule (Important & Not Urgent)</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Yellow strip & tint: Delegate (Not Important & Urgent)</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span>Gray strip & tint: Eliminate (Not Important & Not Urgent)</span>
            </li>
          </ul>
        </div>
      </div>
    )
  },
}

export const TouchInteractions: Story = {
  render: () => {
    const [lastAction, setLastAction] = React.useState<string>('None')

    const sampleNode = createMockNode('touch-demo', 'Try different interactions', {
      importance: 8,
      urgency: 7,
      category: 'Interactive Demo',
    })

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Touch & Click Interactions</h3>
          <p className="text-sm text-gray-600 mb-4">
            Test different interaction methods on the card below:
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Interaction Methods:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>
              • <strong>Click:</strong> Select the card
            </li>
            <li>
              • <strong>Right-click:</strong> Open context menu (desktop)
            </li>
            <li>
              • <strong>Long press (500ms):</strong> Open context menu (touch devices)
            </li>
            <li>
              • <strong>Drag:</strong> Move the card (if enabled)
            </li>
          </ul>
        </div>

        <div className="max-w-md mx-auto">
          <HierarchicalCard
            node={sampleNode}
            showHierarchy={true}
            draggable={true}
            onSelect={id => setLastAction(`Selected: ${id}`)}
            onContextMenu={(e, node) => {
              e.preventDefault()
              setLastAction(`Context menu opened for: ${node.data.label}`)
            }}
            onDragStart={(e, node) => setLastAction(`Started dragging: ${node.data.label}`)}
            onDragEnd={() => setLastAction('Drag ended')}
          />
        </div>

        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-900">
            <strong>Last action:</strong> {lastAction}
          </p>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> On touch devices, press and hold the card for 500ms to trigger
            the context menu. The card will slightly scale down to indicate the long press is
            detected.
          </p>
        </div>
      </div>
    )
  },
}

export const KeyboardNavigationDemo: Story = {
  render: () => {
    const [focusedNodeId, setFocusedNodeId] = React.useState<string>('wireframes')
    const [expandedView, setExpandedView] = React.useState(false)

    // Create test hierarchy
    const nodes = [
      createMockNode('project', 'Mobile App Development', {
        importance: 9,
        urgency: 8,
        category: 'Project',
      }),
      createMockNode('planning', 'Planning Phase', {
        importance: 8,
        urgency: 9,
      }),
      createMockNode('requirements', 'Gather Requirements', {
        importance: 9,
        urgency: 9,
        status: 'completed',
      }),
      createMockNode('wireframes', 'Create Wireframes', {
        importance: 7,
        urgency: 8,
        status: 'in-progress',
      }),
      createMockNode('development', 'Development Phase', {
        importance: 9,
        urgency: 7,
      }),
      createMockNode('ios', 'iOS Development', {
        importance: 8,
        urgency: 7,
      }),
      createMockNode('android', 'Android Development', {
        importance: 8,
        urgency: 6,
      }),
      createMockNode('testing', 'Testing Phase', {
        importance: 8,
        urgency: 5,
      }),
      createMockNode('unit', 'Unit Tests', {
        importance: 7,
        urgency: 6,
      }),
      createMockNode('integration', 'Integration Tests', {
        importance: 8,
        urgency: 5,
      }),
    ]

    // Set up relationships
    nodes[0].children = [nodes[1], nodes[4], nodes[7]] // project -> planning, development, testing
    nodes[1].children = [nodes[2], nodes[3]] // planning -> requirements, wireframes
    nodes[4].children = [nodes[5], nodes[6]] // development -> ios, android
    nodes[7].children = [nodes[8], nodes[9]] // testing -> unit, integration

    const hierarchy = buildTestHierarchy(nodes)
    const rootNode = hierarchy[0]

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Keyboard Navigation Demo</h3>
          <p className="text-sm text-gray-600 mb-4">
            Use keyboard shortcuts to navigate through the hierarchy. Focus is shown with a purple
            ring.
          </p>
        </div>

        {/* Keyboard shortcuts guide */}
        <div className="p-4 bg-gray-100 rounded-lg mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Keyboard Shortcuts:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono text-xs">
                  Space
                </kbd>
                <span className="text-gray-700">Toggle between accordion and splay view</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono text-xs">
                  Enter
                </kbd>
                <span className="text-gray-700">Select focused card</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono text-xs">
                  Tab
                </kbd>
                <span className="text-gray-700">Navigate to next interactive element</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono text-xs">
                  ←
                </kbd>
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono text-xs">
                  →
                </kbd>
                <span className="text-gray-700">Navigate cards in splay view</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono text-xs">
                  Esc
                </kbd>
                <span className="text-gray-700">Close splay view</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current focus info */}
        <div className="p-3 bg-purple-50 rounded-lg mb-4">
          <p className="text-sm text-purple-900">
            <strong>Currently focused:</strong> {focusedNodeId}
          </p>
          <p className="text-xs text-purple-700 mt-1">
            Press <kbd className="px-1 py-0.5 bg-purple-100 rounded text-xs">Space</kbd> to toggle
            view mode
          </p>
        </div>

        {/* Render the appropriate view */}
        {!expandedView ? (
          <div>
            <TimeboxCardDeck
              node={rootNode}
              selectedNodeId={focusedNodeId}
              focusedNodeId={focusedNodeId}
              onNodeSelect={setFocusedNodeId}
              onNodeFocus={setFocusedNodeId}
            />
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg overflow-x-auto">
            <SplayedCardDeck
              node={rootNode}
              selectedNodeId={focusedNodeId}
              focusedNodeId={focusedNodeId}
              onNodeSelect={setFocusedNodeId}
              onNodeFocus={setFocusedNodeId}
            />
          </div>
        )}

        {/* Add keyboard listener */}
        {React.useEffect(() => {
          const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === ' ') {
              e.preventDefault()
              setExpandedView(prev => !prev)
            }
          }

          window.addEventListener('keydown', handleKeyPress)
          return () => window.removeEventListener('keydown', handleKeyPress)
        }, [])}
      </div>
    )
  },
}

export const BrainDumpStyles: Story = {
  render: () => {
    const statusExamples = [
      createMockNode('completed1', 'Completed task with high priority', {
        importance: 9,
        urgency: 8,
        taskStatus: 'completed',
        category: 'Work',
      }),
      createMockNode('inprogress1', 'Task in progress', {
        importance: 7,
        urgency: 7,
        taskStatus: 'in-progress',
        category: 'Project',
      }),
      createMockNode('pending1', 'Pending task', {
        importance: 5,
        urgency: 4,
        taskStatus: 'pending',
        category: 'Planning',
      }),
      createMockNode('recurring1', 'Daily standup meeting', {
        importance: 6,
        urgency: 9,
        taskType: 'recurring',
        category: 'Meetings',
      }),
      createMockNode('habit1', 'Morning meditation', {
        importance: 8,
        urgency: 3,
        taskType: 'habit',
        currentStreak: 15,
        category: 'Health',
      }),
    ]

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Brain Dump Task Styles</h3>
          <p className="text-sm text-gray-600 mb-4">
            Different card styles based on task status and type, matching the Brain Dump flow.
          </p>
        </div>

        <div className="space-y-4 max-w-2xl">
          {statusExamples.map(node => (
            <HierarchicalCard
              key={node.id}
              node={node}
              showHierarchy={true}
              onStatusToggle={(id, completed) => {
                console.log(`Toggle status for ${id}: ${completed}`)
              }}
            />
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Task Status Indicators:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                • <strong>Completed:</strong> Reduced opacity & strikethrough
              </li>
              <li>
                • <strong>In Progress:</strong> Normal styling
              </li>
              <li>
                • <strong>Pending:</strong> Default state
              </li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Special Task Types:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                • 🔄 <strong>Recurring:</strong> Shows recurring indicator
              </li>
              <li>
                • 🔥 <strong>Habit:</strong> Shows current streak
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
}
