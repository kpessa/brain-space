import { getUserFromHeaders } from '@/lib/server-auth'
import ProgressClient from './progress-client'

export default function ProgressPage() {
  const user = getUserFromHeaders()
  
  if (!user) {
    return null // This shouldn't happen as layout checks auth
  }

  return <ProgressClient userId={user.uid} />
}
