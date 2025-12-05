import React, { useState, useEffect } from 'react'
import { Box, Typography, Button, keyframes, LinearProgress } from '@mui/material'
import { type QuickDrawState } from '../hooks/useSupabaseRealtime'

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
`

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(255, 193, 7, 0.5); }
  50% { box-shadow: 0 0 40px rgba(255, 193, 7, 0.8), 0 0 60px rgba(255, 193, 7, 0.4); }
`

const slideIn = keyframes`
  from { transform: translateY(50px) scale(0.8); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
`

const flash = keyframes`
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.5; }
`

interface QuickDrawOverlayProps {
  quickDraw: QuickDrawState
  onVote: (vote: string) => void
  currentUserId: string
}

export const QuickDrawOverlay: React.FC<QuickDrawOverlayProps> = ({
  quickDraw,
  onVote,
  currentUserId,
}) => {
  const [timeLeft, setTimeLeft] = useState(5)
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  useEffect(() => {
    if (!quickDraw.active) {
      setHasVoted(false)
      setSelectedCard(null)
      return
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((quickDraw.endTime - Date.now()) / 1000))
      setTimeLeft(remaining)
    }, 100)

    // Check if we already voted
    if (quickDraw.participants.has(currentUserId)) {
      setHasVoted(true)
      setSelectedCard(quickDraw.participants.get(currentUserId) || null)
    }

    return () => clearInterval(interval)
  }, [quickDraw, currentUserId])

  const handleCardClick = (card: string) => {
    if (hasVoted) return
    setSelectedCard(card)
    setHasVoted(true)
    onVote(card)
  }

  if (!quickDraw.active) return null

  const progress = (timeLeft / 5) * 100
  const isUrgent = timeLeft <= 2

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 10003,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      {/* Title */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '2.5rem', md: '4rem' },
            fontWeight: 900,
            color: '#ffc107',
            textShadow: '0 0 20px rgba(255, 193, 7, 0.8), 0 0 40px rgba(255, 193, 7, 0.4)',
            animation: `${pulse} 0.5s ease-in-out infinite, ${shake} 0.3s ease-in-out`,
            letterSpacing: '0.1em',
          }}
        >
          ⚡ QUICK DRAW ⚡
        </Typography>
        <Typography
          variant="h5"
          sx={{
            color: '#fff',
            mt: 1,
            animation: `${slideIn} 0.5s ease-out`,
          }}
        >
          {hasVoted ? 'Vote locked in! Waiting for others...' : 'Choose your card NOW!'}
        </Typography>
      </Box>

      {/* Timer */}
      <Box sx={{ width: '80%', maxWidth: 400 }}>
        <Typography
          variant="h2"
          sx={{
            textAlign: 'center',
            color: isUrgent ? '#f44336' : '#ffc107',
            fontWeight: 900,
            fontSize: '3rem',
            animation: isUrgent ? `${flash} 0.3s ease-in-out infinite` : 'none',
            mb: 1,
          }}
        >
          {timeLeft}s
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            '& .MuiLinearProgress-bar': {
              bgcolor: isUrgent ? '#f44336' : '#ffc107',
              transition: 'transform 0.1s linear',
            },
          }}
        />
      </Box>

      {/* Cards */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {quickDraw.cards.map((card, index) => (
          <Button
            key={card}
            onClick={() => handleCardClick(card)}
            disabled={hasVoted}
            sx={{
              width: { xs: 80, md: 120 },
              height: { xs: 120, md: 180 },
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 900,
              borderRadius: 3,
              bgcolor: selectedCard === card ? '#4caf50' : '#ffc107',
              color: selectedCard === card ? '#fff' : '#000',
              border: '4px solid',
              borderColor: selectedCard === card ? '#2e7d32' : '#ff8f00',
              animation: `${slideIn} ${0.3 + index * 0.1}s ease-out, ${glow} 1.5s ease-in-out infinite`,
              animationDelay: `${index * 0.1}s`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: hasVoted ? undefined : '#ffca28',
                transform: hasVoted ? undefined : 'scale(1.1)',
              },
              '&:disabled': {
                bgcolor: selectedCard === card ? '#4caf50' : 'rgba(255, 193, 7, 0.3)',
                color: selectedCard === card ? '#fff' : 'rgba(0, 0, 0, 0.5)',
              },
            }}
          >
            {card}
          </Button>
        ))}
      </Box>

      {/* Participants count */}
      <Typography
        variant="h6"
        sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          animation: `${slideIn} 0.6s ease-out`,
        }}
      >
        {quickDraw.participants.size} player{quickDraw.participants.size !== 1 ? 's' : ''} voted
      </Typography>

      {/* Double Power info */}
      <Box
        sx={{
          bgcolor: 'rgba(255, 193, 7, 0.2)',
          border: '2px solid #ffc107',
          borderRadius: 2,
          px: 3,
          py: 1.5,
          animation: `${pulse} 2s ease-in-out infinite`,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: '#ffc107',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          🎯 Participate to earn DOUBLE POWER for the next round! 🎯
        </Typography>
      </Box>
    </Box>
  )
}

