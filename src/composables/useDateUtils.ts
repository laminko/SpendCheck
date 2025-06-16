import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  isSameDay as dateFnsIsSameDay,
  isToday,
  isYesterday,
  isSameYear,
  formatDistanceToNow
} from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

/**
 * Date utilities using date-fns for robust timezone handling
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
    
    // Parse the UTC date
    const utcDateTime = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
    
    // Convert UTC to user's local timezone
    const localDateTime = toZonedTime(utcDateTime, userTimezone)
    
    // Return as YYYY-MM-DD string in local timezone
    const result = format(localDateTime, 'yyyy-MM-dd')
    
    
    
    return result
  }

  // Get today's date in local timezone as YYYY-MM-DD string
  const getTodayString = (): string => {
    const now = new Date()
    return format(now, 'yyyy-MM-dd')
  }

  // Get first day of current month in local timezone as YYYY-MM-DD string
  const getThisMonthFirstDay = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const firstDay = new Date(year, month, 1)
    const result = format(firstDay, 'yyyy-MM-dd')
    
    
    return result
  }

  // Get last day of current month in local timezone as YYYY-MM-DD string
  const getThisMonthLastDay = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const lastDay = new Date(year, month + 1, 0) // Last day of current month
    return format(lastDay, 'yyyy-MM-dd')
  }

  // Get first day of last month in local timezone as YYYY-MM-DD string
  const getLastMonthFirstDay = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const firstDay = new Date(year, month - 1, 1) // First day of last month
    return format(firstDay, 'yyyy-MM-dd')
  }

  // Get last day of last month in local timezone as YYYY-MM-DD string
  const getLastMonthLastDay = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const lastDay = new Date(year, month, 0) // Last day of last month
    return format(lastDay, 'yyyy-MM-dd')
  }

  // Get date N days ago in local timezone as YYYY-MM-DD string
  const getDaysAgo = (days: number): string => {
    const now = new Date()
    const daysAgo = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
    return format(daysAgo, 'yyyy-MM-dd')
  }

  // Get start of week (Sunday) in local timezone as YYYY-MM-DD string
  const getStartOfWeek = (): string => {
    const now = new Date()
    const weekStart = startOfWeek(now)
    return format(weekStart, 'yyyy-MM-dd')
  }

  // Get end of week (Saturday) in local timezone as YYYY-MM-DD string
  const getEndOfWeek = (): string => {
    const now = new Date()
    const weekEnd = endOfWeek(now)
    return format(weekEnd, 'yyyy-MM-dd')
  }

  // Check if two dates are the same day in local timezone
  const isSameDay = (date1: string | Date, date2: string | Date): boolean => {
    const userTimezone = getUserTimezone()
    
    // Parse UTC dates
    const utcDate1 = typeof date1 === 'string' ? new Date(date1) : date1
    const utcDate2 = typeof date2 === 'string' ? new Date(date2) : date2
    
    // Convert to local timezone
    const localDate1 = toZonedTime(utcDate1, userTimezone)
    const localDate2 = toZonedTime(utcDate2, userTimezone)
    
    return dateFnsIsSameDay(localDate1, localDate2)
  }

  // Format date for display (e.g., "Today", "Yesterday", "Dec 25")
  const formatRelativeDate = (date: string | Date): string => {
    const userTimezone = getUserTimezone()
    
    // Parse UTC date
    const utcDate = typeof date === 'string' ? new Date(date) : date
    
    // Convert to local timezone
    const localDate = toZonedTime(utcDate, userTimezone)
    const nowLocal = toZonedTime(new Date(), userTimezone)
    
    if (isToday(localDate)) {
      return 'Today'
    } else if (isYesterday(localDate)) {
      return 'Yesterday'
    } else if (isSameYear(localDate, nowLocal)) {
      return format(localDate, 'MMM d')
    } else {
      return format(localDate, 'MMM d, yyyy')
    }
  }

  // Format time ago (e.g., "2 hours ago", "Just now")
  const formatTimeAgo = (date: string | Date): string => {
    const userTimezone = getUserTimezone()
    
    // Parse UTC date
    const utcDate = typeof date === 'string' ? new Date(date) : date
    
    // Convert to local timezone
    const localDate = toZonedTime(utcDate, userTimezone)
    
    return formatDistanceToNow(localDate, { addSuffix: true })
  }

  // Format timestamp with time (e.g., "2024-06-16 2:30 PM")
  const formatDateTime = (timestamp: string | Date): string => {
    const userTimezone = getUserTimezone()
    
    // Parse the UTC timestamp
    const utcDateTime = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    
    // Convert UTC to user's local timezone
    const localDateTime = toZonedTime(utcDateTime, userTimezone)
    
    // Return formatted in local timezone
    return format(localDateTime, 'yyyy-MM-dd h:mm a')
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
    formatTimeAgo,
    formatDateTime
  }
}