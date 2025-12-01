import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material'
import { useUser } from '../contexts/UserContext'

interface UserModalProps {
  open: boolean
  onClose: () => void
  onSave: (message: string, severity: 'success' | 'info') => void
}

export const UserModal: React.FC<UserModalProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const { userId, userName, setUserName, jiraToken, setJiraToken, hasJiraToken } = useUser()
  const [nameInput, setNameInput] = useState('')
  const [tokenInput, setTokenInput] = useState('')

  const handleOpen = () => {
    setNameInput(userName || '')
    setTokenInput(jiraToken || '')
  }

  const handleClose = () => {
    setNameInput('')
    setTokenInput('')
    onClose()
  }

  const handleSave = () => {
    // Save username
    if (nameInput.trim()) {
      setUserName(nameInput.trim())
    } else {
      setUserName(null)
    }

    // Save JIRA token
    if (tokenInput.trim()) {
      setJiraToken(tokenInput.trim())
      onSave('User settings saved successfully!', 'success')
    } else {
      setJiraToken(null)
      if (nameInput.trim()) {
        onSave('Username saved, JIRA token removed', 'info')
      } else {
        onSave('Settings cleared', 'info')
      }
    }
    handleClose()
  }

  const handleRemoveToken = () => {
    setJiraToken(null)
    handleClose()
    onSave('JIRA token removed', 'info')
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      onTransitionEnter={handleOpen}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>User Configuration</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 1 }}>
          Your unique user ID: <strong>{userId}</strong>
        </Typography>
        
        <TextField
          margin="dense"
          label="Your Name"
          type="text"
          fullWidth
          variant="outlined"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Enter your name (optional)"
          helperText="Can be a single word or multiple words"
          sx={{ mb: 2 }}
        />

        <Typography variant="body2" color="text.secondary" paragraph>
          Enter your JIRA API token to enable integration with JIRA. This token will
          be stored locally in your browser.
        </Typography>
        <TextField
          margin="dense"
          label="JIRA API Token"
          type="password"
          fullWidth
          variant="outlined"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="Enter your JIRA token (optional)"
          helperText="Your token is stored securely in localStorage"
        />
        {(userName || hasJiraToken) && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {userName && <>Name: <strong>{userName}</strong><br /></>}
            {hasJiraToken && 'JIRA token is currently saved and active'}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {hasJiraToken && (
          <Button onClick={handleRemoveToken} color="error">
            Remove Token
          </Button>
        )}
        <Button onClick={handleSave} variant="contained">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  )
}

