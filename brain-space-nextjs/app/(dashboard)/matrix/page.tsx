import { getUserFromHeaders } from '@/lib/server-auth'
import MatrixClient from './matrix-client'

// Force dynamic rendering because drag-and-drop uses React Context
export const dynamic = 'force-dynamic'

export default function MatrixPage() {
  const user = getUserFromHeaders()
  
  if (!user) {
    return null // This shouldn't happen as layout checks auth
  }

  return <MatrixClient userId={user.uid} />
}
