// Force dynamic rendering to avoid static generation issues with auth
export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700">
      {children}
    </div>
  )
}