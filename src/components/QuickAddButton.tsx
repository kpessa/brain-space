import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuickAddModal } from './QuickAddModal'

interface QuickAddButtonProps {
  className?: string
}

export function QuickAddButton({ className }: QuickAddButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          // Base styles
          'fixed bottom-6 right-6 z-40',
          'flex items-center justify-center',
          'w-14 h-14 rounded-full',
          'bg-brain-600 hover:bg-brain-700 text-white',
          'shadow-lg hover:shadow-xl',
          'transition-all duration-200 ease-in-out',
          'hover:scale-105 active:scale-95',
          // Mobile adjustments
          'sm:bottom-8 sm:right-8',
          // Ensure it's above bottom navigation on mobile
          'mb-16 sm:mb-0',
          className
        )}
        title="Add Task"
        aria-label="Add new task"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Quick Add Modal */}
      <QuickAddModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
