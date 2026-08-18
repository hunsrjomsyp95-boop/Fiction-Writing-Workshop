import { useState, useEffect, useRef, useCallback } from 'react'

export function useTypingTracker(novelId) {
  const [typing, setTyping] = useState({ today: 0, session: 0, hourly: [] })
  const [streak, setStreak] = useState(0)
  const [dailyGoal, setDailyGoal] = useState(0)
  const typingPending = useRef(0)
  const typingTimer = useRef(null)

  const typingFlush = useCallback(() => {
    if (typingPending.current <= 0) return
    const w = typingPending.current
    typingPending.current = 0
    window.api.addTypingWords(novelId, w).then(setTyping)
  }, [novelId])

  useEffect(() => {
    window.api.getTypingStats(novelId).then(setTyping)
    window.api.getWritingStreak(novelId).then(setStreak)
    window.api.getSetting('daily_goal', '0').then((v) => setDailyGoal(parseInt(v) || 0))
    return () => {
      clearTimeout(typingTimer.current)
      typingFlush()
    }
  }, [novelId, typingFlush])

  const handleTyping = useCallback(
    (n) => {
      typingPending.current += n
      setTyping((t) => ({ ...t, session: t.session + n }))
      if (!typingTimer.current) {
        typingTimer.current = setTimeout(() => {
          typingTimer.current = null
          typingFlush()
        }, 3000)
      }
    },
    [typingFlush]
  )

  return { typing, streak, dailyGoal, handleTyping }
}
