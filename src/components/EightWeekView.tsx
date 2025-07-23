import React, { useMemo, useState, useRef, useCallback } from 'react'
import dayjs from 'dayjs'
import { Navigate } from 'react-big-calendar'
import { MonthHeader } from './calendar/MonthHeader'
import { WeekRow } from './calendar/WeekRow'

// Custom 8-week view: 1 week before + current week + 7 weeks ahead
export const EightWeekView = {
  // Generate the date range for the 8-week view
  range: (date: Date) => {
    const start = dayjs(date).startOf('week').subtract(1, 'week')
    const end = dayjs(date).startOf('week').add(7, 'weeks').endOf('week')

    const range: Date[] = []
    let current = start

    while (current.isSameOrBefore(end, 'day')) {
      range.push(current.toDate())
      current = current.add(1, 'day')
    }

    return range
  },

  // Navigation logic for the custom view
  navigate: (date: Date, action: Navigate) => {
    switch (action) {
      case Navigate.PREVIOUS:
        return dayjs(date).subtract(8, 'weeks').toDate()
      case Navigate.NEXT:
        return dayjs(date).add(8, 'weeks').toDate()
      case Navigate.TODAY:
        return new Date()
      default:
        return date
    }
  },

  // Title for the view
  title: (date: Date) => {
    const start = dayjs(date).startOf('week').subtract(1, 'week')
    const end = dayjs(date).startOf('week').add(7, 'weeks').endOf('week')

    if (start.year() === end.year()) {
      if (start.month() === end.month()) {
        return `${start.format('MMMM YYYY')}`
      } else {
        return `${start.format('MMM')} - ${end.format('MMM YYYY')}`
      }
    } else {
      return `${start.format('MMM YYYY')} - ${end.format('MMM YYYY')}`
    }
  },
}

// React component for rendering the 8-week view
interface EightWeekViewComponentProps {
  date: Date
  events: any[]
  onSelectEvent: (event: any) => void
  onSelectSlot: (slotInfo: any) => void
  localizer: any
  eventPropGetter?: (event: any) => any
  onNavigate?: (newDate: Date) => void
}

