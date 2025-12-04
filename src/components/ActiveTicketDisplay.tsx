import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Link } from '@mui/material';
import { Assignment as AssignmentIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import type { Ticket } from './IssuesSidebar';

interface ActiveTicketDisplayProps {
  ticket: Ticket;
}

export const ActiveTicketDisplay: React.FC<ActiveTicketDisplayProps> = ({ ticket }) => {
  return (
    <Card
      sx={{
        mb: 3,
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
            : 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
        color: 'white',
        boxShadow: 3,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <AssignmentIcon sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            Voting On:
          </Typography>
          <Chip
            label={ticket.key}
            size="small"
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          />
          {ticket.link && (
            <Link
              href={ticket.link}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'flex', alignItems: 'center', color: 'white', ml: 'auto' }}
            >
              <OpenInNewIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="caption">View in Jira</Typography>
            </Link>
          )}
        </Box>
        <Typography variant="h6" sx={{ color: 'white', mt: 1 }}>
          {ticket.summary}
        </Typography>
      </CardContent>
    </Card>
  );
};

