import React, { useState, useEffect } from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import type { PointEvent } from '../hooks/usePoints';

const floatUp = keyframes`
  0% { opacity: 1; transform: translateY(0) scale(1); }
  70% { opacity: 1; transform: translateY(-30px) scale(1.1); }
  100% { opacity: 0; transform: translateY(-50px) scale(0.8); }
`;

interface PointsFloaterProps {
  events: PointEvent[];
}

export const PointsFloater: React.FC<PointsFloaterProps> = ({ events }) => {
  const [visibleEvents, setVisibleEvents] = useState<PointEvent[]>([]);

  useEffect(() => {
    if (events.length === 0) return;
    const latest = events[0];
    if (!latest) return;

    setVisibleEvents(prev => {
      if (prev.some(e => e.id === latest.id)) return prev;
      return [latest, ...prev].slice(0, 5);
    });

    const timer = setTimeout(() => {
      setVisibleEvents(prev => prev.filter(e => e.id !== latest.id));
    }, 1500);

    return () => clearTimeout(timer);
  }, [events]);

  return (
    <Box sx={{
      position: 'fixed',
      top: 80,
      right: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 0.5,
      zIndex: 1000,
      pointerEvents: 'none',
    }}>
      {visibleEvents.map(event => (
        <Box
          key={event.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.5,
            borderRadius: '16px',
            bgcolor: event.amount >= 3 ? 'rgba(255, 193, 7, 0.9)' : 'rgba(76, 175, 80, 0.9)',
            color: event.amount >= 3 ? '#000' : '#fff',
            animation: `${floatUp} 1.5s ease-out forwards`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          }}
        >
          <Typography sx={{ fontSize: '0.85rem' }}>{event.icon}</Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
            +{event.amount}
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
            {event.reason}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};
