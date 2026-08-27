import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box, Typography, Avatar, Tooltip, IconButton, Menu, MenuItem,
  ListItemIcon, ListItemText, Divider, Chip, keyframes, useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  CardGiftcard as CardGiftcardIcon,
  Block as BlockIcon,
  HourglassEmpty as HourglassEmptyIcon,
  FlashOn as FlashOnIcon,
} from '@mui/icons-material';
import { EditNameDialog } from './EditNameDialog';
import { generateAvatarDataUri, loadAvatarConfig } from '../services/avatarService';
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
  onRevealCards?: () => void;
  onResetVoting?: () => void;
  isProcessing?: boolean;
  voteSpread?: { min: number; max: number; spread: number; average: number };
  onTriggerQuickDraw?: () => void;
  points?: number;
  onOpenEconomyModal?: () => void;
  avatarVersion?: number;
  onMakeItRain?: (size: 'small' | 'medium' | 'large') => void;
  tomatoSplats?: Map<string, { thrownBy: string; id: string }>;
  applauseEvents?: Map<string, { userName: string; id: string }>;
  megaphoneEvents?: Map<string, { userName: string; id: string }>;
  earthquakeActive?: boolean;
  itemTargeting?: string | null;
  onItemTargetSelect?: (userId: string, userName: string | null) => void;
}

const targetGlow = keyframes`
  0%, 100% { box-shadow: 0 0 6px 2px rgba(244, 67, 54, 0.4); }
  50% { box-shadow: 0 0 14px 6px rgba(244, 67, 54, 0); }
`;

const cardAppear = keyframes`
  0% { transform: scale(0) rotate(-8deg); opacity: 0; }
  60% { transform: scale(1.08) rotate(1deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`;

const votedGlow = keyframes`
  0%, 100% { box-shadow: 0 4px 14px rgba(21, 101, 192, 0.3); }
  50% { box-shadow: 0 4px 20px rgba(21, 101, 192, 0.6); }
`;

const tomatoSplat = keyframes`
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  20% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0.85; }
`;

const applauseFloat = keyframes`
  0% { transform: translateY(0) scale(0); opacity: 1; }
  20% { transform: translateY(-10px) scale(1.2); opacity: 1; }
  100% { transform: translateY(-60px) scale(0.6); opacity: 0; }
`;

const megaphoneBanner = keyframes`
  0% { transform: translateX(-50%) scale(0); opacity: 0; }
  15% { transform: translateX(-50%) scale(1.3); opacity: 1; }
  30% { transform: translateX(-50%) scale(1); opacity: 1; }
  80% { transform: translateX(-50%) scale(1); opacity: 1; }
  100% { transform: translateX(-50%) scale(0.5); opacity: 0; }
`;

const earthquakeShake = keyframes`
  0%, 100% { transform: translate(0, 0) rotate(0); }
  10% { transform: translate(-3px, -2px) rotate(-0.5deg); }
  20% { transform: translate(4px, 1px) rotate(0.5deg); }
  30% { transform: translate(-2px, 3px) rotate(-0.3deg); }
  40% { transform: translate(3px, -1px) rotate(0.4deg); }
  50% { transform: translate(-4px, 2px) rotate(-0.5deg); }
  60% { transform: translate(2px, -3px) rotate(0.3deg); }
  70% { transform: translate(-3px, 1px) rotate(-0.4deg); }
  80% { transform: translate(4px, 2px) rotate(0.5deg); }
  90% { transform: translate(-1px, -2px) rotate(-0.2deg); }
`;

const revealPulse = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(211, 47, 47, 0.4), 0 0 40px rgba(211, 47, 47, 0.2); }
  50% { box-shadow: 0 0 30px rgba(211, 47, 47, 0.6), 0 0 60px rgba(211, 47, 47, 0.3); }
`;

const flipTableShake = keyframes`
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-2deg) translateY(-1px); }
  40% { transform: rotate(2deg) translateY(1px); }
  60% { transform: rotate(-1deg); }
  80% { transform: rotate(1deg); }
