import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Box, Portal } from '@mui/material';
import { keyframes } from '@mui/system';

interface Sparkle {
  id: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
  dx: number;
  dy: number;
  createdAt: number;
}

interface PokeEffectProps {
  pokeId: string | null;
  onAnimationEnd: () => void;
}

// Sparkle fly animation
const sparkleFly = keyframes`
  0% {
    transform: translate(0, 0) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate(calc(var(--dx) * 0.2), calc(var(--dy) * 0.2)) scale(1);
    opacity: 0.6;
  }
  100% {
    transform: translate(var(--dx), var(--dy)) scale(0.3);
    opacity: 0;
  }
`;

const SPARKLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#FF9F43', '#A29BFE',
  '#FD79A8', '#00B894', '#E17055', '#74B9FF',
];

export const PokeEffect: React.FC<PokeEffectProps> = ({ pokeId, onAnimationEnd }) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const lastPokeIdRef = useRef<string | null>(null);

  const createSparkles = useCallback((baseId: string) => {
    const sparks: Sparkle[] = [];
    const now = Date.now();
    for (let i = 0; i < 30; i++) {
      sparks.push({
        id: `${baseId}-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 20 + 10,
        delay: Math.random() * 0.3,
        color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
        dx: (Math.random() - 0.5) * 200,
        dy: (Math.random() - 0.5) * 200,
        createdAt: now,
      });
    }
    return sparks;
  }, []);

  const triggerShake = useCallback(() => {
    const root = document.getElementById('root');
    if (root) {
      // Reset animation to allow re-triggering
      root.style.animation = 'none';
      // Force reflow
      void root.offsetHeight;
      root.style.animation = 'pokeShake 0.4s ease-in-out';
    }
  }, []);

  // Handle new pokes
  useEffect(() => {
    if (pokeId && pokeId !== lastPokeIdRef.current) {
      lastPokeIdRef.current = pokeId;
      
      // Add new sparkles to existing ones
      const newSparkles = createSparkles(pokeId);
      setSparkles(prev => [...prev, ...newSparkles]);
      
      // Trigger shake
      triggerShake();
    }
  }, [pokeId, createSparkles, triggerShake]);

  // Cleanup old sparkles periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setSparkles(prev => {
        const filtered = prev.filter(s => now - s.createdAt < 2000);
        // If all sparkles are gone, call onAnimationEnd
        if (filtered.length === 0 && prev.length > 0) {
          onAnimationEnd();
        }
        return filtered;
      });
    }, 500);

    return () => clearInterval(cleanup);
  }, [onAnimationEnd]);

  // Inject shake keyframes into document
  useEffect(() => {
    const styleId = 'poke-shake-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes pokeShake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-3px, -2px); }
          40% { transform: translate(3px, 2px); }
          60% { transform: translate(-2px, 1px); }
          80% { transform: translate(2px, -1px); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (sparkles.length === 0) return null;

  return (
    <Portal>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 10000,
          overflow: 'hidden',
        }}
      >
        {/* Sparkles */}
        {sparkles.map((spark) => (
          <Box
            key={spark.id}
            sx={{
              position: 'absolute',
              left: `${spark.x}%`,
              top: `${spark.y}%`,
              width: spark.size,
              height: spark.size,
              borderRadius: '50%',
              backgroundColor: spark.color,
              opacity: 0.5,
              boxShadow: `0 0 12px ${spark.color}`,
              '--dx': `${spark.dx}px`,
              '--dy': `${spark.dy}px`,
              animation: `${sparkleFly} 1.5s ease-out forwards`,
              animationDelay: `${spark.delay}s`,
            } as any}
          />
        ))}
      </Box>
    </Portal>
  );
};
