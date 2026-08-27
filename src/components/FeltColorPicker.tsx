import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface FeltColorPickerProps {
  open: boolean;
  onClose: () => void;
  onSelectColor: (color: string) => void;
}

const FELT_COLORS = [
  { id: 'green', label: 'Classic Green', colors: ['#388E3C', '#2E7D32', '#1B5E20', '#145214'] },
  { id: 'blue', label: 'Ocean Blue', colors: ['#1976D2', '#1565C0', '#0D47A1', '#0A3880'] },
  { id: 'red', label: 'Casino Red', colors: ['#C62828', '#B71C1C', '#8E0000', '#6D0000'] },
  { id: 'purple', label: 'Royal Purple', colors: ['#7B1FA2', '#6A1B9A', '#4A148C', '#380E6B'] },
  { id: 'black', label: 'Midnight Black', colors: ['#424242', '#303030', '#212121', '#1A1A1A'] },
  { id: 'pink', label: 'Hot Pink', colors: ['#C2185B', '#AD1457', '#880E4F', '#6A0C3E'] },
  { id: 'orange', label: 'Sunset Orange', colors: ['#E65100', '#BF360C', '#9A2A06', '#7A2005'] },
  { id: 'teal', label: 'Teal Wave', colors: ['#00897B', '#00796B', '#004D40', '#003830'] },
];

export const FeltColorPicker: React.FC<FeltColorPickerProps> = ({ open, onClose, onSelectColor }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">🟩 Choose Felt Color</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, py: 1 }}>
          {FELT_COLORS.map((felt) => (
            <Box
              key={felt.id}
              onClick={() => {
                onSelectColor(felt.id);
                onClose();
              }}
              sx={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '50%',
                background: `radial-gradient(ellipse at 35% 35%, ${felt.colors[0]} 0%, ${felt.colors[1]} 30%, ${felt.colors[2]} 60%, ${felt.colors[3]} 100%)`,
                cursor: 'pointer',
                border: '2px solid transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.15)',
                  border: '2px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 0 12px rgba(255,255,255,0.3)',
                },
              }}
              title={felt.label}
            />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
          Everyone at the table sees the new color
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

/** Map felt color ID to gradient values for PokerTable */
export const FELT_COLOR_MAP: Record<string, string[]> = {
  green: ['#388E3C', '#2E7D32', '#1B5E20', '#145214'],
  blue: ['#1976D2', '#1565C0', '#0D47A1', '#0A3880'],
  red: ['#C62828', '#B71C1C', '#8E0000', '#6D0000'],
  purple: ['#7B1FA2', '#6A1B9A', '#4A148C', '#380E6B'],
  black: ['#424242', '#303030', '#212121', '#1A1A1A'],
  pink: ['#C2185B', '#AD1457', '#880E4F', '#6A0C3E'],
  orange: ['#E65100', '#BF360C', '#9A2A06', '#7A2005'],
  teal: ['#00897B', '#00796B', '#004D40', '#003830'],
};
