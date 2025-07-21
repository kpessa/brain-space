import { useState, useCallback, useEffect, useRef } from 'react'

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  const enterFullscreen = useCallback(() => {
    if (!elementRef.current) return

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
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      // Safari
      ;(document as any).webkitExitFullscreen()
    } else if ((document as any).msExitFullscreen) {
      // IE/Edge
      ;(document as any).msExitFullscreen()
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('msfullscreenchange', handleFullscreenChange)
    }
  }, [])

  return {
    elementRef,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  }
}
