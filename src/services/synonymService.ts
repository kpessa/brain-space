import type { BrainDumpNode, BrainDumpEntry } from '../types/braindump'

export interface SynonymMatch {
  node: BrainDumpNode
  entry: BrainDumpEntry
  matchedSynonym: string
  matchType: 'exact' | 'fuzzy'
}

export class SynonymService {
  /**
   * Check if a text matches any synonyms in the given entries
   */
  static findMatches(text: string, entries: BrainDumpEntry[]): SynonymMatch[] {
    const matches: SynonymMatch[] = []
    const searchText = text.toLowerCase().trim()

    for (const entry of entries) {
      for (const node of entry.nodes) {
        // Skip ghost nodes as they're just references
        if (node.data.isGhost) continue

        // Check main label
        if (node.data.label.toLowerCase() === searchText) {
          matches.push({
            node,
            entry,
            matchedSynonym: node.data.label,
            matchType: 'exact',
          })
          continue
        }

        // Check synonyms
        if (node.data.synonyms) {
          for (const synonym of node.data.synonyms) {
            if (synonym.toLowerCase() === searchText) {
              matches.push({
                node,
                entry,
                matchedSynonym: synonym,
                matchType: 'exact',
              })
              break
            }
          }
        }
      }
    }

    // If no exact matches, try fuzzy matching
    if (matches.length === 0) {
      matches.push(...this.findFuzzyMatches(text, entries))
    }

    return matches
  }

  /**
   * Find fuzzy matches for partial text or similar words
   */
  private static findFuzzyMatches(text: string, entries: BrainDumpEntry[]): SynonymMatch[] {
    const matches: SynonymMatch[] = []
    const searchText = text.toLowerCase().trim()

    // Only do fuzzy matching if text is at least 3 characters
    if (searchText.length < 3) return matches

    for (const entry of entries) {
      for (const node of entry.nodes) {
        if (node.data.isGhost) continue

        // Check if label contains the search text
        if (node.data.label.toLowerCase().includes(searchText)) {
          matches.push({
            node,
            entry,
            matchedSynonym: node.data.label,
            matchType: 'fuzzy',
          })
          continue
        }

        // Check synonyms for partial matches
        if (node.data.synonyms) {
          for (const synonym of node.data.synonyms) {
            if (synonym.toLowerCase().includes(searchText)) {
              matches.push({
                node,
                entry,
                matchedSynonym: synonym,
                matchType: 'fuzzy',
              })
              break
            }
          }
        }
      }
    }

    return matches
  }

  /**
   * Add a synonym to a node
   */
  static addSynonym(node: BrainDumpNode, synonym: string): BrainDumpNode {
    const trimmedSynonym = synonym.trim()
    if (!trimmedSynonym) return node

    const currentSynonyms = node.data.synonyms || []

    // Don't add if it already exists or matches the label
    if (
      currentSynonyms.some(s => s.toLowerCase() === trimmedSynonym.toLowerCase()) ||
      node.data.label.toLowerCase() === trimmedSynonym.toLowerCase()
    ) {
      return node
    }

    return {
      ...node,
      data: {
        ...node.data,
        synonyms: [...currentSynonyms, trimmedSynonym],
      },
    }
  }

  /**
   * Remove a synonym from a node
   */
  static removeSynonym(node: BrainDumpNode, synonym: string): BrainDumpNode {
    if (!node.data.synonyms) return node

    return {
      ...node,
      data: {
        ...node.data,
        synonyms: node.data.synonyms.filter(s => s !== synonym),
      },
    }
  }

  /**
   * Create an instance node from a prototype
   */
  static createInstance(
    prototype: BrainDumpNode,
    position: { x: number; y: number }
  ): BrainDumpNode {
    const instanceId = `instance-${prototype.id}-${Date.now()}`

    return {
      id: instanceId,
      type: prototype.type,
      position,
      data: {
        ...prototype.data,
        isInstance: true,
        prototypeId: prototype.id,
        // Don't copy instances array or ghost properties
        instances: undefined,
        isGhost: false,
        referencedNodeId: undefined,
      },
    }
  }

  /**
   * Update prototype with new instance reference
   */
  static addInstanceToPrototype(prototype: BrainDumpNode, instanceId: string): BrainDumpNode {
    const currentInstances = prototype.data.instances || []

    return {
      ...prototype,
      data: {
        ...prototype.data,
        instances: [...currentInstances, instanceId],
      },
    }
  }
}
