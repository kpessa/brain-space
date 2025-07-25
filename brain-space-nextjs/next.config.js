/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Configure image domains
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google profile images
  },
  
  
  // Configure headers for Firebase Auth popup compatibility
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ]
  },
  
  // Redirect old routes to new structure
  async redirects() {
    return [
      // Redirect old route group paths to new dashboard paths
      {
        source: '/journal',
        destination: '/dashboard/journal',
        permanent: true,
      },
      {
        source: '/braindump',
        destination: '/dashboard/braindump',
        permanent: true,
      },
      {
        source: '/nodes',
        destination: '/dashboard/nodes',
        permanent: true,
      },
      {
        source: '/progress',
        destination: '/dashboard/progress',
        permanent: true,
      },
      {
        source: '/timebox',
        destination: '/dashboard/timebox',
        permanent: true,
      },
      {
        source: '/routines',
        destination: '/dashboard/routines',
        permanent: true,
      },
      {
        source: '/calendar',
        destination: '/dashboard/calendar',
        permanent: true,
      },
    ]
  },
  
  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
}

module.exports = nextConfig