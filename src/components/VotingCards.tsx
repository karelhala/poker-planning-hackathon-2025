import React, { useState, useEffect, useMemo } from 'react';
import { Grid, Button, Typography, Box, Tooltip, Divider, keyframes, Alert, Chip } from '@mui/material';
import { Block as BlockIcon, Close as CloseIcon, Shuffle as ShuffleIcon } from '@mui/icons-material';
import { type SpecialCard, type ActiveTargeting, type SpecialCardType, type CopyVoteRelation, type ShuffleEffect, SPECIAL_CARD_INFO } from '../hooks/useSupabaseRealtime';

// Standard Fibonacci scale for agile estimation
const CARDS = ['0', '1', '2', '3', '5', '8', '13', '21'];
// Numeric cards for random selection
const NUMERIC_CARDS = ['0', '1', '2', '3', '5', '8', '13', '21'];

// Shimmer animation for special cards
const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`;

// Pulse glow animation
const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px currentColor, 0 0 10px currentColor;
  }
  50% {
    box-shadow: 0 0 15px currentColor, 0 0 25px currentColor;
  }
`;

// Shuffle animation - cards fly around
const shuffleAnim = keyframes`
  0% {
    transform: rotateY(0deg) translateX(0) translateY(0);
  }
  25% {
    transform: rotateY(90deg) translateX(50px) translateY(-30px);
  }
  50% {
    transform: rotateY(180deg) translateX(0) translateY(20px);
  }
  75% {
    transform: rotateY(270deg) translateX(-50px) translateY(-20px);
  }
  100% {
    transform: rotateY(360deg) translateX(0) translateY(0);
  }
`;

// Flip animation
const flipCard = keyframes`
  0% {
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(180deg);
  }
`;

