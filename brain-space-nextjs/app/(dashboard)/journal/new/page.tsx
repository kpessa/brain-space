import { getUserFromHeaders } from '@/lib/server-auth'
import NewJournalEntryClient from './new-journal-client'

export default function NewJournalEntryPage() {
  const user = getUserFromHeaders()
  
  if (!user) {
    return null // This shouldn't happen as layout checks auth
  }

  return <NewJournalEntryClient userId={user.uid} />
}