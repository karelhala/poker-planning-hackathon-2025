import { useState } from 'react'
import {
  Box,
  Button,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  Snackbar,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import {
  Add as AddIcon,
  Login as LoginIcon,
  Share as ShareIcon,
  ExitToApp as ExitIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { useRoom } from '../contexts/RoomContext'
import type { VotingMode } from '../hooks/useSupabaseRealtime'

interface RoomControlsProps {
  onOpenJoinModal: () => void
  isConnected?: boolean
  isAdmin?: boolean
  votingMode?: VotingMode
  onSetVotingMode?: (mode: VotingMode) => void
}

// Get base path from current URL (everything before /room)
const getBasePath = (): string => {
  const path = window.location.pathname
  const roomIndex = path.indexOf('/room')
  
  if (roomIndex > 0) {
    // URL contains /room, extract everything before it
    return path.substring(0, roomIndex)
  }
  
  // No /room in URL - remove trailing slash and return the path
  // This handles both "/" (dev) and "/poker-planning-hackathon-2025/" (prod)
  return path.replace(/\/+$/, '')
}

export const RoomControls: React.FC<RoomControlsProps> = ({
  onOpenJoinModal,
  isConnected = false,
  isAdmin = false,
  votingMode = 'fibonacci',
  onSetVotingMode,
}) => {
  const { roomId, createRoom, leaveRoom } = useRoom()
  const [copyNotification, setCopyNotification] = useState(false)

  const handleShare = async () => {
    if (roomId) {
      const basePath = getBasePath()
      const fullUrl = `${window.location.origin}${basePath}/room/${roomId}`
      try {
        await navigator.clipboard.writeText(fullUrl)
        setCopyNotification(true)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const handleCloseCopyNotification = () => {
    setCopyNotification(false)
  }

  if (!roomId) {
    // No room - show create/join options
    return (
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          Get started:
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={createRoom}
          size="small"
        >
          Create Room
        </Button>
        <Button
          variant="outlined"
          startIcon={<LoginIcon />}
          onClick={onOpenJoinModal}
          size="small"
        >
          Join Room
        </Button>
      </Box>
    )
  }

  // In a room - show room info and controls
  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          Room:
        </Typography>
        <Chip
          label={roomId}
          color="primary"
          variant="outlined"
          sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
        />
        {isConnected && (
          <Chip
            icon={<CheckCircleIcon />}
            label="Connected"
            color="success"
            variant="outlined"
            size="small"
          />
        )}
        <Tooltip title="Share room link">
          <IconButton size="small" onClick={handleShare} color="primary">
            <ShareIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Leave room">
          <IconButton size="small" onClick={leaveRoom} color="error">
            <ExitIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {isAdmin && onSetVotingMode && (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <ToggleButtonGroup
              value={votingMode}
              exclusive
              onChange={(_e, newMode) => {
                if (newMode !== null) onSetVotingMode(newMode as VotingMode)
              }}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  px: 1.5,
                  py: 0.25,
                },
              }}
            >
              <ToggleButton value="fibonacci">
                <Tooltip title="Fibonacci: 0, 1, 2, 3, 5, 8, 13, 21">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>🔢 Fibonacci</Box>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="tshirt">
                <Tooltip title="T-Shirt: S, M, L, XL">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>👕 T-Shirt</Box>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </>
        )}
      </Box>

      <Snackbar
        open={copyNotification}
        autoHideDuration={2000}
        onClose={handleCloseCopyNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseCopyNotification}
          severity="success"
          sx={{ width: '100%' }}
        >
          Room link copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  )
}

