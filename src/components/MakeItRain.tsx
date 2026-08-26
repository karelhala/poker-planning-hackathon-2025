import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, keyframes } from '@mui/material';

const catchPop = keyframes`
  0% { transform: scale(1); opacity: 1; }
  40% { transform: scale(1.6); opacity: 1; }
  100% { transform: scale(0); opacity: 0; }
`;

const wobble = keyframes`
  0%, 100% { transform: rotate(-3deg) scale(1); }
  50% { transform: rotate(3deg) scale(1.05); }
`;

const fadeAway = keyframes`
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.3); }
`;

export type RainSize = 'small' | 'medium' | 'large';

const RAIN_CONFIG: Record<RainSize, { count: number; spawnDuration: number; lingerTime: number; label: string }> = {
  small: { count: 15, spawnDuration: 5000, lingerTime: 2000, label: 'Drizzle' },
  medium: { count: 35, spawnDuration: 5000, lingerTime: 2000, label: 'Rain' },
  large: { count: 60, spawnDuration: 5000, lingerTime: 2000, label: 'Jackpot' },
};

interface Chip {
  id: number;
  x: number;
  y: number;
  spawnAt: number;
  fadeAt: number;
  caught: boolean;
  fading: boolean;
}

interface MakeItRainProps {
  active: boolean;
  size: RainSize;
  onCatch: () => void;
  onEnd: () => void;
}

export const MakeItRain: React.FC<MakeItRainProps> = ({ active, size, onCatch, onEnd }) => {
  const [chips, setChips] = useState<Chip[]>([]);
  const [caught, setCaught] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const startTimeRef = useRef(0);
  const frameRef = useRef<number>();
  const endTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!active) {
      setChips([]);
      setCaught(0);
      setShowScore(false);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }

    const config = RAIN_CONFIG[size];
    const now = Date.now();
    startTimeRef.current = now;
    const newChips: Chip[] = [];

    for (let i = 0; i < config.count; i++) {
      const spawnDelay = Math.random() * config.spawnDuration;
      newChips.push({
        id: i,
        x: 15 + Math.random() * 70,
        y: 15 + Math.random() * 55,
        spawnAt: now + spawnDelay,
        fadeAt: now + spawnDelay + config.lingerTime,
        caught: false,
        fading: false,
      });
    }

    setChips(newChips);
    setCaught(0);

    const totalDuration = 7000;

    const tick = () => {
      const t = Date.now();
      setChips(prev => prev.map(c => {
        if (c.caught || c.fading) return c;
        if (t > c.fadeAt) return { ...c, fading: true };
        return c;
      }));
      if (t - startTimeRef.current < totalDuration) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    endTimerRef.current = setTimeout(() => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      setShowScore(true);
      setTimeout(() => onEnd(), 2500);
    }, totalDuration);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, [active, size]);

  const handleCatchChip = useCallback((chipId: number) => {
    setChips(prev => prev.map(c =>
      c.id === chipId && !c.caught && !c.fading ? { ...c, caught: true } : c
    ));
    setCaught(prev => prev + 1);
    onCatch();
  }, [onCatch]);

  if (!active && !showScore) return null;

  const config = RAIN_CONFIG[size];
  const now = Date.now();

  return (
    <Box sx={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {/* Chips on the table */}
      {chips.map(chip => {
        const visible = now >= chip.spawnAt;
        if (!visible && !chip.caught) return null;

        return (
          <Box
            key={chip.id}
            onClick={() => !chip.caught && !chip.fading && handleCatchChip(chip.id)}
            sx={{
              position: 'absolute',
              left: `${chip.x}%`,
              top: `${chip.y}%`,
              width: 40,
              height: 40,
              borderRadius: '50%',
              cursor: chip.caught || chip.fading ? 'default' : 'pointer',
              pointerEvents: chip.caught || chip.fading ? 'none' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 800,
              userSelect: 'none',
              animation: chip.caught
                ? `${catchPop} 0.35s ease-out forwards`
                : chip.fading
                  ? `${fadeAway} 0.8s ease-in forwards`
                  : `${wobble} 1.5s ease-in-out infinite`,
              animationDelay: chip.caught || chip.fading ? '0s' : `${(chip.id % 5) * 0.15}s`,
              bgcolor: chip.caught ? '#4CAF50' : '#FFC107',
              color: chip.caught ? '#fff' : '#5D4037',
              border: chip.caught ? '2px solid #388E3C' : '3px solid #FF8F00',
              boxShadow: chip.caught
                ? '0 0 16px rgba(76,175,80,0.7)'
                : '0 3px 10px rgba(0,0,0,0.35), inset 0 1px 3px rgba(255,255,255,0.4)',
              transition: 'background-color 0.15s, box-shadow 0.15s',
              '&:hover': !chip.caught && !chip.fading ? {
                bgcolor: '#FFD54F',
                boxShadow: '0 0 20px rgba(255,193,7,0.7)',
                transform: 'scale(1.25)',
              } : {},
            }}
          >
            {chip.caught ? '✓' : '🪙'}
          </Box>
        );
      })}

      {/* Score popup */}
      {showScore && (
        <Box sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 2001,
          bgcolor: 'rgba(0,0,0,0.85)',
          borderRadius: 3,
          px: 5,
          py: 3,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          border: '2px solid rgba(255,193,7,0.3)',
          pointerEvents: 'auto',
        }}>
          <Typography sx={{ fontSize: '2.5rem', mb: 0.5 }}>🪙</Typography>
          <Typography sx={{ color: '#FFC107', fontWeight: 800, fontSize: '2rem' }}>
            +{caught}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
            chips caught!
          </Typography>
        </Box>
      )}

      {/* Rain label */}
      {active && !showScore && (
        <Box sx={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          bgcolor: 'rgba(255,193,7,0.9)',
          color: '#3E2723',
          px: 3,
          py: 1,
          borderRadius: 2,
          fontWeight: 700,
          fontSize: '1rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          zIndex: 2001,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}>
          💰 {config.label}! Click chips to catch them! ({caught} caught)
        </Box>
      )}
    </Box>
  );
};
