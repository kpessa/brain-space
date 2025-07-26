import { getUserFromHeaders } from '@/lib/server-auth'
import BraindumpClient from './braindump-client'

// Force dynamic rendering because React Flow uses React Context
export const dynamic = 'force-dynamic'

export default function BraindumpPage() {
  const user = getUserFromHeaders()
  
  if (!user) {
    return null // This shouldn't happen as layout checks auth
  }

  return <BraindumpClient userId={user.uid} />
}
