import React from 'react';
import { Box, Button, Paper, Typography, Divider, Tooltip, Chip } from '@mui/material';
import {
  Visibility as VisibilityIcon,
  RestartAlt as RestartAltIcon,
  ArrowForward as ArrowForwardIcon,
  FlashOn as FlashOnIcon,
} from '@mui/icons-material';

export type GameState = 'VOTING' | 'REVEALED' | 'QUICK_DRAW';

interface GameControlsProps {
  isAdmin: boolean;
  gameState: GameState;
  onRevealCards: () => void;
  onResetVoting: () => void;
  voteSpread?: { min: number; max: number; spread: number; average: number };
  onTriggerQuickDraw?: () => void;
  onNextTicket?: () => void;
  doublePowerCount?: number;
}

export const GameControls: React.FC<GameControlsProps> = ({
  isAdmin,
  gameState,
  onRevealCards,
  onResetVoting,
  voteSpread,
  onTriggerQuickDraw,
  onNextTicket,
  doublePowerCount = 0,
}) => {
  if (!isAdmin) {
    return null;
  }

  const hasBigSpread = voteSpread && voteSpread.spread >= 5 && gameState === 'REVEALED';

  const getStatusText = () => {
    if (gameState === 'QUICK_DRAW') return 'Quick Draw in progress!';
    if (gameState === 'VOTING') return 'Players are voting - reveal when ready';
    return 'Cards revealed - reset to start new round';
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mb: 2,
        position: 'sticky',
        top: 80,
        zIndex: 10,
        bgcolor: 'background.paper',
        borderLeft: 4,
        borderColor: gameState === 'QUICK_DRAW' ? 'warning.main' : 'primary.main',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              Game Controls
            </Typography>
            {doublePowerCount > 0 && (
              <Chip
                size="small"
                label={`⚡ ${doublePowerCount} with Double Power`}
                color="warning"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {getStatusText()}
          </Typography>
          {voteSpread && gameState === 'REVEALED' && (
            <Typography variant="caption" display="block" color={hasBigSpread ? 'warning.main' : 'text.secondary'}>
              Spread: {voteSpread.min} → {voteSpread.max} (diff: {voteSpread.spread})
              {hasBigSpread && ' ⚠️ Big spread detected!'}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {gameState === 'VOTING' && (
            <Button
              variant="contained"
              size="large"
              onClick={onRevealCards}
              color="primary"
              startIcon={<VisibilityIcon />}
              sx={{
                fontWeight: 600,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              Reveal Cards
            </Button>
          )}

          {hasBigSpread && onTriggerQuickDraw && (
            <Tooltip title="Trigger a quick vote with 3 options around the average. Participants earn double power!">
              <Button
                variant="contained"
                size="large"
                onClick={onTriggerQuickDraw}
                color="warning"
                startIcon={<FlashOnIcon />}
                sx={{
                  fontWeight: 600,
                  boxShadow: 2,
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 193, 7, 0.4)' },
                    '50%': { boxShadow: '0 0 0 10px rgba(255, 193, 7, 0)' },
                  },
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                ⚡ Quick Draw!
              </Button>
            </Tooltip>
          )}
          
          <Button
            variant="outlined"
            size="large"
            onClick={onResetVoting}
            color="warning"
            disabled={gameState === 'QUICK_DRAW'}
            startIcon={<RestartAltIcon />}
            sx={{
              fontWeight: 600,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              },
            }}
          >
            Reset Round
          </Button>

          <Divider orientation="vertical" flexItem />
              <Button
                variant="outlined"
                size="large"
                color="secondary"
                disabled={gameState === 'QUICK_DRAW'}
                startIcon={<ArrowForwardIcon />}
                onClick={onNextTicket}
                sx={{
                  fontWeight: 600,
                }}
              >
                Next Ticket
              </Button>
        </Box>
      </Box>
    </Paper>
  );
};

