import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Matrix } from './Matrix'
import { useBrainDumpStore } from '@/store/braindump'
import type { BrainDumpNode, BrainDumpEdge } from '@/types/braindump'

// Create mock data from real brain dump YAML
const createMockNode = (
  id: string,
  label: string,
  nodeType: string = 'thought',
  options: {
    importance?: number
    urgency?: number
    category?: string
    taskStatus?: string
    taskType?: string
    dueDate?: string
    subtasks?: string[]
    currentStreak?: number
    status?: string
  } = {}
): BrainDumpNode => ({
  id,
  type: nodeType as any,
  position: { x: 0, y: 0 },
  data: {
    label,
    importance: options.importance ?? 5,
    urgency: options.urgency ?? 5,
    category: options.category,
    taskStatus: options.taskStatus,
    taskType: options.taskType,
    dueDate: options.dueDate,
    subtasks: options.subtasks,
    currentStreak: options.currentStreak,
    status: options.status ?? 'pending',
  },
})

// Real brain dump data converted to mock format
const mockNodes: BrainDumpNode[] = [
  // Root node
  createMockNode('root', 'Brain Dump', 'category'),

  // Category nodes
  createMockNode('cat-body', 'Body', 'category', {
    category: 'misc',
    subtaskLogic: 'OR', // Either rollerblade OR tennis completes daily exercise
  }),
  createMockNode('cat-brain-space', 'Brain Space', 'category', { category: 'brain space' }),
  createMockNode('cat-home', 'Home', 'category', { category: 'home' }),
  createMockNode('cat-todo', 'ToDo', 'category', { category: 'misc' }),
  createMockNode('cat-trips', 'Trips', 'category', { category: 'trips' }),
  createMockNode('cat-work', 'Work', 'category', { category: 'misc' }),
  createMockNode('cat-tasks', 'Tasks', 'category', { category: 'tasks' }),

  // Body category tasks - Schedule (Important but not urgent - health/fitness)
  createMockNode('rollerblade', 'Rollerblade', 'thought', {
    importance: 7,
    urgency: 3,
    category: 'Body',
    taskType: 'habit',
    autoCompleteParent: true, // Either rollerblade OR tennis completes "Body" exercise
  }),
  createMockNode('tennis-wall', 'Tennis Wall', 'thought', {
    importance: 6,
    urgency: 3,
    category: 'Body',
    taskType: 'habit',
    autoCompleteParent: true, // Either rollerblade OR tennis completes "Body" exercise
  }),

  // ToDo category - Mix of urgencies
  createMockNode('best-buy-tv', 'Best Buy - Broken TV', 'thought', {
    importance: 5,
    urgency: 7,
    category: 'Home',
    taskStatus: 'pending',
  }),
  createMockNode('eisenhower-matrix-todo', 'Eisenhower Matrix', 'thought', {
    importance: 8,
    urgency: 6,
    category: 'Brain Space',
    taskStatus: 'in-progress',
  }),
  createMockNode('scooter', 'Scooter', 'thought', {
    importance: 4,
    urgency: 5,
    category: 'Transportation',
  }),
  createMockNode('timebox', 'Timebox', 'thought', {
    importance: 8,
    urgency: 6,
    category: 'Brain Space',
    taskStatus: 'in-progress',
  }),

  // Trips - Schedule category (important for planning)
  createMockNode('magic-live', 'Magic Live', 'thought', {
    importance: 8,
    urgency: 7,
    category: 'Trips',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), // 1 week from now
  }),
  createMockNode('lubbock', 'Lubbock', 'thought', {
    importance: 8,
    urgency: 8,
    category: 'Trips',
    subtasks: ['haircut', 'pack-prepare', 'speech', 'what-to-wear'],
    subtaskLogic: 'AND', // All required subtasks must be completed (except optional ones)
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(), // 3 days from now
  }),
  createMockNode('haircut', 'Haircut (optional)', 'thought', {
    importance: 3,
    urgency: 6,
    category: 'Personal',
    status: 'pending',
    isOptional: true, // Optional for Lubbock trip completion
  }),
  createMockNode('pack-prepare', 'Pack / Prepare', 'thought', {
    importance: 8,
    urgency: 8,
    category: 'Trips',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), // 2 days from now
  }),
  createMockNode('speech', 'Speech', 'thought', {
    importance: 9,
    urgency: 8,
    category: 'Work',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
  }),
  createMockNode('what-to-wear', 'What to wear', 'thought', {
    importance: 4,
    urgency: 7,
    category: 'Personal',
  }),
  createMockNode('las-vegas', 'Las Vegas', 'thought', {
    importance: 6,
    urgency: 2,
    category: 'Trips',
  }),

  // Work - Do First and Schedule mix
  createMockNode('advisor-enhancements', 'Advisor Enhancements', 'thought', {
    importance: 8,
    urgency: 6,
    category: 'Work',
    taskStatus: 'in-progress',
  }),
  createMockNode('atlanta-go-live', 'Atlanta Go-Live', 'thought', {
    importance: 9,
    urgency: 8,
    category: 'Work',
    subtasks: ['super-user-training'],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString(), // 2 weeks
  }),
  createMockNode('super-user-training', 'Super-User Training', 'thought', {
    importance: 9,
    urgency: 9,
    category: 'Work',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(), // 5 days
  }),
  createMockNode('bh-48hr-review', 'bh 48 hr abx review', 'thought', {
    importance: 7,
    urgency: 8,
    category: 'Work',
    taskType: 'recurring',
  }),
  createMockNode('cedar-hills-nebulizing', 'Cedar Hills - Nebulizing Treatments', 'thought', {
    importance: 8,
    urgency: 7,
    category: 'Work',
  }),
  createMockNode('immunizations', 'Immunizations', 'thought', {
    importance: 6,
    urgency: 4,
    category: 'Work',
    taskType: 'recurring',
  }),
  createMockNode('multum', 'Multum', 'thought', {
    importance: 7,
    urgency: 5,
    category: 'Work',
  }),

  // High-priority tasks
  createMockNode('leo-dropoff', '🚙 Leo - Learning Experience - Dropoff', 'thought', {
    importance: 9,
    urgency: 9,
    category: 'Tasks',
    dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  }),
  createMockNode('eisenhower-matrix-task', 'Eisenhower Matrix', 'thought', {
    importance: 8,
    urgency: 6,
    category: 'Tasks',
    taskStatus: 'in-progress',
  }),
]

