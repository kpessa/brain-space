import { getUserFromHeaders } from '@/lib/server-auth'
import TodosClient from './todos-client'

export default function TodosPage() {
  const user = getUserFromHeaders()
  
  if (!user) {
    return null // This shouldn't happen as layout checks auth
  }

  return <TodosClient userId={user.uid} />
}
