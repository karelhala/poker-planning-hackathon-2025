import { Card, CardContent, Typography, Box, Button, Chip, Avatar, AvatarGroup, Tooltip } from '@mui/material'
import { TrendingUp as TrendingUpIcon, Casino as CasinoIcon, Person as PersonIcon, Star as StarIcon } from '@mui/icons-material'

interface RoomUser {
  userId: string
  userName: string | null
}

interface CollaborationControlsProps {
  count: number
  roomCreator: string | null
  activeUsers: RoomUser[]
  currentUserId: string
  onIncrement: () => void
  onReset: () => void
}

export const CollaborationControls: React.FC<CollaborationControlsProps> = ({
  count,
  roomCreator,
  activeUsers,
  currentUserId,
  onIncrement,
  onReset,
}) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Real-time Collaboration Controls
          </Typography>
          
          {/* Active Users Display */}
          {activeUsers.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'}:
              </Typography>
              <AvatarGroup max={4}>
                {activeUsers.map((user) => {
                  const isCreator = user.userId === roomCreator
                  const isCurrentUser = user.userId === currentUserId
                  
                  return (
                    <Tooltip 
                      key={user.userId} 
                      title={
                        <Box>
                          <Typography variant="caption" display="block">
                            {user.userName || 'Anonymous'}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                            {user.userId.substring(0, 8)}...
                          </Typography>
                          {isCreator && <Typography variant="caption" display="block">⭐ Room Creator</Typography>}
                          {isCurrentUser && <Typography variant="caption" display="block">👤 You</Typography>}
                        </Box>
                      }
                    >
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32,
                          bgcolor: isCurrentUser ? 'primary.main' : 'grey.500',
                          border: isCreator ? '2px solid gold' : 'none',
                        }}
                      >
                        {isCreator ? <StarIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
                      </Avatar>
                    </Tooltip>
                  )
                })}
              </AvatarGroup>
            </Box>
          )}
        </Box>
        
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

