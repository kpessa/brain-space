import { Calendar, FileText, Target, Trash2 } from 'lucide-react'
import type { BrainDumpEntry } from '../types/braindump'
import { useBrainDumpStore } from '../store/braindump'

interface BrainDumpItemProps {
  entry: BrainDumpEntry
  isActive: boolean
  onClick: () => void
}

export function BrainDumpItem({ entry, isActive, onClick }: BrainDumpItemProps) {
  const { deleteEntry } = useBrainDumpStore()

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering onClick

    const message =
      entry.type === 'topic-focused'
        ? `Are you sure you want to delete the topic brain dump "${entry.title}"? This cannot be undone.`
        : `Are you sure you want to delete "${entry.title}"? This cannot be undone.`

    if (window.confirm(message)) {
      deleteEntry(entry.id)
    }
  }

  return (
    <div
      className={`p-3 rounded-lg cursor-pointer transition-all group ${
        isActive ? 'bg-brain-100 border-brain-300' : 'hover:bg-gray-50 border-transparent'
      } border`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm truncate">{entry.title}</h3>
            {entry.type === 'topic-focused' && (
              <Target className="w-3 h-3 text-brain-600 flex-shrink-0" title="Topic-focused" />
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(entry.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {entry.nodes?.length || 0} nodes
            </span>
          </div>
          {entry.topicFocus && (
            <div className="mt-1">
              <span className="text-xs px-2 py-0.5 bg-brain-100 text-brain-700 rounded-full">
                {entry.topicFocus}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 rounded-md"
          title="Delete brain dump"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </div>
  )
}
