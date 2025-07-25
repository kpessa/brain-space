import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Navigate } from 'react-big-calendar'
import type { Event, View } from 'react-big-calendar'
import dayjs from 'dayjs'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../styles/calendar.css'
import { googleCalendarService } from '../services/googleCalendarWrapper'
import { useCalendarStore } from '../store/calendarStore'
import { EightWeekView, EightWeekViewComponent } from '../components/EightWeekView'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { dayjsLocalizer } from '../lib/dayjsLocalizer'
import { RefreshCw, MoreVertical, Settings, Info } from 'lucide-react'

const localizer = dayjsLocalizer()

// Add custom 8-week view to views
const customViews = {
  eightWeek: EightWeekViewComponent,
}

// Custom toolbar component that includes 8-week view
interface CustomToolbarProps {
  label: string
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void
  onView: (view: string) => void
  view: string
  views: string[]
  onEightWeekView: () => void
  currentView: View | 'eightWeek'
}

const CustomToolbar: React.FC<CustomToolbarProps> = ({
  label,
  onNavigate,
  onView,
  view,
  views,
  onEightWeekView,
  currentView,
}) => {
  return (
    <div className="rbc-toolbar">
      {/* Desktop layout - normal spacing */}
      <div className="hidden lg:flex items-center justify-between py-2 mb-4">
        {/* Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('PREV')}
            className="px-3 py-1.5 hover:bg-gray-100 rounded-lg active:scale-95 transition-all"
            title="Previous"
          >
            <span className="text-sm">←</span>
          </button>
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-4 py-2 bg-brain-500 text-white rounded-lg hover:bg-brain-600 active:scale-95 transition-all text-sm font-medium"
          >
            Today
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="px-3 py-1.5 hover:bg-gray-100 rounded-lg active:scale-95 transition-all"
            title="Next"
          >
            <span className="text-sm">→</span>
          </button>
        </div>

        {/* Title */}
        <div className="flex-1 text-center px-4">
          <h2 className="text-xl font-semibold text-gray-800 truncate">{label}</h2>
        </div>

        {/* View buttons */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {views.map(viewName => (
            <button
              key={viewName}
              onClick={() => onView(viewName)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all min-w-[32px] ${
                view === viewName
                  ? 'bg-white text-brain-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title={viewName.charAt(0).toUpperCase() + viewName.slice(1)}
            >
              {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
            </button>
          ))}
          <button
            onClick={onEightWeekView}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all min-w-[32px] ${
              currentView === 'eightWeek'
                ? 'bg-white text-brain-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            title="8 Weeks"
          >
            8 Weeks
          </button>
        </div>
      </div>

      {/* Mobile layout removed - all functionality now in MobileCalendarMenu */}
    </div>
  )
}

// Mobile calendar menu component - everything in one popup
interface MobileCalendarMenuProps {
  currentView: View | 'eightWeek'
  currentDate: Date
  onNavigate: (newDate: Date) => void
  onViewChange: (view: View | 'eightWeek') => void
  onRefresh: () => void
  isRefreshing: boolean
  loading: boolean
}

const MobileCalendarMenu: React.FC<MobileCalendarMenuProps> = ({
  currentView,
  currentDate,
  onNavigate,
  onViewChange,
  onRefresh,
  isRefreshing,
  loading,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleNavigate = (direction: 'PREV' | 'NEXT' | 'TODAY') => {
    if (direction === 'TODAY') {
      onNavigate(new Date())
    } else if (currentView === 'eightWeek') {
      const newDate = EightWeekView.navigate(
        currentDate,
        direction === 'PREV' ? Navigate.PREVIOUS : Navigate.NEXT
      )
      onNavigate(newDate)
    } else {
      // For standard views, we'll use a simple month navigation
      const current = dayjs(currentDate)
      if (direction === 'PREV') {
        onNavigate(current.subtract(1, 'month').toDate())
      } else {
        onNavigate(current.add(1, 'month').toDate())
      }
    }
    setIsOpen(false)
  }

  const currentTitle =
    currentView === 'eightWeek'
      ? EightWeekView.title(currentDate)
      : dayjs(currentDate).format('MMMM YYYY')

  return (
    <div className="relative lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
        title="Calendar menu"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-2">
            {/* Current view type */}
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-700 capitalize">
                {currentView === 'eightWeek' ? '8 Week View' : `${currentView} view`}
              </p>
            </div>

            {/* Navigation */}
            <div className="px-2 py-2 border-b border-gray-100">
              <div className="flex items-center justify-center space-x-1">
                <button
                  onClick={() => handleNavigate('PREV')}
                  className="flex-1 py-2 px-3 hover:bg-gray-50 rounded text-sm font-medium transition-colors"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => handleNavigate('TODAY')}
                  className="px-4 py-2 bg-brain-500 text-white rounded hover:bg-brain-600 text-sm font-medium transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => handleNavigate('NEXT')}
                  className="flex-1 py-2 px-3 hover:bg-gray-50 rounded text-sm font-medium transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* View selection */}
            <div className="px-2 py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2 mb-1">
                Calendar View
              </p>
              <div className="grid grid-cols-2 gap-1">
                {['month', 'week', 'day', 'agenda'].map(viewName => (
                  <button
                    key={viewName}
                    onClick={() => {
                      onViewChange(viewName as View)
                      setIsOpen(false)
                    }}
                    className={`py-2 px-3 rounded text-sm font-medium transition-colors capitalize ${
                      currentView === viewName
                        ? 'bg-brain-100 text-brain-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {viewName}
                  </button>
                ))}
                <button
                  onClick={() => {
                    onViewChange('eightWeek')
                    setIsOpen(false)
                  }}
                  className={`py-2 px-3 rounded text-sm font-medium transition-colors col-span-2 ${
                    currentView === 'eightWeek'
                      ? 'bg-brain-100 text-brain-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  8 Week View
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="px-2 py-2">
              <button
                onClick={() => {
                  onRefresh()
                  setIsOpen(false)
                }}
                disabled={isRefreshing || loading}
                className="flex items-center gap-3 w-full px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Events
              </button>
              <Link
                to="/calendar/settings"
                className="flex items-center gap-3 w-full px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Calendar Settings
              </Link>
              <button
                className="flex items-center gap-3 w-full px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded"
                onClick={() => {
                  setIsOpen(false)
                  // Could add help/info modal here
                }}
              >
                <Info className="w-4 h-4" />
                Help & Info
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Desktop header menu button component
const HeaderMenuButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
        title="More options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
            <Link
              to="/calendar/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Calendar Settings
            </Link>
            <button
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
              onClick={() => {
                setIsOpen(false)
                // Could add help/info modal here
              }}
            >
              <Info className="w-4 h-4" />
              Help & Info
            </button>
          </div>
        </>
      )}
    </div>
  )
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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Cache to avoid repeated API calls
  const [eventCache, setEventCache] = useState<{ [key: string]: CalendarEvent[] }>({})
  const [cacheTimestamp, setCacheTimestamp] = useState<{ [key: string]: number }>({})

  // Load calendars on mount
  useEffect(() => {
    const initializeCalendars = async () => {
      const allCalendars: CalendarInfo[] = []

      // Try Google Calendar
      try {
        const isAuthorized = await googleCalendarService.authorize(true) // immediate mode
        if (isAuthorized) {
          setIsGoogleAuthenticated(true)
          const googleCalendars = await googleCalendarService.listCalendars()
          allCalendars.push(...googleCalendars)
        }
      } catch (err) {
        // Google Calendar not authenticated - this is expected on first load
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

  const loadEvents = async (forceRefresh = false) => {
    setLoading(true)
    setError(null)

    // Clear cache if force refresh
    if (forceRefresh) {
      setEventCache({})
      setCacheTimestamp({})
    }

    try {
      // Calculate extended date range for better event coverage
      let start: Date, end: Date

      if (currentView === 'eightWeek') {
        // For 8-week view, load 1 year before and 1 year after for maximum coverage
        start = dayjs(currentDate).subtract(1, 'year').startOf('month').toDate()
        end = dayjs(currentDate).add(1, 'year').endOf('month').toDate()
      } else {
        // For other views, load 6 months before and 6 months after
        start = dayjs(currentDate).subtract(6, 'months').startOf('month').toDate()
        end = dayjs(currentDate).add(6, 'months').endOf('month').toDate()
      }

      const allEvents: CalendarEvent[] = []

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
              startDate = dayjs(event.start.date).startOf('day').toDate()
              endDate = dayjs(event.end.date).startOf('day').toDate()

              // All-day event detected
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
                originalEvent: event,
              },
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

      setEvents(allEvents)

      // Update last refresh time
      if (forceRefresh) {
        setLastRefresh(new Date())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadEvents(true)
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
        display: 'block',
      },
    }
  }, [])

  if (!isGoogleAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl mb-4">Please authenticate with Google Calendar</p>
          <Link to="/calendar/settings" className="text-blue-500 hover:text-blue-700 underline">
            Go to Calendar Settings
          </Link>
        </div>
      </div>
    )
  }

  if (selectedCalendarIds.size === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl mb-4">No calendars selected</p>
          <Link to="/calendar/settings" className="text-blue-500 hover:text-blue-700 underline">
            Select Calendars
          </Link>
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
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="bg-white/95 backdrop-blur rounded-b-xl shadow-lg mx-2 mb-2 mt-safe flex-1 flex flex-col overflow-hidden">
        <div className="p-2 pb-1 flex-shrink-0">
          {/* Header with date and menu */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Mobile: Show current date */}
              <div className="lg:hidden">
                <h1 className="text-base font-semibold text-gray-800">
                  {currentView === 'eightWeek'
                    ? EightWeekView.title(currentDate)
                    : dayjs(currentDate).format('MMM YYYY')}
                </h1>
              </div>
              {/* Desktop: Show "Calendar" title */}
              <h1 className="hidden lg:block text-lg font-semibold text-gray-800">Calendar</h1>
              {loading && !isRefreshing && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
              {error && (
                <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">Error</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Desktop: Show refresh button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-all"
                title="Refresh calendar events"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Mobile: Everything in menu */}
              <MobileCalendarMenu
                currentView={currentView}
                currentDate={currentDate}
                onNavigate={handleNavigate}
                onViewChange={handleViewChange}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                loading={loading}
              />

              {/* Desktop: Settings menu only */}
              <div className="hidden lg:block">
                <HeaderMenuButton />
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex-1 min-h-0 px-4 pb-4 overflow-auto touch-pan-y"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y pinch-zoom',
          }}
        >
          <ErrorBoundary
            context="Calendar View"
            isolate={true}
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Error</h3>
                  <p className="text-gray-600 mb-4">
                    There was an issue loading the calendar view.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-brain-600 text-white rounded hover:bg-brain-700"
                  >
                    Reload Calendar
                  </button>
                </div>
              </div>
            }
          >
            {currentView === 'eightWeek' ? (
              <ErrorBoundary context="8-Week View" isolate={true}>
                <div>
                  {/* Desktop: Show toolbar */}
                  <div className="hidden lg:block">
                    <CustomToolbar
                      label={EightWeekView.title(currentDate)}
                      onNavigate={action => {
                        if (action === 'PREV') {
                          setCurrentDate(EightWeekView.navigate(currentDate, 'PREVIOUS' as any))
                        } else if (action === 'NEXT') {
                          setCurrentDate(EightWeekView.navigate(currentDate, 'NEXT' as any))
                        } else if (action === 'TODAY') {
                          setCurrentDate(new Date())
                        }
                      }}
                      onView={handleViewChange}
                      view="eightWeek"
                      views={['month', 'week', 'day', 'agenda']}
                      onEightWeekView={() => handleViewChange('eightWeek')}
                      currentView={currentView}
                    />
                  </div>
                  <EightWeekViewComponent
                    date={currentDate}
                    events={events}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    localizer={localizer}
                    eventPropGetter={eventStyleGetter}
                    onNavigate={handleNavigate}
                  />
                </div>
              </ErrorBoundary>
            ) : (
              <ErrorBoundary context="Standard Calendar View" isolate={true}>
                <div
                  className="h-full overflow-auto touch-pan-y"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                    touchAction: 'pan-y pinch-zoom',
                  }}
                >
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
                    style={{ height: '100%', minHeight: '600px' }}
                    views={['month', 'week', 'day', 'agenda']}
                    selectable
                    popup
                    tooltipAccessor={event => `${event.title} (${event.resource?.calendarName})`}
                    components={{
                      toolbar: props => (
                        <div className="hidden lg:block">
                          <CustomToolbar
                            {...props}
                            onEightWeekView={() => handleViewChange('eightWeek')}
                            currentView={currentView}
                          />
                        </div>
                      ),
                    }}
                  />
                </div>
              </ErrorBoundary>
            )}
          </ErrorBoundary>
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{selectedEvent.title}</h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Calendar:</strong> {selectedEvent.resource?.calendarName}
              </p>
              <p>
                <strong>Start:</strong> {selectedEvent.start.toLocaleString()}
              </p>
              <p>
                <strong>End:</strong> {selectedEvent.end.toLocaleString()}
              </p>
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
              onSubmit={e => {
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
                  <p>
                    <strong>Start:</strong> {selectedSlot.start.toLocaleString()}
                  </p>
                  <p>
                    <strong>End:</strong> {selectedSlot.end.toLocaleString()}
                  </p>
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
