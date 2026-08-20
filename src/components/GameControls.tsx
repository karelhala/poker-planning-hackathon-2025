import React from 'react';
import { Box, Button, Paper, Typography, Tooltip, Chip, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  FlashOn as FlashOnIcon,
} from '@mui/icons-material';
import type { VotingMode } from '../hooks/useSupabaseRealtime';

export type GameState = 'VOTING' | 'REVEALED' | 'QUICK_DRAW';

interface GameControlsProps {
  isAdmin: boolean;
  gameState: GameState;
  isProcessing?: boolean;
  onRevealCards: () => void;
  onResetVoting: () => void;
  voteSpread?: { min: number; max: number; spread: number; average: number };
  onTriggerQuickDraw?: () => void;
  onNextTicket?: () => void;
  doublePowerCount?: number;
  votingMode?: VotingMode;
  onSetVotingMode?: (mode: VotingMode) => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  isAdmin,
  gameState,
  voteSpread,
  onTriggerQuickDraw,
  onNextTicket,
  doublePowerCount = 0,
  votingMode = 'fibonacci',
  onSetVotingMode,
}) => {
  if (!isAdmin) {
    return null;
  }

  const hasBigSpread = voteSpread && voteSpread.spread >= 5 && gameState === 'REVEALED';

  return (
    <Paper
      elevation={1}
      sx={{
        p: 1.5,
        bgcolor: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(8px)',
        borderLeft: 3,
        borderColor: gameState === 'QUICK_DRAW' ? 'warning.main' : 'primary.main',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {doublePowerCount > 0 && (
            <Chip size="small" label={`⚡ ${doublePowerCount} with 2x`} color="warning" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Voting Mode Toggle */}
          {onSetVotingMode && (
            <ToggleButtonGroup
              value={votingMode}
              exclusive
              onChange={(_e, newMode) => {
                if (newMode !== null) onSetVotingMode(newMode as VotingMode);
              }}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  px: 1.5,
                  py: 0.25,
                },
              }}
            >
              <ToggleButton value="fibonacci">
                <Tooltip title="Fibonacci: 0, 1, 2, 3, 5, 8, 13, 21">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    🔢 Fibonacci
                  </Box>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="tshirt">
                <Tooltip title="T-Shirt: S, M, L, XL">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    👕 T-Shirt
                  </Box>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          )}

          {hasBigSpread && onTriggerQuickDraw && (
            <Tooltip title="Quick vote with 3 options around the average. Participants earn double power!">
              <Button
                variant="contained"
                size="small"
                onClick={onTriggerQuickDraw}
                color="warning"
                startIcon={<FlashOnIcon />}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 193, 7, 0.4)' },
                    '50%': { boxShadow: '0 0 0 8px rgba(255, 193, 7, 0)' },
                  },
                }}
              >
                Quick Draw
              </Button>
            </Tooltip>
          )}

          {voteSpread && gameState === 'REVEALED' && (
            <Typography variant="caption" color={hasBigSpread ? 'warning.main' : 'text.secondary'} sx={{ fontSize: '0.7rem' }}>
              Spread: {voteSpread.spread}{hasBigSpread && ' ⚠️'}
            </Typography>
          )}

          <Button
            variant="outlined"
            size="small"
            color="secondary"
            disabled={gameState === 'QUICK_DRAW'}
            startIcon={<ArrowForwardIcon />}
            onClick={onNextTicket}
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          >
            Next Ticket
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
