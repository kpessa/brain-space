import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { DateLocalizer } from 'react-big-calendar'

// Extend dayjs with plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(weekOfYear)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export function dayjsLocalizer(): DateLocalizer {
  const dateRangeFormat = (range: { start: Date; end: Date }, culture?: string, local?: any) => {
    return dayjs(range.start).format('MMMM DD') + ' – ' + dayjs(range.end).format('MMMM DD, YYYY')
  }

  const timeRangeFormat = (range: { start: Date; end: Date }, culture?: string, local?: any) => {
    return dayjs(range.start).format('h:mm A') + ' – ' + dayjs(range.end).format('h:mm A')
  }

  const timeRangeStartFormat = (range: { start: Date; end: Date }, culture?: string, local?: any) => {
    return dayjs(range.start).format('h:mm A') + ' – '
  }

  const timeRangeEndFormat = (range: { start: Date; end: Date }, culture?: string, local?: any) => {
    return ' – ' + dayjs(range.end).format('h:mm A')
  }

  return new DateLocalizer({
    formats: {
      dateFormat: 'DD',
      dayFormat: 'DD ddd',
      weekdayFormat: 'ddd',
      selectRangeFormat: timeRangeFormat,
      eventTimeRangeFormat: timeRangeFormat,
      eventTimeRangeStartFormat: timeRangeStartFormat,
      eventTimeRangeEndFormat: timeRangeEndFormat,
      timeGutterFormat: 'h:mm A',
      monthHeaderFormat: 'MMMM YYYY',
      dayHeaderFormat: 'dddd MMM DD',
      dayRangeHeaderFormat: dateRangeFormat,
      agendaHeaderFormat: dateRangeFormat,
      agendaDateFormat: 'ddd MMM DD',
      agendaTimeFormat: 'h:mm A',
      agendaTimeRangeFormat: timeRangeFormat,
    },

    messages: {
      allDay: 'All Day',
      previous: 'Back',
      next: 'Next',
      today: 'Today',
      month: 'Month',
      week: 'Week',
      day: 'Day',
      agenda: 'Agenda',
      date: 'Date',
      time: 'Time',
      event: 'Event',
      noEventsInRange: 'There are no events in this range.',
      showMore: (total: number) => `+${total} more`,
    },

    firstOfWeek: (culture?: string) => 0, // Sunday

    format: (value: Date, format: string, culture?: string) => {
      return dayjs(value).format(format)
    },

    parse: (value: string, format: string, culture?: string) => {
      const parsed = dayjs(value, format)
      return parsed.isValid() ? parsed.toDate() : new Date(value)
    },

    startOf: (value: Date, unit: 'month' | 'week' | 'day' | 'date') => {
      return dayjs(value).startOf(unit).toDate()
    },

    endOf: (value: Date, unit: 'month' | 'week' | 'day' | 'date') => {
      return dayjs(value).endOf(unit).toDate()
    },

    eq: (a: Date, b: Date, unit?: 'month' | 'week' | 'day' | 'date') => {
      return dayjs(a).isSame(dayjs(b), unit)
    },

    neq: (a: Date, b: Date, unit?: 'month' | 'week' | 'day' | 'date') => {
      return !dayjs(a).isSame(dayjs(b), unit)
    },

    gt: (a: Date, b: Date, unit?: 'month' | 'week' | 'day' | 'date') => {
      return dayjs(a).isAfter(dayjs(b), unit)
    },

    gte: (a: Date, b: Date, unit?: 'month' | 'week' | 'day' | 'date') => {
      return dayjs(a).isSameOrAfter(dayjs(b), unit)
    },

    lt: (a: Date, b: Date, unit?: 'month' | 'week' | 'day' | 'date') => {
      return dayjs(a).isBefore(dayjs(b), unit)
    },

    lte: (a: Date, b: Date, unit?: 'month' | 'week' | 'day' | 'date') => {
      return dayjs(a).isSameOrBefore(dayjs(b), unit)
    },

    add: (value: Date, amount: number, unit: 'month' | 'week' | 'day' | 'date' | 'hour' | 'minute' | 'second') => {
      return dayjs(value).add(amount, unit).toDate()
    },

    range: (start: Date, end: Date, unit: 'month' | 'week' | 'day' | 'date') => {
      const startDay = dayjs(start)
      const endDay = dayjs(end)
      const range: Date[] = []
      let current = startDay

      while (current.isSameOrBefore(endDay, unit)) {
        range.push(current.toDate())
        current = current.add(1, unit)
      }

      return range
    },

    inRange: (day: Date, min: Date, max: Date, unit?: 'month' | 'week' | 'day' | 'date') => {
      const dayObj = dayjs(day)
      return dayObj.isSameOrAfter(dayjs(min), unit) && dayObj.isSameOrBefore(dayjs(max), unit)
    },

    min: (dateA: Date, dateB: Date) => {
      return dayjs(dateA).isBefore(dayjs(dateB)) ? dateA : dateB
    },

    max: (dateA: Date, dateB: Date) => {
      return dayjs(dateA).isAfter(dayjs(dateB)) ? dateA : dateB
    },

    minutes: (date: Date) => {
      return dayjs(date).minute()
    },

    hours: (date: Date) => {
      return dayjs(date).hour()
    },

    day: (date: Date) => {
      return dayjs(date).day()
    },

    date: (date: Date) => {
      return dayjs(date).date()
    },

    month: (date: Date) => {
      return dayjs(date).month()
    },

    year: (date: Date) => {
      return dayjs(date).year()
    },

    decade: (date: Date) => {
      return Math.floor(dayjs(date).year() / 10) * 10
    },

    century: (date: Date) => {
      return Math.floor(dayjs(date).year() / 100) * 100
    },
  })
}