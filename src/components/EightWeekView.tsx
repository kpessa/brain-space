import React from 'react'
import moment from 'moment'
import { Navigate } from 'react-big-calendar'

// Custom 8-week view: 1 week before + current week + 7 weeks ahead
export const EightWeekView = {
  // Generate the date range for the 8-week view
  range: (date: Date) => {
    const start = moment(date).startOf('week').subtract(1, 'week')
    const end = moment(date).startOf('week').add(7, 'weeks').endOf('week')
    
    const range: Date[] = []
    let current = start.clone()
    
    while (current.isSameOrBefore(end, 'day')) {
      range.push(current.toDate())
      current.add(1, 'day')
    }
    
    return range
  },

  // Navigation logic for the custom view
  navigate: (date: Date, action: Navigate) => {
    switch (action) {
      case Navigate.PREVIOUS:
        return moment(date).subtract(8, 'weeks').toDate()
      case Navigate.NEXT:
        return moment(date).add(8, 'weeks').toDate()
      case Navigate.TODAY:
        return new Date()
      case Navigate.DATE:
        return date
      default:
        return date
    }
  },

  // Title for the view
  title: (date: Date) => {
    const start = moment(date).startOf('week').subtract(1, 'week')
    const end = moment(date).startOf('week').add(7, 'weeks').endOf('week')
    
    if (start.year() === end.year()) {
      if (start.month() === end.month()) {
        return `${start.format('MMMM YYYY')}`
      } else {
        return `${start.format('MMM')} - ${end.format('MMM YYYY')}`
      }
    } else {
      return `${start.format('MMM YYYY')} - ${end.format('MMM YYYY')}`
    }
  }
}

// React component for rendering the 8-week view
interface EightWeekViewComponentProps {
  date: Date
  events: any[]
  onSelectEvent: (event: any) => void
  onSelectSlot: (slotInfo: any) => void
  localizer: any
  eventPropGetter?: (event: any) => any
}

