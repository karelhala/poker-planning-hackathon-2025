import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import { type CopyRevealEffect } from '../hooks/useSupabaseRealtime';

// Animations
const fadeOut = keyframes`
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

const bounceIn = keyframes`
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.3) rotate(10deg);
  }
  70% {
    transform: scale(0.9) rotate(-5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
`;

const wiggle = keyframes`
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const confetti = keyframes`
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
`;

const slideInFromLeft = keyframes`
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
`;

interface CopycatRevealEffectProps {
  effects: CopyRevealEffect[];
  onAnimationEnd: () => void;
}

// Confetti particle component
const ConfettiParticle: React.FC<{ delay: number; color: string; left: number }> = ({ delay, color, left }) => (
  <Box
    sx={{
      position: 'fixed',
      top: -20,
      left: `${left}%`,
      width: 10,
      height: 10,
      bgcolor: color,
      borderRadius: '2px',
      animation: `${confetti} 3s ease-in forwards`,
      animationDelay: `${delay}s`,
      zIndex: 10001,
    }}
  />
);

export const CopycatRevealEffect: React.FC<CopycatRevealEffectProps> = ({
  effects,
  onAnimationEnd,
}) => {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<{ id: number; color: string; left: number; delay: number }[]>([]);
  const onAnimationEndRef = useRef(onAnimationEnd);

  // Keep ref updated
  useEffect(() => {
    onAnimationEndRef.current = onAnimationEnd;
  }, [onAnimationEnd]);

  useEffect(() => {
    if (effects.length === 0) {
      setVisible(false);
      setFadingOut(false);
      return;
    }

    setVisible(true);
    setFadingOut(false);

    // Generate confetti particles
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      color: ['#9c27b0', '#e91e63', '#ff9800', '#4caf50', '#2196f3', '#ffeb3b'][Math.floor(Math.random() * 6)],
      left: Math.random() * 100,
      delay: Math.random() * 1,
    }));
    setConfettiParticles(particles);

    // Start fade-out after 4 seconds
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, 4000);

    // Fully dismiss after 5 seconds (4s visible + 1s fade)
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setFadingOut(false);
      onAnimationEndRef.current();
    }, 5000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [effects]);

  const handleDismiss = () => {
    setFadingOut(true);
    setTimeout(() => {
      setVisible(false);
      setFadingOut(false);
      onAnimationEndRef.current();
    }, 300);
  };

  if (!visible || effects.length === 0) return null;

  return (
    <>
      {/* Confetti */}
      {confettiParticles.map((particle) => (
        <ConfettiParticle
          key={particle.id}
          color={particle.color}
          left={particle.left}
          delay={particle.delay}
        />
      ))}

      {/* Overlay */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          ...(fadingOut && {
            animation: `${fadeOut} 1s ease-out forwards`,
          }),
        }}
        onClick={handleDismiss}
      >
        {/* Big COPYCAT title */}
        <Typography
          variant="h1"
          sx={{
            fontSize: '5rem',
            fontWeight: 900,
            color: '#9c27b0',
            textShadow: '0 0 20px rgba(156, 39, 176, 0.8), 0 0 40px rgba(156, 39, 176, 0.6)',
            animation: `${bounceIn} 0.6s ease-out, ${wiggle} 0.5s ease-in-out 0.6s 3`,
            letterSpacing: '0.1em',
          }}
        >
          🐱 COPYCAT! 🐱
        </Typography>

        {/* Each copy reveal */}
        {effects.map((effect, index) => (
          <Box
            key={effect.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: 'rgba(156, 39, 176, 0.2)',
              borderRadius: 4,
              px: 4,
              py: 2,
              border: '3px solid #9c27b0',
              animation: `${slideInFromLeft} 0.5s ease-out forwards, ${float} 2s ease-in-out infinite`,
              animationDelay: `${0.3 + index * 0.2}s, ${0.8 + index * 0.2}s`,
              opacity: 0,
            }}
          >
            {/* Copier */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h4"
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                {effect.copierUserName || 'Someone'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                the copycat
              </Typography>
            </Box>

            {/* Arrow with cat emoji */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '2rem', animation: `${wiggle} 0.3s ease-in-out infinite` }}>
                📋
              </Typography>
              <Typography sx={{ color: '#9c27b0', fontSize: '2rem', fontWeight: 900 }}>
                →
              </Typography>
            </Box>

            {/* Target */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h4"
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                {effect.targetUserName || 'Someone'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                the original
              </Typography>
            </Box>

            {/* Vote value */}
            <Box
              sx={{
                ml: 2,
                bgcolor: '#9c27b0',
                color: '#fff',
                borderRadius: 2,
                px: 3,
                py: 1,
                fontSize: '2rem',
                fontWeight: 900,
                boxShadow: '0 0 20px rgba(156, 39, 176, 0.8)',
                animation: `${bounceIn} 0.5s ease-out`,
                animationDelay: `${0.6 + index * 0.2}s`,
                animationFillMode: 'backwards',
              }}
            >
              {effect.copiedVote || '?'}
            </Box>
          </Box>
        ))}

        {/* Funny message */}
        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            mt: 2,
            fontStyle: 'italic',
            animation: `${float} 2s ease-in-out infinite`,
          }}
        >
          {effects.length === 1 
            ? "Imitation is the sincerest form of flattery! 😸"
            : "Multiple copycats detected! The cloning has begun! 🐱🐱"}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.5)',
            mt: 2,
          }}
        >
          {fadingOut ? 'Bye bye! 👋' : 'Click anywhere to dismiss (auto-closes in 5s)'}
        </Typography>
      </Box>
    </>
  );
};

