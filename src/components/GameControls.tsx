import React from 'react';
import { Box, Button, Paper, Typography, Divider } from '@mui/material';
import {
  Visibility as VisibilityIcon,
  RestartAlt as RestartAltIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

export type GameState = 'VOTING' | 'REVEALED';

interface GameControlsProps {
  isAdmin: boolean;
  gameState: GameState;
  onRevealCards: () => void;
  onResetVoting: () => void;
  hasJiraToken?: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  isAdmin,
  gameState,
  onRevealCards,
  onResetVoting,
  hasJiraToken = false,
}) => {
  if (!isAdmin) {
    return null;
  }

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
        borderColor: 'primary.main',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Game Controls
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {gameState === 'VOTING' 
              ? 'Players are voting - reveal when ready'
              : 'Cards revealed - reset to start new round'
            }
          </Typography>
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
          
          <Button
            variant="outlined"
            size="large"
            onClick={onResetVoting}
            color="warning"
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

          {hasJiraToken && (
            <>
              <Divider orientation="vertical" flexItem />
              <Button
                variant="outlined"
                size="large"
                color="secondary"
                startIcon={<ArrowForwardIcon />}
                disabled
                sx={{
                  fontWeight: 600,
                }}
              >
                Next Ticket
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

