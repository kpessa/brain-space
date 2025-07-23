import type { BrainDumpEntry } from '@/types/braindump'

export interface GroupedBrainDumps {
  [key: string]: {
    title: string
    entries: BrainDumpEntry[]
    count: number
  }
}

/**
 * Group brain dumps by topic focus
 */
export function groupBrainDumpsByTopic(entries: BrainDumpEntry[]): GroupedBrainDumps {
  const groups: GroupedBrainDumps = {}

  entries.forEach(entry => {
    let groupKey: string
    let groupTitle: string

    if (entry.topicFocus) {
      // Group by topic for topic-focused dumps
      groupKey = `topic-${entry.topicFocus.toLowerCase()}`
      groupTitle = entry.topicFocus
    } else {
      // For general dumps, try to extract a main topic from nodes
      const mainTopic = extractMainTopic(entry)
      if (mainTopic) {
        groupKey = `extracted-${mainTopic.toLowerCase()}`
        groupTitle = mainTopic
      } else {
        groupKey = 'general'
        groupTitle = 'General Brain Dumps'
      }
    }

    if (!groups[groupKey]) {
      groups[groupKey] = {
        title: groupTitle,
        entries: [],
        count: 0,
      }
    }

    groups[groupKey].entries.push(entry)
    groups[groupKey].count++
  })

  return groups
}

/**
 * Group brain dumps by type (general vs topic-focused)
 */
export function groupBrainDumpsByType(entries: BrainDumpEntry[]): GroupedBrainDumps {
  const groups: GroupedBrainDumps = {
    'topic-focused': {
      title: 'Topic-Focused',
      entries: [],
      count: 0,
    },
    general: {
      title: 'General',
      entries: [],
      count: 0,
    },
  }

  entries.forEach(entry => {
    const type = entry.type || 'general'
    groups[type].entries.push(entry)
    groups[type].count++
  })

  // Remove empty groups
  Object.keys(groups).forEach(key => {
    if (groups[key].count === 0) {
      delete groups[key]
    }
  })

  return groups
}

/**
 * Sort brain dumps within their groups
 */
export function sortBrainDumps(
  entries: BrainDumpEntry[],
  sortBy: 'date' | 'topic' | 'alphabetical'
): BrainDumpEntry[] {
  const sorted = [...entries]

  switch (sortBy) {
    case 'date':
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

    case 'topic':
      return sorted.sort((a, b) => {
        const topicA = a.topicFocus || extractMainTopic(a) || 'zzz'
        const topicB = b.topicFocus || extractMainTopic(b) || 'zzz'
        return topicA.localeCompare(topicB)
      })

    case 'alphabetical':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))

    default:
      return sorted
  }
}

/**
 * Extract main topic from a brain dump's nodes
 * Looks for the most prominent category or root node label
 */
function extractMainTopic(entry: BrainDumpEntry): string | null {
  if (!entry.nodes || entry.nodes.length === 0) return null

  // First, try to find a root node
  const rootNode = entry.nodes.find(n => n.type === 'root')
  if (rootNode && rootNode.data.label !== 'Brain Dump') {
    return rootNode.data.label
  }

  // Count nodes by category
  const categoryCounts: Record<string, number> = {}
  entry.nodes.forEach(node => {
    if (node.data.category && node.type !== 'root') {
      categoryCounts[node.data.category] = (categoryCounts[node.data.category] || 0) + 1
    }
  })

  // Find the most common category
  let maxCount = 0
  let mainCategory = null

  Object.entries(categoryCounts).forEach(([category, count]) => {
    if (count > maxCount) {
      maxCount = count
      mainCategory = category
    }
  })

  // If we have a dominant category, try to find a representative node
  if (mainCategory && maxCount >= 3) {
    const categoryNode = entry.nodes.find(
      n => n.type === 'category' && n.data.category === mainCategory
    )
    if (categoryNode) {
      return categoryNode.data.label
    }
  }

  return null
}

/**
 * Toggle group collapse state
 */
export function toggleGroupCollapse(groupKey: string, collapsedGroups: Set<string>): Set<string> {
  const newSet = new Set(collapsedGroups)
  if (newSet.has(groupKey)) {
    newSet.delete(groupKey)
  } else {
    newSet.add(groupKey)
  }
  return newSet
}
