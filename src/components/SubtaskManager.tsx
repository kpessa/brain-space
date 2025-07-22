import { useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimeboxTask } from '@/store/useTimeboxStore'

interface SubtaskManagerProps {
  task: TimeboxTask
  subtasks: TimeboxTask[]
  onAddSubtask: (parentId: string, label: string) => void
  onToggleSubtask: (taskId: string, completed: boolean) => void
  onDeleteSubtask?: (taskId: string) => void
  isExpanded?: boolean
  onToggleExpanded?: () => void
}

export function SubtaskManager({
  task,
  subtasks,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  isExpanded = true,
  onToggleExpanded
}: SubtaskManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSubtaskLabel, setNewSubtaskLabel] = useState('')
  
  const completedCount = subtasks.filter(st => st.status === 'completed').length
  const totalCount = subtasks.length
  
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSubtaskLabel.trim()) {
      onAddSubtask(task.id, newSubtaskLabel.trim())
      setNewSubtaskLabel('')
      setShowAddForm(false)
    }
  }
  
  return (
    <div className="mt-2">
      {/* Subtask header */}
      {totalCount > 0 && (
        <div 
          className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer"
          onClick={onToggleExpanded}
        >
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span>Subtasks ({completedCount}/{totalCount})</span>
          {completedCount > 0 && (
            <div className="flex-1 max-w-[100px] h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}
      
      {/* Subtask list */}
      {isExpanded && (
        <div className="ml-4 mt-2 space-y-1">
          {subtasks.map(subtask => (
            <div 
              key={subtask.id}
              className="flex items-center gap-2 group"
            >
              <button
                onClick={() => onToggleSubtask(subtask.id, subtask.status !== 'completed')}
                className="p-0.5"
              >
                {subtask.status === 'completed' ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Circle className="w-3 h-3 text-gray-400" />
                )}
              </button>
              <span className={cn(
                "text-xs flex-1",
                subtask.status === 'completed' && "line-through text-gray-500"
              )}>
                {subtask.label}
              </span>
              {onDeleteSubtask && (
                <button
                  onClick={() => onDeleteSubtask(subtask.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          
          {/* Add subtask form */}
          {showAddForm ? (
            <form onSubmit={handleAddSubtask} className="flex items-center gap-1">
              <input
                type="text"
                value={newSubtaskLabel}
                onChange={(e) => setNewSubtaskLabel(e.target.value)}
                placeholder="Add subtask..."
                className="flex-1 text-xs px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-brain-500"
                autoFocus
                onBlur={() => {
                  if (!newSubtaskLabel.trim()) {
                    setShowAddForm(false)
                  }
                }}
              />
              <button
                type="submit"
                className="text-xs text-brain-600 hover:text-brain-700"
              >
                Add
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Plus className="w-3 h-3" />
              Add subtask
            </button>
          )}
        </div>
      )}
    </div>
  )
}