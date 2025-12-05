import { AppBar, Toolbar, IconButton, Typography, Badge, Avatar, Tooltip } from '@mui/material'
import {
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Casino as CasinoIcon,
  HistoryToggleOff as LogIcon,
} from '@mui/icons-material'

interface HeaderProps {
  mode: 'light' | 'dark'
  hasJiraToken: boolean
  onToggleTheme: () => void
  onOpenJiraModal: () => void
  onOpenActionLog: () => void
  actionLogCount: number
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  hasJiraToken,
  onToggleTheme,
  onOpenJiraModal,
  onOpenActionLog,
  actionLogCount,
}) => {
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

