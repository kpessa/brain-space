import { AuthDebug } from '@/components/AuthDebug'

export default function AuthTest() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Authentication Test Page</h1>
        <AuthDebug />
      </div>
    </div>
  )
}