// Create edges for parent-child relationships from brain dump
const mockEdges: BrainDumpEdge[] = [
  // Root connections
  { id: 'e-root-body', source: 'root', target: 'cat-body' },
  { id: 'e-root-brain-space', source: 'root', target: 'cat-brain-space' },
  { id: 'e-root-home', source: 'root', target: 'cat-home' },
  { id: 'e-root-todo', source: 'root', target: 'cat-todo' },
  { id: 'e-root-trips', source: 'root', target: 'cat-trips' },
  { id: 'e-root-work', source: 'root', target: 'cat-work' },
  { id: 'e-root-tasks', source: 'root', target: 'cat-tasks' },

  // Body category connections
  { id: 'e-body-rollerblade', source: 'cat-body', target: 'rollerblade' },
  { id: 'e-body-tennis', source: 'cat-body', target: 'tennis-wall' },

  // ToDo category connections
  { id: 'e-todo-tv', source: 'cat-todo', target: 'best-buy-tv' },
  { id: 'e-todo-matrix', source: 'cat-todo', target: 'eisenhower-matrix-todo' },
  { id: 'e-todo-scooter', source: 'cat-todo', target: 'scooter' },
  { id: 'e-todo-timebox', source: 'cat-todo', target: 'timebox' },

  // Trips category connections
  { id: 'e-trips-magic', source: 'cat-trips', target: 'magic-live' },
  { id: 'e-trips-lubbock', source: 'cat-trips', target: 'lubbock' },
  { id: 'e-trips-vegas', source: 'cat-trips', target: 'las-vegas' },

  // Lubbock subtasks
  { id: 'e-lubbock-haircut', source: 'lubbock', target: 'haircut' },
  { id: 'e-lubbock-pack', source: 'lubbock', target: 'pack-prepare' },
  { id: 'e-lubbock-speech', source: 'lubbock', target: 'speech' },
  { id: 'e-lubbock-wear', source: 'lubbock', target: 'what-to-wear' },

  // Work category connections
  { id: 'e-work-advisor', source: 'cat-work', target: 'advisor-enhancements' },
  { id: 'e-work-atlanta', source: 'cat-work', target: 'atlanta-go-live' },
  { id: 'e-work-bh', source: 'cat-work', target: 'bh-48hr-review' },
  { id: 'e-work-cedar', source: 'cat-work', target: 'cedar-hills-nebulizing' },
  { id: 'e-work-immunizations', source: 'cat-work', target: 'immunizations' },
  { id: 'e-work-multum', source: 'cat-work', target: 'multum' },

  // Atlanta subtasks
  { id: 'e-atlanta-training', source: 'atlanta-go-live', target: 'super-user-training' },

  // Tasks category connections
  { id: 'e-tasks-leo', source: 'cat-tasks', target: 'leo-dropoff' },
  { id: 'e-tasks-matrix', source: 'cat-tasks', target: 'eisenhower-matrix-task' },
]

