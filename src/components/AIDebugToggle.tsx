import React from 'react'
import { useBrainDumpStore } from '../store/braindump'

export const AIDebugToggle: React.FC = () => {
  const { isDebugMode, toggleDebugMode } = useBrainDumpStore()

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="debug-toggle" className="text-sm font-medium text-gray-700">
        AI Debug Mode
      </label>
      <button
        id="debug-toggle"
        type="button"
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors focus:outline-none focus:ring-2 focus:ring-brain-500 focus:ring-offset-2
          ${isDebugMode ? 'bg-brain-600' : 'bg-gray-200'}
        `}
        onClick={toggleDebugMode}
        aria-pressed={isDebugMode}
      >
        <span className="sr-only">Toggle AI debug mode</span>
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${isDebugMode ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  )
}