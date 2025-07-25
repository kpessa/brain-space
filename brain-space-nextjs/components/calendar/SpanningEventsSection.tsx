import React from 'react'
import dayjs from '@/lib/dayjs'

interface SpanningEvent {
  event: any
  startDay: number
  spanDays: number
}

interface SpanningEventsSectionProps {
  allDaySpanningEvents: SpanningEvent[]
  timedSpanningEvents: SpanningEvent[]
  eventPropGetter?: (event: any) => any
  onSelectEvent: (event: any) => void
}

export const SpanningEventsSection: React.FC<SpanningEventsSectionProps> = ({
  allDaySpanningEvents = [],
  timedSpanningEvents = [],
  eventPropGetter,
  onSelectEvent,
}) => {
  const hasSpanningEvents = allDaySpanningEvents.length > 0 || timedSpanningEvents.length > 0

  if (!hasSpanningEvents) {
    return null
  }

  return (
    <div className="spanning-events-section mb-1">
      {/* All-day spanning events */}
      {allDaySpanningEvents.slice(0, 3).map((spanEvent, spanIndex) => {
        const eventStyle = eventPropGetter ? eventPropGetter(spanEvent.event) : {}
        const leftPercent = (spanEvent.startDay / 7) * 100
        const widthPercent = (spanEvent.spanDays / 7) * 100

        return (
          <div
            key={`${spanEvent.event.id || spanIndex}-allday-span`}
            className="relative mb-1"
            style={{ height: '18px' }}
          >
            <div
              className="absolute text-xs px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 font-medium"
              style={{
                left: `calc(${leftPercent}% + 2px)`,
                width: `calc(${widthPercent}% - 4px)`,
                backgroundColor: eventStyle.style?.backgroundColor || '#9ca3af',
                color: 'white',
                opacity: 0.9,
                minHeight: '16px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
              onClick={e => {
                e.stopPropagation()
                onSelectEvent(spanEvent.event)
              }}
              title={`${spanEvent.event.title} (${spanEvent.spanDays} days, All-day) - ${spanEvent.event.resource?.calendarName || 'Calendar'}`}
            >
              <span className="truncate">{spanEvent.event.title}</span>
            </div>
          </div>
        )
      })}

      {/* Timed spanning events */}
      {timedSpanningEvents.slice(0, 2).map((spanEvent, spanIndex) => {
        const eventStyle = eventPropGetter ? eventPropGetter(spanEvent.event) : {}
        const leftPercent = (spanEvent.startDay / 7) * 100
        const widthPercent = (spanEvent.spanDays / 7) * 100

        return (
          <div
            key={`${spanEvent.event.id || spanIndex}-timed-span`}
            className="relative mb-1"
            style={{ height: '20px' }}
          >
            <div
              className="absolute text-xs px-2 py-1 rounded cursor-pointer transition-all hover:scale-105 font-medium"
              style={{
                left: `calc(${leftPercent}% + 2px)`,
                width: `calc(${widthPercent}% - 4px)`,
                backgroundColor: eventStyle.style?.backgroundColor || '#3174ad',
                color: 'white',
                minHeight: '18px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
              onClick={e => {
                e.stopPropagation()
                onSelectEvent(spanEvent.event)
              }}
              title={`${spanEvent.event.title} (${spanEvent.spanDays} days) - ${spanEvent.event.resource?.calendarName || 'Calendar'}`}
            >
              <span className="truncate">
                {dayjs(spanEvent.event.start).format('h:mm')} {spanEvent.event.title}
              </span>
            </div>
          </div>
        )
      })}

      {/* Overflow indicator for spanning events */}
      {(allDaySpanningEvents.length > 3 || timedSpanningEvents.length > 2) && (
        <div className="text-xs text-gray-600 font-medium bg-white px-2 py-0.5 rounded text-center mb-1">
          +
          {Math.max(0, allDaySpanningEvents.length - 3) +
            Math.max(0, timedSpanningEvents.length - 2)}{' '}
          more spanning events
        </div>
      )}
    </div>
  )
}