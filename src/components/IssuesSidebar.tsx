import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Divider,
  Chip,
  Link,
} from '@mui/material';
import {
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

export interface Ticket {
  id: string;
  key: string;
  summary: string;
  link?: string;
}

const MOCK_TICKETS: Ticket[] = [
  {
    id: '1',
    key: 'PROJ-101',
    summary: 'Fix login bug causing session timeout',
    link: 'https://jira.example.com/browse/PROJ-101',
  },
  {
    id: '2',
    key: 'PROJ-102',
    summary: 'Refactor user state management to use Redux',
    link: 'https://jira.example.com/browse/PROJ-102',
  },
  {
    id: '3',
    key: 'PROJ-103',
    summary: 'Add password reset functionality',
    link: 'https://jira.example.com/browse/PROJ-103',
  },
  {
    id: '4',
    key: 'PROJ-104',
    summary: 'Implement dark mode theme toggle',
    link: 'https://jira.example.com/browse/PROJ-104',
  },
  {
    id: '5',
    key: 'PROJ-105',
    summary: 'Optimize database queries for user dashboard',
    link: 'https://jira.example.com/browse/PROJ-105',
  },
];

interface IssuesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTicketId: string | null;
  onSelectTicket: (ticket: Ticket) => void;
}

export const IssuesSidebar: React.FC<IssuesSidebarProps> = ({
  isOpen,
  onClose,
  activeTicketId,
  onSelectTicket,
}) => {
  const handleTicketClick = (ticket: Ticket) => {
    onSelectTicket(ticket);
  };

  return (
    <Drawer
      anchor="left"
      open={isOpen}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 400,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon color="primary" />
          <Typography variant="h6" component="h2">
            Backlog
          </Typography>
        </Box>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1, m: 2 }}>
        <Typography variant="body2" color="info.dark" sx={{ fontWeight: 500 }}>
          🎯 Select a ticket for the team to vote on
        </Typography>
      </Box>

      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {MOCK_TICKETS.map((ticket) => {
          const isActive = ticket.id === activeTicketId;
          
          return (
            <ListItem
              key={ticket.id}
              disablePadding
              sx={{
                bgcolor: isActive ? 'action.selected' : 'transparent',
                borderLeft: isActive ? 4 : 0,
                borderColor: 'primary.main',
              }}
            >
              <ListItemButton
                onClick={() => handleTicketClick(ticket)}
                selected={isActive}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip
                        label={ticket.key}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                      />
                      {ticket.link && (
                        <Link
                          href={ticket.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          sx={{ display: 'flex', alignItems: 'center' }}
                        >
                          <OpenInNewIcon fontSize="small" />
                        </Link>
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.primary">
                      {ticket.summary}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {MOCK_TICKETS.length} tickets in backlog
        </Typography>
      </Box>
    </Drawer>
  );
};

