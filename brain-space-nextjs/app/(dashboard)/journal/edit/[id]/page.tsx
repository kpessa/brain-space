import { getUserFromHeaders } from '@/lib/server-auth'
import EditJournalEntryClient from './edit-journal-client'

export default function EditJournalEntryPage() {
  const user = getUserFromHeaders()
  
  if (!user) {
    return null // This shouldn't happen as layout checks auth
  }

  return <EditJournalEntryClient userId={user.uid} />
}