import { useState, useEffect } from 'react'
import { AppBar, Toolbar, IconButton, Typography, Badge, Avatar, Tooltip, Chip } from '@mui/material'
import {
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Casino as CasinoIcon,
  HistoryToggleOff as LogIcon,
  Timer as TimerIcon,
} from '@mui/icons-material'

const formatElapsed = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs.toString().padStart(2, '0')}s ago`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins.toString().padStart(2, '0')}m ago`;
};

interface HeaderProps {
  mode: 'light' | 'dark'
  hasJiraToken: boolean
  onToggleTheme: () => void
  onOpenJiraModal: () => void
  onOpenActionLog: () => void
  actionLogCount: number
  lastHeartbeat?: number
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  hasJiraToken,
  onToggleTheme,
  onOpenJiraModal,
  onOpenActionLog,
  actionLogCount,
  lastHeartbeat,
}) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(lastHeartbeat ? Date.now() - lastHeartbeat : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastHeartbeat]);

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ pr: '24px' }}>
        <CasinoIcon sx={{ mr: 2 }} />
        <Typography
          component="h1"
          variant="h6"
          color="inherit"
          noWrap
          sx={{ flexGrow: 1 }}
        >
          Poker Planning Dashboard
        </Typography>
        <Tooltip title="Time since last heartbeat">
          <Chip
            icon={<TimerIcon sx={{ fontSize: 16, color: 'inherit !important' }} />}
            label={formatElapsed(elapsed)}
            size="small"
            sx={{
              mr: 1,
              color: 'rgba(255,255,255,0.85)',
              bgcolor: 'rgba(255,255,255,0.12)',
              fontWeight: 600,
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              '& .MuiChip-icon': { ml: 0.5 },
            }}
          />
        </Tooltip>
        <Tooltip title="Action Log">
          <IconButton onClick={onOpenActionLog} color="inherit">
            <Badge
              badgeContent={actionLogCount > 0 ? actionLogCount : null}
              color="secondary"
              max={99}
            >
              <LogIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        <IconButton onClick={onToggleTheme} color="inherit">
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        <IconButton onClick={onOpenJiraModal} color="inherit">
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              hasJiraToken ? (
                <CheckCircleIcon
                  sx={{
                    fontSize: 16,
                    color: 'success.main',
                    bgcolor: 'background.paper',
                    borderRadius: '50%',
                  }}
                />
              ) : null
            }
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <PersonIcon fontSize="small" />
            </Avatar>
          </Badge>
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}

