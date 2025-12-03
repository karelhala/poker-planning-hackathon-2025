import { Card, CardContent, Typography, Box, Button, Chip, Avatar, AvatarGroup, Tooltip } from '@mui/material'
import { Casino as CasinoIcon, Person as PersonIcon, Star as StarIcon, RestartAlt as RestartAltIcon, Visibility as VisibilityIcon } from '@mui/icons-material'

interface RoomUser {
  userId: string
  userName: string | null
}

export type GameState = 'VOTING' | 'REVEALED'

interface CollaborationControlsProps {
  roomCreator: string | null
  activeUsers: RoomUser[]
  currentUserId: string
  gameState: GameState
  onResetVoting: () => void
  onRevealCards: () => void
}

export const CollaborationControls: React.FC<CollaborationControlsProps> = ({
  roomCreator,
  activeUsers,
  currentUserId,
  gameState,
  onResetVoting,
  onRevealCards,
}) => {
  const isAdmin = currentUserId === roomCreator;
  return (
    <Card>
      <CardContent>
        {/* Active Users Display */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" component="h2" gutterBottom>
              Active Users
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label="WebSocket Connected"
                color="success"
                variant="outlined"
                size="small"
                icon={<CasinoIcon />}
              />
              <Typography variant="body2" color="text.secondary">
                {activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'} in room
              </Typography>
            </Box>
          </Box>

          {activeUsers.length > 0 && (
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
          )}
        </Box>

        {/* Admin Controls */}
        {isAdmin && (
          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="h6" component="h3" gutterBottom>
              Admin Controls
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {gameState === 'VOTING' 
                ? 'Reveal all votes to see the results, or reset to start a new round.'
                : 'Votes are revealed! Reset to start a new voting round.'
              }
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {gameState === 'VOTING' && (
                <Button
                  variant="contained"
                  size="medium"
                  onClick={onRevealCards}
                  color="primary"
                  startIcon={<VisibilityIcon />}
                >
                  Reveal Cards
                </Button>
              )}
              <Button
                variant="outlined"
                size="medium"
                onClick={onResetVoting}
                color="secondary"
                startIcon={<RestartAltIcon />}
              >
                Reset Voting
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

