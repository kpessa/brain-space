'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { googleCalendarService } from '@/services/googleCalendar'
import { EightWeekViewComponent } from '@/components/calendar/EightWeekView'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react'
import { useCalendarStore } from '@/store/calendarStore'

export default function CalendarPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { selectedCalendarIds } = useCalendarStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<any[]>([])
  const [calendars, setCalendars] = useState<any[]>([])
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check Google Calendar authorization on mount
  useEffect(() => {
    checkAuthorization()
  }, [])

  // Load events when authorized or selection changes
  useEffect(() => {
    if (isAuthorized) {
      loadCalendarsAndEvents()
    }
  }, [isAuthorized, currentDate, selectedCalendarIds])

  const checkAuthorization = async () => {
    try {
      // First try manual initialization
      // Checking Google Calendar authorization...
      const initStatus = await googleCalendarService.initializeManually()
      // Initialization status check

      // Wait for Google APIs to load
      let attempts = 0
      while (!googleCalendarService.isReady() && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500))
        attempts++
      }

      if (!googleCalendarService.isReady()) {
        // Google Calendar APIs failed to load after manual init
        // Final status check
        setIsLoading(false)
        return
      }

      // Try to authorize with existing token
      const authorized = await googleCalendarService.authorize(true)
      setIsAuthorized(authorized)
    } catch (error) {
      // Error checking authorization
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuthorize = async () => {
    try {
      setIsLoading(true)
      const authorized = await googleCalendarService.authorize(false)
      setIsAuthorized(authorized)
      if (authorized) {
        await loadCalendarsAndEvents()
      }
    } catch (error) {
      // Error authorizing
    } finally {
      setIsLoading(false)
    }
  }

  // const handleDisconnect = async () => {
  //   try {
  //     await googleCalendarService.signOut()
  //     setIsAuthorized(false)
  //     setEvents([])
  //     setCalendars([])
  //   } catch (error) {
  //     console.error('Error disconnecting:', error)
  //   }
  // }

  const loadCalendarsAndEvents = async () => {
    try {
      // Load calendars
      const calendarList = await googleCalendarService.listCalendars()
      setCalendars(calendarList)

      // Load events from selected calendars only
      const allEvents: any[] = []
      const timeMin = new Date()
      timeMin.setMonth(timeMin.getMonth() - 1)
      const timeMax = new Date()
      timeMax.setMonth(timeMax.getMonth() + 3)

      // Filter calendars based on selection
      const calendarsToLoad = selectedCalendarIds.size > 0 
        ? calendarList.filter(cal => selectedCalendarIds.has(cal.id))
        : calendarList // If none selected, show all (first time user experience)

      // Loading events from calendars

      for (const calendar of calendarsToLoad) {
        try {
          const calendarEvents = await googleCalendarService.listEvents(
            calendar.id,
            timeMin,
            timeMax
          )
          
          // Transform events to format expected by calendar component
          const transformedEvents = calendarEvents.map((event: any) => ({
            id: event.id,
            title: event.summary || 'Untitled',
            start: event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date),
            end: event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date),
            allDay: !event.start.dateTime,
            resource: {
              calendarId: calendar.id,
              calendarName: calendar.summary,
              backgroundColor: calendar.backgroundColor,
              foregroundColor: calendar.foregroundColor,
              originalEvent: event,
            },
          }))
          
          allEvents.push(...transformedEvents)
        } catch (error) {
          // Error loading events from calendar
        }
      }

      setEvents(allEvents)
    } catch (error) {
      // Error loading calendars and events
    }
  }

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate)
  }

  const handleSelectEvent = (event: any) => {
    // Selected event
    // TODO: Show event details modal
  }

  const handleSelectSlot = (slotInfo: any) => {
    // Selected slot
    // TODO: Show create event modal
  }

  const eventPropGetter = (event: any) => {
    // Get calendar color if available
    const calendar = calendars.find(c => c.id === event.resource?.calendarId)
    const backgroundColor = calendar?.backgroundColor || '#3174ad'
    
    return {
      style: {
        backgroundColor,
        borderColor: backgroundColor,
      },
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 56) // 8 weeks
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 56) // 8 weeks
    setCurrentDate(newDate)
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-8 w-8 text-brain-600" />
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {isAuthorized && (
              <>
                <button
                  onClick={() => router.push('/calendar/settings')}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Calendar Settings"
                >
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {/* TODO: Show create event modal */}}
                  className="flex items-center space-x-2 px-4 py-2 bg-brain-600 text-white rounded-lg hover:bg-brain-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Event</span>
                </button>
              </>
            )}
          </div>
        </div>

        {!isAuthorized && !isLoading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Connect Your Google Calendar
            </h3>
            <p className="text-yellow-800 mb-4">
              Authorize Brain Space to access your Google Calendar to view and manage your events.
            </p>
            <button
              onClick={handleAuthorize}
              className="px-6 py-2 bg-brain-600 text-white rounded-lg hover:bg-brain-700 transition-colors"
            >
              Connect Google Calendar
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brain-600"></div>
          </div>
        )}

        {isAuthorized && !isLoading && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPrevious}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Previous 8 weeks"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={goToNext}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Next 8 weeks"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              
              <div className="text-lg font-semibold text-gray-900">
                {new Date(currentDate).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </div>
            </div>

            {/* Calendar selection indicator */}
            {selectedCalendarIds.size > 0 && selectedCalendarIds.size < calendars.length && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-blue-800">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    Showing {selectedCalendarIds.size} of {calendars.length} calendars
                  </span>
                </div>
                <button
                  onClick={() => router.push('/calendar/settings')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Change selection
                </button>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <EightWeekViewComponent
                date={currentDate}
                events={events}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                eventPropGetter={eventPropGetter}
                onNavigate={handleNavigate}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}