import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from '@mui/material'
import { useRoom } from '../contexts/RoomContext'

interface JoinRoomModalProps {
  open: boolean
  onClose: () => void
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ open, onClose }) => {
  const { joinRoom } = useRoom()
  const [roomIdInput, setRoomIdInput] = useState('')

  const handleClose = () => {
    setRoomIdInput('')
    onClose()
  }

  const handleJoin = () => {
    if (roomIdInput.trim()) {
      joinRoom(roomIdInput.trim())
      handleClose()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && roomIdInput.trim()) {
      handleJoin()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Join a Room</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 1 }}>
          Enter the room ID to join an existing poker planning session.
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Room ID"
          type="text"
          fullWidth
          variant="outlined"
          value={roomIdInput}
          onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          placeholder="e.g., A1B2C3D4"
          helperText="Room IDs are case-insensitive"
          inputProps={{
            style: { fontFamily: 'monospace', fontSize: '1.1rem' },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleJoin}
          variant="contained"
          disabled={!roomIdInput.trim()}
        >
          Join Room
        </Button>
      </DialogActions>
    </Dialog>
  )
}

