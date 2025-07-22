import { useEffect, useRef, useState } from 'react'
import {
  X,
  CheckCircle,
  RotateCcw,
  Clock,
  FileText,
  Calendar,
  Plus,
  Trash2,
  Repeat,
  ChevronUp,
  ChevronDown,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { linearToLog, logToLinear } from '@/lib/priorityUtils'
import { calculateUrgencyFromDueDate, getDueDateDescription, format } from '@/lib/dateUtils'

interface TimeboxContextMenuProps {
  x: number
  y: number
  task: {
    id: string
    label: string
    importance?: number
    urgency?: number
    status?: string
    attempts?: any[]
    dueDate?: string
    hasChildren?: boolean
    parentId?: string
    parentLabel?: string
    isCollapsed?: boolean
    childrenCount?: number
  }
  onUpdateTask: (taskId: string, updates: { importance?: number; urgency?: number }) => void
  onTaskComplete?: (taskId: string, completed: boolean) => void
  onRecordAttempt?: (taskId: string) => void
  onViewAttempts?: (taskId: string) => void
  onAddSubtask?: (taskId: string) => void
  onMakeRecurring?: (taskId: string) => void
  onDeleteTask?: (taskId: string) => void
  onCollapseChildren?: (taskId: string) => void
  onExpandChildren?: (taskId: string) => void
  onCollapseToParent?: (taskId: string, parentId: string) => void
  onClose: () => void
}

export function TimeboxContextMenu({
  x,
  y,
  task,
  onUpdateTask,
  onTaskComplete,
  onRecordAttempt,
  onViewAttempts,
  onAddSubtask,
  onMakeRecurring,
  onDeleteTask,
  onCollapseChildren,
  onExpandChildren,
  onCollapseToParent,
  onClose,
}: TimeboxContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [showPriorityEdit, setShowPriorityEdit] = useState(false)

  // Convert log values to linear for display
  const initialLinearImportance =
    task.importance !== undefined ? Math.round(logToLinear(task.importance)) : 5
  const initialLinearUrgency =
    task.urgency !== undefined ? Math.round(logToLinear(task.urgency)) : 5

  // Local state for slider values
  const [localImportance, setLocalImportance] = useState(initialLinearImportance)
  const [localUrgency, setLocalUrgency] = useState(initialLinearUrgency)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleImportanceChange = (value: number) => {
    setLocalImportance(value)
  }

  const handleUrgencyChange = (value: number) => {
    setLocalUrgency(value)
  }

  const handleSavePriority = () => {
    onUpdateTask(task.id, {
      importance: linearToLog(localImportance),
      urgency: linearToLog(localUrgency),
    })
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[280px]"
      style={{ left: x, top: y }}
    >
      {!showPriorityEdit ? (
        // Task Actions Menu
        <div className="py-2">
          <div className="px-4 py-2 border-b dark:border-gray-700">
            <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
              {task.label}
            </p>
          </div>

          <div className="py-1">
            {task.status !== 'completed' && onTaskComplete && (
              <button
                onClick={() => {
                  onTaskComplete(task.id, true)
                  onClose()
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Mark Complete</span>
              </button>
            )}

            {task.status === 'completed' && onTaskComplete && (
              <button
                onClick={() => {
                  onTaskComplete(task.id, false)
                  onClose()
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <RotateCcw className="w-4 h-4 text-gray-600" />
                <span>Mark Incomplete</span>
              </button>
            )}

            {onRecordAttempt && (
              <button
                onClick={() => {
                  onRecordAttempt(task.id)
                  onClose()
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Record Attempt</span>
                {task.attempts && task.attempts.length > 0 && (
                  <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                    {task.attempts.length}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setShowPriorityEdit(true)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
            >
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Edit Priority</span>
            </button>

            {onMakeRecurring && (
              <button
                onClick={() => {
                  onMakeRecurring(task.id)
                  onClose()
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <Repeat className="w-4 h-4 text-purple-600" />
                <span>Make Recurring</span>
              </button>
            )}

            {onAddSubtask && (
              <button
                onClick={() => {
                  onAddSubtask(task.id)
                  onClose()
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Add Subtask</span>
              </button>
            )}

            {/* Collapse/Expand Options */}
            {task.hasChildren && !task.isCollapsed && onCollapseChildren && (
              <button
                onClick={() => {
                  onCollapseChildren(task.id)
                  onClose()
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <ChevronUp className="w-4 h-4 text-orange-600" />
                <span>Collapse Children</span>
                {task.childrenCount && (
                  <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                    {task.childrenCount}
                  </span>
                )}
              </button>
            )}

            {task.hasChildren && task.isCollapsed && onExpandChildren && (
              <button
                onClick={() => {
                  onExpandChildren(task.id)
                  onClose()
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <ChevronDown className="w-4 h-4 text-green-600" />
                <span>Expand Children</span>
                {task.childrenCount && (
                  <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                    {task.childrenCount}
                  </span>
                )}
              </button>
            )}

            {task.parentId && task.parentLabel && onCollapseToParent && (
              <button
                onClick={() => {
                  onCollapseToParent(task.id, task.parentId!)
                  onClose()
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Collapse to {task.parentLabel}</span>
              </button>
            )}

            {onDeleteTask && (
              <>
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Are you sure you want to delete "${task.label}"? This action cannot be undone.`
                      )
                    ) {
                      onDeleteTask(task.id)
                      onClose()
                    }
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Task</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        // Priority Edit View
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Edit Task Priority</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {task.label}
              </p>
              {task.dueDate && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Due: {format(new Date(task.dueDate), 'MMM d')} -{' '}
                    {getDueDateDescription(task.dueDate)}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Importance: {localImportance}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={localImportance}
                onChange={e => handleImportanceChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Not Important</span>
                <span>Very Important</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Urgency: {localUrgency}
                </label>
                {task.dueDate && (
                  <button
                    onClick={() => {
                      const calculatedUrgency = calculateUrgencyFromDueDate(task.dueDate)
                      if (calculatedUrgency !== undefined) {
                        setLocalUrgency(Math.round(logToLinear(calculatedUrgency)))
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Auto-set from due date
                  </button>
                )}
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={localUrgency}
                onChange={e => handleUrgencyChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Not Urgent</span>
                <span>Very Urgent</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t dark:border-gray-700">
              <div className="text-center p-2 rounded bg-gray-50 dark:bg-gray-900">
                <p className="text-xs text-gray-500 dark:text-gray-400">Quadrant</p>
                <p className="text-sm font-medium">
                  {localImportance >= 5 && localUrgency >= 5 && '🔥 Do First'}
                  {localImportance >= 5 && localUrgency < 5 && '📅 Schedule'}
                  {localImportance < 5 && localUrgency >= 5 && '👥 Delegate'}
                  {localImportance < 5 && localUrgency < 5 && '🗑️ Eliminate'}
                </p>
              </div>
              <button
                onClick={handleSavePriority}
                className="px-4 py-2 bg-brain-600 text-white rounded hover:bg-brain-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
