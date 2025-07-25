import React, { useMemo } from 'react'
import dayjs from 'dayjs'
import { DayCell } from './DayCell'
import { SpanningEventsSection } from './SpanningEventsSection'

interface WeekRowProps {
  week: Date[]
  currentDate: Date
  currentWeekStart: dayjs.Dayjs
  events: any[]
  eventPropGetter?: (event: any) => any
  onSelectEvent: (event: any) => void
  onSelectSlot: (slotInfo: any) => void
  getEventsForDay: (day: Date) => any[]
  isAllDayEvent: (event: any) => boolean
  getTimedEventsForDay: (day: Date) => any[]
  getAllDayEventsForDay: (day: Date) => any[]
  getEventSpanInfo: (event: any, day: Date, week: Date[]) => any
}

export const WeekRow: React.FC<WeekRowProps> = React.memo(
  ({
    week,
    currentDate,
    currentWeekStart,
    events,
    eventPropGetter,
    onSelectEvent,
    onSelectSlot,
    getEventsForDay,
    isAllDayEvent,
    getTimedEventsForDay,
    getAllDayEventsForDay,
    getEventSpanInfo,
  }) => {
    const isCurrentWeek = week.some(day =>
      dayjs(day).startOf('week').isSame(currentWeekStart, 'week')
    )

    const handleSlotClick = (day: Date) => {
      const slotInfo = {
        start: day,
        end: dayjs(day).add(1, 'hour').toDate(),
        action: 'select',
        slots: [day],
      }
      onSelectSlot(slotInfo)
    }

    // Memoize expensive spanning event calculations
    const { allDaySpanningEvents, timedSpanningEvents } = useMemo(() => {
      const allDaySpannings: { event: any; startDay: number; spanDays: number }[] = []
      const timedSpannings: { event: any; startDay: number; spanDays: number }[] = []

      week.forEach((day, dayIndex) => {
        const dayEvents = getEventsForDay(day)

        dayEvents.forEach(event => {
          const spanInfo = getEventSpanInfo(event, day, week)
          // Only add multi-day events to spanning events, and only from their first day in the week
          if (spanInfo.isMultiDay && spanInfo.isFirstDayInWeek) {
            const spanningEvent = {
              event,
              startDay: dayIndex,
              spanDays: spanInfo.spanDays,
            }

            const isAllDay = isAllDayEvent(event)

            if (isAllDay) {
              allDaySpannings.push(spanningEvent)
            } else {
              timedSpannings.push(spanningEvent)
            }
          }
        })
      })

      return {
        allDaySpanningEvents: allDaySpannings,
        timedSpanningEvents: timedSpannings,
      }
    }, [week, events, getEventsForDay, getEventSpanInfo, isAllDayEvent])

    return (
      <div
        className={`week-row ${
          isCurrentWeek
            ? 'current-week bg-brain-50/70 backdrop-blur-sm p-2 rounded-xl border-2 border-brain-300/60 shadow-sm'
            : 'p-1'
        }`}
      >
        {/* Spanning events area - flexible height */}
        <SpanningEventsSection
          allDaySpanningEvents={allDaySpanningEvents}
          timedSpanningEvents={timedSpanningEvents}
          eventPropGetter={eventPropGetter}
          onSelectEvent={onSelectEvent}
        />

        <div className="grid grid-cols-7 gap-0.5">
          {week.map((day, dayIndex) => {
            const isToday = dayjs(day).isSame(dayjs(), 'day')

            // Get single-day all-day events for this day
            const singleDayAllDayEvents = getAllDayEventsForDay(day).filter(event => {
              const spanInfo = getEventSpanInfo(event, day, week)
              return !spanInfo.isMultiDay
            })

            // Get single-day timed events for this day
            const singleDayTimedEvents = getTimedEventsForDay(day).filter(event => {
              const spanInfo = getEventSpanInfo(event, day, week)
              return !spanInfo.isMultiDay
            })

            return (
              <DayCell
                key={dayIndex}
                day={day}
                currentDate={currentDate}
                isToday={isToday}
                singleDayAllDayEvents={singleDayAllDayEvents}
                timedEvents={singleDayTimedEvents}
                eventPropGetter={eventPropGetter}
                onSelectEvent={onSelectEvent}
                onDayClick={handleSlotClick}
              />
            )
          })}
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.week.length === nextProps.week.length &&
      prevProps.week.every((day, i) => day.getTime() === nextProps.week[i].getTime()) &&
      prevProps.currentDate.getTime() === nextProps.currentDate.getTime() &&
      prevProps.currentWeekStart.isSame(nextProps.currentWeekStart) &&
      prevProps.events.length === nextProps.events.length
    )
  }
)
