import React from 'react';
import { Grid, Button, Typography, Box } from '@mui/material';

// Standard Fibonacci scale for agile estimation
const CARDS = ['0', '1', '2', '3', '5', '8', '13', '21'];

interface VotingCardsProps {
  selectedValue: string | null;
  onVote: (value: string) => void;
  disabled: boolean;
}

export const VotingCards: React.FC<VotingCardsProps> = ({ selectedValue, onVote, disabled }) => {
  return (
    <Box sx={{ mt: 4, width: '100%' }}>
      <Typography variant="h6" gutterBottom color="text.secondary">
        Select your estimate
      </Typography>
      
      <Grid container spacing={2} justifyContent="center">
        {/* Render Number Cards */}
        {CARDS.map((cardValue) => (
          <Grid item key={cardValue}>
            <Button
              variant={selectedValue === cardValue ? "contained" : "outlined"}
              color="primary"
              disabled={disabled}
              onClick={() => onVote(cardValue)}
              sx={{
                width: 60,
                height: 80,
                fontSize: '1.5rem',
                borderRadius: 2,
                boxShadow: selectedValue === cardValue ? 6 : 1,
                borderWidth: selectedValue === cardValue ? 0 : 2,
                transition: 'transform 0.1s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                }
              }}
            >
              {cardValue}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};