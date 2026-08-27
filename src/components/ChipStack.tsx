import React from 'react';
import { Box, Tooltip, keyframes } from '@mui/material';
import { SHOP_ITEMS } from '../data/shopItems';

const popIn = keyframes`
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

interface ChipStackProps {
  items: string[];
  onUseItem: (itemId: string) => void;
}

export const ChipStack: React.FC<ChipStackProps> = ({ items, onUseItem }) => {
  if (items.length === 0) return null;

  const grouped = items.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        zIndex: 1200,
      }}
    >
      {Object.entries(grouped).map(([itemId, count]) => {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return null;

        return (
          <Tooltip
            key={itemId}
            title={`${item.name} — click to use${count > 1 ? ` (${count})` : ''}`}
            placement="left"
            arrow
          >
            <Box
              onClick={() => onUseItem(itemId)}
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: 'rgba(255,193,7,0.9)',
                border: '3px solid #FF8F00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                cursor: 'pointer',
                boxShadow: '0 3px 12px rgba(0,0,0,0.3), inset 0 1px 3px rgba(255,255,255,0.3)',
                position: 'relative',
                transition: 'all 0.2s ease',
                animation: `${popIn} 0.3s ease-out`,
                '&:hover': {
                  transform: 'scale(1.15)',
                  boxShadow: '0 4px 16px rgba(255,193,7,0.5)',
                },
                '&:active': {
                  transform: 'scale(0.9)',
                },
              }}
            >
              {item.icon}
              {count > 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    bgcolor: '#D32F2F',
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #fff',
                  }}
                >
                  {count}
                </Box>
              )}
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
};
