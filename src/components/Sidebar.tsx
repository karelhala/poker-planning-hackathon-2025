import { useState } from 'react'
import {
  Drawer,
  Toolbar,
  Box,
  Typography,
  TextField,
  IconButton,
  Card,
  CardContent,
  CardActions,
  CardActionArea,
  Stack,
  Divider,
  Chip,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material'

export interface JiraTicket {
  id: string
  key: string
  addedBy: string
  addedByName: string | null
  timestamp: string
}

interface SidebarProps {
  tickets: JiraTicket[]
  activeTicketId: string | null
  isRoomCreator: boolean
  onAddTicket: (key: string) => void
  onRemoveTicket: (id: string) => void
  onSelectTicket: (id: string) => void
}

const drawerWidth = 320

export const Sidebar: React.FC<SidebarProps> = ({
  tickets,
  activeTicketId,
  isRoomCreator,
  onAddTicket,
  onRemoveTicket,
  onSelectTicket,
}) => {
  const [ticketKey, setTicketKey] = useState('')

  const handleAddTicket = () => {
    if (ticketKey.trim()) {
      onAddTicket(ticketKey.trim())
      setTicketKey('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTicket()
    }
  }

  return (
    <Drawer
      variant="permanent"
      anchor="right"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', p: 2 }}>
        <Typography variant="h6" gutterBottom>
          JIRA Tickets
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Enter JIRA key (e.g., PROJ-123)"
            value={ticketKey}
            onChange={(e) => setTicketKey(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <IconButton 
            color="primary" 
            onClick={handleAddTicket}
            disabled={!ticketKey.trim()}
          >
            <AddIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Stack spacing={2}>
          {tickets.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center">
              No tickets added yet
            </Typography>
          ) : (
            tickets.map((ticket) => {
              const isActive = ticket.id === activeTicketId
              return (
                <Card 
                  key={ticket.id} 
                  variant="outlined"
                  sx={{
                    borderColor: isActive ? 'primary.main' : undefined,
                    borderWidth: isActive ? 2 : 1,
                    bgcolor: isActive ? 'action.selected' : undefined,
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {isRoomCreator ? (
                    <CardActionArea onClick={() => onSelectTicket(ticket.id)}>
                      <CardContent sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          {isActive && (
                            <PlayArrowIcon color="primary" fontSize="small" />
                          )}
                          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            {ticket.key}
                          </Typography>
                          {isActive && (
                            <Chip label="Active" color="primary" size="small" />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Added by: {ticket.addedByName || 'Unknown'}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  ) : (
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {isActive && (
                          <PlayArrowIcon color="primary" fontSize="small" />
                        )}
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                          {ticket.key}
                        </Typography>
                        {isActive && (
                          <Chip label="Active" color="primary" size="small" />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Added by: {ticket.addedByName || 'Unknown'}
                      </Typography>
                    </CardContent>
                  )}
                  <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveTicket(ticket.id)
                      }}
                      aria-label="delete ticket"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              )
            })
          )}
        </Stack>
      </Box>
    </Drawer>
  )
}

