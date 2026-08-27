import React from 'react';
import { Box, Tooltip, keyframes } from '@mui/material';
import { SHOP_ITEMS } from '../data/shopItems';

const popIn = keyframes`
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const ghostShimmer = keyframes`
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.55; }
`;

interface ChipStackProps {
  items: string[];
  onUseItem: (itemId: string) => void;
  ghostChipCount?: number;
}

export const ChipStack: React.FC<ChipStackProps> = ({ items, onUseItem, ghostChipCount = 0 }) => {
  if (items.length === 0 && ghostChipCount === 0) return null;

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
      {/* Real consumable chips on top */}
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

      {/* Ghost chips at bottom — translucent, not clickable */}
      {ghostChipCount > 0 && (
        <Tooltip title={`Ghost Stack — ${ghostChipCount} fake chips (bluff)`} placement="left" arrow>
          <Box sx={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', mt: items.length > 0 ? 0.5 : 0 }}>
            {Array.from({ length: Math.min(ghostChipCount, 15) }).map((_, i) => (
              <Box
                key={`ghost-${i}`}
                sx={{
                  width: 38,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: i % 2 === 0 ? 'rgba(255,193,7,0.25)' : 'rgba(255,179,0,0.2)',
                  border: '1px solid rgba(255,143,0,0.3)',
                  mt: i > 0 ? '-4px' : 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  animation: `${ghostShimmer} 3s ease-in-out ${i * 0.15}s infinite`,
                  pointerEvents: 'none',
                }}
              />
            ))}
            <Box sx={{
              fontSize: '0.7rem',
              mt: 0.5,
              color: 'rgba(255,255,255,0.4)',
              pointerEvents: 'none',
              textAlign: 'center',
            }}>
              👻
            </Box>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
};
