import moment from 'moment-timezone'

/**
 * Date utilities using Moment.js for robust timezone handling
 * 
 * All functions return dates in YYYY-MM-DD format unless specified otherwise.
 * UTC dates from backend are automatically converted to user's local timezone.
 */
export function useDateUtils() {
  // Get user's timezone
  const getUserTimezone = (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }

  // Convert UTC date to local date string (YYYY-MM-DD format)
  const toLocalDateString = (utcDate: string | Date): string => {
    const userTimezone = getUserTimezone()
    return moment.tz(utcDate, userTimezone).format('YYYY-MM-DD')
  }

  // Get today's date in local timezone as YYYY-MM-DD string
  const getTodayString = (): string => {
    const userTimezone = getUserTimezone()
    return moment.tz(userTimezone).format('YYYY-MM-DD')
  }

  // Get first day of current month in local timezone as YYYY-MM-DD string
  const getThisMonthFirstDay = (): string => {
    const userTimezone = getUserTimezone()
    return moment.tz(userTimezone).startOf('month').format('YYYY-MM-DD')
  }

  // Get last day of current month in local timezone as YYYY-MM-DD string
  const getThisMonthLastDay = (): string => {
    const userTimezone = getUserTimezone()
    return moment.tz(userTimezone).endOf('month').format('YYYY-MM-DD')
  }

  // Get first day of last month in local timezone as YYYY-MM-DD string
  const getLastMonthFirstDay = (): string => {
    const userTimezone = getUserTimezone()
    return moment.tz(userTimezone).subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
  }

  // Get last day of last month in local timezone as YYYY-MM-DD string
  const getLastMonthLastDay = (): string => {
    const userTimezone = getUserTimezone()
    return moment.tz(userTimezone).subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
  }

  // Get date N days ago in local timezone as YYYY-MM-DD string
  const getDaysAgo = (days: number): string => {
    const userTimezone = getUserTimezone()
    return moment.tz(userTimezone).subtract(days, 'days').format('YYYY-MM-DD')
  }

  // Get start of week (Sunday) in local timezone as YYYY-MM-DD string
  const getStartOfWeek = (): string => {
    const userTimezone = getUserTimezone()
    return moment.tz(userTimezone).startOf('week').format('YYYY-MM-DD')
  }

  // Get end of week (Saturday) in local timezone as YYYY-MM-DD string
  const getEndOfWeek = (): string => {
    const userTimezone = getUserTimezone()
    return moment.tz(userTimezone).endOf('week').format('YYYY-MM-DD')
  }

  // Check if two dates are the same day in local timezone
  const isSameDay = (date1: string | Date, date2: string | Date): boolean => {
    const userTimezone = getUserTimezone()
    const moment1 = moment.tz(date1, userTimezone)
    const moment2 = moment.tz(date2, userTimezone)
    return moment1.isSame(moment2, 'day')
  }

  // Format date for display (e.g., "Today", "Yesterday", "Dec 25")
  const formatRelativeDate = (date: string | Date): string => {
    const userTimezone = getUserTimezone()
    const momentDate = moment.tz(date, userTimezone)
    const today = moment.tz(userTimezone)
    
    if (momentDate.isSame(today, 'day')) {
      return 'Today'
    } else if (momentDate.isSame(today.clone().subtract(1, 'day'), 'day')) {
      return 'Yesterday'
    } else if (momentDate.isSame(today, 'year')) {
      return momentDate.format('MMM D')
    } else {
      return momentDate.format('MMM D, YYYY')
    }
  }

  // Format time ago (e.g., "2 hours ago", "Just now")
  const formatTimeAgo = (date: string | Date): string => {
    const userTimezone = getUserTimezone()
    const momentDate = moment.tz(date, userTimezone)
    return momentDate.fromNow()
  }

  return {
    getUserTimezone,
    toLocalDateString,
    getTodayString,
    getThisMonthFirstDay,
    getThisMonthLastDay,
    getLastMonthFirstDay,
    getLastMonthLastDay,
    getDaysAgo,
    getStartOfWeek,
    getEndOfWeek,
    isSameDay,
    formatRelativeDate,
    formatTimeAgo
  }
}