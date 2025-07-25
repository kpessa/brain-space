import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LayoutWrapper from './components/LayoutWrapper'
import { AuthProvider as SupabaseAuthProvider } from './contexts/AuthContext'
import {
  FirebaseAuthProvider,
  useAuthProvider,
  useFirebaseAuth,
} from './contexts/FirebaseAuthContext'
import { useAuth } from './contexts/AuthContext'
import { Login } from './components/Login'
import { FirebaseLogin } from './components/FirebaseLogin'
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
import { AuthCallback } from './components/AuthCallback'
import Timebox from './pages/Timebox'
import { Matrix } from './pages/Matrix'
import Routines from './pages/Routines'
import GoogleCalendarTest from './pages/GoogleCalendarTest'
import { CalendarView } from './pages/CalendarView'
import { CalendarSettings } from './pages/CalendarSettings'
import UnifiedTodos from './pages/UnifiedTodos'
import TodoDashboard from './pages/TodoDashboard'
import TestPage from './pages/TestPage'
import { Nodes } from './pages/Nodes'

// Separate components for each auth provider
function SupabaseAppContent() {
  const { user, loading, signOut } = useAuth()
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
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brain-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <Routes>
      <Route path="/" element={<LayoutWrapper user={user} signOut={signOut} />}>
        <Route index element={<Home />} />
        <Route path="test" element={<TestPage />} />
        <Route path="journal" element={<Journal />} />
        <Route path="journal/new" element={<JournalEntry />} />
        <Route path="journal/:date/edit" element={<EditJournalEntry />} />
        <Route path="journal/:date" element={<ViewJournalEntry />} />
        <Route path="progress" element={<Progress />} />
        <Route path="braindump" element={<BrainDump />} />
        <Route path="braindump/:brainDumpId" element={<BrainDump />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route path="timebox" element={<Timebox />} />
        <Route path="matrix" element={<Matrix />} />
        <Route path="routines" element={<Routines />} />
        <Route path="calendar-test" element={<GoogleCalendarTest />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="calendar/settings" element={<CalendarSettings />} />
        <Route path="todos" element={<UnifiedTodos />} />
        <Route path="todo-dashboard" element={<TodoDashboard />} />
        <Route path="nodes" element={<Nodes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function FirebaseAppContent() {
  const { user, loading, signOut } = useFirebaseAuth()
  // Don't use Supabase sync when using Firebase auth

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
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brain-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <FirebaseLogin />
  }

  return (
    <Routes>
      <Route path="/" element={<LayoutWrapper user={user} signOut={signOut} />}>
        <Route index element={<Home />} />
        <Route path="test" element={<TestPage />} />
        <Route path="journal" element={<Journal />} />
        <Route path="journal/new" element={<JournalEntry />} />
        <Route path="journal/:date/edit" element={<EditJournalEntry />} />
        <Route path="journal/:date" element={<ViewJournalEntry />} />
        <Route path="progress" element={<Progress />} />
        <Route path="braindump" element={<BrainDump />} />
        <Route path="braindump/:brainDumpId" element={<BrainDump />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route path="timebox" element={<Timebox />} />
        <Route path="matrix" element={<Matrix />} />
        <Route path="routines" element={<Routines />} />
        <Route path="calendar-test" element={<GoogleCalendarTest />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="calendar/settings" element={<CalendarSettings />} />
        <Route path="todos" element={<UnifiedTodos />} />
        <Route path="todo-dashboard" element={<TodoDashboard />} />
        <Route path="nodes" element={<Nodes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  const useFirebase = useAuthProvider()

  if (useFirebase) {
    return (
      <ErrorBoundary>
        <FirebaseAuthProvider>
          <Router>
            <FirebaseAppContent />
          </Router>
        </FirebaseAuthProvider>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <SupabaseAuthProvider>
        <Router>
          <SupabaseAppContent />
        </Router>
      </SupabaseAuthProvider>
    </ErrorBoundary>
  )
}
