import { useState, useEffect } from 'react'
import { useAuthWrapper } from '../hooks/useAuthWrapper'
import { googleCalendarService } from '../services/googleCalendarWrapper'
import { Button } from '../components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card'
import { Calendar, CheckCircle, XCircle, RefreshCw, LogOut } from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

interface CalendarInfo {
  id: string
  summary: string
  primary?: boolean
  backgroundColor?: string
}

interface EventInfo {
  id?: string
  summary: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
}

export default function GoogleCalendarTest() {
  const { user } = useAuthWrapper()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [calendars, setCalendars] = useState<CalendarInfo[]>([])
  const [events, setEvents] = useState<EventInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [tokenInFirestore, setTokenInFirestore] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Debug: Check environment variables
  useEffect(() => {
    console.log('Google Calendar Environment Variables:', {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'present' : 'missing',
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY ? 'present' : 'missing',
      discoveryDoc: import.meta.env.VITE_GOOGLE_CALENDAR_DISCOVERY_DOC,
      scopes: import.meta.env.VITE_GOOGLE_CALENDAR_SCOPES,
    })
  }, [])

  // Check authorization status on mount
  useEffect(() => {
    // Give Google APIs time to load
    const timer = setTimeout(() => {
      checkAuthStatus()
    }, 1000)
    
    // Also check periodically if APIs are not ready
    const interval = setInterval(() => {
      const status = googleCalendarService.getInitStatus()
      if (status.gapiInited && status.gisInited) {
        clearInterval(interval)
      }
      // Force re-render to update status display
      setLoading(prev => prev)
    }, 500)
    
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [user])

  const checkAuthStatus = async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    try {
      // Check if authorized
      const authorized = await googleCalendarService.authorize(true)
      setIsAuthorized(authorized)

      // Check if token exists in Firestore
      const userRef = doc(db, 'users', user.uid, 'settings', 'googleCalendar')
      const docSnap = await getDoc(userRef)
      setTokenInFirestore(docSnap.exists() && !!docSnap.data()?.google_access_token)

      if (authorized) {
        // If authorized, fetch calendars
        await fetchCalendars()
      }
    } catch (err) {
      console.error('Error checking auth status:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to check authorization status: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthorize = async () => {
    setLoading(true)
    setError(null)
    try {
      const success = await googleCalendarService.authorize()
      setIsAuthorized(success)
      
      if (success) {
        // Check token storage
        const userRef = doc(db, 'users', user!.uid, 'settings', 'googleCalendar')
        const docSnap = await getDoc(userRef)
        setTokenInFirestore(docSnap.exists() && !!docSnap.data()?.google_access_token)
        
        // Fetch calendars after authorization
        await fetchCalendars()
      } else {
        setError('Authorization failed')
      }
    } catch (err) {
      console.error('Error during authorization:', err)
      setError('Failed to authorize with Google Calendar')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await googleCalendarService.signOut()
      setIsAuthorized(false)
      setCalendars([])
      setEvents([])
      setTokenInFirestore(false)
    } catch (err) {
      console.error('Error signing out:', err)
      setError('Failed to sign out')
    } finally {
      setLoading(false)
    }
  }

  const fetchCalendars = async () => {
    try {
      const calendarList = await googleCalendarService.listCalendars()
      setCalendars(calendarList)
    } catch (err) {
      console.error('Error fetching calendars:', err)
      setError('Failed to fetch calendars')
    }
  }

  const fetchEvents = async (calendarId: string = 'primary') => {
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      const eventList = await googleCalendarService.listEvents(
        calendarId,
        now,
        oneMonthLater,
        50
      )
      setEvents(eventList)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError('Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const createTestEvent = async () => {
    setLoading(true)
    setError(null)
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(14, 0, 0, 0)

      const endTime = new Date(tomorrow)
      endTime.setHours(15, 0, 0, 0)

      const event = await googleCalendarService.createEvent('primary', {
        summary: 'Test Event from Brain Space',
        description: 'This is a test event created from the Brain Space app',
        start: {
          dateTime: tomorrow.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      })

      if (event) {
        setError(null)
        // Refresh events
        await fetchEvents()
      } else {
        setError('Failed to create event')
      }
    } catch (err) {
      console.error('Error creating event:', err)
      setError('Failed to create test event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-brain-500" />
              <div>
                <CardTitle>Google Calendar Test</CardTitle>
                <CardDescription>Test Google Calendar OAuth2 with Firebase</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Auth Status */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">Authentication Status</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    {user ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span>Firebase Auth: {user ? `Logged in as ${user.email}` : 'Not logged in'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAuthorized ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span>Google Calendar: {isAuthorized ? 'Authorized' : 'Not authorized'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tokenInFirestore ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span>Token in Firestore: {tokenInFirestore ? 'Stored' : 'Not stored'}</span>
                  </div>
                </div>
                
                {/* API Init Status */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 mb-1">API Initialization</h4>
                  <div className="space-y-1 text-xs text-gray-500">
                    {(() => {
                      const status = googleCalendarService.getInitStatus()
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            {status.hasEnvVars ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span>Environment Variables</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {status.gapiInited ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span>Google API Client (GAPI)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {status.gisInited ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span>Google Identity Services (GIS)</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!isAuthorized ? (
                  <Button
                    onClick={handleAuthorize}
                    disabled={loading || !user}
                    variant="primary"
                  >
                    {loading ? 'Authorizing...' : 'Authorize Google Calendar'}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => checkAuthStatus()}
                      disabled={loading}
                      variant="outline"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Status
                    </Button>
                    <Button
                      onClick={handleSignOut}
                      disabled={loading}
                      variant="outline"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                )}
              </div>

              {/* Calendars */}
              {isAuthorized && calendars.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Your Calendars</h3>
                  <div className="grid gap-2">
                    {calendars.map((calendar) => (
                      <div
                        key={calendar.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                          />
                          <span className="font-medium">
                            {calendar.summary}
                            {calendar.primary && (
                              <span className="ml-2 text-xs text-gray-500">(Primary)</span>
                            )}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchEvents(calendar.id)}
                          disabled={loading}
                        >
                          View Events
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Event Creation */}
              {isAuthorized && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Test Operations</h3>
                  <Button
                    onClick={createTestEvent}
                    disabled={loading}
                    variant="primary"
                  >
                    Create Test Event (Tomorrow at 2 PM)
                  </Button>
                </div>
              )}

              {/* Events */}
              {events.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Upcoming Events</h3>
                  <div className="grid gap-2 max-h-96 overflow-y-auto">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 bg-white rounded-lg border"
                      >
                        <h4 className="font-medium">{event.summary}</h4>
                        <p className="text-sm text-gray-600">
                          {event.start.dateTime
                            ? new Date(event.start.dateTime).toLocaleString()
                            : event.start.date}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}