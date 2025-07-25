import React from 'react'
import dayjs from 'dayjs'

interface DayCellProps {
  day: Date
  currentDate: Date
  isToday: boolean
  singleDayAllDayEvents: any[]
  timedEvents: any[]
  eventPropGetter?: (event: any) => any
  onSelectEvent: (event: any) => void
  onDayClick: (day: Date) => void
}

export const DayCell: React.FC<DayCellProps> = React.memo(
  ({
    day,
    currentDate,
    isToday,
    singleDayAllDayEvents,
    timedEvents,
    eventPropGetter,
    onSelectEvent,
    onDayClick,
  }) => {
    const dayMonth = dayjs(day).month()
    const currentMonth = dayjs(currentDate).month()
    const isDifferentMonth = dayMonth !== currentMonth
    const isPreviousMonth = dayMonth < currentMonth || (dayMonth === 11 && currentMonth === 0)
    const isNextMonth = dayMonth > currentMonth || (dayMonth === 0 && currentMonth === 11)

    return (
      <div
        className={`day-cell min-h-[80px] sm:min-h-[100px] border rounded cursor-pointer transition-all flex flex-col relative active:scale-95 ${
          isToday
            ? 'today-cell bg-brain-100 border-brain-400 border-2 shadow-sm'
            : isDifferentMonth
              ? isPreviousMonth
                ? 'text-gray-400 bg-gray-50/50 border-gray-200 opacity-60'
                : 'text-gray-500 bg-blue-50/50 border-blue-200 opacity-75'
              : 'border-gray-200/60 hover:bg-gray-50/80 hover:border-gray-300 hover:shadow-sm backdrop-blur-sm'
        }`}
        onClick={() => onDayClick(day)}
      >
        {/* Date number - positioned in top right with minimal spacing */}
        <div className="absolute top-0.5 right-0.5 z-20 flex justify-end pointer-events-none">
          <div
            className={`text-xs leading-none ${
              isToday
                ? 'font-bold text-white bg-brain-500 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0'
                : isDifferentMonth
                  ? isPreviousMonth
                    ? 'text-gray-400 font-medium'
                    : 'text-gray-500 font-medium'
                  : 'text-gray-800 font-semibold'
            }`}
          >
            {dayjs(day).format('D')}
          </div>
        </div>

        {/* Flexible content area - full width with top margin for date */}
        <div className="flex-1 flex flex-col p-0.5 pt-6 relative">
          {/* Single-day all-day events section */}
          <div className="all-day-events-section mb-1">
            {singleDayAllDayEvents.slice(0, 2).map((event, eventIndex) => {
              const eventStyle = eventPropGetter ? eventPropGetter(event) : {}

              return (
                <div
                  key={`allday-${event.id || eventIndex}`}
                  className={`all-day-event text-xs px-1 py-0.5 rounded cursor-pointer truncate transition-all active:scale-95 mb-0.5 font-medium min-h-[16px] flex items-center ${
                    isDifferentMonth ? 'opacity-70' : ''
                  }`}
                  style={{
                    backgroundColor: eventStyle.style?.backgroundColor || '#9ca3af',
                    color: 'white',
                  }}
                  onClick={e => {
                    e.stopPropagation()
                    onSelectEvent(event)
                  }}
                  title={`${event.title} (All-day) - ${event.resource?.calendarName || 'Calendar'}`}
                >
                  {event.title}
                </div>
              )
            })}
          </div>

          {/* Timed events section */}
          <div className="timed-events-section">
            {timedEvents.slice(0, 3).map((event, eventIndex) => {
              const eventStyle = eventPropGetter ? eventPropGetter(event) : {}

              return (
                <div
                  key={`timed-${event.id || eventIndex}`}
                  className={`timed-event text-xs px-1 py-0.5 rounded cursor-pointer truncate transition-all active:scale-95 mb-0.5 font-medium min-h-[16px] flex items-center ${
                    isDifferentMonth ? 'opacity-70' : ''
                  }`}
                  style={{
                    backgroundColor: eventStyle.style?.backgroundColor || '#3174ad',
                    color: 'white',
                  }}
                  onClick={e => {
                    e.stopPropagation()
                    onSelectEvent(event)
                  }}
                  title={`${event.title} (${dayjs(event.start).format('h:mm A')}) - ${event.resource?.calendarName || 'Calendar'}`}
                >
                  {dayjs(event.start).format('h:mm')} {event.title}
                </div>
              )
            })}

            {/* Show "more" indicator */}
            {(() => {
              const remaining = Math.max(
                0,
                timedEvents.length - 3 + (singleDayAllDayEvents.length - 2)
              )

              return (
                remaining > 0 && (
                  <div className="text-xs text-gray-500 text-center mt-1">+{remaining} more</div>
                )
              )
            })()}
          </div>
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.day.getTime() === nextProps.day.getTime() &&
      prevProps.currentDate.getTime() === nextProps.currentDate.getTime() &&
      prevProps.isToday === nextProps.isToday &&
      prevProps.singleDayAllDayEvents.length === nextProps.singleDayAllDayEvents.length &&
      prevProps.timedEvents.length === nextProps.timedEvents.length
    )
  }
)
