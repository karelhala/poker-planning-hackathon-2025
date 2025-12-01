import { Card, CardContent, Typography, Box, Button, Chip } from '@mui/material'
import { TrendingUp as TrendingUpIcon, Casino as CasinoIcon } from '@mui/icons-material'

interface CollaborationControlsProps {
  count: number
  onIncrement: () => void
  onReset: () => void
}

export const CollaborationControls: React.FC<CollaborationControlsProps> = ({
  count,
  onIncrement,
  onReset,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Real-time Collaboration Controls
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Click the buttons below to broadcast events to all connected users via
          Supabase Realtime. All users will see the updates instantly through WebSocket
          connections.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            onClick={onIncrement}
            startIcon={<TrendingUpIcon />}
          >
            Increment: {count}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={onReset}
            color="secondary"
          >
            Reset Counter
          </Button>
          <Chip
            label="WebSocket Connected"
            color="success"
            variant="outlined"
            icon={<CasinoIcon />}
          />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            How it works:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Click increment → all users see the new count instantly
            <br />
            • Click reset → everyone's counter resets to 0
            <br />
            • Open multiple tabs to test real-time synchronization
            <br />• All events are broadcast through Supabase Realtime channels
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

