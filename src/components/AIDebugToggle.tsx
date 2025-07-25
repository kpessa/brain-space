import { useState, useEffect } from 'react'
import { Bug } from 'lucide-react'

export function AIDebugToggle() {
  const [debugMode, setDebugMode] = useState(() => 
    localStorage.getItem('ai_debug') === 'true'
  )

  useEffect(() => {
    localStorage.setItem('ai_debug', debugMode.toString())
  }, [debugMode])

  return (
    <button
      onClick={() => setDebugMode(!debugMode)}
      className={`fixed bottom-4 right-4 p-2 rounded-full transition-colors ${
        debugMode 
          ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
          : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
      }`}
      title={debugMode ? 'AI Debug ON' : 'AI Debug OFF'}
    >
      <Bug className="h-5 w-5" />
    </button>
  )
}