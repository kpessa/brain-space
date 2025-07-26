'use client'

import { useState, useEffect } from 'react'
import { Calendar, Cloud, ChevronRight, Check, ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useCalendarStore } from '@/store/calendarStore'
import { googleCalendarService } from '@/services/googleCalendar'

// Google icon component
const GoogleIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

export default function CalendarSettingsClient({ userId }: { userId: string }) {
  const { selectedCalendarIds, toggleCalendarSelection } = useCalendarStore()
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [availableCalendars, setAvailableCalendars] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkGoogleConnection()
  }, [])

  const checkGoogleConnection = async () => {
    try {
      // Wait for Google APIs to load
      let attempts = 0
      while (!googleCalendarService.isReady() && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500))
        attempts++
      }

      if (!googleCalendarService.isReady()) {
        console.error('Google Calendar APIs failed to load')
        setIsLoading(false)
        return
      }

      // Check if already authorized
      const authorized = await googleCalendarService.authorize(true)
      setIsGoogleConnected(authorized)
      
      if (authorized) {
        const calendars = await googleCalendarService.listCalendars()
        setAvailableCalendars(calendars)
      }
    } catch (error) {
      console.error('Error checking Google connection:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleConnect = async () => {
    try {
      setIsLoading(true)
      const authorized = await googleCalendarService.authorize(false)
      setIsGoogleConnected(authorized)
      
      if (authorized) {
        const calendars = await googleCalendarService.listCalendars()
        setAvailableCalendars(calendars)
      }
    } catch (error) {
      console.error('Error connecting to Google:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleDisconnect = async () => {
    try {
      await googleCalendarService.signOut()
      setIsGoogleConnected(false)
      setAvailableCalendars([])
      // Clear all selected calendars
      selectedCalendarIds.forEach(id => toggleCalendarSelection(id))
    } catch (error) {
      console.error('Error disconnecting from Google:', error)
    }
  }

  const googleCalendarCount = availableCalendars.filter(cal => 
    selectedCalendarIds.has(cal.id)
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/calendar">
            <Button variant="ghost" size="sm" className="text-white hover:text-white/80 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Calendar
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Calendar Settings</h1>
          </div>
          
          <p className="text-white/80">
            Connect your calendars to sync events with Brain Space. Your calendar data is stored
            securely with Firebase and accessed through Google's OAuth API.
          </p>
        </div>

        <div className="space-y-4">
          {/* Google Calendar Connection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <GoogleIcon />
                  <div>
                    <CardTitle>Google Calendar</CardTitle>
                    <CardDescription>
                      Connect with your Google account using OAuth
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isGoogleConnected && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brain-600"></div>
                </div>
              ) : !isGoogleConnected ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Sign in with Google to sync your calendars and events
                  </p>
                  <Button variant="primary" onClick={handleGoogleConnect}>
                    <GoogleIcon />
                    <span className="ml-2">Connect Google Account</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Select which calendars to display in Brain Space:
                  </p>
                  <div className="space-y-2">
                    {availableCalendars.map(calendar => (
                      <label
                        key={calendar.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCalendarIds.has(calendar.id)}
                          onChange={() => toggleCalendarSelection(calendar.id)}
                          className="w-5 h-5 text-brain-600 rounded focus:ring-brain-500"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: calendar.backgroundColor || '#4285F4' }}
                          />
                          <span className="font-medium">{calendar.summary}</span>
                          {calendar.primary && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                              Primary
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="pt-4 border-t">
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={handleGoogleDisconnect}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Disconnect Google Account
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connected Calendars Summary */}
          {isGoogleConnected && googleCalendarCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Connected Services</CardTitle>
                <CardDescription>Your calendar sync status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Cloud className="w-5 h-5 text-blue-500" />
                    <span className="text-sm">
                      Google Calendar: {googleCalendarCount} calendar{googleCalendarCount !== 1 ? 's' : ''} syncing
                    </span>
                  </div>
                </div>
                <Link href="/calendar">
                  <Button variant="primary" className="mt-4">
                    View Combined Calendar
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Privacy Notice */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-800">Privacy & Security</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                <p className="text-sm text-blue-700">
                  Your calendar authentication tokens are securely stored in Firebase. Google OAuth
                  ensures we never see your Google password. Calendar data is fetched directly from
                  Google's APIs and processed in your browser.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Future Integrations */}
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>Additional calendar integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">O</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Outlook Calendar</h4>
                    <p className="text-sm text-gray-600">Microsoft 365 integration</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Apple Calendar</h4>
                    <p className="text-sm text-gray-600">iCloud calendar sync</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}