export const EightWeekViewComponent: React.FC<EightWeekViewComponentProps> = ({
  date,
  events,
  onSelectEvent,
  onSelectSlot,
  localizer,
  eventPropGetter
}) => {
  const range = EightWeekView.range(date)
  const weeks: Date[][] = []
  
  // Debug log the date range
  console.log(`[CALENDAR DEBUG] 8-week view range:`, {
    centerDate: moment(date).format('YYYY-MM-DD'),
    rangeStart: moment(range[0]).format('YYYY-MM-DD'),
    rangeEnd: moment(range[range.length - 1]).format('YYYY-MM-DD'),
    totalEvents: events.length
  })
  
  // Group days into weeks
  for (let i = 0; i < range.length; i += 7) {
    weeks.push(range.slice(i, i + 7))
  }
  
  const currentWeekStart = moment(date).startOf('week')
  const currentMonth = moment(date).month()
  
  // Group weeks by month for better organization
  const weeksByMonth: { [key: string]: { weeks: Date[][], monthName: string, year: number, isCurrentMonth: boolean } } = {}
  
  weeks.forEach(week => {
    const weekStart = moment(week[0])
    const monthKey = weekStart.format('YYYY-MM')
    const monthName = weekStart.format('MMMM')
    const year = weekStart.year()
    const isCurrentMonth = weekStart.month() === currentMonth
    
    if (!weeksByMonth[monthKey]) {
      weeksByMonth[monthKey] = {
        weeks: [],
        monthName,
        year,
        isCurrentMonth
      }
    }
    weeksByMonth[monthKey].weeks.push(week)
  })
  
  const handleSlotClick = (day: Date) => {
    const slotInfo = {
      start: day,
      end: moment(day).add(1, 'hour').toDate(),
      action: 'select',
      slots: [day]
    }
    onSelectSlot(slotInfo)
  }
  
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventStart = moment(event.start).startOf('day')
      const eventEnd = moment(event.end).startOf('day')
      const dayMoment = moment(day).startOf('day')
      
      // Check if the day falls within the event's date range
      return dayMoment.isSameOrAfter(eventStart) && dayMoment.isSameOrBefore(eventEnd)
    })
  }
  
  const isAllDayEvent = (event: any) => {
    // Check multiple ways to detect all-day events
    // 1. Original Google Calendar structure (from originalEvent)
    if (event.resource?.originalEvent) {
      const original = event.resource.originalEvent
      const hasDateOnly = original.start?.date && !original.start?.dateTime
      
      // Log detection for debugging
      if (event.title && event.title.toLowerCase().includes('birthday')) {
        console.log(`[CALENDAR DEBUG] Birthday event detection:`, {
          title: event.title,
          hasDateOnly,
          originalStart: original.start,
          originalEnd: original.end,
          detectedAsAllDay: hasDateOnly
        })
      }
      
      if (hasDateOnly) return true
    }
    
    // 2. Check if start and end times are exactly at midnight and span full days
    const startDate = moment(event.start)
    const endDate = moment(event.end)
    const isStartMidnight = startDate.hours() === 0 && startDate.minutes() === 0
    const isEndMidnight = endDate.hours() === 0 && endDate.minutes() === 0
    const spansDays = !startDate.isSame(endDate, 'day')
    
    // 3. Check if it's a single day event with no time component
    const isSameDay = startDate.isSame(endDate, 'day')
    const hasNoTime = isStartMidnight && (isEndMidnight || (isSameDay && endDate.diff(startDate, 'hours') === 24))
    
    const result = hasNoTime || (isStartMidnight && isEndMidnight && spansDays)
    
    // Additional debug logging for events that might be all-day
    if (isStartMidnight && event.title) {
      console.log(`[CALENDAR DEBUG] Midnight event analysis:`, {
        title: event.title,
        isStartMidnight,
        isEndMidnight,
        spansDays,
        isSameDay,
        hasNoTime,
        finalResult: result,
        startFormatted: startDate.format('YYYY-MM-DD HH:mm'),
        endFormatted: endDate.format('YYYY-MM-DD HH:mm')
      })
    }
    
    return result
  }
  
  const getTimedEventsForDay = (day: Date) => {
    return getEventsForDay(day).filter(event => !isAllDayEvent(event))
  }
  
  const getAllDayEventsForDay = (day: Date) => {
    return getEventsForDay(day).filter(event => isAllDayEvent(event))
  }
  
  const getEventSpanInfo = (event: any, day: Date, week: Date[]) => {
    const eventStart = moment(event.start).startOf('day')
    const eventEnd = moment(event.end).startOf('day')
    const dayMoment = moment(day).startOf('day')
    const dayIndex = week.findIndex(weekDay => moment(weekDay).isSame(dayMoment, 'day'))
    
    if (dayIndex === -1) return { isFirstDayInWeek: false, spanDays: 1, isMultiDay: false }
    
    const isMultiDay = !eventStart.isSame(eventEnd)
    
    // Find the first day of this event within this week
    let firstDayIndex = -1
    for (let i = 0; i < week.length; i++) {
      const weekDayMoment = moment(week[i]).startOf('day')
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
        const nextDay = moment(week[i]).startOf('day')
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
      continuesToNext: dayMoment.isBefore(eventEnd)
    }
  }
  
  return (
    <div className="eight-week-view">
      <div className="week-headers grid grid-cols-7 gap-0.5 mb-2 sticky top-0 bg-white z-10 py-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 p-2 bg-gray-50 rounded">
            {day}
          </div>
        ))}
      </div>
      
      <div className="months-container space-y-2">
        {Object.entries(weeksByMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([monthKey, monthData]) => (
            <div key={monthKey} className="month-section">
              {/* Month Header - Inline and subtle */}
              <div className="month-header flex items-center gap-2 mb-2">
                <div className="flex-grow h-px bg-gray-300"></div>
                <h3 className={`text-sm font-medium px-3 ${
                  monthData.isCurrentMonth ? 'text-brain-600' : 'text-gray-500'
                }`}>
                  {monthData.monthName} {monthData.year}
                </h3>
                <div className="flex-grow h-px bg-gray-300"></div>
              </div>
              
              {/* Weeks in this month */}
              <div className="weeks-container space-y-1">
                {monthData.weeks.map((week, weekIndex) => {
                  const isCurrentWeek = week.some(day => 
                    moment(day).startOf('week').isSame(currentWeekStart, 'week')
                  )
                  
                  // Pre-calculate events for the entire week to handle spanning
                  const weekEvents: { [dayIndex: number]: any[] } = {}
                  const allDaySpanningEvents: { event: any, startDay: number, spanDays: number }[] = []
                  const timedSpanningEvents: { event: any, startDay: number, spanDays: number }[] = []
                  
                  week.forEach((day, dayIndex) => {
                    const dayEvents = getEventsForDay(day)
                    weekEvents[dayIndex] = []
                    
                    dayEvents.forEach(event => {
                      const spanInfo = getEventSpanInfo(event, day, week)
                      // Only add multi-day events to spanning events, and only from their first day in the week
                      if (spanInfo.isMultiDay && spanInfo.isFirstDayInWeek) {
                        const spanningEvent = {
                          event,
                          startDay: dayIndex,
                          spanDays: spanInfo.spanDays
                        }
                        
                        const isAllDay = isAllDayEvent(event)
                        
                        // Debug logging for multi-day events
                        if (spanInfo.isMultiDay && dayIndex === 0) { // Only log once per week
                          console.log(`[CALENDAR DEBUG] Multi-day event "${event.title}":`, {
                            isAllDay,
                            startTime: moment(event.start).format('YYYY-MM-DD HH:mm'),
                            endTime: moment(event.end).format('YYYY-MM-DD HH:mm'),
                            originalStart: event.resource?.originalEvent?.start,
                            originalEnd: event.resource?.originalEvent?.end,
                            spanDays: spanInfo.spanDays,
                            category: isAllDay ? 'ALL-DAY' : 'TIMED',
                            eventId: event.id
                          })
                        }
                        
                        if (isAllDay) {
                          allDaySpanningEvents.push(spanningEvent)
                        } else {
                          timedSpanningEvents.push(spanningEvent)
                        }
                      }
                    })
                  })
                  
                  return (
                    <div 
                      key={`${monthKey}-${weekIndex}`}
                      className={`week-row ${
                        isCurrentWeek ? 'current-week bg-brain-50 p-1 rounded-lg border-2 border-brain-300' : ''
                      }`}
                    >
                      <div className="grid grid-cols-7 gap-0.5 relative">
                        {week.map((day, dayIndex) => {
                          const isToday = moment(day).isSame(moment(), 'day')
                          const dayMonth = moment(day).month()
                          const isDifferentMonth = dayMonth !== moment(date).month()
                          const isPreviousMonth = dayMonth < currentMonth || (dayMonth === 11 && currentMonth === 0)
                          const isNextMonth = dayMonth > currentMonth || (dayMonth === 0 && currentMonth === 11)
                          
                          // Get single-day all-day events for this day
                          const singleDayAllDayEvents = getAllDayEventsForDay(day).filter(event => {
                            const spanInfo = getEventSpanInfo(event, day, week)
                            return !spanInfo.isMultiDay
                          })
                          
                          // Debug log single-day all-day events
                          const allDayEventsForThisDay = getAllDayEventsForDay(day)
                          if (dayIndex === 0 && weekIndex === 0) {
                            console.log(`[CALENDAR DEBUG] Day ${moment(day).format('YYYY-MM-DD')}:`, {
                              allEventsForDay: getEventsForDay(day).length,
                              allDayEvents: allDayEventsForThisDay.length,
                              singleDayAllDayEvents: singleDayAllDayEvents.length,
                              events: allDayEventsForThisDay.map(e => ({
                                title: e.title,
                                isAllDay: isAllDayEvent(e),
                                isMultiDay: getEventSpanInfo(e, day, week).isMultiDay,
                                start: moment(e.start).format('YYYY-MM-DD HH:mm'),
                                end: moment(e.end).format('YYYY-MM-DD HH:mm'),
                                originalEvent: e.resource?.originalEvent?.start
                              }))
                            })
                          }
                          
                          return (
                            <div
                              key={dayIndex}
                              className={`day-cell min-h-[120px] border rounded cursor-pointer transition-all relative ${
                                isToday 
                                  ? 'today-cell bg-brain-100 border-brain-400 border-2' 
                                  : isDifferentMonth
                                    ? isPreviousMonth 
                                      ? 'text-gray-400 bg-gray-50 border-gray-200 opacity-60' 
                                      : 'text-gray-500 bg-blue-50 border-blue-200 opacity-75'
                                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                              }`}
                              onClick={() => handleSlotClick(day)}
                            >
                              {/* Reserve space at top for spanning events */}
                              <div className="event-space-top" style={{ height: '50px' }}></div>
                              
                              {/* Date number */}
                              <div className={`date-number text-right mb-1 text-sm ${
                                isToday 
                                  ? 'font-bold text-brain-700 bg-brain-500 text-white rounded-full w-6 h-6 flex items-center justify-center ml-auto' 
                                  : isDifferentMonth
                                    ? isPreviousMonth ? 'text-gray-400' : 'text-gray-500'
                                    : 'text-gray-700 font-medium'
                              }`}>
                                {moment(day).format('D')}
                              </div>
                              
                              {/* Single-day all-day events section */}
                              <div className="all-day-events-section mb-1 px-1">
                                {singleDayAllDayEvents.slice(0, 2).map((event, eventIndex) => {
                                  const eventStyle = eventPropGetter ? eventPropGetter(event) : {}
                                  
                                  return (
                                    <div
                                      key={`allday-${event.id || eventIndex}`}
                                      className={`all-day-event text-xs px-1 py-0.5 rounded cursor-pointer truncate transition-all hover:scale-105 mb-0.5 font-medium ${
                                        isDifferentMonth ? 'opacity-70' : ''
                                      }`}
                                      style={{
                                        backgroundColor: eventStyle.style?.backgroundColor || '#9ca3af',
                                        color: 'white'
                                      }}
                                      onClick={(e) => {
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
                              <div className="timed-events-container px-1">
                                {getTimedEventsForDay(day)
                                  .filter(event => {
                                    const spanInfo = getEventSpanInfo(event, day, week)
                                    return !spanInfo.isMultiDay
                                  })
                                  .slice(0, 3)
                                  .map((event, eventIndex) => {
                                    const eventStyle = eventPropGetter ? eventPropGetter(event) : {}
                                    
                                    return (
                                      <div
                                        key={`timed-${event.id || eventIndex}`}
                                        className={`timed-event text-xs p-1 rounded cursor-pointer truncate transition-all hover:scale-105 mb-1 ${
                                          isDifferentMonth ? 'opacity-70' : ''
                                        }`}
                                        style={{
                                          backgroundColor: eventStyle.style?.backgroundColor || '#3174ad',
                                          color: 'white'
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onSelectEvent(event)
                                        }}
                                        title={`${event.title} (${moment(event.start).format('h:mm A')}) - ${event.resource?.calendarName || 'Calendar'}`}
                                      >
                                        {moment(event.start).format('h:mm')} {event.title}
                                      </div>
                                    )
                                  })}
                              
                                {/* Show "more" indicator */}
                                {(() => {
                                  const timedEvents = getTimedEventsForDay(day).filter(event => {
                                    const spanInfo = getEventSpanInfo(event, day, week)
                                    return !spanInfo.isMultiDay
                                  })
                                  const remaining = Math.max(0, (timedEvents.length - 3) + (singleDayAllDayEvents.length - 2))
                                  
                                  return remaining > 0 && (
                                    <div className="text-xs text-gray-500 text-center mt-1">
                                      +{remaining} more
                                    </div>
                                  )
                                })()}
                              </div>
                            </div>
                          )
                        })}
                        
                        {/* All-day spanning events overlay (above dates) */}
                        <div className="absolute inset-0 pointer-events-none">
                          {allDaySpanningEvents
                            .slice(0, 2) // Limit to 2 all-day spanning events per week
                            .map((spanEvent, spanIndex) => {
                              const eventStyle = eventPropGetter ? eventPropGetter(spanEvent.event) : {}
                              const leftPercent = (spanEvent.startDay / 7) * 100
                              const widthPercent = (spanEvent.spanDays / 7) * 100
                              const topOffset = 4 + spanIndex * 22 // Position above date numbers with more spacing
                              
                              return (
                                <div
                                  key={`${spanEvent.event.id || spanIndex}-allday-span`}
                                  className="absolute text-xs px-2 py-0.5 rounded cursor-pointer transition-all hover:scale-105 pointer-events-auto font-medium"
                                  style={{
                                    left: `calc(${leftPercent}% + 2px)`,
                                    width: `calc(${widthPercent}% - 4px)`,
                                    top: `${topOffset}px`,
                                    backgroundColor: eventStyle.style?.backgroundColor || '#9ca3af',
                                    color: 'white',
                                    opacity: 0.75,
                                    filter: 'saturate(0.7)',
                                    zIndex: 20 - spanIndex,
                                    minHeight: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSelectEvent(spanEvent.event)
                                  }}
                                  title={`${spanEvent.event.title} (${spanEvent.spanDays} days, All-day) - ${spanEvent.event.resource?.calendarName || 'Calendar'}`}
                                >
                                  <span className="truncate">
                                    {spanEvent.event.title}
                                  </span>
                                </div>
                              )
                            })}
                        </div>
                        
                        {/* Timed spanning events overlay (below dates) */}
                        <div className="absolute inset-0 pointer-events-none">
                          {timedSpanningEvents
                            .slice(0, 2) // Limit to 2 timed spanning events per week
                            .map((spanEvent, spanIndex) => {
                              const eventStyle = eventPropGetter ? eventPropGetter(spanEvent.event) : {}
                              const leftPercent = (spanEvent.startDay / 7) * 100
                              const widthPercent = (spanEvent.spanDays / 7) * 100
                              const topOffset = 64 + spanIndex * 22 // Position below date numbers
                              
                              return (
                                <div
                                  key={`${spanEvent.event.id || spanIndex}-timed-span`}
                                  className="absolute text-xs px-2 py-1 rounded cursor-pointer transition-all hover:scale-105 pointer-events-auto font-medium"
                                  style={{
                                    left: `calc(${leftPercent}% + 2px)`,
                                    width: `calc(${widthPercent}% - 4px)`,
                                    top: `${topOffset}px`,
                                    backgroundColor: eventStyle.style?.backgroundColor || '#3174ad',
                                    color: 'white',
                                    zIndex: 10 - spanIndex,
                                    minHeight: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSelectEvent(spanEvent.event)
                                  }}
                                  title={`${spanEvent.event.title} (${spanEvent.spanDays} days) - ${spanEvent.event.resource?.calendarName || 'Calendar'}`}
                                >
                                  <span className="truncate">
                                    {moment(spanEvent.event.start).format('h:mm')} {spanEvent.event.title}
                                  </span>
                                </div>
                              )
                            })}
                        </div>
                        
                        {/* Overflow indicators */}
                        {(allDaySpanningEvents.length > 2 || timedSpanningEvents.length > 2) && (
                          <div
                            className="absolute text-xs text-gray-600 font-medium bg-white px-1 rounded"
                            style={{
                              left: '4px',
                              bottom: '4px',
                              zIndex: 1
                            }}
                          >
                            +{Math.max(0, allDaySpanningEvents.length - 2) + Math.max(0, timedSpanningEvents.length - 2)} more spanning events
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-center items-center flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-brain-50 border-2 border-brain-300 rounded"></div>
            <span>Current Week</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-brain-500 rounded-full"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-brain-50 border-l-4 border-brain-500 rounded"></div>
            <span>Current Month</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded opacity-60"></div>
            <span>Previous Month</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded opacity-75"></div>
            <span>Future Month</span>
          </div>
        </div>
      </div>
    </div>
  )
}