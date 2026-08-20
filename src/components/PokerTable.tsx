import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Avatar, Tooltip, IconButton, Menu, MenuItem,
  ListItemIcon, ListItemText, Divider, Chip, keyframes, useTheme,
} from '@mui/material';
import {
  Star as StarIcon,
  Edit as EditIcon,
  CardGiftcard as CardGiftcardIcon,
  Block as BlockIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material';
import { EditNameDialog } from './EditNameDialog';
import {
  SPECIAL_CARD_INFO,
  type SpecialCardType,
  type ActiveTargeting,
  type CopyVoteRelation,
  type Player,
  type VotingMode,
  TSHIRT_NUMERIC_MAP,
  NUMERIC_TSHIRT_MAP,
} from '../hooks/useSupabaseRealtime';
import type { Ticket } from './IssuesSidebar';

export type GameState = 'VOTING' | 'REVEALED' | 'QUICK_DRAW';

interface PokerTableProps {
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
  hasHalfPower?: (playerId: string) => boolean;
  onGrantDoublePower?: (userId: string, userName: string | null) => void;
  onGrantHalfPower?: (userId: string, userName: string | null) => void;
  activeTicket?: Ticket | null;
  votingMode?: VotingMode;
}

const targetGlow = keyframes`
  0%, 100% { box-shadow: 0 0 6px 2px rgba(244, 67, 54, 0.4); }
  50% { box-shadow: 0 0 14px 6px rgba(244, 67, 54, 0); }
`;

function getSeatPositions(count: number, currentIndex: number) {
  if (count === 0) return [];
  const radiusX = 46;
  const radiusY = 43;
  return Array.from({ length: count }, (_, i) => {
    const stepsFromCurrent = (i - currentIndex + count) % count;
    const angle = (Math.PI / 2) - (stepsFromCurrent / count) * 2 * Math.PI;
    return {
      left: 50 + radiusX * Math.cos(angle),
      top: 50 + radiusY * Math.sin(angle),
    };
  });
}

export const PokerTable: React.FC<PokerTableProps> = ({
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
  hasHalfPower,
  onGrantDoublePower,
  onGrantHalfPower,
  activeTicket,
  votingMode = 'fibonacci',
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [grantMenuAnchor, setGrantMenuAnchor] = useState<{
    element: HTMLElement;
    player: Player;
  } | null>(null);

  const currentIndex = players.findIndex((p) => p.userId === currentUserId);
  const seats = useMemo(
    () => getSeatPositions(players.length, currentIndex >= 0 ? currentIndex : 0),
    [players.length, currentIndex]
  );

  const isTargetingMode = activeTargeting !== null;

  const getCopyInfo = (playerId: string) =>
    copyVoteRelations.find((r) => r.copierUserId === playerId);

  const effVote = (playerId: string) =>
    getEffectiveVote
      ? getEffectiveVote(playerId)
      : (players.find((p) => p.userId === playerId)?.vote ?? null);

  const handleSeatClick = (player: Player) => {
    if (player.userId === currentUserId) return;
    if (isTargetingMode) {
      onTargetSelect?.(player.userId, player.userName);
    } else {
      onPokeUser?.(player.userId, player.userName);
    }
  };

  const handleGrantMenuOpen = (
    e: React.MouseEvent<HTMLElement>,
    player: Player
  ) => {
    e.stopPropagation();
    setGrantMenuAnchor({ element: e.currentTarget, player });
  };

  const handleGrantCard = (cardType: SpecialCardType) => {
    if (grantMenuAnchor && onGrantSpecialCard) {
      onGrantSpecialCard(
        grantMenuAnchor.player.userId,
        grantMenuAnchor.player.userName,
        cardType
      );
    }
    setGrantMenuAnchor(null);
  };

  const renderCard = (player: Player) => {
    const isRevealed = gameState === 'REVEALED';
    const vote = effVote(player.userId);
    const isBlocked = blockedPlayers.has(player.userId);
    const copyInfo = getCopyInfo(player.userId);

    let backColor = '#1565C0';
    let backBorder = '#0D47A1';
    if (isBlocked) {
      backColor = '#C62828';
      backBorder = '#B71C1C';
    } else if (copyInfo) {
      backColor = '#7B1FA2';
      backBorder = '#6A1B9A';
    }

    return (
      <Box sx={{ width: 44, height: 62, perspective: '600px', flexShrink: 0 }}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s ease',
            transform:
              isRevealed && player.hasVoted ? 'rotateY(180deg)' : 'none',
          }}
        >
          {/* Back */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              borderRadius: 1,
              bgcolor: player.hasVoted ? backColor : 'transparent',
              border: player.hasVoted
                ? `2px solid ${backBorder}`
                : '2px dashed rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: player.hasVoted
                ? '0 2px 8px rgba(0,0,0,0.4)'
                : 'none',
              backgroundImage: player.hasVoted
                ? 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.06) 4px, rgba(255,255,255,0.06) 8px)'
                : 'none',
            }}
          >
            {!player.hasVoted && !isBlocked && (
              <HourglassEmptyIcon
                sx={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }}
              />
            )}
            {isBlocked && !player.hasVoted && (
              <BlockIcon
                sx={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}
              />
            )}
          </Box>

          {/* Front */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: 1,
              bgcolor: '#FFFDE7',
              border: copyInfo
                ? '2px solid #7B1FA2'
                : isBlocked
                  ? '2px solid #C62828'
                  : '2px solid #BDBDBD',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              gap: 0,
            }}
          >
            {copyInfo && (
              <Typography sx={{ fontSize: '0.5rem', lineHeight: 1 }}>
                📋
              </Typography>
            )}
            {isBlocked && (
              <Typography sx={{ fontSize: '0.5rem', lineHeight: 1 }}>
                🚫
              </Typography>
            )}
            <Typography
              sx={{
                fontWeight: 700,
                fontSize:
                  vote && vote.length > 2 ? '0.85rem' : '1.1rem',
                color: isBlocked
                  ? '#C62828'
                  : copyInfo
                    ? '#7B1FA2'
                    : '#333',
                lineHeight: 1.1,
              }}
            >
              {vote || '—'}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderSeat = (player: Player, index: number) => {
    const pos = seats[index];
    if (!pos) return null;

    const isCurrentUser = player.userId === currentUserId;
    const isCreator = player.userId === roomCreator;
    const isBlocked = blockedPlayers.has(player.userId);
    const canInteract = !isCurrentUser;
    const displayName = player.userName || 'Anon';
    const initials = player.userName
      ? player.userName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : player.userId.slice(0, 2).toUpperCase();

    return (
      <Box
        key={player.userId}
        onClick={() => canInteract && handleSeatClick(player)}
        sx={{
          position: 'absolute',
          left: `${pos.left}%`,
          top: `${pos.top}%`,
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          cursor: canInteract ? 'pointer' : 'default',
          transition: 'transform 0.2s ease',
          zIndex: isCurrentUser ? 10 : 5,
          '&:hover': canInteract
            ? { transform: 'translate(-50%, -50%) scale(1.1)' }
            : {},
          ...(isTargetingMode &&
            canInteract && {
              animation: `${targetGlow} 1.5s ease-in-out infinite`,
              borderRadius: 2,
            }),
        }}
      >
        {/* Avatar */}
        <Tooltip
          title={
            isCurrentUser
              ? 'You'
              : isTargetingMode
                ? `Target ${displayName}`
                : `Poke ${displayName}`
          }
          arrow
          placement="top"
        >
          <Avatar
            sx={{
              width: isCurrentUser ? 44 : 38,
              height: isCurrentUser ? 44 : 38,
              bgcolor: isCurrentUser ? 'primary.main' : 'grey.600',
              border: isCreator
                ? '2px solid gold'
                : isCurrentUser
                  ? '2px solid #42A5F5'
                  : '2px solid rgba(255,255,255,0.15)',
              fontSize: '0.8rem',
              fontWeight: 600,
              opacity: player.isOnline ? 1 : 0.35,
              filter: player.isOnline ? 'none' : 'grayscale(80%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
              transition: 'all 0.3s ease',
            }}
          >
            {isCreator ? <StarIcon sx={{ fontSize: 18 }} /> : initials}
          </Avatar>
        </Tooltip>

        {/* Card */}
        {renderCard(player)}

        {/* Name + indicators */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.25,
            maxWidth: 100,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'white',
              fontWeight: isCurrentUser ? 700 : 500,
              fontSize: '0.68rem',
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 90,
            }}
          >
            {isCurrentUser ? `${displayName} (You)` : displayName}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 0.25,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {!player.isOnline && (
              <Chip
                label="Off"
                size="small"
                sx={{
                  height: 15,
                  fontSize: '0.5rem',
                  bgcolor: 'grey.700',
                  color: 'white',
                }}
              />
            )}
            {hasDoublePower?.(player.userId) && (
              <Chip
                label="⚡2x"
                size="small"
                sx={{
                  height: 15,
                  fontSize: '0.5rem',
                  bgcolor: '#FFC107',
                  color: '#000',
                  fontWeight: 700,
                }}
              />
            )}
            {hasHalfPower?.(player.userId) && (
              <Chip
                label="☕½"
                size="small"
                sx={{
                  height: 15,
                  fontSize: '0.5rem',
                  bgcolor: '#795548',
                  color: '#fff',
                  fontWeight: 700,
                }}
              />
            )}
            {isBlocked && gameState === 'VOTING' && (
              <Chip
                label="Blocked"
                size="small"
                sx={{
                  height: 15,
                  fontSize: '0.5rem',
                  bgcolor: '#C62828',
                  color: '#fff',
                }}
              />
            )}
          </Box>

          {/* Admin action button */}
          {isAdmin && !isCurrentUser && (
            <IconButton
              size="small"
              onClick={(e) => handleGrantMenuOpen(e, player)}
              sx={{
                color: 'rgba(255,255,255,0.5)',
                p: '2px',
                '&:hover': {
                  color: '#CE93D8',
                  bgcolor: 'rgba(255,255,255,0.08)',
                },
              }}
            >
              <CardGiftcardIcon sx={{ fontSize: 13 }} />
            </IconButton>
          )}

          {/* Edit name for self */}
          {isCurrentUser && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setEditDialogOpen(true);
              }}
              sx={{
                color: 'rgba(255,255,255,0.5)',
                p: '2px',
                '&:hover': {
                  color: '#90CAF9',
                  bgcolor: 'rgba(255,255,255,0.08)',
                },
              }}
            >
              <EditIcon sx={{ fontSize: 13 }} />
            </IconButton>
          )}
        </Box>
      </Box>
    );
  };

  const renderCenterContent = () => {
    if (gameState === 'REVEALED') {
      const isTshirt = votingMode === 'tshirt';
      const numericVotes = players
        .map((p) => effVote(p.userId))
        .filter((v): v is string => v !== null)
        .map((v) => (isTshirt ? TSHIRT_NUMERIC_MAP[v] : Number(v)))
        .filter((v) => v !== undefined && !isNaN(v));

      if (numericVotes.length === 0) {
        return (
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.5)' }}
          >
            No votes
          </Typography>
        );
      }

      const avg =
        numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
      const min = Math.min(...numericVotes);
      const max = Math.max(...numericVotes);
      const range = max - min;

      let consensus: { text: string; color: string };
      if (range === 0) consensus = { text: 'Consensus!', color: '#4CAF50' };
      else if (range <= 2)
        consensus = { text: 'Close', color: '#2196F3' };
      else if (range <= 5)
        consensus = { text: 'Mixed', color: '#FF9800' };
      else consensus = { text: 'High Variance', color: '#F44336' };

      const displayAvg = isTshirt
        ? NUMERIC_TSHIRT_MAP[Math.round(avg)] || avg.toFixed(1)
        : avg.toFixed(1);

      return (
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h3"
            sx={{
              color: 'white',
              fontWeight: 800,
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
              lineHeight: 1,
            }}
          >
            {displayAvg}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mt: 0.5 }}
          >
            Average
          </Typography>
          <Chip
            label={consensus.text}
            size="small"
            sx={{
              mt: 1,
              bgcolor: consensus.color,
              color: 'white',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.5)',
              display: 'block',
              mt: 0.5,
              fontSize: '0.65rem',
            }}
          >
            {isTshirt
              ? `${NUMERIC_TSHIRT_MAP[min] || min} — ${NUMERIC_TSHIRT_MAP[max] || max}`
              : `${min} — ${max}`}
          </Typography>
        </Box>
      );
    }

    if (activeTicket) {
      return (
        <Box sx={{ textAlign: 'center', p: 1 }}>
          <Chip
            label={activeTicket.key}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontFamily: 'monospace',
              fontWeight: 700,
              mb: 0.5,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '0.75rem',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {activeTicket.summary}
          </Typography>
        </Box>
      );
    }

    return (
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(255,255,255,0.3)',
          fontStyle: 'italic',
          fontSize: '0.75rem',
        }}
      >
        Select a ticket to vote
      </Typography>
    );
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 950,
        margin: '0 auto',
        aspectRatio: '16 / 9',
        minHeight: 420,
      }}
    >
      {/* Wood border ring */}
      <Box
        sx={{
          position: 'absolute',
          left: '12%',
          top: '8%',
          width: '76%',
          height: '84%',
          borderRadius: '50%',
          background: isDark
            ? 'linear-gradient(145deg, #6D4C41, #4E342E, #3E2723)'
            : 'linear-gradient(145deg, #A1887F, #6D4C41, #4E342E)',
          boxShadow: `
            0 8px 32px rgba(0,0,0,0.5),
            inset 0 2px 4px rgba(255,255,255,0.08)
          `,
          p: '10px',
        }}
      >
        {/* Felt surface */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at 35% 35%, #388E3C 0%, #2E7D32 30%, #1B5E20 60%, #145214 100%)',
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.35), inset 0 0 15px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              backgroundImage: `
                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.04) 0%, transparent 60%)
              `,
              pointerEvents: 'none',
            },
          }}
        >
          {/* Center content */}
          <Box
            sx={{
              width: '50%',
              maxWidth: 260,
              zIndex: 1,
            }}
          >
            {renderCenterContent()}
          </Box>
        </Box>
      </Box>

      {/* Player seats */}
      {players.map((player, index) => renderSeat(player, index))}

      {/* Player count badge */}
      <Chip
        label={(() => {
          const online = players.filter((p) => p.isOnline).length;
          return online < players.length
            ? `${online}/${players.length} online`
            : `${players.length} player${players.length !== 1 ? 's' : ''}`;
        })()}
        size="small"
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          bgcolor: 'rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 500,
          fontSize: '0.7rem',
        }}
      />

      {/* Edit Name Dialog */}
      <EditNameDialog
        open={editDialogOpen}
        currentName={currentUserName}
        onClose={() => setEditDialogOpen(false)}
        onSave={onNameChange}
      />

      {/* Grant Special Card Menu */}
      <Menu
        anchorEl={grantMenuAnchor?.element}
        open={Boolean(grantMenuAnchor)}
        onClose={() => setGrantMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MenuItem disabled sx={{ opacity: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Grant card to{' '}
            {grantMenuAnchor?.player.userName || 'player'}
          </Typography>
        </MenuItem>
        <Divider />
        {(Object.keys(SPECIAL_CARD_INFO) as SpecialCardType[]).map(
          (cardType) => {
            const info = SPECIAL_CARD_INFO[cardType];
            return (
              <MenuItem
                key={cardType}
                onClick={() => handleGrantCard(cardType)}
                sx={{ '&:hover': { bgcolor: `${info.color}15` } }}
              >
                <ListItemIcon sx={{ fontSize: '1.2rem', minWidth: 36 }}>
                  {info.icon}
                </ListItemIcon>
                <ListItemText
                  primary={info.label}
                  secondary={info.description}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    color: info.color,
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    sx: { fontSize: '0.7rem' },
                  }}
                />
              </MenuItem>
            );
          }
        )}
        <Divider sx={{ my: 1 }} />
        <MenuItem disabled sx={{ opacity: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Power Modifiers
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (grantMenuAnchor?.player) {
              onGrantDoublePower?.(
                grantMenuAnchor.player.userId,
                grantMenuAnchor.player.userName
              );
              setGrantMenuAnchor(null);
            }
          }}
          disabled={
            grantMenuAnchor?.player
              ? hasDoublePower?.(grantMenuAnchor.player.userId)
              : false
          }
          sx={{ '&:hover': { bgcolor: 'rgba(255, 193, 7, 0.15)' } }}
        >
          <ListItemIcon sx={{ fontSize: '1.2rem', minWidth: 36 }}>
            ⚡
          </ListItemIcon>
          <ListItemText
            primary="Double Power"
            secondary="Next round vote counts for 2x"
            primaryTypographyProps={{ fontWeight: 600, color: '#ffc107' }}
            secondaryTypographyProps={{
              variant: 'caption',
              sx: { fontSize: '0.7rem' },
            }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (grantMenuAnchor?.player) {
              onGrantHalfPower?.(
                grantMenuAnchor.player.userId,
                grantMenuAnchor.player.userName
              );
              setGrantMenuAnchor(null);
            }
          }}
          disabled={
            grantMenuAnchor?.player
              ? hasHalfPower?.(grantMenuAnchor.player.userId)
              : false
          }
          sx={{ '&:hover': { bgcolor: 'rgba(121, 85, 72, 0.15)' } }}
        >
          <ListItemIcon sx={{ fontSize: '1.2rem', minWidth: 36 }}>
            ☕
          </ListItemIcon>
          <ListItemText
            primary="Half Power"
            secondary="Next round vote counts for 0.5x"
            primaryTypographyProps={{ fontWeight: 600, color: '#795548' }}
            secondaryTypographyProps={{
              variant: 'caption',
              sx: { fontSize: '0.7rem' },
            }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};
