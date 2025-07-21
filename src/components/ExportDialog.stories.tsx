import type { Meta, StoryObj } from '@storybook/react'
import { ExportDialog } from './ExportDialog'

const meta: Meta<typeof ExportDialog> = {
  title: 'Components/ExportDialog',
  component: ExportDialog,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div style={{ width: '100vw', height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

const sampleYamlContent = `# Brain Dump Export
# Total nodes: 5
# Total connections: 4
# Export date: ${new Date().toLocaleString()}

- Main Idea # type: root
  - Sub Idea 1 # type: thought
    - Detail A # type: insight
    - Detail B # type: question
  - Sub Idea 2 # type: thought
`

const sampleJsonContent = JSON.stringify(
  {
    metadata: {
      exportDate: new Date().toISOString(),
      totalNodes: 5,
      totalEdges: 4,
    },
    nodes: [
      { id: '1', label: 'Main Idea', type: 'root' },
      { id: '2', label: 'Sub Idea 1', type: 'thought' },
      { id: '3', label: 'Sub Idea 2', type: 'thought' },
      { id: '4', label: 'Detail A', type: 'insight' },
      { id: '5', label: 'Detail B', type: 'question' },
    ],
    edges: [
      { source: '1', target: '2' },
      { source: '1', target: '3' },
      { source: '2', target: '4' },
      { source: '2', target: '5' },
    ],
  },
  null,
  2
)

export const Default: Story = {
  args: {
    isOpen: true,
    yamlContent: sampleYamlContent,
    jsonContent: sampleJsonContent,
    filename: 'brain-dump-2024-01-15',
    onClose: () => console.log('Close clicked'),
    onExport: format => console.log('Export clicked:', format),
  },
}

export const Empty: Story = {
  args: {
    isOpen: true,
    yamlContent: '# Empty brain dump\n',
    jsonContent:
      '{\n  "metadata": {\n    "totalNodes": 0,\n    "totalEdges": 0\n  },\n  "nodes": [],\n  "edges": []\n}',
    filename: 'empty-brain-dump',
    onClose: () => console.log('Close clicked'),
    onExport: format => console.log('Export clicked:', format),
  },
}

export const Closed: Story = {
  args: {
    isOpen: false,
    yamlContent: sampleYamlContent,
    jsonContent: sampleJsonContent,
    filename: 'brain-dump-2024-01-15',
    onClose: () => console.log('Close clicked'),
    onExport: format => console.log('Export clicked:', format),
  },
}