export const EightWeekViewComponent: React.FC<EightWeekViewComponentProps> = ({
  date,
  events,
  onSelectEvent,
  onSelectSlot,
  localizer,
  eventPropGetter,
  onNavigate,
}) => {
  const range = EightWeekView.range(date)
  const weeks: Date[][] = []

  // Calculate 8-week view range

  // Group days into weeks
  for (let i = 0; i < range.length; i += 7) {
    weeks.push(range.slice(i, i + 7))
  }

  const currentWeekStart = dayjs(date).startOf('week')
  const currentMonth = dayjs(date).month()

  // Group weeks by month for better organization
  const weeksByMonth: {
    [key: string]: { weeks: Date[][]; monthName: string; year: number; isCurrentMonth: boolean }
  } = {}

  weeks.forEach(week => {
    const weekStart = dayjs(week[0])
    const monthKey = weekStart.format('YYYY-MM')
    const monthName = weekStart.format('MMMM')
    const year = weekStart.year()
    const isCurrentMonth = weekStart.month() === currentMonth

    if (!weeksByMonth[monthKey]) {
      weeksByMonth[monthKey] = {
        weeks: [],
        monthName,
        year,
        isCurrentMonth,
      }
    }
    weeksByMonth[monthKey].weeks.push(week)
  })

  const handleSlotClick = (day: Date) => {
    const slotInfo = {
      start: day,
      end: dayjs(day).add(1, 'hour').toDate(),
      action: 'select',
      slots: [day],
    }
    onSelectSlot(slotInfo)
  }

  // Memoize expensive event processing
  const { eventsByDate, isAllDayEvent } = useMemo(() => {
    const eventsByDate: { [dateKey: string]: { allDay: any[], timed: any[] } } = {}
    
    const isAllDayEvent = (event: any) => {
      // Check multiple ways to detect all-day events
      // 1. Original Google Calendar structure (from originalEvent)
      if (event.resource?.originalEvent) {
        const original = event.resource.originalEvent
        const hasDateOnly = original.start?.date && !original.start?.dateTime
        if (hasDateOnly) return true
      }

      // 2. Check if start and end times are exactly at midnight and span full days
      const startDate = dayjs(event.start)
      const endDate = dayjs(event.end)
      const isStartMidnight = startDate.hour() === 0 && startDate.minute() === 0
      const isEndMidnight = endDate.hour() === 0 && endDate.minute() === 0
      const spansDays = !startDate.isSame(endDate, 'day')

      // 3. Check if it's a single day event with no time component
      const isSameDay = startDate.isSame(endDate, 'day')
      const hasNoTime =
        isStartMidnight && (isEndMidnight || (isSameDay && endDate.diff(startDate, 'hours') === 24))

      return hasNoTime || (isStartMidnight && isEndMidnight && spansDays)
    }

    // Pre-process all events and organize by date
    events.forEach(event => {
      const eventStart = dayjs(event.start).startOf('day')
      const eventEnd = dayjs(event.end).startOf('day')
      const isAllDay = isAllDayEvent(event)

      // Add event to all days it spans
      let currentDay = eventStart
      while (currentDay.isSameOrBefore(eventEnd)) {
        const dateKey = currentDay.format('YYYY-MM-DD')
        
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = { allDay: [], timed: [] }
        }

        if (isAllDay) {
          eventsByDate[dateKey].allDay.push(event)
        } else {
          eventsByDate[dateKey].timed.push(event)
        }

        currentDay = currentDay.add(1, 'day')
      }
    })

    return { eventsByDate, isAllDayEvent }
  }, [events])

  const getEventsForDay = (day: Date) => {
    const dateKey = dayjs(day).format('YYYY-MM-DD')
    const dayEvents = eventsByDate[dateKey]
    return dayEvents ? [...dayEvents.allDay, ...dayEvents.timed] : []
  }

  const getTimedEventsForDay = (day: Date) => {
    const dateKey = dayjs(day).format('YYYY-MM-DD')
    const dayEvents = eventsByDate[dateKey]
    return dayEvents ? dayEvents.timed : []
  }

  const getAllDayEventsForDay = (day: Date) => {
    const dateKey = dayjs(day).format('YYYY-MM-DD')
    const dayEvents = eventsByDate[dateKey]
    return dayEvents ? dayEvents.allDay : []
  }

  const getEventSpanInfo = (event: any, day: Date, week: Date[]) => {
    const eventStart = dayjs(event.start).startOf('day')
    const eventEnd = dayjs(event.end).startOf('day')
    const dayMoment = dayjs(day).startOf('day')
    const dayIndex = week.findIndex(weekDay => dayjs(weekDay).isSame(dayMoment, 'day'))

    if (dayIndex === -1) return { isFirstDayInWeek: false, spanDays: 1, isMultiDay: false }

    const isMultiDay = !eventStart.isSame(eventEnd)

    // Find the first day of this event within this week
    let firstDayIndex = -1
    for (let i = 0; i < week.length; i++) {
      const weekDayMoment = dayjs(week[i]).startOf('day')
      if (weekDayMoment.isSameOrAfter(eventStart) && weekDayMoment.isSameOrBefore(eventEnd)) {
        firstDayIndex = i
        break
      }
    }

    const isFirstDayInWeek = dayIndex === firstDayIndex

    // Calculate span days from the current day
    let spanDays = 1
    if (isFirstDayInWeek) {
      for (let i = dayIndex + 1; i < week.length; i++) {
        const nextDay = dayjs(week[i]).startOf('day')
        if (nextDay.isSameOrBefore(eventEnd)) {
          spanDays++
        } else {
          break
        }
      }
    }

    return {
      isFirstDayInWeek,
      spanDays,
      isMultiDay,
      continuesFromPrevious: dayMoment.isAfter(eventStart),
      continuesToNext: dayMoment.isBefore(eventEnd),
    }
  }

  // Touch/pan navigation state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setTouchEnd(null)
  }, [])

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchEnd({ x: touch.clientX, y: touch.clientY })
  }, [])

  // Handle touch end - detect swipe
  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd || !onNavigate) return

    const deltaX = touchStart.x - touchEnd.x
    const deltaY = touchStart.y - touchEnd.y
    
    // Minimum swipe distance (in pixels)
    const minSwipeDistance = 50
    
    // Check if this is a horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe left - go to next 8 weeks
        const nextDate = EightWeekView.navigate(date, Navigate.NEXT)
        onNavigate(nextDate)
      } else {
        // Swipe right - go to previous 8 weeks
        const prevDate = EightWeekView.navigate(date, Navigate.PREVIOUS)
        onNavigate(prevDate)
      }
    }
    
    setTouchStart(null)
    setTouchEnd(null)
  }, [touchStart, touchEnd, date, onNavigate])

  return (
    <div 
      ref={containerRef}
      className="eight-week-view h-full overflow-auto touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div className="week-headers grid grid-cols-7 gap-0.5 mb-2 sticky top-0 bg-white/95 backdrop-blur-sm z-20 py-1 border-b border-gray-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-600 py-1 px-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="months-container space-y-4 pb-safe">
        {Object.entries(weeksByMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([monthKey, monthData]) => (
            <div key={monthKey} className="month-section">
              {/* Month Header - Inline and subtle */}
              <MonthHeader
                monthName={monthData.monthName}
                year={monthData.year}
                isCurrentMonth={monthData.isCurrentMonth}
              />

              {/* Weeks in this month */}
              <div className="weeks-container space-y-1">
                {monthData.weeks.map((week, weekIndex) => {
                  return (
                    <WeekRow
                      key={`${monthKey}-${weekIndex}`}
                      week={week}
                      currentDate={date}
                      currentWeekStart={currentWeekStart}
                      events={events}
                      eventPropGetter={eventPropGetter}
                      onSelectEvent={onSelectEvent}
                      onSelectSlot={onSelectSlot}
                      getEventsForDay={getEventsForDay}
                      isAllDayEvent={isAllDayEvent}
                      getTimedEventsForDay={getTimedEventsForDay}
                      getAllDayEventsForDay={getAllDayEventsForDay}
                      getEventSpanInfo={getEventSpanInfo}
                    />
                  )
                })}
              </div>
            </div>
          ))}
      </div>

      <div className="mt-6 p-4 bg-gray-100/50 rounded-xl border border-gray-200/50 mb-safe">
        <div className="flex justify-center items-center flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-brain-50 border-2 border-brain-300 rounded"></div>
            <span className="font-medium">Current Week</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-brain-500 rounded-full"></div>
            <span className="font-medium">Today</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-50 border border-gray-200 rounded opacity-60"></div>
            <span className="font-medium">Previous Month</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-50 border border-blue-200 rounded opacity-75"></div>
            <span className="font-medium">Future Month</span>
          </div>
        </div>
      </div>
    </div>
  )
}