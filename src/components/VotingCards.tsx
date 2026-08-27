import React, { useState, useEffect, useMemo } from 'react';
import { Button, Typography, Box, Tooltip, keyframes, Alert, Chip } from '@mui/material';
import { Block as BlockIcon, Close as CloseIcon, Shuffle as ShuffleIcon } from '@mui/icons-material';
import { type SpecialCard, type ActiveTargeting, type SpecialCardType, type CopyVoteRelation, type ShuffleEffect, type VotingMode, SPECIAL_CARD_INFO, TSHIRT_SIZES } from '../hooks/useSupabaseRealtime';

const CARDS = ['0', '1', '2', '3', '5', '8', '13', '21'];
const NUMERIC_CARDS = ['0', '1', '2', '3', '5', '8', '13', '21'];

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 5px currentColor, 0 0 10px currentColor; }
  50% { box-shadow: 0 0 15px currentColor, 0 0 25px currentColor; }
`;

const wobble = keyframes`
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
`;

const flipCard = keyframes`
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(180deg); }
`;

const smokeSwirl = keyframes`
  0% { opacity: 0.85; filter: blur(8px); transform: scale(1) rotate(0deg); }
  25% { opacity: 0.95; filter: blur(12px); transform: scale(1.02) rotate(2deg); }
  50% { opacity: 0.8; filter: blur(10px); transform: scale(0.98) rotate(-1deg); }
  75% { opacity: 0.9; filter: blur(11px); transform: scale(1.01) rotate(1deg); }
  100% { opacity: 0.85; filter: blur(8px); transform: scale(1) rotate(0deg); }
