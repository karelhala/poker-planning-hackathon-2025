import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Avatar, Grid, Chip, Divider,
} from '@mui/material';
import {
  generateAvatarDataUri, loadAvatarConfig, saveAvatarConfig,
  loadUnlockedItems, saveUnlockedItems, isItemFree,
  type AvatarConfig,
} from '../services/avatarService';

interface AvatarEditorProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  points: number;
  onSpendPoints: (amount: number) => void;
  onSave?: () => void;
}

interface OptionItem {
  value: string;
  label: string;
  free: boolean;
  cost?: number;
}

const HAIR_OPTIONS: OptionItem[] = [
  { value: 'none', label: 'Bald', free: true },
  { value: 'short01', label: 'Buzz', free: true },
  { value: 'short03', label: 'Short', free: true },
  { value: 'long01', label: 'Long', free: true },
  { value: 'short05', label: 'Mohawk', free: false, cost: 3 },
  { value: 'long08', label: 'Afro', free: false, cost: 3 },
  { value: 'long15', label: 'Bun', free: false, cost: 4 },
  { value: 'long12', label: 'Pigtails', free: false, cost: 4 },
  { value: 'short15', label: 'Pomp', free: false, cost: 4 },
  { value: 'long18', label: 'Mullet', free: false, cost: 5 },
  { value: 'long20', label: 'Braids', free: false, cost: 5 },
  { value: 'short10', label: 'Spiky', free: false, cost: 3 },
];

const EYES_OPTIONS: OptionItem[] = [
  { value: 'variant01', label: 'Square', free: true },
  { value: 'variant06', label: 'Down', free: true },
  { value: 'variant04', label: 'Low', free: false, cost: 2 },
  { value: 'variant08', label: 'Left', free: false, cost: 3 },
  { value: 'variant10', label: 'Shaded', free: false, cost: 5 },
  { value: 'variant03', label: 'High', free: false, cost: 3 },
  { value: 'variant12', label: 'Sleepy', free: false, cost: 2 },
];

const MOUTH_OPTIONS: OptionItem[] = [
  { value: 'happy09', label: 'Smile', free: true },
  { value: 'happy03', label: 'Dot', free: true },
  { value: 'happy05', label: 'Shaded', free: false, cost: 2 },
  { value: 'happy01', label: 'Square', free: false, cost: 2 },
  { value: 'happy13', label: 'Cross', free: false, cost: 3 },
  { value: 'sad01', label: 'Frown', free: false, cost: 2 },
  { value: 'sad06', label: 'Line', free: false, cost: 3 },
];

const CLOTHING_OPTIONS: OptionItem[] = [
  { value: 'variant01', label: 'T-Shirt', free: true },
  { value: 'variant03', label: 'Knit', free: true },
  { value: 'variant08', label: 'Crewneck', free: false, cost: 3 },
  { value: 'variant05', label: 'V-Neck', free: false, cost: 5 },
  { value: 'variant12', label: 'Highneck', free: false, cost: 4 },
  { value: 'variant15', label: 'Pads', free: false, cost: 6 },
  { value: 'variant18', label: 'Low-V', free: false, cost: 3 },
];

const SKIN_COLORS = [
  { value: 'f5d0a9', label: 'Light' },
  { value: 'e8b98a', label: 'Peach' },
  { value: 'c68642', label: 'Tan' },
  { value: '8d5524', label: 'Brown' },
  { value: '614335', label: 'Dark' },
  { value: 'ffdbac', label: 'Fair' },
];

const HAIR_COLORS = [
  { value: '2c1b18', label: 'Black' },
  { value: '724133', label: 'Brown' },
  { value: 'a55728', label: 'Auburn' },
  { value: 'e8e1e1', label: 'Gray' },
  { value: 'f59797', label: 'Pink' },
  { value: '4a90d9', label: 'Blue' },
  { value: '77311d', label: 'Red' },
  { value: 'ecdcbf', label: 'Blonde' },
];

const BEARD_OPTIONS: OptionItem[] = [
  { value: '', label: 'None', free: true },
  { value: 'variant01', label: 'Full', free: false, cost: 2 },
  { value: 'variant02', label: 'Chin', free: false, cost: 2 },
  { value: 'variant04', label: 'Goatee', free: false, cost: 3 },
  { value: 'variant08', label: 'Lumberjack', free: false, cost: 4 },
  { value: 'variant03', label: 'Viking', free: false, cost: 6 },
];

