import { useState, useEffect } from 'react'
import { Plus, ChevronDown, Sparkles } from 'lucide-react'
import { useNodesStore } from '@/store/nodes'
import { cn } from '@/lib/utils'
import type { Node } from '@/types/node'

interface NodeCategorySelectorProps {
  value?: string
  onChange: (categoryId: string | undefined) => void
  className?: string
}

export function NodeCategorySelector({ value, onChange, className }: NodeCategorySelectorProps) {
  const { categories } = useNodesStore()
  const [isOpen, setIsOpen] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryReasoning, setNewCategoryReasoning] = useState('')

  const selectedCategory = categories.find(cat => cat.id === value)

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryReasoning.trim()) return

    // This will be implemented when we have auth context
    // For now, just close the form
    setNewCategoryName('')
    setNewCategoryReasoning('')
    setShowNewCategory(false)
    setIsOpen(false)
  }

  // Default categories if none exist
  const defaultCategories: Partial<Node>[] = [
    { name: 'Work', confidence: 0.9, reasoning: 'Professional tasks and responsibilities' },
    { name: 'Personal', confidence: 0.8, reasoning: 'Personal life and self-care' },
    { name: 'Ideas', confidence: 0.7, reasoning: 'Creative thoughts and future projects' },
  ]

  const displayCategories = categories.length > 0 ? categories : defaultCategories

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          {selectedCategory ? (
            <>
              <span className="font-medium">{selectedCategory.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(selectedCategory.confidence * 100)}% confident
              </span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Select category...</span>
          )}
        </span>
        <ChevronDown
          className={cn('w-4 h-4 transition-transform', isOpen && 'transform rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          {/* No category option */}
          <button
            type="button"
            onClick={() => {
              onChange(undefined)
              setIsOpen(false)
            }}
            className={cn(
              'w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
              !value && 'bg-gray-50 dark:bg-gray-700'
            )}
          >
            <span className="text-gray-500 dark:text-gray-400">No category</span>
          </button>

          {/* Existing categories */}
          {displayCategories.map((category, index) => (
            <button
              key={category.id || index}
              type="button"
              onClick={() => {
                if (category.id) {
                  onChange(category.id)
                  setIsOpen(false)
                }
              }}
              className={cn(
                'w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                value === category.id && 'bg-gray-50 dark:bg-gray-700'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{category.name}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    {Math.round((category.confidence || 0.5) * 100)}%
                  </span>
                  {category.reasoning && <Sparkles className="w-3 h-3 text-brain-500" />}
                </div>
              </div>
              {category.reasoning && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                  {category.reasoning}
                </p>
              )}
            </button>
          ))}

          {/* Create new category */}
          {!showNewCategory ? (
            <button
              type="button"
              onClick={() => setShowNewCategory(true)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 text-brain-600 dark:text-brain-400"
            >
              <Plus className="w-4 h-4" />
              <span>Create new category</span>
            </button>
          ) : (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
                <textarea
                  value={newCategoryReasoning}
                  onChange={e => setNewCategoryReasoning(e.target.value)}
                  placeholder="Why this category? (reasoning)"
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim() || !newCategoryReasoning.trim()}
                    className="flex-1 px-2 py-1 text-xs bg-brain-600 text-white rounded hover:bg-brain-700 disabled:bg-gray-400"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategory(false)
                      setNewCategoryName('')
                      setNewCategoryReasoning('')
                    }}
                    className="flex-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
