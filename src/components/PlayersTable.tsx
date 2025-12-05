import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Edit as EditIcon,
  CardGiftcard as CardGiftcardIcon,
  Block as BlockIcon,
  GpsFixed as TargetIcon,
} from '@mui/icons-material';
import { EditNameDialog } from './EditNameDialog';
import { SPECIAL_CARD_INFO, type SpecialCardType, type ActiveTargeting, type CopyVoteRelation, type Player } from '../hooks/useSupabaseRealtime';

export type { Player };

export type GameState = 'VOTING' | 'REVEALED' | 'QUICK_DRAW';

interface PlayersTableProps {
  players: Player[];
  currentUserId: string;
  roomCreator: string | null;
  gameState: GameState;
  onNameChange: (newName: string) => void;
  currentUserName: string | null;
  onPokeUser?: (userId: string, userName: string | null) => void;
  onGrantSpecialCard?: (userId: string, userName: string | null, cardType: SpecialCardType) => void;
  isAdmin?: boolean;
  blockedPlayers?: Map<string, { blockedBy: string; blockedByName: string | null }>;
  activeTargeting?: ActiveTargeting | null;
  onTargetSelect?: (userId: string, userName: string | null) => void;
  copyVoteRelations?: CopyVoteRelation[];
  getEffectiveVote?: (playerId: string) => string | null;
  hasDoublePower?: (playerId: string) => boolean;
}

