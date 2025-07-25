import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Cloud, ChevronRight, Check } from 'lucide-react'
import { googleCalendarService } from '../services/googleCalendarWrapper'
import { useCalendarStore } from '../store/calendarStore'

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

export const CalendarSettings: React.FC = () => {
  const { selectedCalendarIds } = useCalendarStore()
  const isGoogleConnected = googleCalendarService.isAuthorized()

  const googleCalendarCount = selectedCalendarIds.size

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-8 h-8 text-brain-600" />
        <h1 className="text-2xl font-bold">Calendar Settings</h1>
      </div>

      <p className="text-gray-600 mb-8">
        Connect your calendars to sync events with Brain Space. Your calendar data stays private and
        is only accessible in your browser.
      </p>

      <div className="space-y-4">
        {/* Google Calendar */}
        <Link
          to="/calendar-test"
          className="block bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <GoogleIcon />
              <div>
                <h3 className="text-lg font-semibold">Google Calendar</h3>
                <p className="text-sm text-gray-600">
                  Connect with your Google account using OAuth
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isGoogleConnected && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {googleCalendarCount} calendar{googleCalendarCount !== 1 ? 's' : ''} selected
                  </span>
                </div>
              )}
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </Link>
      </div>

      {/* Connected Calendars Summary */}
      {isGoogleConnected && (
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Connected Services</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-500" />
              <span>Google Calendar: {googleCalendarCount} calendars syncing</span>
            </div>
          </div>
          <Link
            to="/calendar"
            className="inline-flex items-center gap-2 mt-3 text-brain-600 hover:text-brain-700 font-medium"
          >
            View Combined Calendar
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
        <h4 className="font-semibold text-blue-800 mb-1">Privacy & Security</h4>
        <p className="text-sm text-blue-700">
          Your calendar data is processed locally in your browser. We never send your calendar
          events or credentials to our servers. Google uses OAuth for secure authentication.
        </p>
      </div>
    </div>
  )
}