`;

const TSHIRT_COLORS: Record<string, string> = {
  S: '#1976d2',
  M: '#4caf50',
  L: '#ff9800',
  XL: '#f44336',
};

const DECOY_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
const SHUFFLED_TSHIRT_OPTIONS = [...TSHIRT_SIZES, ...DECOY_LETTERS];

type HandCardType = 'number' | 'tshirt' | 'random' | 'coffee' | 'special' | 'shuffled';

interface HandCard {
  id: string;
  type: HandCardType;
  value: string;
  label: string;
  color?: string;
  icon?: string;
  specialCard?: SpecialCard;
  specialType?: SpecialCardType;
  shuffleDisplayIndex?: number;
  shuffleOriginalIndex?: number;
  isDecoy?: boolean;
}

interface SmokeBombState {
  smokedBy: string;
  id: string;
}

interface VotingCardsProps {
  selectedValue: string | null;
  onVote: (value: string) => void;
  disabled: boolean;
  specialCards?: SpecialCard[];
  onUseSpecialCard?: (cardId: string, cardType: SpecialCardType) => void;
  isBlocked?: boolean;
  activeTargeting?: ActiveTargeting | null;
  onCancelTargeting?: () => void;
  currentUserCopyTarget?: CopyVoteRelation | undefined;
  shuffleEffect?: ShuffleEffect | null;
  onCoffeeSelect?: () => void;
  votingMode?: VotingMode;
  smokeBomb?: SmokeBombState | null;
}

function getArcTransform(index: number, total: number, isHovered: boolean, isSelected: boolean) {
  if (total <= 1) return { rotation: 0, yOffset: 0, xShift: 0 };
  const center = (total - 1) / 2;
  const offset = index - center;
  const spreadAngle = Math.min(3.5, 40 / total);
  const rotation = offset * spreadAngle;
  const yOffset = offset * offset * 1.2;

  if (isHovered || isSelected) {
    return { rotation: 0, yOffset: -28, xShift: 0 };
  }
  return { rotation, yOffset, xShift: 0 };
}

export const VotingCards: React.FC<VotingCardsProps> = ({
  selectedValue,
  onVote,
  disabled,
  specialCards = [],
  onUseSpecialCard,
  isBlocked = false,
  activeTargeting = null,
  onCancelTargeting,
  currentUserCopyTarget,
  shuffleEffect = null,
  onCoffeeSelect,
  votingMode = 'fibonacci',
  smokeBomb = null,
}) => {
  const [lastRandomValue, setLastRandomValue] = useState<string | null>(null);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const [shuffledRevealed, setShuffledRevealed] = useState<Set<number>>(new Set());
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const isShuffled = shuffleEffect !== null;
  const votingDisabled = disabled || isBlocked;

  useEffect(() => {
    if (shuffleEffect?.cardOrder) {
      if (votingMode === 'tshirt') {
        setShuffledRevealed(new Set());
      } else {
        const preRevealed = new Set<number>();
        shuffleEffect.cardOrder.forEach((origIdx, dispIdx) => {
          if (origIdx === 0 || origIdx === 7) preRevealed.add(dispIdx);
        });
        setRevealedCards(preRevealed);
      }
    } else {
      setRevealedCards(new Set());
      setShuffledRevealed(new Set());
    }
  }, [shuffleEffect, votingMode]);

  const hand = useMemo((): HandCard[] => {
    const cards: HandCard[] = [];

    if (isShuffled && shuffleEffect?.cardOrder) {
      const order = shuffleEffect.cardOrder;
      if (votingMode === 'tshirt') {
        order.forEach((origIdx, dispIdx) => {
          const label = SHUFFLED_TSHIRT_OPTIONS[origIdx];
          const isReal = origIdx < 4;
          cards.push({
            id: `shuffle-t-${dispIdx}`,
            type: 'shuffled',
            value: label,
            label: label,
            color: isReal ? TSHIRT_COLORS[label] : '#9E9E9E',
            shuffleDisplayIndex: dispIdx,
            shuffleOriginalIndex: origIdx,
            isDecoy: !isReal,
          });
        });
      } else {
        order.forEach((origIdx, dispIdx) => {
          cards.push({
            id: `shuffle-f-${dispIdx}`,
            type: 'shuffled',
            value: CARDS[origIdx],
            label: CARDS[origIdx],
            shuffleDisplayIndex: dispIdx,
            shuffleOriginalIndex: origIdx,
          });
        });
      }
    } else {
      if (votingMode === 'tshirt') {
        TSHIRT_SIZES.forEach((size) =>
          cards.push({
            id: `ts-${size}`,
            type: 'tshirt',
            value: size,
            label: size,
            color: TSHIRT_COLORS[size],
            icon: '👕',
          })
        );
      } else {
        CARDS.forEach((val) =>
          cards.push({ id: `num-${val}`, type: 'number', value: val, label: val })
        );
      }

      cards.push({
        id: 'random',
        type: 'random',
        value: '?',
        label: lastRandomValue || '?',
        icon: '🎲',
      });

      cards.push({
        id: 'coffee',
        type: 'coffee',
        value: '☕',
        label: '☕',
        icon: '☕',
      });
    }

    specialCards.forEach((card) => {
      const info = SPECIAL_CARD_INFO[card.type];
      cards.push({
        id: card.id,
        type: 'special',
        value: card.type,
        label: info.label,
        color: info.color,
        icon: info.icon as string,
        specialCard: card,
        specialType: card.type,
      });
    });

    return cards;
  }, [votingMode, isShuffled, shuffleEffect, specialCards, lastRandomValue]);

  const isCardRevealed = (card: HandCard) => {
    if (card.type !== 'shuffled') return true;
    if (votingMode === 'tshirt') return shuffledRevealed.has(card.shuffleDisplayIndex!);
    return revealedCards.has(card.shuffleDisplayIndex!);
  };

  const isCardSelected = (card: HandCard) => {
    if (card.type === 'special') return false;
    if (card.type === 'random') return lastRandomValue !== null;
    if (card.type === 'coffee') return selectedValue === '☕';
    if (card.type === 'shuffled') {
      return isCardRevealed(card) && selectedValue === card.value;
    }
    return selectedValue === card.value;
  };

  const handleCardClick = (card: HandCard) => {
    if (votingDisabled && card.type !== 'special') return;

    switch (card.type) {
      case 'number':
      case 'tshirt':
        onVote(card.value);
        break;
      case 'random': {
        const pool = votingMode === 'tshirt' ? [...TSHIRT_SIZES] : NUMERIC_CARDS;
        const val = pool[Math.floor(Math.random() * pool.length)];
        setLastRandomValue(val);
        onVote(val);
        break;
      }
      case 'coffee':
        onVote('☕');
        onCoffeeSelect?.();
        break;
      case 'special':
        if (card.specialCard && onUseSpecialCard && !disabled && !isBlocked) {
          onUseSpecialCard(card.specialCard.id, card.specialType!);
        }
        break;
      case 'shuffled': {
        const di = card.shuffleDisplayIndex!;
        if (votingMode === 'tshirt') {
          setShuffledRevealed((prev) => new Set([...prev, di]));
          if (!card.isDecoy) {
            onVote(card.value);
          }
        } else {
          setRevealedCards((prev) => new Set([...prev, di]));
          onVote(card.value);
        }
        break;
      }
    }
  };

  const getHeaderMessage = () => {
    if (isBlocked) return 'You are blocked from voting this round';
    if (activeTargeting) {
      const info = SPECIAL_CARD_INFO[activeTargeting.cardType];
      return `${info.icon} Click on a player to use ${info.label}`;
    }
    if (isShuffled) return '🔀 Pick a card to reveal...';
    if (disabled) return 'Voting closed — waiting for reset';
    return 'Select your estimate';
  };

  const renderCardContent = (card: HandCard) => {
    const revealed = isCardRevealed(card);
    const selected = isCardSelected(card);

    if (card.type === 'shuffled' && !revealed) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ fontSize: '1.4rem', lineHeight: 1 }}>❓</Typography>
          <Typography sx={{ fontSize: '0.45rem', opacity: 0.7, color: '#fff' }}>Flip</Typography>
        </Box>
      );
    }

    if (card.type === 'special') {
      const info = SPECIAL_CARD_INFO[card.specialType!];
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: '1.4rem' }}>{info.icon}</span>
          <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, mt: 0.25, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {info.label.split(' ')[0]}
          </Typography>
        </Box>
      );
    }

    if (card.type === 'coffee') {
      return <Typography sx={{ fontSize: '1.6rem', lineHeight: 1 }}>☕</Typography>;
    }

    if (card.type === 'random') {
      if (lastRandomValue) {
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography sx={{ fontSize: '0.5rem', opacity: 0.6 }}>🎲</Typography>
            <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1 }}>{lastRandomValue}</Typography>
          </Box>
        );
      }
      return <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>?</Typography>;
    }

    if (card.type === 'shuffled' && revealed && card.isDecoy) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1, textDecoration: 'line-through', color: '#BDBDBD' }}>{card.label}</Typography>
          <Typography sx={{ fontSize: '0.45rem', mt: 0.25, color: 'error.main' }}>Decoy</Typography>
        </Box>
      );
    }

    const displayVal = card.label;
    const textColor = selected ? '#fff' : (card.color || '#37474F');

    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ position: 'absolute', top: 3, left: 5, fontSize: '0.45rem', fontWeight: 700, lineHeight: 1, opacity: 0.5, color: textColor }}>{displayVal}</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography sx={{ fontSize: card.type === 'tshirt' ? '1.4rem' : '1.3rem', fontWeight: 700, lineHeight: 1, color: textColor }}>{displayVal}</Typography>
          {card.icon && card.type === 'tshirt' && (
            <Typography sx={{ fontSize: '0.5rem', mt: 0.25, opacity: 0.5 }}>{card.icon}</Typography>
          )}
        </Box>
        <Typography sx={{ position: 'absolute', bottom: 3, right: 5, fontSize: '0.45rem', fontWeight: 700, lineHeight: 1, opacity: 0.5, transform: 'rotate(180deg)', color: textColor }}>{displayVal}</Typography>
        <Typography sx={{ position: 'absolute', fontSize: '2rem', opacity: 0.04, lineHeight: 1, pointerEvents: 'none', color: textColor }}>
          {card.type === 'tshirt' ? '♦' : '♠'}
        </Typography>
      </Box>
    );
  };

  const getCardSx = (card: HandCard) => {
    const selected = isCardSelected(card);
    const revealed = isCardRevealed(card);

    const base = {
      width: 58,
      height: 82,
      minWidth: 58,
      borderRadius: '8px',
      p: 0,
      transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      position: 'relative' as const,
      overflow: 'hidden',
    };

    if (card.type === 'shuffled' && !revealed) {
      return {
        ...base,
        bgcolor: '#ff9800',
        color: '#fff',
        border: '2px solid #e65100',
        boxShadow: '0 3px 10px rgba(255,152,0,0.35)',
        animation: `${wobble} 2.5s ease-in-out infinite`,
        animationDelay: `${(card.shuffleDisplayIndex || 0) * 0.12}s`,
      };
    }

    if (card.type === 'shuffled' && revealed && card.isDecoy) {
      return {
        ...base,
        bgcolor: '#F5F5F5',
        color: '#BDBDBD',
        border: '2px solid #E0E0E0',
        boxShadow: 'none',
        animation: `${flipCard} 0.4s ease-out`,
        cursor: 'default',
      };
    }

    if (card.type === 'special') {
      const info = SPECIAL_CARD_INFO[card.specialType!];
      return {
        ...base,
        bgcolor: info.color,
        color: '#fff',
        border: `2px solid ${info.color}`,
        boxShadow: `0 3px 12px ${info.color}60`,
        animation: `${pulseGlow} 2.5s ease-in-out infinite`,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
          backgroundSize: '200% 100%',
          animation: `${shimmer} 2s infinite`,
        },
      };
    }

    if (card.type === 'coffee') {
      return {
        ...base,
        bgcolor: selected ? '#795548' : '#EFEBE9',
        color: selected ? '#fff' : '#795548',
        border: selected ? '2px solid #4E342E' : '2px solid #D7CCC8',
        boxShadow: selected ? '0 4px 16px rgba(121,85,72,0.4)' : '0 2px 6px rgba(0,0,0,0.1)',
      };
    }

    if (card.type === 'random') {
      return {
        ...base,
        bgcolor: lastRandomValue ? '#dc004e' : '#FFF3E0',
        color: lastRandomValue ? '#fff' : '#dc004e',
        border: lastRandomValue ? '2px solid #c51162' : '2px solid #FFCCBC',
        boxShadow: lastRandomValue ? '0 4px 16px rgba(220,0,78,0.35)' : '0 2px 6px rgba(0,0,0,0.1)',
      };
    }

    if (card.type === 'tshirt') {
      const c = card.color!;
      return {
        ...base,
        bgcolor: selected ? c : '#FFFDE7',
        color: selected ? '#fff' : c,
        border: `2px solid ${selected ? c : '#D7CCC8'}`,
        boxShadow: selected ? `0 4px 16px ${c}50` : '0 2px 6px rgba(0,0,0,0.1)',
      };
    }

    if (card.type === 'shuffled' && revealed) {
      const c = card.color || '#1976d2';
      return {
        ...base,
        bgcolor: selected ? c : '#FFFDE7',
        color: selected ? '#fff' : '#37474F',
        border: `2px solid ${selected ? c : '#D7CCC8'}`,
        boxShadow: selected ? `0 4px 16px ${c}50` : '0 2px 6px rgba(0,0,0,0.1)',
        animation: `${flipCard} 0.4s ease-out`,
      };
    }

    return {
      ...base,
      bgcolor: selected ? '#1565C0' : '#FFFDE7',
      color: selected ? '#fff' : '#37474F',
      border: selected ? '2px solid #0D47A1' : '2px solid #D7CCC8',
      boxShadow: selected
        ? '0 4px 16px rgba(21,101,192,0.45), 0 0 0 2px #1976d2'
        : '0 2px 6px rgba(0,0,0,0.1)',
    };
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Alerts */}
      {isBlocked && (
        <Alert severity="warning" icon={<BlockIcon />} sx={{ mb: 1.5, animation: `${pulseGlow} 2s ease-in-out infinite`, '& .MuiAlert-icon': { color: '#f44336' } }}>
          <Typography variant="body2" fontWeight={600}>🚫 You have been blocked from voting!</Typography>
          <Typography variant="caption">Your vote will be set to the average when cards are revealed.</Typography>
        </Alert>
      )}

      {activeTargeting && (
        <Alert severity="info" sx={{ mb: 1.5 }} action={onCancelTargeting && (
          <Chip label="Cancel" size="small" icon={<CloseIcon />} onClick={onCancelTargeting} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' } }} />
        )}>
          <Typography variant="body2" fontWeight={600}>{SPECIAL_CARD_INFO[activeTargeting.cardType].icon} Targeting Mode Active</Typography>
          <Typography variant="caption">Click on a player to use your {SPECIAL_CARD_INFO[activeTargeting.cardType].label} card.</Typography>
        </Alert>
      )}

      {currentUserCopyTarget && !disabled && (
        <Alert severity="success" sx={{ mb: 1.5, bgcolor: 'rgba(156,39,176,0.1)', border: '1px solid rgba(156,39,176,0.3)', '& .MuiAlert-icon': { color: '#9c27b0' } }} icon={<span style={{ fontSize: '1.2rem' }}>🤫</span>}>
          <Typography variant="body2" fontWeight={600} sx={{ color: '#9c27b0' }}>📋 Secretly copying {currentUserCopyTarget.targetUserName || 'someone'}...</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Your vote will match theirs when revealed. 🐱</Typography>
        </Alert>
      )}

      {isShuffled && !disabled && (
        <Alert severity="warning" icon={<ShuffleIcon />} sx={{ mb: 1.5, bgcolor: 'rgba(255,152,0,0.1)', border: '2px solid #ff9800' }}>
          <Typography variant="body2" fontWeight={600} sx={{ color: '#ff9800' }}>🔀 Cards shuffled by {shuffleEffect?.shuffledByName || 'someone'}!</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Click a card to flip it. Choose wisely!</Typography>
        </Alert>
      )}

      {/* Header */}
      <Typography
        variant="body2"
        sx={{
          mb: 1,
          fontWeight: 600,
          color: isBlocked ? 'error.main' : isShuffled ? 'warning.main' : activeTargeting ? 'info.main' : 'text.secondary',
          textAlign: 'center',
          fontSize: '0.8rem',
        }}
      >
        {getHeaderMessage()}
      </Typography>

      {/* Card hand arc */}
      <Box sx={{ position: 'relative' }}>
        {/* Smoke bomb overlay — visual only, clicks pass through */}
        {smokeBomb && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 200,
              pointerEvents: 'none',
              borderRadius: '12px',
              background: 'radial-gradient(ellipse at center, rgba(100,100,100,0.93) 0%, rgba(70,70,70,0.88) 30%, rgba(50,50,50,0.8) 60%, rgba(30,30,30,0.65) 100%)',
              animation: `${smokeSwirl} 3s ease-in-out infinite`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              userSelect: 'none',
            }}
          >
            <Box sx={{ fontSize: '2.5rem' }}>💨</Box>
            <Box sx={{
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.85rem',
              textShadow: '0 2px 8px rgba(0,0,0,0.9)',
              letterSpacing: '0.08em',
            }}>
              SMOKE BOMB!
            </Box>
          </Box>
        )}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            pt: 5,
            pb: 1,
            px: 1,
            position: 'relative',
            minHeight: 130,
          }}
        >
          {hand.map((card, index) => {
            const selected = isCardSelected(card);
            const hovered = hoveredCard === card.id;
            const arc = getArcTransform(index, hand.length, hovered, selected);
            const cardSx = getCardSx(card);

            return (
              <Box
                key={card.id}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                sx={{
                  transform: `rotate(${arc.rotation}deg) translateY(${arc.yOffset}px)`,
                  transformOrigin: 'bottom center',
                  transition: 'transform 0.2s ease',
                  mx: '-3px',
                  zIndex: hovered ? 100 : selected ? 50 : hand.length - Math.abs(Math.round(index - (hand.length - 1) / 2)),
                  flexShrink: 0,
                }}
              >
                <Tooltip
                  title={
                    card.type === 'special'
                      ? `${SPECIAL_CARD_INFO[card.specialType!].label}: ${SPECIAL_CARD_INFO[card.specialType!].description}`
                      : card.type === 'random'
                        ? 'Random vote'
                        : card.type === 'coffee'
                          ? 'Pass (0.5x next round)'
                          : card.type === 'shuffled' && !isCardRevealed(card)
                            ? 'Click to flip'
                            : ''
                  }
                  arrow
                  placement="top"
                  disableHoverListener={card.type === 'number' || card.type === 'tshirt'}
                >
                  <Button
                    disabled={votingDisabled && card.type !== 'special'}
                    onClick={() => handleCardClick(card)}
                    sx={{
                      ...cardSx,
                      ...(isBlocked && card.type !== 'special' && { opacity: 0.35, filter: 'grayscale(1)' }),
                    }}
                  >
                    {renderCardContent(card)}
                  </Button>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
