import { useState, useEffect } from 'react'

type Orientation = 'portrait' | 'landscape'

interface OrientationState {
  orientation: Orientation
  dimensions: {
    width: number
    height: number
  }
  isMobile: boolean
  isMobileLandscape: boolean
  isTabletLandscape: boolean
}

export function useOrientation(): OrientationState {
  const [state, setState] = useState<OrientationState>(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    const orientation = width > height ? 'landscape' : 'portrait'
    
    return {
      orientation,
      dimensions: { width, height },
      isMobile: width < 768,
      isMobileLandscape: width <= 932 && orientation === 'landscape',
      isTabletLandscape: width > 932 && width <= 1366 && orientation === 'landscape',
    }
  })

  useEffect(() => {
    const updateOrientation = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const orientation = width > height ? 'landscape' : 'portrait'
      
      const newState = {
        orientation,
        dimensions: { width, height },
        isMobile: width < 768,
        isMobileLandscape: width <= 932 && orientation === 'landscape',
        isTabletLandscape: width > 932 && width <= 1366 && orientation === 'landscape',
      }
      
      setState(newState)
    }

    // Listen to both resize and orientationchange events
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)

    // Initial update
    updateOrientation()

    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
    }
  }, [])

  return state
}