import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import { Login } from './components/Login'
import { useSupabaseSync } from './hooks/useSupabaseSync'
import { logger } from './services/logger'
import { ErrorBoundary } from './components/ErrorBoundary'
import Home from './pages/Home'
import Journal from './pages/Journal'
import JournalEntry from './pages/JournalEntry'
import EditJournalEntry from './pages/EditJournalEntry'
import ViewJournalEntry from './pages/ViewJournalEntry'
import Progress from './pages/Progress'
import BrainDump from './pages/BrainDump'
import AuthTest from './pages/AuthTest'
import { TestAuth } from './pages/TestAuth'
import { AuthCallback } from './components/AuthCallback'
import { AuthDiagnostic } from './pages/AuthDiagnostic'
import DatabaseSetup from './pages/DatabaseSetup'
import TestJournalFix from './pages/TestJournalFix'
import DebugJournal from './pages/DebugJournal'
import RecalculateProgress from './pages/RecalculateProgress'
import Timebox from './pages/Timebox'

function AppContent() {
  const { user, loading } = useAuth()
  useSupabaseSync()

  // Set up global keyboard shortcut for downloading logs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'L') {
        e.preventDefault()
        logger.info('USER', 'Downloading logs via keyboard shortcut', {
          key: e.key,
          keyCode: e.keyCode,
          timestamp: new Date().toISOString(),
        })
        logger.downloadLogs()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brain-600 via-space-600 to-brain-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading your adventure...</p>
        </div>
      </div>
    )
  }

  // In offline mode or when user is authenticated, show the app
  // Otherwise show auth form
  const isAuthenticated = user !== null

  return (
    <ErrorBoundary
      context="Router"
      isolate={true}
      resetKeys={user?.id ? [user.id] : []}
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brain-600 via-space-600 to-brain-700">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Navigation Error</h1>
            <p>There was an error loading this page.</p>
            <button
              onClick={() => (window.location.href = '/')}
              className="mt-4 px-4 py-2 bg-white text-brain-600 rounded-lg hover:bg-gray-100"
            >
              Return Home
            </button>
          </div>
        </div>
      }
    >
      <Router>
        <Routes>
          {/* Auth callback route - available regardless of auth status */}
          <Route path="/auth-callback" element={<AuthCallback />} />

          {isAuthenticated ? (
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="journal" element={<Journal />} />
              <Route path="journal/new" element={<JournalEntry />} />
              <Route path="journal/edit/:id" element={<EditJournalEntry />} />
              <Route path="journal/view/:id" element={<ViewJournalEntry />} />
              <Route path="braindump" element={<BrainDump />} />
              <Route path="progress" element={<Progress />} />
              <Route path="database-setup" element={<DatabaseSetup />} />
              <Route path="test-journal-fix" element={<TestJournalFix />} />
              <Route path="debug-journal" element={<DebugJournal />} />
              <Route path="recalculate-progress" element={<RecalculateProgress />} />
              <Route path="timebox" element={<Timebox />} />
            </Route>
          ) : (
            <>
              <Route path="/auth" element={<Login />} />
              <Route path="/auth-test" element={<AuthTest />} />
              <Route path="/test-auth" element={<TestAuth />} />
              <Route path="/auth-diagnostic" element={<AuthDiagnostic />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </>
          )}
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

function App() {
  return (
    <ErrorBoundary
      context="App"
      resetOnPropsChange={false}
      onError={(error, errorInfo) => {
        logger.error('APP', 'Top-level application error', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        })
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
