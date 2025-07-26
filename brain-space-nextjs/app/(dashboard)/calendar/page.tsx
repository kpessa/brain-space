import { getUserFromHeaders } from '@/lib/server-auth'
import CalendarClient from './calendar-client'

export default function CalendarPage() {
  const user = getUserFromHeaders()
  
  if (!user) {
    return null // This shouldn't happen as layout checks auth
  }

  return <CalendarClient userId={user.uid} />
}
