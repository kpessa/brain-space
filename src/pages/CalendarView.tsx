import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import type { Event, View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../styles/calendar.css'
import { googleCalendarService } from '../services/googleCalendar'
import { useCalendarStore } from '../store/calendarStore'
import { EightWeekView, EightWeekViewComponent } from '../components/EightWeekView'

const localizer = momentLocalizer(moment)

// Add custom 8-week view to views
const customViews = {
  eightWeek: EightWeekViewComponent
}

interface CalendarInfo {
  id: string
  summary: string
  backgroundColor?: string
  foregroundColor?: string
}

interface CalendarEvent extends Event {
  id?: string
  title: string
  start: Date
  end: Date
  resource?: {
    calendarId: string
    calendarName: string
    backgroundColor?: string
    originalEvent: any
  }
}

export const CalendarView: React.FC = () => {
  const { selectedCalendarIds } = useCalendarStore()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [calendars, setCalendars] = useState<CalendarInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<View | 'eightWeek'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  
  // Cache to avoid repeated API calls
  const [eventCache, setEventCache] = useState<{ [key: string]: CalendarEvent[] }>({})
  const [cacheTimestamp, setCacheTimestamp] = useState<{ [key: string]: number }>({})

  // Load calendars on mount
  useEffect(() => {
    const initializeCalendars = async () => {
      const allCalendars: CalendarInfo[] = []
      
      // Try Google Calendar
      try {
        await googleCalendarService.initialize()
        await googleCalendarService.authenticate()
        setIsGoogleAuthenticated(true)
        
        const googleCalendars = await googleCalendarService.listCalendars()
        allCalendars.push(...googleCalendars)
      } catch (err) {
        console.log('Google Calendar not authenticated:', err)
      }
      
      setCalendars(allCalendars)
      
      if (allCalendars.length === 0) {
        setError('Please authenticate with Google Calendar')
      }
    }
    
    initializeCalendars()
  }, [])

  // Load events when calendars or date range changes
  useEffect(() => {
    if (isGoogleAuthenticated && selectedCalendarIds.size > 0) {
      loadEvents()
    }
  }, [isGoogleAuthenticated, selectedCalendarIds, currentDate, currentView])

  const loadEvents = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Calculate extended date range for better event coverage
      let start: Date, end: Date
      
      if (currentView === 'eightWeek') {
        // For 8-week view, load 1 year before and 1 year after for maximum coverage
        start = moment(currentDate).subtract(1, 'year').startOf('month').toDate()
        end = moment(currentDate).add(1, 'year').endOf('month').toDate()
      } else {
        // For other views, load 6 months before and 6 months after
        start = moment(currentDate).subtract(6, 'months').startOf('month').toDate()
        end = moment(currentDate).add(6, 'months').endOf('month').toDate()
      }
      
      const allEvents: CalendarEvent[] = []
      
      console.log(`Loading events from ${start.toLocaleDateString()} to ${end.toLocaleDateString()} for ${currentView} view`)
      
      for (const calendarId of selectedCalendarIds) {
        try {
          const calendar = calendars.find(cal => cal.id === calendarId)
          // Google Calendar
          const eventList = await googleCalendarService.listEvents(calendarId, start, end)
          
          const formattedEvents = eventList.map(event => {
            // For all-day events, we need to handle the dates specially
            let startDate, endDate
            
            if (event.start.date && !event.start.dateTime) {
              // All-day event - parse as date only and set to midnight
              startDate = moment(event.start.date).startOf('day').toDate()
              endDate = moment(event.end.date).startOf('day').toDate()
              
              // Log all-day events as they're loaded
              console.log(`[CALENDAR DEBUG] Loading all-day event:`, {
                title: event.summary,
                calendarName: calendar?.summary,
                originalStart: event.start,
                originalEnd: event.end,
                formattedStart: startDate.toISOString(),
                formattedEnd: endDate.toISOString()
              })
            } else {
              // Timed event
              startDate = new Date(event.start.dateTime || event.start.date || '')
              endDate = new Date(event.end.dateTime || event.end.date || '')
            }
            
            return {
              id: event.id,
              title: event.summary || 'Untitled Event',
              start: startDate,
              end: endDate,
              resource: {
                calendarId,
                calendarName: calendar?.summary || '',
                backgroundColor: calendar?.backgroundColor,
                originalEvent: event
              }
            }
          })
          
          allEvents.push(...formattedEvents)
        } catch (err) {
          console.error(`Failed to load events from calendar ${calendarId}:`, err)
        }
      }
      
      // Sort events by start time
      allEvents.sort((a, b) => {
        const aTime = new Date(a.start)
        const bTime = new Date(b.start)
        return aTime.getTime() - bTime.getTime()
      })
      
      console.log(`Successfully loaded ${allEvents.length} events total`)
      setEvents(allEvents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }, [])

  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date; action: string }) => {
    if (slotInfo.action === 'select') {
      setSelectedSlot({ start: slotInfo.start, end: slotInfo.end })
      setShowCreateModal(true)
    }
  }, [])

  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate)
  }, [])

  const handleViewChange = useCallback((view: View | 'eightWeek') => {
    setCurrentView(view)
  }, [])

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const backgroundColor = event.resource?.backgroundColor || '#3174ad'
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }, [])

  if (!isGoogleAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl mb-4">Please authenticate with Google Calendar</p>
          <a
            href="/calendar-settings"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Go to Calendar Settings
          </a>
        </div>
      </div>
    )
  }

  if (selectedCalendarIds.size === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl mb-4">No calendars selected</p>
          <a
            href="/calendar-settings"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Select Calendars
          </a>
        </div>
      </div>
    )
  }

  const handleCreateEvent = async (title: string, calendarId: string) => {
    if (!selectedSlot || !title) return
    
    setLoading(true)
    try {
      // Google calendar
      await googleCalendarService.createEvent(calendarId, {
        summary: title,
        start: {
          dateTime: selectedSlot.start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: selectedSlot.end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      })
      
      setShowCreateModal(false)
      setSelectedSlot(null)
      await loadEvents() // Reload events
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen p-4 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Calendar View</h1>
              {loading && <p className="text-sm text-gray-500 mt-2">Loading events...</p>}
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
            <a
              href="/calendar-settings"
              className="text-sm text-blue-500 hover:text-blue-700 underline"
            >
              Calendar Settings
            </a>
          </div>
          
          {/* Custom Navigation for 8-week view */}
          {currentView === 'eightWeek' && (
            <div className="bg-gray-50 p-3 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentDate(EightWeekView.navigate(currentDate, 'PREVIOUS' as any))}
                    className="px-3 py-1 bg-white border rounded hover:bg-gray-50"
                  >
                    ← Previous 8 Weeks
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1 bg-brain-500 text-white rounded hover:bg-brain-600"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setCurrentDate(EightWeekView.navigate(currentDate, 'NEXT' as any))}
                    className="px-3 py-1 bg-white border rounded hover:bg-gray-50"
                  >
                    Next 8 Weeks →
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-700">
                    {EightWeekView.title(currentDate)}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleViewChange('month')}
                      className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
                    >
                      Month
                    </button>
                    <button
                      onClick={() => handleViewChange('week')}
                      className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
                    >
                      Week
                    </button>
                    <button
                      onClick={() => handleViewChange('eightWeek')}
                      className="px-3 py-1 bg-brain-500 text-white rounded text-sm"
                    >
                      8 Weeks
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border-l-2 border-blue-400">
                💡 <strong>Extended Range:</strong> 8-week view loads events from 1 year before to 1 year after for comprehensive planning. 
                Other views load 6 months before/after.
              </div>
            </div>
          )}
          
          {/* Add 8-week view button to standard views */}
          {currentView !== 'eightWeek' && (
            <div className="flex justify-center mb-2">
              <button
                onClick={() => handleViewChange('eightWeek')}
                className="px-4 py-2 bg-brain-500 text-white rounded hover:bg-brain-600 text-sm"
              >
                Switch to 8-Week View
              </button>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-h-0">
          {currentView === 'eightWeek' ? (
            <EightWeekViewComponent
              date={currentDate}
              events={events}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              localizer={localizer}
              eventPropGetter={eventStyleGetter}
            />
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              titleAccessor="title"
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              onNavigate={handleNavigate}
              onView={handleViewChange}
              view={currentView as View}
              date={currentDate}
              eventPropGetter={eventStyleGetter}
              style={{ height: '100%' }}
              views={['month', 'week', 'day', 'agenda']}
              selectable
              popup
              tooltipAccessor={(event) => `${event.title} (${event.resource?.calendarName})`}
            />
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{selectedEvent.title}</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Calendar:</strong> {selectedEvent.resource?.calendarName}</p>
              <p><strong>Start:</strong> {selectedEvent.start.toLocaleString()}</p>
              <p><strong>End:</strong> {selectedEvent.end.toLocaleString()}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowEventModal(false)
                  setSelectedEvent(null)
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create New Event</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const title = formData.get('title') as string
                const calendarId = formData.get('calendarId') as string
                handleCreateEvent(title, calendarId)
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Event Title</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Calendar</label>
                  <select
                    name="calendarId"
                    required
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a calendar</option>
                    {calendars
                      .filter(cal => selectedCalendarIds.has(cal.id))
                      .map(cal => (
                        <option key={cal.id} value={cal.id}>
                          {cal.summary}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Start:</strong> {selectedSlot.start.toLocaleString()}</p>
                  <p><strong>End:</strong> {selectedSlot.end.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setSelectedSlot(null)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}