import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Divider,
  Chip,
  Link,
  Toolbar,
  CircularProgress,
  Alert,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import { useRoom } from '../contexts/RoomContext';
import { fetchJiraTickets } from '../services/jiraService';
import { supabase } from '../supabaseClient';

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
  activeTicketId: string | null;
  onSelectTicket: (ticket: Ticket) => void;
  isAdmin?: boolean;
}

const JQL_PRESETS = [
  { label: 'Recent Issues', jql: 'order by created DESC' },
  { label: 'My Open Issues', jql: 'assignee = currentUser() AND status != Done order by updated DESC' },
  { label: 'Sprint Backlog', jql: 'sprint in openSprints() order by rank' },
  { label: 'To Do', jql: 'status = "To Do" order by priority DESC' },
  { label: 'In Progress', jql: 'status = "In Progress" order by updated DESC' },
  { label: 'High Priority', jql: 'priority in (Highest, High) AND status != Done order by priority DESC' },
]

export const IssuesSidebar: React.FC<IssuesSidebarProps> = ({
  activeTicketId,
  onSelectTicket,
  isAdmin = false,
}) => {
  const { userId, userName, jiraToken, jiraDomain, jiraEmail, hasJiraToken } = useUser()
  const { roomId } = useRoom()
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jqlQuery, setJqlQuery] = useState<string>(() => {
    return localStorage.getItem('jqlQuery') || 'order by created DESC'
  })
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const loadJiraTickets = async (customJql?: string) => {
    if (!hasJiraToken || !jiraToken || !jiraDomain || !jiraEmail) {
      setTickets(MOCK_TICKETS)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const queryToUse = customJql || jqlQuery
      const jiraTickets = await fetchJiraTickets({
        domain: jiraDomain,
        email: jiraEmail,
        token: jiraToken,
      }, queryToUse)
      setTickets(jiraTickets)

      // Broadcast loaded tickets to all players in the room
      if (roomId && isAdmin) {
        const channelName = `poker-planning-room-${roomId}`
        const channel = supabase.channel(channelName)
        await channel.send({
          type: 'broadcast',
          event: 'jira_tickets_loaded',
          payload: {
            tickets: jiraTickets,
            userId,
            userName: userName || null,
            timestamp: new Date().toISOString(),
          },
        })
      }
    } catch (err: any) {
      console.error('Error loading Jira tickets:', err)
      setError(err.message || 'Failed to load Jira tickets')
      setTickets(MOCK_TICKETS)
    } finally {
      setLoading(false)
    }
  }

  // Listen for broadcasted JIRA tickets from admin
  useEffect(() => {
    if (!roomId) return

    const channelName = `poker-planning-room-${roomId}`
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    })

    channel.on('broadcast', { event: 'jira_tickets_loaded' }, (payload) => {
      const loadedTickets = payload.payload.tickets || []
      setTickets(loadedTickets)
    })

    channel.subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

  const handleJqlChange = (newJql: string) => {
    setJqlQuery(newJql)
    localStorage.setItem('jqlQuery', newJql)
  }

  const handleJqlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadJiraTickets()
  }

  const handlePresetClick = (preset: string) => {
    handleJqlChange(preset)
    loadJiraTickets(preset)
    setAnchorEl(null)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleTicketClick = (ticket: Ticket) => {
    onSelectTicket(ticket);
  };

  return (
    <Drawer
      anchor="left"
      variant="permanent"
      sx={{
        width: 400,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 400,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssignmentIcon color="primary" />
        <Typography variant="h6" component="h2">
          Backlog
        </Typography>
      </Box>

      <Divider />

      <Box sx={{ 
        px: 2, 
        my: 2, 
        py: 1.5,
        bgcolor: 'action.hover',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        position: 'relative'
      }}>
        <Box sx={{ 
          width: 3, 
          height: '100%', 
          bgcolor: 'primary.main', 
          position: 'absolute',
          left: 0,
          top: 0,
          borderRadius: '4px 0 0 4px'
        }} />
        <Typography variant="body2" sx={{ fontSize: '1.25rem', ml: 0.5 }}>
          🎯
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, flexGrow: 1 }}>
          Select a ticket for the team to vote on
        </Typography>
      </Box>

      {isAdmin && hasJiraToken && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Box component="form" onSubmit={handleJqlSubmit}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              JQL Query (Admin Only)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                value={jqlQuery}
                onChange={(e) => handleJqlChange(e.target.value)}
                placeholder="e.g., project = PROJ AND status = 'To Do'"
                variant="outlined"
                sx={{ flexGrow: 1 }}
              />
              <Tooltip title="JQL Presets">
                <IconButton size="small" onClick={handleMenuOpen}>
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
              <Button
                size="small"
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => loadJiraTickets()}
                disabled={loading}
                type="submit"
              >
                Load
              </Button>
            </Box>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            {JQL_PRESETS.map((preset) => (
              <MenuItem 
                key={preset.label} 
                onClick={() => handlePresetClick(preset.jql)}
                dense
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {preset.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {preset.jql}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      )}

      {!isAdmin && hasJiraToken && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Alert severity="info" icon={false}>
            <Typography variant="body2">
              💡 Only the admin can load JIRA tickets
            </Typography>
          </Alert>
        </Box>
      )}

      {error && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {!hasJiraToken && isAdmin && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Alert severity="info">
            Configure your Jira credentials to load real tickets
          </Alert>
        </Box>
      )}

      {!hasJiraToken && !isAdmin && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Alert severity="info" icon={false}>
            <Typography variant="body2">
              💡 The admin can configure JIRA to load real tickets
            </Typography>
          </Alert>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {tickets.map((ticket) => {
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
      )}

      <Divider />

      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} in backlog
        </Typography>
        {hasJiraToken && (
          <Chip 
            label="Jira Connected" 
            color="success" 
            size="small" 
            variant="outlined"
          />
        )}
      </Box>
    </Drawer>
  );
};

