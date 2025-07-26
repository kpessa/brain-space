import { getUserFromHeaders } from '@/lib/server-auth'
import CalendarSettingsClient from './calendar-settings-client'

export default function CalendarSettingsPage() {
  const user = getUserFromHeaders()
  
  if (!user) {
    return null // This shouldn't happen as layout checks auth
  }

  return <CalendarSettingsClient userId={user.uid} />
}