const CLOTHING_COLORS = [
  { value: '1565c0', label: 'Blue' },
  { value: 'c62828', label: 'Red' },
  { value: '2e7d32', label: 'Green' },
  { value: 'f57f17', label: 'Yellow' },
  { value: '4a148c', label: 'Purple' },
  { value: '212121', label: 'Black' },
  { value: 'e0e0e0', label: 'White' },
  { value: 'ff6f00', label: 'Orange' },
];

export const AvatarEditor: React.FC<AvatarEditorProps> = ({ open, onClose, userId, points, onSpendPoints, onSave }) => {
  const [config, setConfig] = useState<AvatarConfig>(() => loadAvatarConfig());
  const [unlocked, setUnlocked] = useState<Set<string>>(() => loadUnlockedItems());

  const previewUri = useMemo(
    () => generateAvatarDataUri(userId, config),
    [userId, config]
  );

  const isUnlocked = (category: string, value: string) => {
    if (!value) return true;
    const key = `${category}:${value}`;
    return isItemFree(key) || unlocked.has(key);
  };

  const buyItem = (category: string, value: string, cost: number) => {
    if (points < cost) return;
    const key = `${category}:${value}`;
    const next = new Set(unlocked);
    next.add(key);
    setUnlocked(next);
    saveUnlockedItems(next);
    onSpendPoints(cost);
  };

  const update = (key: keyof AvatarConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: value ? [value] : undefined,
    }));
  };

  const handleSave = () => {
    saveAvatarConfig(config);
    onSave?.();
    onClose();
  };

  const handleReset = () => {
    setConfig({});
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          src={previewUri}
          sx={{ width: 48, height: 48, border: '2px solid', borderColor: 'primary.main', '& img': { imageRendering: 'pixelated' } }}
        />
        <Box sx={{ flexGrow: 1 }}>Customize Avatar</Box>
        <Chip
          label={`🪙 ${points}`}
          size="small"
          sx={{ fontWeight: 700, bgcolor: 'rgba(255,193,7,0.15)', color: '#F9A825', border: '1px solid rgba(255,193,7,0.3)' }}
        />
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        {/* Live preview */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, mt: 1 }}>
          <Avatar
            src={previewUri}
            sx={{
              width: 120,
              height: 120,
              border: '3px solid',
              borderColor: 'primary.main',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              '& img': { imageRendering: 'pixelated' },
            }}
          />
        </Box>

        {/* Skin Color */}
        <SectionHeader title="Skin Color" />
        <ColorRow
          colors={SKIN_COLORS}
          selected={config.skinColor?.[0]}
          onSelect={(v) => update('skinColor', v)}
        />

        <Divider sx={{ my: 1.5 }} />

        {/* Hair */}
        <SectionHeader title="Hair" />
        <OptionGrid
          options={HAIR_OPTIONS}
          selected={config.hair?.[0]}
          onSelect={(v) => update('hair', v)}
          previewKey="hair"
          userId={userId}
          baseConfig={config}
          category="hair"
          isUnlocked={isUnlocked}
          onBuy={buyItem}
          currentPoints={points}
        />
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Hair Color</Typography>
          <ColorRow
            colors={HAIR_COLORS}
            selected={config.hairColor?.[0]}
            onSelect={(v) => update('hairColor', v)}
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Eyes */}
        <SectionHeader title="Eyes" />
        <OptionGrid
          options={EYES_OPTIONS}
          selected={config.eyes?.[0]}
          onSelect={(v) => update('eyes', v)}
          previewKey="eyes"
          userId={userId}
          baseConfig={config}
          category="eyes"
          isUnlocked={isUnlocked}
          onBuy={buyItem}
          currentPoints={points}
        />

        <Divider sx={{ my: 1.5 }} />

        {/* Beard */}
        <SectionHeader title="Beard" />
        <OptionGrid
          options={BEARD_OPTIONS}
          selected={config.beard?.[0] || ''}
          onSelect={(v) => {
            setConfig(prev => ({
              ...prev,
              beard: v ? [v] : undefined,
              beardProbability: v ? 100 : 0,
            }));
          }}
          previewKey="beard"
          userId={userId}
          baseConfig={config}
          category="beard"
          isUnlocked={isUnlocked}
          onBuy={buyItem}
          currentPoints={points}
        />

        <Divider sx={{ my: 1.5 }} />

        {/* Mouth */}
        <SectionHeader title="Mouth" />
        <OptionGrid
          options={MOUTH_OPTIONS}
          selected={config.mouth?.[0]}
          onSelect={(v) => update('mouth', v)}
          previewKey="mouth"
          userId={userId}
          baseConfig={config}
          category="mouth"
          isUnlocked={isUnlocked}
          onBuy={buyItem}
          currentPoints={points}
        />

        <Divider sx={{ my: 1.5 }} />

        {/* Clothing */}
        <SectionHeader title="Clothing" />
        <OptionGrid
          options={CLOTHING_OPTIONS}
          selected={config.clothing?.[0]}
          onSelect={(v) => update('clothing', v)}
          previewKey="clothing"
          userId={userId}
          baseConfig={config}
          category="clothing"
          isUnlocked={isUnlocked}
          onBuy={buyItem}
          currentPoints={points}
        />
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Shirt Color</Typography>
          <ColorRow
            colors={CLOTHING_COLORS}
            selected={config.clothingColor?.[0]}
            onSelect={(v) => update('clothingColor', v)}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleReset} color="warning" size="small">
          Reset
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small">
          Save Avatar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

