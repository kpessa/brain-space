import { getUserFromHeaders } from '@/lib/server-auth'
import RecurringClient from './recurring-client'

export default function RecurringPage() {
  const user = getUserFromHeaders()
  
  if (!user) {
    return null // This shouldn't happen as layout checks auth
  }

  return <RecurringClient userId={user.uid} />
}
