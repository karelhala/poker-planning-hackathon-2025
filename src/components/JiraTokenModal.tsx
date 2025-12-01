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
import { useJira } from '../JiraContext'

interface JiraTokenModalProps {
  open: boolean
  onClose: () => void
  onSave: (message: string, severity: 'success' | 'info') => void
}

export const JiraTokenModal: React.FC<JiraTokenModalProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const { jiraToken, setJiraToken, hasToken } = useJira()
  const [tokenInput, setTokenInput] = useState('')

  const handleOpen = () => {
    setTokenInput(jiraToken || '')
  }

  const handleClose = () => {
    setTokenInput('')
    onClose()
  }

  const handleSave = () => {
    if (tokenInput.trim()) {
      setJiraToken(tokenInput.trim())
      onSave('JIRA token saved successfully!', 'success')
    } else {
      setJiraToken(null)
      onSave('JIRA token removed', 'info')
    }
    handleClose()
  }

  const handleRemove = () => {
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
      <DialogTitle>JIRA Token Configuration</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 1 }}>
          Enter your JIRA API token to enable integration with JIRA. This token will
          be stored locally in your browser.
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="JIRA API Token"
          type="password"
          fullWidth
          variant="outlined"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="Enter your JIRA token"
          helperText="Your token is stored securely in localStorage"
        />
        {hasToken && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Token is currently saved and active
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {hasToken && (
          <Button onClick={handleRemove} color="error">
            Remove Token
          </Button>
        )}
        <Button onClick={handleSave} variant="contained">
          Save Token
        </Button>
      </DialogActions>
    </Dialog>
  )
}

