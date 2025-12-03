import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Grid, Divider } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

export interface Player {
  userId: string;
  userName: string | null;
  hasVoted: boolean;
  vote: string | null;
  isOnline: boolean;
}

interface VotingStatsProps {
  players: Player[];
}

export const VotingStats: React.FC<VotingStatsProps> = ({ players }) => {
  // Extract numeric votes
  const numericVotes = players
    .map(p => p.vote)
    .filter(vote => vote !== null && !isNaN(Number(vote)))
    .map(vote => Number(vote));

  if (numericVotes.length === 0) {
    return (
      <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            No votes to display
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const average = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
  const min = Math.min(...numericVotes);
  const max = Math.max(...numericVotes);
  const range = max - min;
  
  // Determine consensus level
  let consensusText: string;
  let consensusColor: 'success' | 'info' | 'warning' | 'error';
  let consensusIcon: JSX.Element;

  if (range === 0) {
    consensusText = 'Perfect Consensus! 🎉';
    consensusColor = 'success';
    consensusIcon = <CheckCircleIcon />;
  } else if (range <= 2) {
    consensusText = 'Close Agreement';
    consensusColor = 'info';
    consensusIcon = <CheckCircleIcon />;
  } else if (range <= 5) {
    consensusText = 'Mixed Estimates';
    consensusColor = 'warning';
    consensusIcon = <WarningIcon />;
  } else {
    consensusText = 'High Variance';
    consensusColor = 'error';
    consensusIcon = <ErrorIcon />;
  }

  // Calculate mode (most common vote)
  const voteCounts = numericVotes.reduce((acc, vote) => {
    acc[vote] = (acc[vote] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const maxCount = Math.max(...Object.values(voteCounts));
  const modes = Object.keys(voteCounts)
    .filter(vote => voteCounts[Number(vote)] === maxCount)
    .map(Number);

  return (
    <Card
      sx={{
        mb: 3,
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #434343 0%, #000000 100%)',
        color: 'white',
        boxShadow: 4,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: 'white' }}>
            📊 Voting Results
          </Typography>
          <Chip
            icon={consensusIcon}
            label={consensusText}
            color={consensusColor}
            sx={{ 
              fontWeight: 600,
              fontSize: '0.9rem',
              bgcolor: 'white',
              color: `${consensusColor}.main`,
            }}
          />
        </Box>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Average */}
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" component="div" sx={{ fontWeight: 700, color: 'white' }}>
                {average.toFixed(1)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Average Estimate
              </Typography>
            </Box>
          </Grid>

          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />

          {/* Range */}
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                Vote Range
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'white' }}>
                {min} - {max}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                Spread: {range} points
              </Typography>
            </Box>
          </Grid>

          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />

          {/* Most Common */}
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                Most Common
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'white' }}>
                {modes.length === 1 ? modes[0] : modes.join(', ')}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                {maxCount} {maxCount === 1 ? 'vote' : 'votes'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Vote Distribution */}
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
          <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
            Vote Distribution:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {Object.keys(voteCounts)
              .map(Number)
              .sort((a, b) => a - b)
              .map(vote => (
                <Chip
                  key={vote}
                  label={`${vote} (${voteCounts[vote]})`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 500,
                  }}
                />
              ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

