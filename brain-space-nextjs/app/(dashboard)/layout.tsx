import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getUserFromHeaders } from '@/lib/server-auth'
import DashboardShell from '@/components/DashboardShell'

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check auth server-side
  const user = getUserFromHeaders()
  
  if (!user) {
    redirect('/login')
  }

  // Get current path for navigation highlighting
  const headersList = headers()
  const pathname = headersList.get('x-pathname') || ''

  // User is authenticated, render the dashboard shell
  return (
    <DashboardShell currentPath={pathname}>
      {children}
    </DashboardShell>
  )
}