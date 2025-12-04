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
} from '@mui/material'
import {
  Add as AddIcon,
  Login as LoginIcon,
  Share as ShareIcon,
  ExitToApp as ExitIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { useRoom } from '../contexts/RoomContext'

interface RoomControlsProps {
  onOpenJoinModal: () => void
  isConnected?: boolean
}

export const RoomControls: React.FC<RoomControlsProps> = ({ 
  onOpenJoinModal, 
  isConnected = false,
}) => {
  const { roomId, createRoom, leaveRoom } = useRoom()
  const [copyNotification, setCopyNotification] = useState(false)

  const handleShare = async () => {
    if (roomId) {
      const fullUrl = `${window.location.origin}/room/${roomId}`
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

