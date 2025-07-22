import { useState, useCallback, useEffect, useRef } from 'react'

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false)

  // Check if fullscreen API is supported
  const isFullscreenSupported = () => {
    return !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).msFullscreenEnabled
    )
  }

  const enterFullscreen = useCallback(() => {
    if (!elementRef.current) return

    // For mobile devices that don't support fullscreen API, use CSS fullscreen
    if (!isFullscreenSupported()) {
      setIsMobileFullscreen(true)
      setIsFullscreen(true)
      return
    }

    const elem = elementRef.current
    if (elem.requestFullscreen) {
      elem.requestFullscreen()
    } else if ((elem as any).webkitRequestFullscreen) {
      // Safari
      ;(elem as any).webkitRequestFullscreen()
    } else if ((elem as any).msRequestFullscreen) {
      // IE/Edge
      ;(elem as any).msRequestFullscreen()
    }
  }, [])

  const exitFullscreen = useCallback(() => {
    // For mobile devices using CSS fullscreen
    if (isMobileFullscreen) {
      setIsMobileFullscreen(false)
      setIsFullscreen(false)
      return
    }

    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      // Safari
      ;(document as any).webkitExitFullscreen()
    } else if ((document as any).msExitFullscreen) {
      // IE/Edge
      ;(document as any).msExitFullscreen()
    }
  }, [isMobileFullscreen])

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen])

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!isMobileFullscreen) {
        setIsFullscreen(!!document.fullscreenElement)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('msfullscreenchange', handleFullscreenChange)
    }
  }, [isMobileFullscreen])

  // Apply CSS classes for mobile fullscreen
  useEffect(() => {
    if (elementRef.current && isMobileFullscreen) {
      elementRef.current.classList.add('mobile-fullscreen')
      document.body.classList.add('mobile-fullscreen-active')
    } else if (elementRef.current) {
      elementRef.current.classList.remove('mobile-fullscreen')
      document.body.classList.remove('mobile-fullscreen-active')
    }
  }, [isMobileFullscreen])

  return {
    elementRef,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  }
}
