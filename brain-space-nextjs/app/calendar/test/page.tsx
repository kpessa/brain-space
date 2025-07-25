'use client'

import { useState, useEffect } from 'react'
import { googleCalendarService } from '@/services/googleCalendar'

export default function CalendarTestPage() {
  const [status, setStatus] = useState<any>({})
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    checkGoogleAPIs()
  }, [])

  const checkGoogleAPIs = async () => {
    addLog('Starting Google API check...')
    
    // Check environment variables
    addLog(`Client ID: ${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Present' : 'Missing'}`)
    addLog(`API Key: ${process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? 'Present' : 'Missing'}`)
    
    // Check initial window objects
    addLog(`window.gapi: ${!!window.gapi}`)
    addLog(`window.google: ${!!window.google}`)
    
    // Get initial status
    const initialStatus = googleCalendarService.getInitStatus()
    setStatus(initialStatus)
    addLog(`Initial status: ${JSON.stringify(initialStatus)}`)
    
    // Wait a bit for any existing scripts
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Try manual initialization
    addLog('Attempting manual initialization...')
    const finalStatus = await googleCalendarService.initializeManually()
    setStatus(finalStatus)
    addLog(`Final status: ${JSON.stringify(finalStatus)}`)
    
    // Check window objects again
    addLog(`window.gapi after init: ${!!window.gapi}`)
    addLog(`window.google after init: ${!!window.google}`)
  }

  const testAuth = async () => {
    addLog('Testing authorization...')
    try {
      const result = await googleCalendarService.authorize(false)
      addLog(`Authorization result: ${result}`)
    } catch (error) {
      addLog(`Authorization error: ${error}`)
    }
  }

  const retryInit = async () => {
    addLog('Retrying initialization...')
    const newStatus = await googleCalendarService.initializeManually()
    setStatus(newStatus)
    addLog(`New status: ${JSON.stringify(newStatus)}`)
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Google Calendar API Test</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Status</h2>
        <div className="space-y-1 text-sm font-mono">
          <div>GAPI Initialized: {status.gapiInited ? '✅' : '❌'}</div>
          <div>GIS Initialized: {status.gisInited ? '✅' : '❌'}</div>
          <div>Env Vars Present: {status.hasEnvVars ? '✅' : '❌'}</div>
        </div>
      </div>

      <div className="mb-6 space-x-2">
        <button 
          onClick={retryInit}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry Init
        </button>
        <button 
          onClick={testAuth}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Auth
        </button>
      </div>

      <div className="p-4 bg-gray-900 text-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Logs</h2>
        <div className="space-y-1 text-xs font-mono">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  )
}