// Create a mock brain dump entry
const mockEntry = {
  id: 'test-entry',
  user_id: 'test-user',
  topic: 'Task Management',
  nodes: mockNodes,
  edges: mockEdges,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const meta = {
  title: 'Pages/Matrix',
  component: Matrix,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The Matrix page is a complete Eisenhower Matrix implementation that includes:
- Drag-and-drop between quadrants
- Grid view with four quadrants (Do First, Schedule, Delegate, Eliminate)
- Hierarchy view using CardDeck
- Search and category filtering
- Context menus for task actions
- Proper priority coloring and indicators
- Sidebar with task list

This is the actual implementation used in the /matrix route.
        `,
      },
    },
  },
  decorators: [
    Story => {
      // Set up the store with mock data
      React.useEffect(() => {
        const store = useBrainDumpStore.getState()
        store.setCurrentEntry(mockEntry)
        return () => {
          store.setCurrentEntry(null)
        }
      }, [])

      return <Story />
    },
  ],
} satisfies Meta<typeof Matrix>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The complete Matrix page with all features enabled. Try dragging tasks between quadrants!',
      },
    },
  },
}

export const GridView: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Shows the grid view with tasks organized in four quadrants based on importance and urgency.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // The Matrix component starts in grid view by default
  },
}

export const HierarchyView: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Shows the hierarchy view using CardDeck to display tasks with parent-child relationships.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Simulate clicking the hierarchy view button
    const hierarchyButton = canvasElement.querySelector('[aria-label*="hierarchy"]')
    if (hierarchyButton instanceof HTMLElement) {
      hierarchyButton.click()
    }
  },
}

export const WithSearch: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the search functionality. Tasks are filtered as you type.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Simulate typing in the search box
    const searchInput = canvasElement.querySelector(
      'input[placeholder*="Search"]'
    ) as HTMLInputElement
    if (searchInput) {
      searchInput.value = 'bug'
      searchInput.dispatchEvent(new Event('input', { bubbles: true }))
    }
  },
}

export const CategoryFilter: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Shows how category filtering works. Select a category to see only tasks in that category.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Simulate selecting a category
    const categorySelect = canvasElement.querySelector('select') as HTMLSelectElement
    if (categorySelect) {
      categorySelect.value = 'Engineering'
      categorySelect.dispatchEvent(new Event('change', { bubbles: true }))
    }
  },
}

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Shows how the Matrix page adapts to mobile screens with a collapsible sidebar.',
      },
    },
  },
}

export const EmptyState: Story = {
  decorators: [
    Story => {
      // Clear the entry to show empty state
      React.useEffect(() => {
        const store = useBrainDumpStore.getState()
        store.setCurrentEntry(null)
      }, [])

      return <Story />
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows the empty state when no brain dump is selected.',
      },
    },
  },
}

export const InteractiveDemo: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Interactive demonstration of all Matrix features:
1. **Drag & Drop**: Drag tasks between quadrants to change their priority
2. **Toggle Views**: Switch between grid and hierarchy views
3. **Search**: Type in the search box to filter tasks
4. **Categories**: Select a category to filter tasks
5. **Context Menu**: Right-click on tasks for additional actions
6. **Task Status**: Click checkboxes to mark tasks as complete
7. **Sidebar**: Toggle the sidebar to see the task list
8. **Collapse/Expand**: Right-click on tasks to collapse children or collapse to parent

The Matrix automatically saves priority changes as you drag tasks between quadrants.
        `,
      },
    },
  },
}

export const CollapseDemo: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates the collapse/expand functionality for hierarchical tasks:
- **Right-click on "Lubbock"** to see "Collapse Children" option - this will hide all 4 subtasks
- **Right-click on subtasks** like "Pack / Prepare" to see "Collapse to Lubbock" option
- **Collapsed nodes** show a blue badge with the count of hidden tasks
- **Clean Matrix View**: Use collapse to reduce clutter and focus on high-level tasks

This makes the Matrix much cleaner when you have complex hierarchical tasks like trip planning with multiple subtasks.
        `,
      },
    },
  },
}

export const SmartCompletionDemo: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates the smart task completion logic with AND/OR relationships:

**OR Logic Example - "Body" (Exercise)**:
- Check either "Rollerblade" OR "Tennis Wall" 
- The parent "Body" task will automatically complete
- This represents "I need to exercise today - either option counts"

**AND Logic Example - "Lubbock" (Trip)**:
- "Lubbock" requires ALL subtasks: Pack/Prepare, Speech, What to wear
- "Haircut" is marked as optional and won't block completion
- Only when all required subtasks are done will "Lubbock" auto-complete

**Try it:**
1. Check "Rollerblade" → "Body" auto-completes (OR logic)
2. Uncheck "Rollerblade" → "Body" auto-uncompletes
3. Check "Pack/Prepare", "Speech", "What to wear" → "Lubbock" auto-completes (AND logic)
4. Notice "Haircut" being optional doesn't affect "Lubbock" completion

This solves the brain-dump-to-actionable-tasks workflow by making task relationships intelligent and automatic.
        `,
      },
    },
  },
}
