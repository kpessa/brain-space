'use client'

import dynamic from 'next/dynamic'

// Dynamic import to work around route group manifest issue
const Dashboard = dynamic(() => import('./dashboard-temp'), {
  ssr: false,
})

export default Dashboard