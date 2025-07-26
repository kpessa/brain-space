import { getUserFromHeaders } from '@/lib/server-auth'
import TimeboxClient from './timebox-client'

export default function TimeboxPage() {
  const user = getUserFromHeaders()
  
  if (!user) {
    return null // This shouldn't happen as layout checks auth
  }

  return <TimeboxClient userId={user.uid} />
}
