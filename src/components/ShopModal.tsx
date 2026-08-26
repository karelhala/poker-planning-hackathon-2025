import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  Chip, Tabs, Tab, Grid, Button, Tooltip,
} from '@mui/material';
import { SHOP_ITEMS, RARITY_COLORS, type ShopItem, type ItemRarity } from '../data/shopItems';

interface ShopModalProps {
  open: boolean;
  onClose: () => void;
  points: number;
  onBuy: (item: ShopItem) => void;
  ownedItems: string[];
}

const TABS: { label: string; rarity: ItemRarity; icon: string }[] = [
  { label: 'Normal', rarity: 'normal', icon: '🃏' },
  { label: 'Rare', rarity: 'rare', icon: '💎' },
  { label: 'Legendary', rarity: 'legendary', icon: '⭐' },
];

export const ShopModal: React.FC<ShopModalProps> = ({ open, onClose, points, onBuy, ownedItems }) => {
  const [tab, setTab] = useState(0);

  const currentRarity = TABS[tab].rarity;
  const items = SHOP_ITEMS.filter(i => i.rarity === currentRarity);
  const ownedSet = new Set(ownedItems);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Typography sx={{ fontSize: '1.4rem' }}>🏪</Typography>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Item Shop</Typography>
          <Typography variant="caption" color="text.secondary">
            Buy items with your points. Consumables reset when you leave.
          </Typography>
        </Box>
        <Chip
          label={`🪙 ${points}`}
          sx={{
            fontWeight: 700,
            fontSize: '0.9rem',
            bgcolor: 'rgba(255,193,7,0.15)',
            color: '#F9A825',
            border: '1px solid rgba(255,193,7,0.3)',
            px: 1,
          }}
        />
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          px: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { fontWeight: 600, minHeight: 48 },
        }}
      >
        {TABS.map((t) => (
          <Tab
            key={t.rarity}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
                <Chip
                  label={SHOP_ITEMS.filter(item => item.rarity === t.rarity).length}
                  size="small"
                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                />
              </Box>
            }
          />
        ))}
      </Tabs>

      <DialogContent sx={{ pt: 2, minHeight: 400 }}>
        <Grid container spacing={2}>
          {items.map(item => {
            const owned = item.type === 'permanent' && ownedSet.has(item.id);
            const canAfford = points >= item.cost;
            const colors = RARITY_COLORS[item.rarity];

            return (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: owned ? 'success.main' : colors.border,
                    bgcolor: owned ? 'rgba(76,175,80,0.05)' : colors.bg,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                    opacity: !owned && !canAfford ? 0.5 : 1,
                    '&:hover': {
                      borderColor: owned ? 'success.main' : canAfford ? colors.text : colors.border,
                      boxShadow: canAfford && !owned ? `0 0 12px ${colors.border}` : 'none',
                    },
                  }}
                >
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                    <Typography sx={{ fontSize: '1.8rem', lineHeight: 1 }}>{item.icon}</Typography>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>
                        {item.name}
                      </Typography>
                      <Chip
                        label={item.type === 'permanent' ? 'Permanent' : 'Single Use'}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.5rem',
                          fontWeight: 600,
                          mt: 0.25,
                          bgcolor: item.type === 'permanent' ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.08)',
                          color: item.type === 'permanent' ? '#66BB6A' : 'text.secondary',
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Description */}
                  <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1, mb: 1.5, lineHeight: 1.4 }}>
                    {item.description}
                  </Typography>

                  {/* Buy button */}
                  {owned ? (
                    <Chip
                      label="✓ Owned"
                      size="small"
                      color="success"
                      sx={{ fontWeight: 600, alignSelf: 'flex-start' }}
                    />
                  ) : (
                    <Tooltip
                      title={
                        !item.implemented
                          ? 'Coming soon!'
                          : !canAfford
                            ? `Need ${item.cost - points} more points`
                            : ''
                      }
                      arrow
                    >
                      <span>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={!canAfford || !item.implemented}
                          onClick={() => onBuy(item)}
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            bgcolor: canAfford && item.implemented ? colors.text : undefined,
                            '&:hover': { bgcolor: canAfford && item.implemented ? colors.text : undefined, filter: 'brightness(0.9)' },
                          }}
                        >
                          🪙 {item.cost} {!item.implemented && '(Soon)'}
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