function SectionHeader({ title }: { title: string }) {
  return (
    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75, fontSize: '0.8rem' }}>
      {title}
    </Typography>
  );
}

function ColorRow({ colors, selected, onSelect }: {
  colors: { value: string; label: string }[];
  selected?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
      {colors.map(c => (
        <Box
          key={c.value}
          onClick={() => onSelect(c.value)}
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: `#${c.value}`,
            cursor: 'pointer',
            border: selected === c.value ? '3px solid' : '2px solid',
            borderColor: selected === c.value ? 'primary.main' : 'rgba(0,0,0,0.15)',
            transition: 'all 0.15s ease',
            boxShadow: selected === c.value ? '0 0 0 2px rgba(25,118,210,0.3)' : 'none',
            '&:hover': { transform: 'scale(1.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' },
          }}
          title={c.label}
        />
      ))}
    </Box>
  );
}

function OptionGrid({ options, selected, onSelect, previewKey, userId, baseConfig, category, isUnlocked, onBuy, currentPoints }: {
  options: OptionItem[];
  selected?: string;
  onSelect: (value: string) => void;
  previewKey: string;
  userId: string;
  baseConfig: AvatarConfig;
  category: string;
  isUnlocked: (category: string, value: string) => boolean;
  onBuy: (category: string, value: string, cost: number) => void;
  currentPoints: number;
}) {
  return (
    <Grid container spacing={1}>
      {options.map(opt => {
        const owned = isUnlocked(category, opt.value);
        const isSelected = selected === opt.value || (!selected && opt.value === '');
        const canAfford = opt.cost ? currentPoints >= opt.cost : true;
        const previewConfig = {
          ...baseConfig,
          [previewKey]: opt.value === 'none' ? ['none'] : opt.value ? [opt.value] : undefined,
          ...(previewKey === 'beard' && { beardProbability: opt.value ? 100 : 0 }),
        };
        const previewUri = generateAvatarDataUri(userId, previewConfig);

        const handleClick = () => {
          if (owned) {
            onSelect(opt.value);
          } else if (opt.cost && canAfford) {
            onBuy(category, opt.value, opt.cost);
            onSelect(opt.value);
          }
        };

        return (
          <Grid item key={opt.value || 'none'}>
            <Box
              onClick={handleClick}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.25,
                p: 0.5,
                borderRadius: 1,
                border: '2px solid',
                borderColor: isSelected ? 'primary.main' : 'transparent',
                bgcolor: isSelected ? 'action.selected' : 'transparent',
                cursor: owned || canAfford ? 'pointer' : 'not-allowed',
                opacity: owned ? 1 : canAfford ? 0.75 : 0.35,
                transition: 'all 0.15s ease',
                '&:hover': owned || canAfford ? { bgcolor: 'action.hover', borderColor: owned ? 'primary.light' : '#FFC107' } : {},
              }}
            >
              <Avatar
                src={previewUri}
                sx={{ width: 40, height: 40, '& img': { imageRendering: 'pixelated' } }}
              />
              <Typography variant="caption" sx={{ fontSize: '0.55rem', lineHeight: 1.2 }}>
                {opt.label}
              </Typography>
              {!owned && opt.cost && (
                <Chip
                  label={`🪙 ${opt.cost}`}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.5rem',
                    fontWeight: 700,
                    bgcolor: canAfford ? 'rgba(255,193,7,0.2)' : 'rgba(0,0,0,0.1)',
                    color: canAfford ? '#F9A825' : 'text.disabled',
                    border: canAfford ? '1px solid rgba(255,193,7,0.4)' : 'none',
                  }}
                />
              )}
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
}
