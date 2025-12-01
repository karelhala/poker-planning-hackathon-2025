import { useState } from 'react'
import { 
  ThemeProvider, 
  createTheme, 
  Container, 
  Box, 
  Typography, 
  Button,
  Card,
  CardContent,
  AppBar,
  Toolbar
} from '@mui/material'
import { Casino as CasinoIcon } from '@mui/icons-material'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

function App() {
  const [count, setCount] = useState(0)

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <CasinoIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Poker Planning
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome to Poker Planning
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Real-time ticket sizing for your team
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Button 
                  variant="contained" 
                  onClick={() => setCount(count + 1)}
                  sx={{ mr: 2 }}
                >
                  Count: {count}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => setCount(0)}
                >
                  Reset
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App

