import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, keyframes } from '@mui/material';

interface DiceRollEffectProps {
  active: boolean;
  value: string;
  scale: string[];
  userName: string;
  onEnd: () => void;
}

const bounce = keyframes`
  0% { transform: translateY(0) rotate(0deg) scale(1); }
  15% { transform: translateY(-80px) rotate(90deg) scale(1.1); }
  30% { transform: translateY(0) rotate(180deg) scale(1); }
  45% { transform: translateY(-50px) rotate(270deg) scale(1.05); }
  60% { transform: translateY(0) rotate(360deg) scale(1); }
  75% { transform: translateY(-25px) rotate(420deg) scale(1.02); }
  90% { transform: translateY(0) rotate(450deg) scale(1); }
  100% { transform: translateY(0) rotate(360deg) scale(1); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.3); }
  to { opacity: 1; transform: scale(1); }
`;

const popIn = keyframes`
  0% { opacity: 0; transform: scale(0); }
  60% { transform: scale(1.3); }
  100% { opacity: 1; transform: scale(1); }
`;

const shimmer = keyframes`
  0% { text-shadow: 0 0 10px rgba(255,215,0,0.5); }
  50% { text-shadow: 0 0 30px rgba(255,215,0,0.9), 0 0 60px rgba(255,215,0,0.4); }
  100% { text-shadow: 0 0 10px rgba(255,215,0,0.5); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ROLL_DURATION = 1400;
const SHOW_RESULT_DURATION = 900;

export const DiceRollEffect: React.FC<DiceRollEffectProps> = ({ active, value, scale, onEnd }) => {
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'result'>('idle');
  const [displayValue, setDisplayValue] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      setDisplayValue('');
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setPhase('rolling');
    intervalRef.current = setInterval(() => {
      setDisplayValue(scale[Math.floor(Math.random() * scale.length)]);
    }, 80);

    const rollTimer = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayValue(value);
      setPhase('result');
    }, ROLL_DURATION);

    const endTimer = setTimeout(() => {
      setPhase('idle');
      onEnd();
    }, ROLL_DURATION + SHOW_RESULT_DURATION);

    return () => {
      clearTimeout(rollTimer);
      clearTimeout(endTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  if (phase === 'idle') return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
        pointerEvents: 'none',
        animation: `${fadeIn} 0.2s ease-out`,
      }}
    >
      {/* Backdrop */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Header text */}
      <Typography
        sx={{
          position: 'relative',
          zIndex: 1,
          fontSize: '2rem',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.85)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          mb: 3,
          animation: `${slideUp} 0.4s ease-out`,
          textAlign: 'center',
          px: 2,
        }}
      >
        Who brought dice to a poker?
      </Typography>

      {/* Dice emoji */}
      <Typography
        sx={{
          fontSize: phase === 'rolling' ? '6rem' : '7rem',
          lineHeight: 1,
          position: 'relative',
          zIndex: 1,
          animation: phase === 'rolling'
            ? `${bounce} ${ROLL_DURATION / 1000}s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards`
            : `${popIn} 0.3s ease-out`,
          filter: phase === 'rolling'
            ? 'drop-shadow(0 4px 20px rgba(255,255,255,0.3))'
            : 'drop-shadow(0 4px 30px rgba(255,215,0,0.6))',
          transition: 'filter 0.3s',
        }}
      >
        🎲
      </Typography>

      {/* Cycling / final value */}
      <Typography
        sx={{
          position: 'relative',
          zIndex: 1,
          mt: 2,
          fontSize: phase === 'result' ? '3.5rem' : '2.5rem',
          fontWeight: 900,
          fontFamily: '"Courier New", monospace',
          color: phase === 'result' ? '#FFD700' : 'rgba(255,255,255,0.7)',
          animation: phase === 'result' ? `${popIn} 0.3s ease-out, ${shimmer} 0.8s ease-in-out infinite` : undefined,
          transition: 'font-size 0.2s, color 0.2s',
          minWidth: '80px',
          textAlign: 'center',
          letterSpacing: '0.05em',
        }}
      >
        {displayValue}
      </Typography>

    </Box>
  );
};
