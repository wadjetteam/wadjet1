import { useState, useCallback, useEffect, useRef } from 'react'

const INACTIVITY_LIMIT = 300_000
const TIMEOUT_WARNING_DURATION = 60_000

export function useInactivityTimer() {
  const [showTimeout, setShowTimeout] = useState(false)
  const [isLoggedOut, setIsLoggedOut] = useState(false)
  const lastActivityRef = useRef(Date.now())
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeoutWarningRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    setShowTimeout(false)
    if (timeoutWarningRef.current) { clearTimeout(timeoutWarningRef.current); timeoutWarningRef.current = null }
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    inactivityTimerRef.current = setTimeout(() => {
      setShowTimeout(true)
      timeoutWarningRef.current = setTimeout(() => {
        setIsLoggedOut(true)
        setShowTimeout(false)
      }, TIMEOUT_WARNING_DURATION)
    }, INACTIVITY_LIMIT)
  }, [])

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'mousemove', 'touchstart', 'scroll']
    const handle = () => resetInactivityTimer()
    events.forEach(ev => window.addEventListener(ev, handle))
    resetInactivityTimer()
    return () => {
      events.forEach(ev => window.removeEventListener(ev, handle))
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      if (timeoutWarningRef.current) clearTimeout(timeoutWarningRef.current)
    }
  }, [resetInactivityTimer])

  return { showTimeout, isLoggedOut, setIsLoggedOut, handleStayLoggedIn: resetInactivityTimer }
}
