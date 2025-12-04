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
  const { 
    userId, 
    userName, 
    setUserName, 
    jiraToken, 
    setJiraToken, 
    jiraDomain,
    setJiraDomain,
    jiraEmail,
    setJiraEmail,
    hasJiraToken 
  } = useUser()
  const [nameInput, setNameInput] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [domainInput, setDomainInput] = useState('')
  const [emailInput, setEmailInput] = useState('')

  const handleOpen = () => {
    setNameInput(userName || '')
    setTokenInput(jiraToken || '')
    setDomainInput(jiraDomain || '')
    setEmailInput(jiraEmail || '')
  }

  const handleClose = () => {
    setNameInput('')
    setTokenInput('')
    setDomainInput('')
    setEmailInput('')
    onClose()
  }

  const handleSave = () => {
    // Save username
    if (nameInput.trim()) {
      setUserName(nameInput.trim())
    } else {
      setUserName(null)
    }

    // Save JIRA credentials
    if (tokenInput.trim() && domainInput.trim() && emailInput.trim()) {
      setJiraToken(tokenInput.trim())
      setJiraDomain(domainInput.trim())
      setJiraEmail(emailInput.trim())
      onSave('User settings and JIRA credentials saved successfully!', 'success')
    } else {
      setJiraToken(null)
      setJiraDomain(null)
      setJiraEmail(null)
      if (nameInput.trim()) {
        onSave('Username saved, JIRA credentials removed', 'info')
      } else {
        onSave('Settings cleared', 'info')
      }
    }
    handleClose()
  }

  const handleRemoveToken = () => {
    setJiraToken(null)
    setJiraDomain(null)
    setJiraEmail(null)
    handleClose()
    onSave('JIRA credentials removed', 'info')
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
          Enter your JIRA credentials to enable integration with JIRA. All credentials
          will be stored locally in your browser.
        </Typography>
        
        <TextField
          margin="dense"
          label="JIRA Domain"
          type="text"
          fullWidth
          variant="outlined"
          value={domainInput}
          onChange={(e) => setDomainInput(e.target.value)}
          placeholder="your-domain.atlassian.net"
          helperText="Your Jira domain (without https://)"
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="JIRA Email"
          type="email"
          fullWidth
          variant="outlined"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="your-email@example.com"
          helperText="The email associated with your Jira account"
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="JIRA API Token"
          type="password"
          fullWidth
          variant="outlined"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="Enter your JIRA API token"
          helperText="Generate an API token from your Atlassian account settings"
        />
        {(userName || hasJiraToken) && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {userName && <>Name: <strong>{userName}</strong><br /></>}
            {hasJiraToken && 'JIRA credentials are currently saved and active'}
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