// Wobble animation for shuffled cards
const wobble = keyframes`
  0%, 100% {
    transform: rotate(-2deg);
  }
  50% {
    transform: rotate(2deg);
  }
`;

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
}) => {
  const [lastRandomValue, setLastRandomValue] = useState<string | null>(null);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());

  // Reset revealed cards when shuffle effect changes, and pre-reveal 0 and 21
  useEffect(() => {
    if (shuffleEffect?.cardOrder) {
      // Find display indices for cards with values 0 (index 0) and 21 (index 7)
      const preRevealedIndices = new Set<number>();
      shuffleEffect.cardOrder.forEach((originalIndex, displayIndex) => {
        // originalIndex 0 = '0', originalIndex 7 = '21'
        if (originalIndex === 0 || originalIndex === 7) {
          preRevealedIndices.add(displayIndex);
        }
      });
      setRevealedCards(preRevealedIndices);
    } else {
      setRevealedCards(new Set());
    }
  }, [shuffleEffect]);

  const handleSpecialCardClick = (card: SpecialCard) => {
    if (onUseSpecialCard && !disabled && !isBlocked) {
      onUseSpecialCard(card.id, card.type);
    }
  };

  // Get the card order - either shuffled or normal
  const cardOrder = useMemo(() => {
    if (shuffleEffect?.cardOrder) {
      return shuffleEffect.cardOrder;
    }
    return [0, 1, 2, 3, 4, 5, 6, 7];
  }, [shuffleEffect]);

  // Handle clicking a shuffled card to reveal it
  const handleShuffledCardClick = (displayIndex: number, actualValue: string) => {
    if (shuffleEffect && !disabled) {
      // Reveal this card
      setRevealedCards((prev) => new Set([...prev, displayIndex]));
      // Also cast the vote
      onVote(actualValue);
    }
  };

  // If user is blocked, they cannot vote manually
  const votingDisabled = disabled || isBlocked;
  const isShuffled = shuffleEffect !== null;

  // Get the message for the header
  const getHeaderMessage = () => {
    if (isBlocked) {
      return 'You are blocked from voting this round';
    }
    if (activeTargeting) {
      const cardInfo = SPECIAL_CARD_INFO[activeTargeting.cardType];
      return `${cardInfo.icon} Click on a player to use ${cardInfo.label}`;
    }
    if (disabled) {
      return 'Voting is closed - waiting for reset';
    }
    return 'Select your estimate';
  };

  return (
    <Box sx={{ mt: 4, width: '100%' }}>
      {/* Blocked Alert */}
      {isBlocked && (
        <Alert 
          severity="warning" 
          icon={<BlockIcon />}
          sx={{ 
            mb: 2, 
            animation: `${pulseGlow} 2s ease-in-out infinite`,
            '& .MuiAlert-icon': { color: '#f44336' }
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            🚫 You have been blocked from voting!
          </Typography>
          <Typography variant="caption">
            Your vote will automatically be set to the average of other players' votes when cards are revealed.
          </Typography>
        </Alert>
      )}

      {/* Targeting Mode Indicator */}
      {activeTargeting && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          action={
            onCancelTargeting && (
              <Chip
                label="Cancel"
                size="small"
                icon={<CloseIcon />}
                onClick={onCancelTargeting}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' }
                }}
              />
            )
          }
        >
          <Typography variant="body2" fontWeight={600}>
            {SPECIAL_CARD_INFO[activeTargeting.cardType].icon} Targeting Mode Active
          </Typography>
          <Typography variant="caption">
            Click on a player in the table above to use your {SPECIAL_CARD_INFO[activeTargeting.cardType].label} card on them.
          </Typography>
        </Alert>
      )}

      {/* Copy Target Indicator - Secret reminder for the copier */}
      {currentUserCopyTarget && !disabled && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 2,
            bgcolor: 'rgba(156, 39, 176, 0.1)',
            border: '1px solid rgba(156, 39, 176, 0.3)',
            '& .MuiAlert-icon': { color: '#9c27b0' }
          }}
          icon={<span style={{ fontSize: '1.2rem' }}>🤫</span>}
        >
          <Typography variant="body2" fontWeight={600} sx={{ color: '#9c27b0' }}>
            📋 Secretly copying {currentUserCopyTarget.targetUserName || 'someone'}...
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Your vote will match theirs when cards are revealed. Shh, it's a secret! 🐱
          </Typography>
        </Alert>
      )}

      {/* Shuffle Effect Alert */}
      {isShuffled && !disabled && (
        <Alert 
          severity="warning" 
          icon={<ShuffleIcon />}
          sx={{ 
            mb: 2, 
            bgcolor: 'rgba(255, 152, 0, 0.1)',
            border: '2px solid #ff9800',
          }}
        >
          <Typography variant="body2" fontWeight={600} sx={{ color: '#ff9800' }}>
            🔀 Your cards have been shuffled by {shuffleEffect?.shuffledByName || 'someone'}!
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Click on a card to flip it over and see the value. Choose wisely - you can only vote once!
          </Typography>
        </Alert>
      )}

      <Typography variant="h6" gutterBottom color={isBlocked ? 'error' : isShuffled ? 'warning.main' : activeTargeting ? 'info.main' : 'text.secondary'}>
        {isShuffled ? '🔀 Your cards are shuffled! Pick one to reveal...' : getHeaderMessage()}
      </Typography>
      
      <Grid container spacing={2} justifyContent="center">
        {/* Render Number Cards - shuffled or normal */}
        {cardOrder.map((originalIndex, displayIndex) => {
          const cardValue = CARDS[originalIndex];
          const isRevealed = revealedCards.has(displayIndex);
          const isSelected = selectedValue === cardValue;
          const showValue = !isShuffled || isRevealed || disabled;
          
          return (
            <Grid item key={displayIndex}>
              <Box
                sx={{
                  perspective: '1000px',
                  ...(shuffleEffect?.isAnimating && {
                    animation: `${shuffleAnim} 0.5s ease-in-out`,
                    animationDelay: `${displayIndex * 0.1}s`,
                  }),
                }}
              >
                <Button
                  variant={isSelected ? "contained" : "outlined"}
                  color={isShuffled && !showValue ? "warning" : "primary"}
                  disabled={votingDisabled || (isShuffled && isRevealed && !isSelected && selectedValue !== null)}
                  onClick={() => {
                    if (isShuffled) {
                      if (!showValue) {
                        // Hidden card - reveal and vote
                        handleShuffledCardClick(displayIndex, cardValue);
                      } else if (!selectedValue) {
                        // Pre-revealed card (0 or 21) - can vote directly
                        onVote(cardValue);
                      }
                    } else {
                      onVote(cardValue);
                    }
                  }}
                  sx={{
                    width: 60,
                    height: 80,
                    fontSize: '1.5rem',
                    borderRadius: 2,
                    boxShadow: isSelected ? 6 : 1,
                    borderWidth: isSelected ? 0 : 2,
                    transition: 'all 0.3s ease',
                    transformStyle: 'preserve-3d',
                    position: 'relative',
                    '&:hover': {
                      transform: isShuffled && !showValue ? 'translateY(-8px) rotateY(20deg)' : 'translateY(-4px)',
                    },
                    ...(isBlocked && {
                      opacity: 0.4,
                      filter: 'grayscale(1)',
                    }),
                    // Shuffled card styling
                    ...(isShuffled && !showValue && {
                      bgcolor: '#ff9800',
                      borderColor: '#ff9800',
                      color: '#fff',
                      animation: `${wobble} 2s ease-in-out infinite`,
                      animationDelay: `${displayIndex * 0.2}s`,
                      '&:hover': {
                        bgcolor: '#f57c00',
                        transform: 'translateY(-8px) scale(1.1)',
                        boxShadow: '0 8px 25px rgba(255, 152, 0, 0.5)',
                      },
                    }),
                    // Revealed shuffled card
                    ...(isShuffled && isRevealed && {
                      animation: `${flipCard} 0.6s ease-out`,
                    }),
                  }}
                >
                  {showValue ? (
                    cardValue
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      fontSize: '1.8rem',
                    }}>
                      <span>❓</span>
                    </Box>
                  )}
                </Button>
              </Box>
            </Grid>
          );
        })}

        {/* Divider between number cards and special vote cards */}
        <Grid item>
          <Divider orientation="vertical" flexItem sx={{ height: 80, mx: 1 }} />
        </Grid>

        {/* Random Card (?) */}
        <Grid item>
          <Tooltip title="Pick a random value from 0-21" arrow>
            <Button
              variant={selectedValue === '?' || lastRandomValue ? "contained" : "outlined"}
              color="secondary"
              disabled={votingDisabled}
              onClick={() => {
                if (!votingDisabled) {
                  const randomValue = NUMERIC_CARDS[Math.floor(Math.random() * NUMERIC_CARDS.length)];
                  setLastRandomValue(randomValue);
                  onVote(randomValue);
                }
              }}
              sx={{
                width: 70,
                height: 90,
                fontSize: '2rem',
                borderRadius: 2,
                boxShadow: 2,
                borderWidth: 2,
                position: 'relative',
                '&:hover': {
                  transform: votingDisabled ? 'none' : 'translateY(-4px)',
                  boxShadow: votingDisabled ? 2 : 4,
                  borderWidth: 2,
                },
              }}
            >
              {lastRandomValue ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.7 }}>🎲</Typography>
                  <span>{lastRandomValue}</span>
                </Box>
              ) : '?'}
            </Button>
          </Tooltip>
        </Grid>

        {/* Coffee Card (☕) */}
        <Grid item>
          <Tooltip title="Take a break - your next round vote counts as 0.5x" arrow>
            <Button
              variant={selectedValue === '☕' ? "contained" : "outlined"}
              color="warning"
              disabled={votingDisabled}
              onClick={() => {
                if (!votingDisabled) {
                  onVote('☕');
                  onCoffeeSelect?.();
                }
              }}
              sx={{
                width: 70,
                height: 90,
                fontSize: '2rem',
                borderRadius: 2,
                boxShadow: 2,
                borderWidth: 2,
                bgcolor: selectedValue === '☕' ? '#795548' : 'transparent',
                borderColor: '#795548',
                color: selectedValue === '☕' ? '#fff' : '#795548',
                '&:hover': {
                  transform: votingDisabled ? 'none' : 'translateY(-4px)',
                  boxShadow: votingDisabled ? 2 : 4,
                  borderWidth: 2,
                  bgcolor: selectedValue === '☕' ? '#5d4037' : 'rgba(121, 85, 72, 0.1)',
                },
              }}
            >
              ☕
            </Button>
          </Tooltip>
        </Grid>
      </Grid>

      {/* Special Cards Section */}
      {specialCards.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
              ✨ Special Cards (Single Use)
            </Typography>
          </Divider>
          
          <Grid container spacing={2} justifyContent="center">
            {specialCards.map((card) => {
              const cardInfo = SPECIAL_CARD_INFO[card.type];
              return (
                <Grid item key={card.id}>
                  <Tooltip 
                    title={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {cardInfo.label}
                        </Typography>
                        <Typography variant="caption">
                          {cardInfo.description}
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.7 }}>
                          From: {card.grantedByName || 'Admin'}
                        </Typography>
                      </Box>
                    }
                    arrow
                  >
                    <Button
                      variant="contained"
                      disabled={disabled}
                      onClick={() => handleSpecialCardClick(card)}
                      sx={{
                        width: 70,
                        height: 90,
                        fontSize: '1.8rem',
                        borderRadius: 2,
                        position: 'relative',
                        overflow: 'hidden',
                        bgcolor: cardInfo.color,
                        color: '#fff',
                        border: `2px solid ${cardInfo.color}`,
                        animation: `${pulseGlow} 2s ease-in-out infinite`,
                        transition: 'all 0.2s ease',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: `linear-gradient(
                            90deg,
                            transparent,
                            rgba(255, 255, 255, 0.3),
                            transparent
                          )`,
                          backgroundSize: '200% 100%',
                          animation: `${shimmer} 2s infinite`,
                        },
                        '&:hover': {
                          transform: 'translateY(-6px) scale(1.05)',
                          bgcolor: cardInfo.color,
                          boxShadow: `0 8px 25px ${cardInfo.color}80`,
                        },
                        '&:disabled': {
                          bgcolor: `${cardInfo.color}40`,
                          color: 'rgba(255, 255, 255, 0.5)',
                          animation: 'none',
                          '&::before': {
                            animation: 'none',
                          }
                        }
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        position: 'relative',
                        zIndex: 1,
                      }}>
                        <span>{cardInfo.icon}</span>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: '0.6rem', 
                            lineHeight: 1,
                            mt: 0.5,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {cardInfo.label.split(' ')[0]}
                        </Typography>
                      </Box>
                    </Button>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Box>
  );
};
