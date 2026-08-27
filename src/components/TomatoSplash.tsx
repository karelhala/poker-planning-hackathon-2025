import React, { useState, useEffect } from 'react';
import { Box, keyframes } from '@mui/material';

const splashIn = keyframes`
  0% { transform: scale(0); opacity: 0; }
  15% { transform: scale(1.2); opacity: 1; }
  30% { transform: scale(1); opacity: 0.95; }
  100% { transform: scale(1); opacity: 0; }
`;

const drip = keyframes`
  0% { transform: translateY(0) scaleY(1); opacity: 0.8; }
  100% { transform: translateY(120px) scaleY(2); opacity: 0; }
`;

const seed = keyframes`
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(0.5); opacity: 0; }
`;

interface TomatoSplashProps {
  active: boolean;
  thrownBy: string;
  onEnd: () => void;
}

const SPLATTER_SPOTS = [
  { x: -60, y: -40, size: 30, delay: 0 },
  { x: 50, y: -30, size: 22, delay: 0.05 },
  { x: -30, y: 50, size: 25, delay: 0.08 },
  { x: 70, y: 40, size: 18, delay: 0.03 },
  { x: -80, y: 10, size: 20, delay: 0.06 },
  { x: 20, y: -60, size: 28, delay: 0.02 },
  { x: -40, y: -70, size: 15, delay: 0.1 },
  { x: 60, y: -55, size: 16, delay: 0.07 },
  { x: -55, y: 60, size: 20, delay: 0.04 },
  { x: 40, y: 65, size: 14, delay: 0.09 },
];

const SEEDS = [
  { dx: -80, dy: -100 },
  { dx: 90, dy: -70 },
  { dx: -50, dy: 80 },
  { dx: 70, dy: 90 },
  { dx: -100, dy: 30 },
  { dx: 30, dy: -90 },
];

const DRIPS = [
  { x: -20, delay: 0.3 },
  { x: 15, delay: 0.5 },
  { x: -45, delay: 0.4 },
  { x: 40, delay: 0.6 },
  { x: 0, delay: 0.35 },
];

export const TomatoSplash: React.FC<TomatoSplashProps> = ({ active, thrownBy, onEnd }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onEnd();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!visible) return null;

  return (
    <Box sx={{
      position: 'fixed',
      inset: 0,
      zIndex: 3000,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Main splat */}
      <Box sx={{
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: '50%',
        bgcolor: 'rgba(211, 47, 47, 0.7)',
        animation: `${splashIn} 3s ease-out forwards`,
        boxShadow: '0 0 60px rgba(211, 47, 47, 0.4)',
      }} />

      {/* Center tomato */}
      <Box sx={{
        position: 'absolute',
        fontSize: '5rem',
        animation: `${splashIn} 3s ease-out forwards`,
        zIndex: 2,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
      }}>
        🍅
      </Box>

      {/* Splatter spots */}
      {SPLATTER_SPOTS.map((spot, i) => (
        <Box
          key={`spot-${i}`}
          sx={{
            position: 'absolute',
            width: spot.size,
            height: spot.size,
            borderRadius: '50%',
            bgcolor: i % 3 === 0 ? 'rgba(198, 40, 40, 0.6)' : 'rgba(229, 57, 53, 0.5)',
            left: `calc(50% + ${spot.x}px)`,
            top: `calc(50% + ${spot.y}px)`,
            animation: `${splashIn} 2.8s ease-out ${spot.delay}s forwards`,
          }}
        />
      ))}

      {/* Flying seeds */}
      {SEEDS.map((s, i) => (
        <Box
          key={`seed-${i}`}
          sx={{
            position: 'absolute',
            width: 8,
            height: 5,
            borderRadius: '50%',
            bgcolor: '#FFF9C4',
            '--dx': `${s.dx}px`,
            '--dy': `${s.dy}px`,
            animation: `${seed} 0.8s ease-out ${0.05 + i * 0.03}s forwards`,
          } as any}
        />
      ))}

      {/* Drips */}
      {DRIPS.map((d, i) => (
        <Box
          key={`drip-${i}`}
          sx={{
            position: 'absolute',
            left: `calc(50% + ${d.x}px)`,
            top: '50%',
            width: 6,
            height: 20,
            borderRadius: '0 0 4px 4px',
            bgcolor: 'rgba(211, 47, 47, 0.5)',
            animation: `${drip} 1.5s ease-in ${d.delay}s forwards`,
          }}
        />
      ))}

      {/* "Thrown by" text */}
      <Box sx={{
        position: 'absolute',
        bottom: '35%',
        fontSize: '1.2rem',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.9)',
        textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        animation: `${splashIn} 3s ease-out 0.2s forwards`,
      }}>
        🍅 {thrownBy} hit you!
      </Box>
    </Box>
  );
};
