import Link from 'next/link'
import { Brain } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Brain className="h-16 w-16 text-brain-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          404 - Page Not Found
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brain-600 hover:bg-brain-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brain-500"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}