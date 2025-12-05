import React from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
} from '@mui/material'
import {
  Close as CloseIcon,
  DeleteSweep as ClearIcon,
} from '@mui/icons-material'
import { type ActionLogEntry } from '../hooks/useSupabaseRealtime'

interface ActionLogDrawerProps {
  open: boolean
  onClose: () => void
  actionLog: ActionLogEntry[]
  onClear: () => void
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const getTypeColor = (type: ActionLogEntry['type']) => {
  const colors: Record<ActionLogEntry['type'], string> = {
    join: '#4caf50',
    leave: '#ff9800',
    vote: '#2196f3',
    reveal: '#9c27b0',
    reset: '#00bcd4',
    poke: '#ff5722',
    block: '#f44336',
    copy: '#673ab7',
    shuffle: '#ff9800',
    ticket: '#3f51b5',
    info: '#607d8b',
  }
  return colors[type]
}

export const ActionLogDrawer: React.FC<ActionLogDrawerProps> = ({
  open,
  onClose,
  actionLog,
  onClear,
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 360,
          maxWidth: '100vw',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          📜 Action Log
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Clear log">
            <IconButton size="small" onClick={onClear} disabled={actionLog.length === 0}>
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {actionLog.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            p: 3,
            color: 'text.secondary',
          }}
        >
          <Typography variant="h4" sx={{ mb: 1 }}>📋</Typography>
          <Typography variant="body2">No actions yet</Typography>
          <Typography variant="caption">Actions will appear here as they happen</Typography>
        </Box>
      ) : (
        <List sx={{ py: 0, overflow: 'auto', flex: 1 }}>
          {actionLog.map((entry, index) => (
            <React.Fragment key={entry.id}>
              <ListItem
                sx={{
                  py: 1.5,
                  px: 2,
                  alignItems: 'flex-start',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    fontSize: '1.25rem',
                    mt: 0.5,
                  }}
                >
                  {entry.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          flex: 1,
                          lineHeight: 1.4,
                        }}
                      >
                        {entry.message}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: getTypeColor(entry.type),
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          fontSize: '0.65rem',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {entry.type}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        •
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(entry.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < actionLog.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Drawer>
  )
}

