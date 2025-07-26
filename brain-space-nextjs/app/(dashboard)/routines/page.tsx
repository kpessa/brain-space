import { getUserFromHeaders } from '@/lib/server-auth'
import RoutinesClient from './routines-client'

export default function RoutinesPage() {
  const user = getUserFromHeaders()
  
  if (!user) {
    return null // This shouldn't happen as layout checks auth
  }

  return <RoutinesClient userId={user.uid} />
}
