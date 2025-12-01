import { AppBar, Toolbar, IconButton, Typography, Badge, Avatar } from '@mui/material'
import {
  Menu as MenuIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Casino as CasinoIcon,
} from '@mui/icons-material'

interface HeaderProps {
  open: boolean
  mode: 'light' | 'dark'
  hasJiraToken: boolean
  onToggleDrawer: () => void
  onToggleTheme: () => void
  onOpenJiraModal: () => void
}

const drawerWidth = 240

export const Header: React.FC<HeaderProps> = ({
  open,
  mode,
  hasJiraToken,
  onToggleDrawer,
  onToggleTheme,
  onOpenJiraModal,
}) => {
  return (
    <AppBar
      position="absolute"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: (theme) =>
          theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        ...(open && {
          marginLeft: drawerWidth,
          width: `calc(100% - ${drawerWidth}px)`,
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }),
      }}
    >
      <Toolbar sx={{ pr: '24px' }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={onToggleDrawer}
          sx={{
            marginRight: '36px',
            ...(open && { display: 'none' }),
          }}
        >
          <MenuIcon />
        </IconButton>
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