`;

const tableFlip = keyframes`
  0% { transform: perspective(1200px) rotateX(0deg) scale(1); }
  20% { transform: perspective(1200px) rotateX(-8deg) scale(1.02) translateY(10px); }
  50% { transform: perspective(1200px) rotateX(45deg) scale(0.9) translateY(-30px); }
  65% { transform: perspective(1200px) rotateX(45deg) scale(0.9) translateY(-30px); }
  80% { transform: perspective(1200px) rotateX(-5deg) scale(1.01) translateY(5px); }
  100% { transform: perspective(1200px) rotateX(0deg) scale(1); }
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
  onRevealCards,
  onResetVoting,
  isProcessing = false,
  voteSpread,
  onTriggerQuickDraw,
  points = 0,
  onOpenEconomyModal,
  avatarVersion = 0,
  onMakeItRain,
  tomatoSplats = new Map(),
  applauseEvents = new Map(),
  megaphoneEvents = new Map(),
  earthquakeActive = false,
  itemTargeting = null,
  onItemTargetSelect,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevGameState = useRef(gameState);
  const [grantMenuAnchor, setGrantMenuAnchor] = useState<{
    element: HTMLElement;
    player: Player;
  } | null>(null);

  useEffect(() => {
    if (prevGameState.current === 'REVEALED' && gameState === 'VOTING') {
      setIsFlipping(true);
      const timer = setTimeout(() => setIsFlipping(false), 900);
      return () => clearTimeout(timer);
    }
    prevGameState.current = gameState;
  }, [gameState]);

  const [isEarthquake, setIsEarthquake] = useState(false);
  const [earthquakeSeatIndices, setEarthquakeSeatIndices] = useState<number[]>([]);
  const earthquakeIdRef = useRef(0);

  useEffect(() => {
    if (!earthquakeActive || players.length < 2) {
      // Keep seat indices (frozen positions) — only clear on round reset
      if (!earthquakeActive) setEarthquakeSeatIndices([]);
      setIsEarthquake(false);
      return;
    }

    const id = ++earthquakeIdRef.current;
    setIsEarthquake(true);

    const doShuffle = () => {
      if (earthquakeIdRef.current !== id) return;
      setEarthquakeSeatIndices(prev => {
        const current = prev.length === players.length
          ? [...prev]
          : players.map((_, i) => i);

        // Random count of players to swap (2 to all)
        const count = 2 + Math.floor(Math.random() * (players.length - 1));
        const shuffleCount = Math.min(count, players.length);

        // Pick random positions
        const positions = current.map((_, i) => i);
        for (let i = positions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [positions[i], positions[j]] = [positions[j], positions[i]];
        }
        const selected = positions.slice(0, shuffleCount);

        // Shuffle seat values among selected positions
        const values = selected.map(pos => current[pos]);
        for (let i = values.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [values[i], values[j]] = [values[j], values[i]];
        }
        selected.forEach((pos, i) => {
          current[pos] = values[i];
        });

        return current;
      });
    };

    doShuffle();
    const interval = setInterval(doShuffle, 1000);

    // Stop shuffling after 5s — seats freeze where they are
    const stopTimer = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    // Shake animation runs full 5s independently
    const shakeTimer = setTimeout(() => setIsEarthquake(false), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(stopTimer);
      clearTimeout(shakeTimer);
    };
  }, [earthquakeActive, players.length]);

  const myAvatarConfig = useMemo(() => loadAvatarConfig(), [avatarVersion]);

  const avatarCache = useMemo(() => {
    const cache: Record<string, string> = {};
    for (const player of players) {
      const config = player.userId === currentUserId
        ? myAvatarConfig
        : player.avatarConfig as import('../services/avatarService').AvatarConfig | undefined;
      cache[player.userId] = generateAvatarDataUri(player.userId, config);
    }
    return cache;
  }, [players.map(p => p.userId + JSON.stringify(p.avatarConfig || '')).join(','), currentUserId, myAvatarConfig]);

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
    if (itemTargeting) {
      onItemTargetSelect?.(player.userId, player.userName);
      return;
    }
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

  const renderCard = (player: Player, seatIndex: number) => {
    const isRevealed = gameState === 'REVEALED';
    const vote = effVote(player.userId);
    const isBlocked = blockedPlayers.has(player.userId);
    const copyInfo = getCopyInfo(player.userId);

    let backColor = '#1a237e';
    let backBorder = '#0d1642';
    let frontBorder = '#BDBDBD';
    let textColor = '#37474F';
    if (isBlocked) {
      backColor = '#b71c1c';
      backBorder = '#7f0000';
      frontBorder = '#C62828';
      textColor = '#C62828';
    } else if (copyInfo) {
      backColor = '#4a148c';
      backBorder = '#311b6e';
      frontBorder = '#7B1FA2';
      textColor = '#7B1FA2';
    }

    const flipDelay = seatIndex * 0.08;

    return (
      <Box sx={{ width: 56, height: 78, perspective: '800px', flexShrink: 0 }}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: `transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${isRevealed ? flipDelay : 0}s`,
            transform: isRevealed && player.hasVoted ? 'rotateY(180deg)' : 'none',
          }}
        >
          {/* Card back */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              borderRadius: '6px',
              bgcolor: player.hasVoted ? backColor : 'transparent',
              border: player.hasVoted
                ? `2px solid ${backBorder}`
                : '2px dashed rgba(255,255,255,0.15)',
              overflow: 'hidden',
              boxShadow: player.hasVoted
                ? `0 4px 14px rgba(0,0,0,0.45)`
                : 'none',
              transition: 'all 0.4s ease',
              ...(player.hasVoted && !isRevealed && {
                animation: `${cardAppear} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), ${votedGlow} 2s ease-in-out 0.4s infinite`,
              }),
            }}
          >
            {player.hasVoted && (
              <>
                <Box sx={{
                  position: 'absolute',
                  inset: 4,
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '3px',
                }} />
                <Box sx={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `
                    linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
                    linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.03) 75%),
                    linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.03) 75%)
                  `,
                  backgroundSize: '10px 10px',
                  backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                }} />
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '1.2rem',
                  color: 'rgba(255,255,255,0.1)',
                  lineHeight: 1,
                }}>
                  ♠
                </Box>
              </>
            )}
            {!player.hasVoted && !isBlocked && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <HourglassEmptyIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }} />
              </Box>
            )}
            {isBlocked && !player.hasVoted && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <BlockIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
              </Box>
            )}
          </Box>

          {/* Card front */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: '6px',
              bgcolor: '#FFFDE7',
              border: `2px solid ${frontBorder}`,
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            <Typography sx={{
              position: 'absolute', top: 3, left: 5,
              fontSize: '0.5rem', fontWeight: 700, color: textColor, lineHeight: 1,
            }}>
              {vote || '—'}
            </Typography>
            <Typography sx={{
              position: 'absolute', bottom: 3, right: 5,
              fontSize: '0.5rem', fontWeight: 700, color: textColor, lineHeight: 1,
              transform: 'rotate(180deg)',
            }}>
              {vote || '—'}
            </Typography>
            <Typography sx={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '2.2rem', color: textColor, opacity: 0.05,
              lineHeight: 1, pointerEvents: 'none',
            }}>
              ♠
            </Typography>
            <Box sx={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              {copyInfo && (
                <Typography sx={{ fontSize: '0.5rem', lineHeight: 1, mb: 0.25 }}>📋</Typography>
              )}
              {isBlocked && (
                <Typography sx={{ fontSize: '0.5rem', lineHeight: 1, mb: 0.25 }}>🚫</Typography>
              )}
              <Typography sx={{
                fontWeight: 800,
                fontSize: vote && vote.length > 2 ? '0.9rem' : '1.2rem',
                color: textColor, lineHeight: 1,
              }}>
                {vote || '—'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderSeat = (player: Player, index: number) => {
    const seatIdx = earthquakeSeatIndices.length === players.length
      ? earthquakeSeatIndices[index]
      : index;
    const pos = seats[seatIdx];
    if (!pos) return null;

    const isCurrentUser = player.userId === currentUserId;
    const isCreator = player.userId === roomCreator;
    const isBlocked = blockedPlayers.has(player.userId);
    const canInteract = !isCurrentUser;
    const displayName = player.userName || 'Anon';

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
          transition: 'left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s ease',
          zIndex: isCurrentUser ? 10 : 5,
          '&:hover': canInteract
            ? { transform: 'translate(-50%, -50%) scale(1.1)' }
            : {},
          ...((isTargetingMode || itemTargeting) &&
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
            src={avatarCache[player.userId]}
            sx={{
              width: isCurrentUser ? 64 : 56,
              height: isCurrentUser ? 64 : 56,
              bgcolor: '#546E7A',
              border: isCreator
                ? '3px solid gold'
                : isCurrentUser
                  ? '3px solid #42A5F5'
                  : '2px solid rgba(255,255,255,0.15)',
              opacity: player.isOnline ? 1 : 0.35,
              filter: player.isOnline ? 'none' : 'grayscale(80%)',
              boxShadow: '0 3px 12px rgba(0,0,0,0.4)',
              transition: 'all 0.3s ease',
              '& img': { imageRendering: 'pixelated' },
            }}
          />
        </Tooltip>

        {/* Mini chip stack (real items + ghost chips) */}
        {((player.itemCount || 0) + (player.ghostChipCount || 0)) > 0 && (
          <Box sx={{
            position: 'absolute',
            top: -4,
            right: -16,
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'center',
            gap: '-2px',
            pointerEvents: 'none',
          }}>
            {/* Ghost chips at bottom — other players see solid, you see translucent */}
            {Array.from({ length: Math.min(player.ghostChipCount || 0, 15) }).map((_, i) => (
              <Box key={`g${i}`} sx={{
                width: 14,
                height: 6,
                borderRadius: '50%',
                bgcolor: player.userId === currentUserId
                  ? (i % 2 === 0 ? 'rgba(255,193,7,0.3)' : 'rgba(255,179,0,0.25)')
                  : (i % 2 === 0 ? '#FFC107' : '#FFB300'),
                border: player.userId === currentUserId
                  ? '1px solid rgba(255,143,0,0.3)'
                  : '1px solid #FF8F00',
                mt: i > 0 ? '-2px' : 0,
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
              }} />
            ))}
            {/* Real chips on top */}
            {Array.from({ length: Math.min(player.itemCount || 0, 6) }).map((_, i) => (
              <Box key={`r${i}`} sx={{
                width: 14,
                height: 6,
                borderRadius: '50%',
                bgcolor: i % 2 === 0 ? '#FFC107' : '#FFB300',
                border: '1px solid #FF8F00',
                mt: '-2px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }} />
            ))}
          </Box>
        )}

        {/* Tomato splat */}
        {tomatoSplats.has(player.userId) && (
          <Box sx={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            pointerEvents: 'none',
            width: 90,
            height: 90,
          }}>
            {/* Red splat background */}
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 70,
              height: 70,
              borderRadius: '50%',
              bgcolor: 'rgba(211, 47, 47, 0.55)',
              transform: 'translate(-50%, -50%)',
              animation: `${tomatoSplat} 0.4s ease-out forwards`,
              boxShadow: '0 0 20px rgba(211, 47, 47, 0.4)',
            }} />
            {/* Center tomato */}
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '2.2rem',
              animation: `${tomatoSplat} 0.4s ease-out forwards`,
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
            }}>
              🍅
            </Box>
            {/* Splatter spots */}
            {[
              { x: -30, y: -20, s: 14 },
              { x: 25, y: -15, s: 10 },
              { x: -15, y: 25, s: 12 },
              { x: 30, y: 20, s: 8 },
              { x: -25, y: 5, s: 9 },
              { x: 10, y: -28, s: 11 },
            ].map((spot, i) => (
              <Box key={i} sx={{
                position: 'absolute',
                top: `calc(50% + ${spot.y}px)`,
                left: `calc(50% + ${spot.x}px)`,
                width: spot.s,
                height: spot.s,
                borderRadius: '50%',
                bgcolor: i % 2 === 0 ? 'rgba(198, 40, 40, 0.6)' : 'rgba(229, 57, 53, 0.5)',
                animation: `${tomatoSplat} 0.35s ease-out ${0.05 * i}s forwards`,
              }} />
            ))}
          </Box>
        )}

        {/* Applause effect */}
        {applauseEvents.has(player.userId) && (
          <Box sx={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            pointerEvents: 'none',
          }}>
            {[
              { x: -20, delay: 0 },
              { x: 0, delay: 0.15 },
              { x: 20, delay: 0.3 },
              { x: -10, delay: 0.45 },
              { x: 10, delay: 0.6 },
              { x: -25, delay: 0.8 },
              { x: 5, delay: 0.95 },
              { x: 15, delay: 1.1 },
            ].map((cfg, i) => (
              <Box key={i} sx={{
                position: 'absolute',
                left: cfg.x,
                fontSize: '1.4rem',
                animation: `${applauseFloat} 1.2s ease-out ${cfg.delay}s forwards`,
                opacity: 0,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}>
                👏
              </Box>
            ))}
          </Box>
        )}

        {/* Megaphone VOTED! banner */}
        {megaphoneEvents.has(player.userId) && (
          <Box sx={{
            position: 'absolute',
            top: '-18%',
            left: '50%',
            zIndex: 25,
            pointerEvents: 'none',
            animation: `${megaphoneBanner} 2.8s ease-out forwards`,
          }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #FF6F00, #FFC107)',
              color: '#fff',
              fontWeight: 900,
              fontSize: '1rem',
              px: 1.5,
              py: 0.5,
              borderRadius: '8px',
              whiteSpace: 'nowrap',
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
              boxShadow: '0 4px 16px rgba(255,111,0,0.5)',
              letterSpacing: '0.1em',
            }}>
              📢 VOTED!
            </Box>
          </Box>
        )}

        {/* Card */}
        {renderCard(player, index)}

        {/* Name + indicators */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.25,
            maxWidth: 110,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'white',
              fontWeight: isCurrentUser ? 700 : 500,
              fontSize: '0.72rem',
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 100,
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

          {/* Points + edit for self */}
          {isCurrentUser && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title="Click to see how to earn points" arrow>
                <Chip
                  label={`🪙 ${points}`}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEconomyModal?.();
                  }}
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(255,193,7,0.2)',
                    color: '#FFC107',
                    border: '1px solid rgba(255,193,7,0.3)',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(255,193,7,0.35)' },
                  }}
                />
              </Tooltip>
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
            </Box>
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

      const avg = numericVotes.length > 0
        ? numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length
        : 0;
      const min = numericVotes.length > 0 ? Math.min(...numericVotes) : 0;
      const max = numericVotes.length > 0 ? Math.max(...numericVotes) : 0;
      const range = max - min;

      let consensus: { text: string; color: string };
      if (range === 0) consensus = { text: 'Consensus!', color: '#4CAF50' };
      else if (range <= 2) consensus = { text: 'Close', color: '#2196F3' };
      else if (range <= 5) consensus = { text: 'Mixed', color: '#FF9800' };
      else consensus = { text: 'High Variance', color: '#F44336' };

      const displayAvg = numericVotes.length === 0
        ? '—'
        : isTshirt
          ? NUMERIC_TSHIRT_MAP[Math.round(avg)] || avg.toFixed(1)
          : avg.toFixed(1);

      return (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 800, textShadow: '0 2px 12px rgba(0,0,0,0.5)', lineHeight: 1 }}>
            {displayAvg}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mt: 0.5 }}>
            Average
          </Typography>
          <Chip label={consensus.text} size="small" sx={{ mt: 0.5, bgcolor: consensus.color, color: 'white', fontWeight: 600, fontSize: '0.7rem' }} />
          {isTshirt
            ? <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 0.5, fontSize: '0.6rem' }}>
                {NUMERIC_TSHIRT_MAP[min] || min} — {NUMERIC_TSHIRT_MAP[max] || max}
              </Typography>
            : <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 0.5, fontSize: '0.6rem' }}>
                {min} — {max}
              </Typography>
          }

          {/* Quick Draw (admin, big spread) */}
          {isAdmin && voteSpread && voteSpread.spread >= 5 && onTriggerQuickDraw && (
            <Tooltip title="Quick vote with 3 options around the average" arrow>
              <Box
                component="button"
                onClick={onTriggerQuickDraw}
                sx={{
                  mt: 1,
                  px: 1.5, py: 0.5,
                  border: '2px solid rgba(255,193,7,0.5)',
                  borderRadius: '16px',
                  bgcolor: 'rgba(255,193,7,0.2)',
                  color: '#FFC107',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease',
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 193, 7, 0.4)' },
                    '50%': { boxShadow: '0 0 0 6px rgba(255, 193, 7, 0)' },
                  },
                  '&:hover': { bgcolor: 'rgba(255,193,7,0.35)', borderColor: '#FFC107' },
                }}
              >
                <FlashOnIcon sx={{ fontSize: 14 }} /> Quick Draw
              </Box>
            </Tooltip>
          )}

          {/* Flip Table reset button (admin only) */}
          {isAdmin && onResetVoting && (
            <Box
              component="button"
              onClick={onResetVoting}
              disabled={isProcessing || isFlipping}
              sx={{
                mt: 1.5,
                px: 2, py: 0.75,
                border: '2px solid rgba(255,255,255,0.25)',
                borderRadius: '20px',
                bgcolor: 'rgba(0,0,0,0.3)',
                color: 'rgba(255,255,255,0.8)',
                cursor: isProcessing || isFlipping ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                '&:hover': {
                  bgcolor: 'rgba(244,67,54,0.3)',
                  borderColor: '#F44336',
                  color: '#fff',
                  transform: 'scale(1.05)',
                  animation: `${flipTableShake} 0.4s ease`,
                },
              }}
            >
              <span style={{ fontSize: '0.9rem' }}>(╯°□°)╯︵</span> ┻━┻ New Round
            </Box>
          )}
        </Box>
      );
    }

    // Voting state
    return (
      <Box sx={{ textAlign: 'center' }}>
        {/* Ticket info */}
        {activeTicket && (
          <Box sx={{ mb: isAdmin ? 1.5 : 0 }}>
            <Chip label={activeTicket.key} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontFamily: 'monospace', fontWeight: 700, mb: 0.5 }} />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.7rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {activeTicket.summary}
            </Typography>
          </Box>
        )}
        {!activeTicket && !isAdmin && (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', fontSize: '0.7rem' }}>
            Waiting for vote...
          </Typography>
        )}

        {/* Big Reveal button (admin only) */}
        {isAdmin && onRevealCards && gameState === 'VOTING' && (
          <Box
            component="button"
            onClick={onRevealCards}
            disabled={isProcessing}
            sx={{
              mt: activeTicket ? 0 : 1,
              width: 90,
              height: 90,
              borderRadius: '50%',
              border: '3px solid rgba(211, 47, 47, 0.6)',
              bgcolor: '#D32F2F',
              color: '#fff',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '0.7rem',
              fontWeight: 800,
              fontFamily: 'inherit',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              mx: 'auto',
              transition: 'all 0.2s ease',
              animation: `${revealPulse} 2s ease-in-out infinite`,
              boxShadow: '0 0 20px rgba(211, 47, 47, 0.4), 0 0 40px rgba(211, 47, 47, 0.2)',
              '&:hover': {
                transform: 'scale(1.1)',
                bgcolor: '#C62828',
                boxShadow: '0 0 30px rgba(211, 47, 47, 0.6), 0 0 60px rgba(211, 47, 47, 0.3)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          >
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>👁</span>
            <span>{isProcessing ? '...' : 'Reveal'}</span>
          </Box>
        )}

        {!activeTicket && isAdmin && gameState === 'VOTING' && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', mt: 1, fontSize: '0.6rem' }}>
            Select a ticket from the sidebar
          </Typography>
        )}

        {/* Make It Rain buttons (admin only) */}
        {isAdmin && onMakeItRain && (
          <Box sx={{ mt: 1.5, display: 'flex', gap: 0.75, justifyContent: 'center' }}>
            {([
              { size: 'small' as const, label: '💧', tip: 'Drizzle (15 chips)' },
              { size: 'medium' as const, label: '💰', tip: 'Rain (35 chips)' },
              { size: 'large' as const, label: '🤑', tip: 'Jackpot (60 chips)' },
            ]).map(({ size, label, tip }) => (
              <Tooltip key={size} title={tip} arrow>
                <Box
                  component="button"
                  onClick={() => onMakeItRain(size)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '1px solid rgba(255,193,7,0.3)',
                    bgcolor: 'rgba(255,193,7,0.1)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    '&:hover': {
                      bgcolor: 'rgba(255,193,7,0.25)',
                      borderColor: '#FFC107',
                      transform: 'scale(1.15)',
                    },
                  }}
                >
                  {label}
                </Box>
              </Tooltip>
            ))}
          </Box>
        )}
      </Box>
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
        ...(isEarthquake && {
          animation: `${earthquakeShake} 0.4s ease-in-out infinite`,
        }),
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
          transformOrigin: 'center 60%',
          ...(isFlipping && {
            animation: `${tableFlip} 0.9s cubic-bezier(0.4, 0, 0.2, 1)`,
          }),
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
