import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Divider,
} from '@mui/material';
import { POINT_RULES } from '../hooks/usePoints';

interface PointsEconomyModalProps {
  open: boolean;
  onClose: () => void;
}

export const PointsEconomyModal: React.FC<PointsEconomyModalProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <span style={{ fontSize: '1.4rem' }}>🪙</span>
        Point Economy
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Earn points by participating. Points reset when you leave the room — spend them or lose them!
        </Typography>

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
          Automatic Rewards
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Points</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>When</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(POINT_RULES).map(([key, rule]) => (
                <TableRow key={key} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <span>{rule.icon}</span>
                      <span>{rule.reason}</span>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`+${rule.amount}`}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: rule.amount >= 3 ? '#FFC107' : '#E0E0E0',
                        color: rule.amount >= 3 ? '#000' : '#333',
                        minWidth: 40,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {getDescription(key)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
          How It Works
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <InfoRow icon="🗳️" text="Vote each round to earn base points" />
          <InfoRow icon="🎯" text="Consensus (everyone votes the same) gives a big bonus" />
          <InfoRow icon="⚡" text="Be the first to vote for a speed bonus" />
          <InfoRow icon="🔥" text="Vote 3 rounds in a row for a streak bonus" />
          <InfoRow icon="💸" text="Points reset when you leave — use them or lose them!" />
          <InfoRow icon="🎨" text="Avatar purchases are permanent and carry across sessions" />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" size="small">
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
};

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      <Typography variant="body2">{text}</Typography>
    </Box>
  );
}

function getDescription(key: string): string {
  const descriptions: Record<string, string> = {
    VOTE_CAST: 'Every time you submit a vote',
    CONSENSUS: 'All voters pick the same value (spread = 0)',
    CLOSE_AGREEMENT: 'Vote spread is 2 or less',
    FIRST_TO_VOTE: 'First player to submit their vote in a round',
    CLOSEST_TO_AVG: 'Your vote is closest to the final average',
    STREAK_BONUS: 'Every 3 consecutive rounds you vote in',
    SESSION_JOIN: 'One-time bonus when you join a room',
    QUICK_DRAW_JOIN: 'Participate in a Quick Draw round',
    QUICK_DRAW_WIN: 'Vote closest to the target in Quick Draw',
  };
  return descriptions[key] || '';
}
