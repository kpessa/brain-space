import React, { useState, useEffect } from 'react'
import { googleCalendarService } from '../services/googleCalendarWrapper'
import { useCalendarStore } from '../store/calendarStore'

interface Calendar {
  id: string
  summary: string
  primary?: boolean
  backgroundColor?: string
  foregroundColor?: string
}

interface CalendarEvent {
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
  calendarId?: string
}

export const GoogleCalendarTest: React.FC = () => {
  const { selectedCalendarIds, setSelectedCalendarIds, toggleCalendarSelection } =
    useCalendarStore()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [selectedCalendar, setSelectedCalendar] = useState<string>('')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [newEventTime, setNewEventTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuthenticate = async () => {
    setLoading(true)
    setError(null)
    try {
      const authorized = await googleCalendarService.authorize()
      if (!authorized) {
        throw new Error('Authorization failed')
      }
      setIsAuthenticated(true)
      await loadCalendars()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const loadCalendars = async () => {
    try {
      const calendarList = await googleCalendarService.listCalendars()
      console.log('All available calendars:', calendarList)
      setCalendars(calendarList)

      // If no calendars are selected yet, pre-select primary calendar
      if (selectedCalendarIds.size === 0) {
        const primaryCalendar = calendarList.find(cal => cal.primary)
        if (primaryCalendar) {
          setSelectedCalendar(primaryCalendar.id)
          setSelectedCalendarIds(new Set([primaryCalendar.id]))
        }
      } else {
        // Set the first selected calendar as the default for creating events
        const firstSelectedId = Array.from(selectedCalendarIds)[0]
        if (firstSelectedId) {
          setSelectedCalendar(firstSelectedId)
        }
      }

      // Log calendar details for debugging
      calendarList.forEach(cal => {
        console.log(`Calendar: "${cal.summary}"`, {
          id: cal.id,
          primary: cal.primary,
          backgroundColor: cal.backgroundColor,
          description: cal.description,
          accessRole: (cal as any).accessRole,
          selected: (cal as any).selected,
          hidden: (cal as any).hidden,
        })
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendars')
    }
  }

  const loadEvents = async () => {
    if (selectedCalendarIds.size === 0) {
      setError('Please select at least one calendar')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      // Load events from all selected calendars
      const allEvents: CalendarEvent[] = []
      for (const calendarId of selectedCalendarIds) {
        try {
          const eventList = await googleCalendarService.listEvents(calendarId, now, nextWeek)
          allEvents.push(
            ...eventList.map(event => ({
              ...event,
              calendarId, // Add calendar ID to track which calendar the event is from
            }))
          )
        } catch (err) {
          console.error(`Failed to load events from calendar ${calendarId}:`, err)
        }
      }

      // Sort events by start time
      allEvents.sort((a, b) => {
        const aTime = new Date(a.start.dateTime || a.start.date || '')
        const bTime = new Date(b.start.dateTime || b.start.date || '')
        return aTime.getTime() - bTime.getTime()
      })

      setEvents(allEvents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async () => {
    if (!selectedCalendar || !newEventTitle || !newEventDate || !newEventTime) {
      setError('Please fill in all event details')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const startDateTime = new Date(`${newEventDate}T${newEventTime}`)
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000) // 1 hour later

      await googleCalendarService.createEvent(selectedCalendar, {
        summary: newEventTitle,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      })

      setNewEventTitle('')
      setNewEventDate('')
      setNewEventTime('')
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const formatEventTime = (event: CalendarEvent) => {
    const date = event.start.dateTime
      ? new Date(event.start.dateTime)
      : new Date(event.start.date || '')
    return date.toLocaleString()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Google Calendar API Test</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!isAuthenticated ? (
        <button
          onClick={handleAuthenticate}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Connecting...' : 'Connect to Google Calendar'}
        </button>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Connected to Google Calendar</h2>
            <button
              onClick={() => {
                googleCalendarService.signOut()
                setIsAuthenticated(false)
                setCalendars([])
                setEvents([])
                setSelectedCalendar('')
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">
              Select Calendars to Sync ({calendars.length} available)
            </h2>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto border rounded p-3">
              {calendars.map(calendar => {
                const isBirthday =
                  calendar.summary?.toLowerCase().includes('birthday') ||
                  calendar.summary?.toLowerCase().includes('contact') ||
                  calendar.id?.includes('#contacts@')

                return (
                  <label
                    key={calendar.id}
                    className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded ${
                      isBirthday ? 'bg-yellow-50 border border-yellow-200' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCalendarIds.has(calendar.id)}
                      onChange={() => toggleCalendarSelection(calendar.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span
                      className="flex items-center space-x-2 flex-1"
                      style={{ color: calendar.foregroundColor }}
                    >
                      <span
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {calendar.summary}
                            {calendar.primary ? ' (Primary)' : ''}
                            {isBirthday ? ' 🎂' : ''}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          ID: {calendar.id}
                          {isBirthday && (
                            <span className="ml-2 text-yellow-600 font-medium">
                              (Birthday Calendar)
                            </span>
                          )}
                        </div>
                      </div>
                    </span>
                  </label>
                )
              })}
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400 mb-4">
              <h4 className="font-medium text-blue-800 mb-1">💡 About Birthday Events</h4>
              <p className="text-sm text-blue-700">
                Birthday events (🎂) come from your Google Contacts and may appear in a separate
                "Birthdays" calendar or merged with your primary calendar. You can uncheck the
                birthday calendar if you don't want to sync birthdays to Brain Space.
              </p>
            </div>

            <button
              onClick={loadEvents}
              disabled={loading || selectedCalendarIds.size === 0}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300"
            >
              {loading
                ? 'Loading...'
                : `Load Events from ${selectedCalendarIds.size} Calendar${selectedCalendarIds.size !== 1 ? 's' : ''} (Next 7 Days)`}
            </button>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Create New Event</h2>
            <div className="space-y-2">
              <select
                value={selectedCalendar}
                onChange={e => setSelectedCalendar(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select calendar for new event</option>
                {calendars.map(calendar => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.summary} {calendar.primary ? '(Primary)' : ''}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Event Title"
                value={newEventTitle}
                onChange={e => setNewEventTitle(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newEventDate}
                  onChange={e => setNewEventDate(e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
                <input
                  type="time"
                  value={newEventTime}
                  onChange={e => setNewEventTime(e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
              </div>
              <button
                onClick={createEvent}
                disabled={loading || !selectedCalendar}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-purple-300"
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>

          {events.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Upcoming Events</h2>
              <ul className="space-y-2">
                {events.map(event => {
                  const calendar = calendars.find(cal => cal.id === event.calendarId)
                  return (
                    <li key={event.id} className="p-3 bg-gray-100 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{event.summary}</div>
                          <div className="text-sm text-gray-600">{formatEventTime(event)}</div>
                        </div>
                        {calendar && (
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: calendar.backgroundColor }}
                            />
                            <span className="text-sm text-gray-500">{calendar.summary}</span>
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
