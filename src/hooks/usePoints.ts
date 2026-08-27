import { useState, useCallback, useRef } from 'react'

export interface PointEvent {
  id: string
  amount: number
  reason: string
  icon: string
  timestamp: number
}

export interface PlayerPoints {
  visibleUserId: string
  points: number
}

const POINT_RULES = {
  VOTE_CAST: { amount: 2, reason: 'Voted', icon: '🗳️' },
  CONSENSUS: { amount: 3, reason: 'Consensus!', icon: '🎯' },
  CLOSE_AGREEMENT: { amount: 1, reason: 'Close agreement', icon: '👍' },
  FIRST_TO_VOTE: { amount: 1, reason: 'First to vote', icon: '⚡' },
  CLOSEST_TO_AVG: { amount: 1, reason: 'Closest to average', icon: '🎯' },
  STREAK_BONUS: { amount: 1, reason: 'Voting streak', icon: '🔥' },
  SESSION_JOIN: { amount: 100, reason: 'Session started', icon: '👋' },
  QUICK_DRAW_JOIN: { amount: 2, reason: 'Quick Draw', icon: '⚡' },
  QUICK_DRAW_WIN: { amount: 3, reason: 'Quick Draw winner', icon: '🏆' },
} as const

export type PointRuleKey = keyof typeof POINT_RULES

export { POINT_RULES }

export const usePoints = () => {
  const [points, setPoints] = useState(0)
  const [recentEvents, setRecentEvents] = useState<PointEvent[]>([])
  const [votingStreak, setVotingStreak] = useState(0)
  const sessionJoinedRef = useRef(false)

  const awardPoints = useCallback((ruleKey: PointRuleKey) => {
    const rule = POINT_RULES[ruleKey]
    const event: PointEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      amount: rule.amount,
      reason: rule.reason,
      icon: rule.icon,
      timestamp: Date.now(),
    }
    setPoints(prev => prev + rule.amount)
    setRecentEvents(prev => [event, ...prev].slice(0, 50))
    return event
  }, [])

  const awardCustomPoints = useCallback((amount: number, reason: string, icon: string) => {
    const event: PointEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      amount,
      reason,
      icon,
      timestamp: Date.now(),
    }
    setPoints(prev => prev + amount)
    setRecentEvents(prev => [event, ...prev].slice(0, 50))
    return event
  }, [])

  const onSessionJoin = useCallback(() => {
    if (!sessionJoinedRef.current) {
      sessionJoinedRef.current = true
      return awardPoints('SESSION_JOIN')
    }
    return null
  }, [awardPoints])

  const onVoteCast = useCallback(() => {
    setVotingStreak(prev => {
      const newStreak = prev + 1
      if (newStreak > 0 && newStreak % 3 === 0) {
        setTimeout(() => awardPoints('STREAK_BONUS'), 100)
      }
      return newStreak
    })
    return awardPoints('VOTE_CAST')
  }, [awardPoints])

  const onReveal = useCallback((spread: number, currentUserId: string, players: Array<{ userId: string; vote: string | null }>, average: number) => {
    const events: PointEvent[] = []

    if (spread === 0) {
      events.push(awardPoints('CONSENSUS'))
    } else if (spread <= 2) {
      events.push(awardPoints('CLOSE_AGREEMENT'))
    }

    const myVote = players.find(p => p.userId === currentUserId)?.vote
    if (myVote !== null && myVote !== undefined) {
      const numVote = Number(myVote)
      if (!isNaN(numVote)) {
        const distances = players
          .filter(p => p.vote !== null)
          .map(p => ({ userId: p.userId, dist: Math.abs(Number(p.vote) - average) }))
          .filter(d => !isNaN(d.dist))

        if (distances.length > 0) {
          const minDist = Math.min(...distances.map(d => d.dist))
          const myDist = Math.abs(numVote - average)
          if (myDist === minDist) {
            events.push(awardPoints('CLOSEST_TO_AVG'))
          }
        }
      }
    }

    return events
  }, [awardPoints])

  const resetSession = useCallback(() => {
    setPoints(0)
    setRecentEvents([])
    setVotingStreak(0)
    sessionJoinedRef.current = false
  }, [])

  return {
    points,
    recentEvents,
    votingStreak,
    awardPoints,
    awardCustomPoints,
    onSessionJoin,
    onVoteCast,
    onReveal,
    resetSession,
    POINT_RULES,
  }
}
