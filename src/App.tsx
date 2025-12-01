import { useState, useMemo } from 'react'
import { ThemeProvider, createTheme, CssBaseline, Box, Toolbar, Container, Grid } from '@mui/material'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { JiraTokenModal } from './components/JiraTokenModal'
import { CollaborationControls } from './components/CollaborationControls'
import { NotificationSnackbar } from './components/NotificationSnackbar'
import { useJira } from './JiraContext'
import { useThemeMode } from './hooks/useThemeMode'
import { useSupabaseRealtime } from './hooks/useSupabaseRealtime'

function App() {
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [jiraModalOpen, setJiraModalOpen] = useState(false)
  
  // Custom hooks
  const { mode, toggleColorMode } = useThemeMode()
  const { hasToken } = useJira()
  const {
    count,
    notification,
    handleIncrement,
    handleReset,
    closeNotification,
    showNotification,
  } = useSupabaseRealtime()

  // Create theme
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
        },
      }),
    [mode]
  )

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen)
  }

  const handleOpenJiraModal = () => {
    setJiraModalOpen(true)
  }

  const handleCloseJiraModal = () => {
    setJiraModalOpen(false)
  }

  const handleJiraSave = (message: string, severity: 'success' | 'info') => {
    showNotification(message, severity)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Header
          open={drawerOpen}
          mode={mode}
          hasJiraToken={hasToken}
          onToggleDrawer={toggleDrawer}
          onToggleTheme={toggleColorMode}
          onOpenJiraModal={handleOpenJiraModal}
        />

        <Sidebar open={drawerOpen} onToggleDrawer={toggleDrawer} />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <CollaborationControls
                  count={count}
                  onIncrement={handleIncrement}
                  onReset={handleReset}
                />
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>

      <JiraTokenModal
        open={jiraModalOpen}
        onClose={handleCloseJiraModal}
        onSave={handleJiraSave}
      />

      <NotificationSnackbar
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={closeNotification}
      />
    </ThemeProvider>
  )
}

export default App