export const PlayersTable: React.FC<PlayersTableProps> = ({
  players,
  currentUserId,
  roomCreator,
  gameState,
  onNameChange,
  currentUserName,
  onPokeUser,
  onGrantSpecialCard,
  isAdmin = false,
  blockedPlayers = new Map(),
  activeTargeting = null,
  onTargetSelect,
  copyVoteRelations = [],
  getEffectiveVote,
  hasDoublePower,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [grantMenuAnchor, setGrantMenuAnchor] = useState<{ element: HTMLElement; player: Player } | null>(null);

  // Check if in targeting mode
  const isTargetingMode = activeTargeting !== null;

  // Check if a player is copying someone
  const getPlayerCopyInfo = (playerId: string) => {
    return copyVoteRelations.find(r => r.copierUserId === playerId);
  };

  // Check if a player is being copied
  const isBeingCopied = (playerId: string) => {
    return copyVoteRelations.some(r => r.targetUserId === playerId);
  };

  const handleOpenEditDialog = () => {
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };

  const handleSaveName = (newName: string) => {
    onNameChange(newName);
  };

  const handleOpenGrantMenu = (event: React.MouseEvent<HTMLElement>, player: Player) => {
    event.stopPropagation();
    setGrantMenuAnchor({ element: event.currentTarget, player });
  };

  const handleCloseGrantMenu = () => {
    setGrantMenuAnchor(null);
  };

  const handleGrantCard = (cardType: SpecialCardType) => {
    if (grantMenuAnchor && onGrantSpecialCard) {
      onGrantSpecialCard(grantMenuAnchor.player.userId, grantMenuAnchor.player.userName, cardType);
    }
    handleCloseGrantMenu();
  };
  const getStatusChip = (player: Player) => {
    const { hasVoted, vote, userId } = player;
    const isPlayerBlocked = blockedPlayers.has(userId);
    const copyInfo = getPlayerCopyInfo(userId);
    const playerIsBeingCopied = isBeingCopied(userId);

    // Get effective vote (handles copies)
    const effectiveVote = getEffectiveVote ? getEffectiveVote(userId) : vote;

    // If game is revealed, show the actual vote
    if (gameState === 'REVEALED') {
      if (isPlayerBlocked) {
        return (
          <Tooltip title="Vote was auto-calculated (blocked)">
            <Chip
              label={effectiveVote || 'Avg'}
              color="warning"
              size="medium"
              icon={<BlockIcon />}
              sx={{
                fontSize: '1rem',
                fontWeight: 'bold',
                minWidth: 70,
              }}
            />
          </Tooltip>
        );
      }
      
      // If this player copied someone
      if (copyInfo) {
        return (
          <Tooltip title={`Copied from ${copyInfo.targetUserName || 'someone'} 🐱`}>
            <Chip
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>📋</span>
                  <span>{effectiveVote || '?'}</span>
                </Box>
              }
              size="medium"
              sx={{
                fontSize: '1rem',
                fontWeight: 'bold',
                minWidth: 70,
                bgcolor: '#9c27b0',
                color: '#fff',
                animation: 'copyPulse 1s ease-in-out infinite',
                '@keyframes copyPulse': {
                  '0%, 100%': { boxShadow: '0 0 5px rgba(156, 39, 176, 0.5)' },
                  '50%': { boxShadow: '0 0 15px rgba(156, 39, 176, 0.8)' },
                }
              }}
            />
          </Tooltip>
        );
      }

      // If this player is being copied by someone
      if (playerIsBeingCopied) {
        const copiers = copyVoteRelations.filter(r => r.targetUserId === userId);
        const copierNames = copiers.map(c => c.copierUserName || 'Someone').join(', ');
        return (
          <Tooltip title={`Copied by: ${copierNames} 🎯`}>
            <Chip
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>{effectiveVote}</span>
                  <span style={{ fontSize: '0.8rem' }}>🎯</span>
                </Box>
              }
              color="primary"
              size="medium"
              sx={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                minWidth: 60,
                border: '2px solid #9c27b0',
              }}
            />
          </Tooltip>
        );
      }

      if (effectiveVote) {
        return (
          <Chip
            label={effectiveVote}
            color="primary"
            size="medium"
            sx={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              minWidth: 60,
            }}
          />
        );
      }
      return (
        <Chip
          label="No Vote"
          color="default"
          size="small"
          variant="outlined"
        />
      );
    }

    // If player is blocked during voting
    if (isPlayerBlocked) {
      const blocker = blockedPlayers.get(userId);
      return (
        <Tooltip title={`Blocked by ${blocker?.blockedByName || 'someone'}`}>
          <Chip
            icon={<BlockIcon />}
            label="Blocked"
            color="error"
            size="small"
            variant="outlined"
            sx={{
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.6 },
              }
            }}
          />
        </Tooltip>
      );
    }

    // If game is voting, show status
    if (hasVoted) {
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label="Voted"
          color="success"
          size="small"
          variant="outlined"
        />
      );
    }
    return (
      <Chip
        icon={<HourglassEmptyIcon />}
        label="Thinking..."
        color="default"
        size="small"
        variant="outlined"
      />
    );
  };

  const getUserAvatar = (userId: string, userName: string | null) => {
    const isCreator = userId === roomCreator;
    const isCurrentUser = userId === currentUserId;
    
    // Get initials from name or first 2 chars of userId
    const displayText = userName 
      ? userName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : userId.slice(0, 2).toUpperCase();

    return (
      <Avatar
        sx={{
          bgcolor: isCurrentUser ? 'primary.main' : 'grey.500',
          border: isCreator ? '2px solid gold' : 'none',
          width: 40,
          height: 40,
        }}
      >
        {isCreator ? <StarIcon /> : displayText}
      </Avatar>
    );
  };

  const getDisplayName = (userId: string, userName: string | null) => {
    const isCurrentUser = userId === currentUserId;
    const displayName = userName || 'Anonymous';
    return isCurrentUser ? `${displayName} (You)` : displayName;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Players in Room
          </Typography>
          <Chip
            label={`${players.length} ${players.length === 1 ? 'player' : 'players'}`}
            color="primary"
            size="small"
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell>Name</TableCell>
                <TableCell align="center">
                  {gameState === 'REVEALED' ? 'Vote' : 'Status'}
                </TableCell>
                <TableCell align="center">Role</TableCell>
                {isAdmin && <TableCell align="center">Cards</TableCell>}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {players.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No players in the room yet
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                players.map((player) => {
                  const isCreator = player.userId === roomCreator;
                  const isCurrentUser = player.userId === currentUserId;
                  const isPlayerBlocked = blockedPlayers.has(player.userId);
                  const canTarget = isTargetingMode && !isCurrentUser;
                  const canPoke = !isCurrentUser && !isTargetingMode;
                  
                  const handleRowClick = () => {
                    // If in targeting mode, select this player as target
                    if (canTarget) {
                      onTargetSelect?.(player.userId, player.userName);
                      return;
                    }
                    // Otherwise, poke
                    if (canPoke) {
                      onPokeUser?.(player.userId, player.userName);
                    }
                  };

                  // Get targeting card info for styling
                  const targetingColor = activeTargeting ? SPECIAL_CARD_INFO[activeTargeting.cardType].color : '#f44336';

                  return (
                    <TableRow
                      key={player.userId}
                      onClick={handleRowClick}
                      sx={{
                        '&:hover': { 
                          bgcolor: canTarget 
                            ? `${targetingColor}20` 
                            : canPoke 
                              ? 'rgba(255, 107, 107, 0.1)' 
                              : 'action.hover',
                        },
                        bgcolor: isCurrentUser 
                          ? 'action.selected' 
                          : isPlayerBlocked 
                            ? 'rgba(244, 67, 54, 0.08)' 
                            : 'inherit',
                        cursor: canTarget || canPoke ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        ...(canTarget && {
                          border: `2px dashed ${targetingColor}`,
                          animation: 'targetPulse 1s ease-in-out infinite',
                          '@keyframes targetPulse': {
                            '0%, 100%': { borderColor: targetingColor },
                            '50%': { borderColor: 'transparent' },
                          }
                        }),
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getUserAvatar(player.userId, player.userName)}
                          {canTarget && (
                            <TargetIcon 
                              sx={{ 
                                color: targetingColor,
                                fontSize: '1rem',
                                animation: 'spin 2s linear infinite',
                                '@keyframes spin': {
                                  '0%': { transform: 'rotate(0deg)' },
                                  '100%': { transform: 'rotate(360deg)' },
                                }
                              }} 
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {getDisplayName(player.userId, player.userName)}
                          </Typography>
                          {hasDoublePower?.(player.userId) && (
                            <Tooltip title="Double Power! This player's vote counts for 2">
                              <Chip
                                label="⚡ 2x"
                                size="small"
                                color="warning"
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  animation: 'glow 1.5s ease-in-out infinite',
                                  '@keyframes glow': {
                                    '0%, 100%': { boxShadow: '0 0 5px rgba(255, 193, 7, 0.5)' },
                                    '50%': { boxShadow: '0 0 15px rgba(255, 193, 7, 0.8)' },
                                  },
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {player.userId.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {getStatusChip(player)}
                      </TableCell>
                      <TableCell align="center">
                        {isCreator ? (
                          <Chip
                            icon={<StarIcon />}
                            label="Admin"
                            color="warning"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            icon={<PersonIcon />}
                            label="Member"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {player.availableCards && player.availableCards.length > 0 ? (
                              player.availableCards.map((cardType) => {
                                const cardInfo = SPECIAL_CARD_INFO[cardType];
                                return (
                                  <Tooltip key={cardType} title={cardInfo.label}>
                                    <Box
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: `${cardInfo.color}20`,
                                        borderRadius: 1,
                                        border: `1px solid ${cardInfo.color}`,
                                        fontSize: '0.8rem',
                                      }}
                                    >
                                      {cardInfo.icon}
                                    </Box>
                                  </Tooltip>
                                );
                              })
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                None
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      )}
                      <TableCell 
                        align="center"
                        onClick={(e) => e.stopPropagation()}
                        sx={{ cursor: 'default' }}
                      >
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          {isCurrentUser && (
                            <Tooltip title="Edit your name">
                              <IconButton
                                size="small"
                                onClick={handleOpenEditDialog}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {isAdmin && !isCurrentUser && (
                            <Tooltip title="Grant special card">
                              <IconButton
                                size="small"
                                onClick={(e) => handleOpenGrantMenu(e, player)}
                                sx={{ 
                                  color: '#9c27b0',
                                  '&:hover': {
                                    bgcolor: 'rgba(156, 39, 176, 0.1)',
                                  }
                                }}
                              >
                                <CardGiftcardIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>

      <EditNameDialog
        open={editDialogOpen}
        currentName={currentUserName}
        onClose={handleCloseEditDialog}
        onSave={handleSaveName}
      />

      {/* Grant Special Card Menu */}
      <Menu
        anchorEl={grantMenuAnchor?.element}
        open={Boolean(grantMenuAnchor)}
        onClose={handleCloseGrantMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem disabled sx={{ opacity: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Grant special card to {grantMenuAnchor?.player.userName || 'player'}
          </Typography>
        </MenuItem>
        <Divider />
        {(Object.keys(SPECIAL_CARD_INFO) as SpecialCardType[]).map((cardType) => {
          const cardInfo = SPECIAL_CARD_INFO[cardType];
          return (
            <MenuItem 
              key={cardType} 
              onClick={() => handleGrantCard(cardType)}
              sx={{
                '&:hover': {
                  bgcolor: `${cardInfo.color}15`,
                }
              }}
            >
              <ListItemIcon sx={{ fontSize: '1.2rem', minWidth: 36 }}>
                {cardInfo.icon}
              </ListItemIcon>
              <ListItemText 
                primary={cardInfo.label}
                secondary={cardInfo.description}
                primaryTypographyProps={{ 
                  fontWeight: 600,
                  color: cardInfo.color,
                }}
                secondaryTypographyProps={{ 
                  variant: 'caption',
                  sx: { fontSize: '0.7rem' }
                }}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </Card>
  );
};

