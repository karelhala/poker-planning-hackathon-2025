import React, { useEffect, useState } from 'react';
import { Box, keyframes } from '@mui/material';

interface ConfettiEffectProps {
  active: boolean;
  onEnd?: () => void;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94',
  '#6C5CE7', '#FD79A8', '#00B894', '#FDCB6E', '#74B9FF',
  '#E17055', '#00CEC9', '#FAB1A0', '#81ECEC', '#DFE6E9',
];

const PARTICLE_COUNT = 60;

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  shape: 'square' | 'rect' | 'circle';
}

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 0.6,
    duration: 1.8 + Math.random() * 1.4,
    drift: -40 + Math.random() * 80,
    spin: 360 + Math.random() * 720,
    shape: (['square', 'rect', 'circle'] as const)[Math.floor(Math.random() * 3)],
  }));
}

const confettiFall = (drift: number, spin: number) => keyframes`
  0% {
    transform: translateY(-20px) translateX(0) rotate(0deg) scale(1);
    opacity: 1;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) translateX(${drift}px) rotate(${spin}deg) scale(0.3);
    opacity: 0;
  }
`;

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ active, onEnd }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    setParticles(makeParticles());

    const timer = setTimeout(() => {
      setParticles([]);
      onEnd?.();
    }, 3500);

    return () => clearTimeout(timer);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {particles.map((p) => (
        <Box
          key={p.id}
          sx={{
            position: 'absolute',
            top: 0,
            left: `${p.x}%`,
            width: p.shape === 'rect' ? p.size * 0.5 : p.size,
            height: p.shape === 'circle' ? p.size : p.size * (p.shape === 'rect' ? 1.6 : 1),
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            bgcolor: p.color,
            animation: `${confettiFall(p.drift, p.spin)} ${p.duration}s ease-in ${p.delay}s forwards`,
            opacity: 0,
            boxShadow: `0 2px 6px ${p.color}66`,
          }}
        />
      ))}
    </Box>
  );
};
