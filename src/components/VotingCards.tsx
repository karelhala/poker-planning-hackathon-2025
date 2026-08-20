import React, { useState, useEffect, useMemo } from 'react';
import { Grid, Button, Typography, Box, Tooltip, Divider, keyframes, Alert, Chip, Slider } from '@mui/material';
import { Block as BlockIcon, Close as CloseIcon, Shuffle as ShuffleIcon } from '@mui/icons-material';
import { type SpecialCard, type ActiveTargeting, type SpecialCardType, type CopyVoteRelation, type ShuffleEffect, type VotingMode, SPECIAL_CARD_INFO, TSHIRT_SIZES } from '../hooks/useSupabaseRealtime';

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

const TSHIRT_COLORS: Record<string, string> = {
  S: '#1976d2',
  M: '#4caf50',
  L: '#ff9800',
  XL: '#f44336',
};

const TSHIRT_MARKS = TSHIRT_SIZES.map((size, index) => ({
  value: index,
  label: size,
}));

const DECOY_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
const SHUFFLED_TSHIRT_OPTIONS = [...TSHIRT_SIZES, ...DECOY_LETTERS]; // 10 items: 0-3 real, 4-9 decoy

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
}) => {
  const [lastRandomValue, setLastRandomValue] = useState<string | null>(null);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const [sliderIndex, setSliderIndex] = useState<number | null>(null);
  const [shuffledSliderRevealed, setShuffledSliderRevealed] = useState<Set<number>>(new Set());
  const [decoyMessage, setDecoyMessage] = useState<string | null>(null);
  const [shuffledSliderPos, setShuffledSliderPos] = useState(0);

  const currentSliderColor = sliderIndex !== null ? TSHIRT_COLORS[TSHIRT_SIZES[sliderIndex]] : TSHIRT_COLORS.S;

  const isShuffledTshirt = shuffleEffect !== null && votingMode === 'tshirt';

  // Reset slider when vote is cleared
  useEffect(() => {
    if (!selectedValue) {
      setSliderIndex(null);
    } else if (votingMode === 'tshirt') {
      const idx = TSHIRT_SIZES.indexOf(selectedValue as typeof TSHIRT_SIZES[number]);
      if (idx >= 0) setSliderIndex(idx);
    }
  }, [selectedValue, votingMode]);

  // Reset revealed cards when shuffle effect changes, and pre-reveal 0 and 21
  useEffect(() => {
    if (shuffleEffect?.cardOrder) {
      if (votingMode === 'tshirt') {
        setShuffledSliderRevealed(new Set());
        setShuffledSliderPos(0);
        setDecoyMessage(null);
      } else {
        const preRevealedIndices = new Set<number>();
        shuffleEffect.cardOrder.forEach((originalIndex, displayIndex) => {
          if (originalIndex === 0 || originalIndex === 7) {
            preRevealedIndices.add(displayIndex);
          }
        });
        setRevealedCards(preRevealedIndices);
      }
    } else {
      setRevealedCards(new Set());
      setShuffledSliderRevealed(new Set());
      setDecoyMessage(null);
    }
  }, [shuffleEffect, votingMode]);

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

      {votingMode === 'tshirt' ? (
        /* ── T-Shirt Slider Mode ── */
        <Box sx={{ pb: 2 }}>
          {isShuffledTshirt ? (
            /* ── Shuffled T-Shirt Slider ── */
            (() => {
              const shuffleOrder = shuffleEffect!.cardOrder;
              const currentOriginalIdx = shuffleOrder[shuffledSliderPos];
              const currentLabel = SHUFFLED_TSHIRT_OPTIONS[currentOriginalIdx];
              const isCurrentRevealed = shuffledSliderRevealed.has(shuffledSliderPos);
              const isRealSize = currentOriginalIdx < 4;
              const foundSize = isCurrentRevealed && isRealSize;
              const revealedColor = foundSize ? TSHIRT_COLORS[currentLabel] : undefined;

              return (
                <Box
                  sx={{
                    width: '100%',
                    mt: 2,
                    p: 3,
                    borderRadius: 3,
                    border: '2px solid',
                    borderColor: foundSize ? revealedColor : '#ff9800',
                    bgcolor: foundSize ? `${revealedColor}08` : 'rgba(255, 152, 0, 0.04)',
                    transition: 'all 0.4s ease',
                    boxShadow: foundSize ? `0 4px 20px ${revealedColor}30` : '0 4px 20px rgba(255, 152, 0, 0.15)',
                  }}
                >
                  {/* Header display */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 800,
                        transition: 'all 0.3s ease',
                        letterSpacing: 2,
                        ...(isCurrentRevealed ? (
                          isRealSize ? {
                            color: revealedColor,
                            textShadow: `0 2px 10px ${revealedColor}40`,
                          } : {
                            color: 'text.disabled',
                            textDecoration: 'line-through',
                          }
                        ) : {
                          color: '#ff9800',
                        }),
                      }}
                    >
                      {isCurrentRevealed ? currentLabel : '❓'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {foundSize
                        ? `👕 Voting ${currentLabel} — keep sliding to explore or stay here`
                        : isCurrentRevealed && !isRealSize
                          ? `❌ "${currentLabel}" is not a size! Keep sliding...`
                          : `🔀 Shuffled by ${shuffleEffect?.shuffledByName || 'someone'} — slide to reveal!`
                      }
                    </Typography>
                  </Box>

                  {/* Labels row — 10 slots */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.5, mb: -1 }}>
                    {shuffleOrder.map((originalIdx, displayIdx) => {
                      const label = SHUFFLED_TSHIRT_OPTIONS[originalIdx];
                      const revealed = shuffledSliderRevealed.has(displayIdx);
                      const real = originalIdx < 4;
                      return (
                        <Box key={displayIdx} sx={{ width: 30, textAlign: 'center' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: revealed ? 700 : 400,
                              fontSize: '0.75rem',
                              transition: 'all 0.3s ease',
                              ...(revealed ? (
                                real ? {
                                  color: TSHIRT_COLORS[label],
                                } : {
                                  color: 'text.disabled',
                                  textDecoration: 'line-through',
                                }
                              ) : {
                                color: 'text.disabled',
                              }),
                            }}
                          >
                            {revealed ? label : '❓'}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>

                  {/* The 10-stop shuffled slider */}
                  <Slider
                    value={shuffledSliderPos}
                    min={0}
                    max={9}
                    step={1}
                    marks={Array.from({ length: 10 }, (_, i) => ({ value: i }))}
                    disabled={votingDisabled}
                    onChange={(_e, newValue) => {
                      const pos = newValue as number;
                      setShuffledSliderPos(pos);
                      setShuffledSliderRevealed((prev) => new Set([...prev, pos]));

                      const origIdx = shuffleOrder[pos];
                      const label = SHUFFLED_TSHIRT_OPTIONS[origIdx];
                      const isReal = origIdx < 4;

                      if (isReal) {
                        const sizeIdx = TSHIRT_SIZES.indexOf(label as typeof TSHIRT_SIZES[number]);
                        setSliderIndex(sizeIdx);
                        onVote(label);
                        setDecoyMessage(null);
                      } else {
                        setDecoyMessage(`"${label}" is not a T-shirt size!`);
                      }
                    }}
                    sx={{
                      height: 12,
                      '& .MuiSlider-track': {
                        bgcolor: foundSize ? revealedColor : '#ff9800',
                        border: 'none',
                        transition: 'background-color 0.3s ease',
                      },
                      '& .MuiSlider-rail': {
                        bgcolor: 'action.disabledBackground',
                        opacity: 0.4,
                      },
                      '& .MuiSlider-thumb': {
                        width: 28,
                        height: 28,
                        bgcolor: foundSize ? revealedColor : '#ff9800',
                        border: '3px solid #fff',
                        boxShadow: foundSize
                          ? `0 2px 12px ${revealedColor}60`
                          : '0 2px 12px rgba(255, 152, 0, 0.4)',
                        transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                        ...(!(isCurrentRevealed && isRealSize) && {
                          animation: `${wobble} 1.5s ease-in-out infinite`,
                        }),
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: foundSize
                            ? `0 0 0 8px ${revealedColor}30`
                            : '0 0 0 8px rgba(255, 152, 0, 0.2)',
                        },
                      },
                      '& .MuiSlider-mark': {
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'background.paper',
                        border: '2px solid',
                        borderColor: 'divider',
                        transform: 'translate(-50%, -50%)',
                        top: '50%',
                      },
                      '& .MuiSlider-markActive': {
                        bgcolor: foundSize ? '#fff' : 'rgba(255, 152, 0, 0.3)',
                        borderColor: foundSize ? revealedColor : '#ff9800',
                      },
                      '& .MuiSlider-markLabel': {
                        display: 'none',
                      },
                      '&.Mui-disabled': {
                        opacity: 0.5,
                      },
                    }}
                  />

                  {/* Status row */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mt: 2.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={`${shuffledSliderRevealed.size} / 10 revealed`}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.75rem', borderColor: '#ff9800', color: '#ff9800' }}
                    />
                    {decoyMessage && !foundSize && (
                      <Chip
                        label={decoyMessage}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: 'error.light', color: '#fff' }}
                      />
                    )}
                    {foundSize && (
                      <Chip
                        label={`Voted: ${currentLabel}`}
                        sx={{
                          bgcolor: revealedColor,
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          px: 2,
                        }}
                      />
                    )}
                  </Box>
                </Box>
              );
            })()
          ) : (
            /* ── Normal T-Shirt Slider ── */
            <Box
              sx={{
                width: '100%',
                mt: 2,
                p: 3,
                borderRadius: 3,
                border: '2px solid',
                borderColor: sliderIndex !== null ? currentSliderColor : 'divider',
                bgcolor: sliderIndex !== null ? `${currentSliderColor}08` : 'background.paper',
                transition: 'all 0.4s ease',
                boxShadow: sliderIndex !== null ? `0 4px 20px ${currentSliderColor}30` : 1,
              }}
            >
              {/* Selected size display */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    color: sliderIndex !== null ? currentSliderColor : 'text.disabled',
                    transition: 'all 0.3s ease',
                    letterSpacing: 2,
                    textShadow: sliderIndex !== null ? `0 2px 10px ${currentSliderColor}40` : 'none',
                  }}
                >
                  {sliderIndex !== null ? TSHIRT_SIZES[sliderIndex] : '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {sliderIndex !== null ? '👕 Slide to change your estimate' : '👕 Slide to pick a size'}
                </Typography>
              </Box>

              {/* Size labels above slider */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.5, mb: -1 }}>
                {TSHIRT_SIZES.map((size) => (
                  <Box key={size} sx={{ width: 40, textAlign: 'center' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: selectedValue === size ? 800 : 600,
                        color: selectedValue === size ? TSHIRT_COLORS[size] : 'text.secondary',
                        transition: 'all 0.3s ease',
                        fontSize: selectedValue === size ? '1.1rem' : '0.875rem',
                      }}
                    >
                      {size}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* The slider */}
              <Slider
                value={sliderIndex ?? 0}
                min={0}
                max={3}
                step={1}
                marks={TSHIRT_MARKS}
                disabled={votingDisabled}
                onChange={(_e, newValue) => {
                  const idx = newValue as number;
                  setSliderIndex(idx);
                  onVote(TSHIRT_SIZES[idx]);
                }}
                sx={{
                  height: 12,
                  '& .MuiSlider-track': {
                    background: sliderIndex !== null
                      ? `linear-gradient(90deg, ${TSHIRT_COLORS.S}, ${currentSliderColor})`
                      : TSHIRT_COLORS.S,
                    border: 'none',
                    transition: 'background 0.4s ease',
                  },
                  '& .MuiSlider-rail': {
                    background: 'linear-gradient(90deg, #1976d2, #4caf50, #ff9800, #f44336)',
                    opacity: 0.25,
                  },
                  '& .MuiSlider-thumb': {
                    width: 28,
                    height: 28,
                    bgcolor: currentSliderColor,
                    border: '3px solid #fff',
                    boxShadow: `0 2px 12px ${currentSliderColor}60`,
                    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: `0 0 0 8px ${currentSliderColor}30`,
                    },
                    '&.Mui-active': {
                      boxShadow: `0 0 0 12px ${currentSliderColor}30`,
                    },
                  },
                  '& .MuiSlider-mark': {
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'background.paper',
                    border: '2px solid',
                    borderColor: 'divider',
                    transform: 'translate(-50%, -50%)',
                    top: '50%',
                  },
                  '& .MuiSlider-markActive': {
                    bgcolor: '#fff',
                    borderColor: currentSliderColor,
                  },
                  '& .MuiSlider-markLabel': {
                    display: 'none',
                  },
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  },
                }}
              />

              {/* Bottom row: voted chip + quick actions */}
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mt: 2.5, flexWrap: 'wrap' }}>
                <Tooltip title="Pick a random T-shirt size" arrow>
                  <Chip
                    icon={<span>🎲</span>}
                    label="Random"
                    variant={lastRandomValue && TSHIRT_SIZES.includes(lastRandomValue as typeof TSHIRT_SIZES[number]) ? 'filled' : 'outlined'}
                    disabled={votingDisabled}
                    onClick={() => {
                      if (!votingDisabled) {
                        const randomIdx = Math.floor(Math.random() * TSHIRT_SIZES.length);
                        const randomSize = TSHIRT_SIZES[randomIdx];
                        setLastRandomValue(randomSize);
                        setSliderIndex(randomIdx);
                        onVote(randomSize);
                      }
                    }}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: votingDisabled ? 'default' : 'pointer',
                      px: 1,
                      ...(lastRandomValue && TSHIRT_SIZES.includes(lastRandomValue as typeof TSHIRT_SIZES[number]) && {
                        bgcolor: 'secondary.main',
                        color: '#fff',
                        '&:hover': { bgcolor: 'secondary.dark' },
                      }),
                    }}
                  />
                </Tooltip>

                {sliderIndex !== null && selectedValue && TSHIRT_SIZES.includes(selectedValue as typeof TSHIRT_SIZES[number]) && (
                  <Chip
                    label={`Voted: ${selectedValue}`}
                    sx={{
                      bgcolor: currentSliderColor,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      px: 2,
                      py: 0.5,
                    }}
                  />
                )}

                <Tooltip title="Pass — your next round vote counts as 0.5x" arrow>
                  <Chip
                    icon={<span>☕</span>}
                    label="Pass"
                    variant={selectedValue === '☕' ? 'filled' : 'outlined'}
                    disabled={votingDisabled}
                    onClick={() => {
                      if (!votingDisabled) {
                        setSliderIndex(null);
                        onVote('☕');
                        onCoffeeSelect?.();
                      }
                    }}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: votingDisabled ? 'default' : 'pointer',
                      px: 1,
                      ...(selectedValue === '☕' && {
                        bgcolor: '#795548',
                        color: '#fff',
                        '&:hover': { bgcolor: '#5d4037' },
                      }),
                    }}
                  />
                </Tooltip>
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        /* ── Fibonacci Card Mode (original) ── */
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
                          handleShuffledCardClick(displayIndex, cardValue);
                        } else if (!selectedValue) {
                          onVote(cardValue);
                        }
                      } else {
                        onVote(cardValue);
                      }
                    }}
                    sx={{
                      width: 66,
                      height: 92,
                      fontSize: '1.4rem',
                      borderRadius: '8px',
                      transition: 'all 0.25s ease',
                      transformStyle: 'preserve-3d',
                      position: 'relative',
                      overflow: 'hidden',
                      ...(!isShuffled || showValue ? {
                        bgcolor: isSelected ? '#1565C0' : '#FFFDE7',
                        color: isSelected ? '#fff' : '#37474F',
                        border: isSelected ? '2px solid #0D47A1' : '2px solid #D7CCC8',
                        boxShadow: isSelected
                          ? '0 8px 24px rgba(21, 101, 192, 0.45), 0 0 0 2px #1976d2'
                          : '0 2px 8px rgba(0,0,0,0.12)',
                        '&:hover': {
                          bgcolor: isSelected ? '#1565C0' : '#FFF8E1',
                          transform: 'translateY(-8px)',
                          boxShadow: isSelected
                            ? '0 12px 28px rgba(21, 101, 192, 0.5)'
                            : '0 8px 20px rgba(0,0,0,0.18)',
                          border: isSelected ? '2px solid #0D47A1' : '2px solid #BCAAA4',
                        },
                      } : {}),
                      ...(isBlocked && {
                        opacity: 0.4,
                        filter: 'grayscale(1)',
                      }),
                      ...(isShuffled && !showValue && {
                        bgcolor: '#ff9800',
                        borderColor: '#ff9800',
                        color: '#fff',
                        border: '2px solid #e65100',
                        animation: `${wobble} 2s ease-in-out infinite`,
                        animationDelay: `${displayIndex * 0.2}s`,
                        '&:hover': {
                          bgcolor: '#f57c00',
                          transform: 'translateY(-8px) scale(1.1)',
                          boxShadow: '0 8px 25px rgba(255, 152, 0, 0.5)',
                        },
                      }),
                      ...(isShuffled && isRevealed && {
                        animation: `${flipCard} 0.6s ease-out`,
                      }),
                    }}
                  >
                    {showValue ? (
                      <Box sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Typography sx={{
                          position: 'absolute', top: 2, left: 4,
                          fontSize: '0.5rem', fontWeight: 700, lineHeight: 1, opacity: 0.6,
                        }}>
                          {cardValue}
                        </Typography>
                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1 }}>
                          {cardValue}
                        </Typography>
                        <Typography sx={{
                          position: 'absolute', bottom: 2, right: 4,
                          fontSize: '0.5rem', fontWeight: 700, lineHeight: 1, opacity: 0.6,
                          transform: 'rotate(180deg)',
                        }}>
                          {cardValue}
                        </Typography>
                        <Typography sx={{
                          position: 'absolute',
                          fontSize: '2.5rem', opacity: 0.04, lineHeight: 1, pointerEvents: 'none',
                          color: isSelected ? '#fff' : '#37474F',
                        }}>
                          ♠
                        </Typography>
                      </Box>
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
                  width: 66,
                  height: 92,
                  fontSize: '1.8rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  position: 'relative',
                  overflow: 'hidden',
                  bgcolor: lastRandomValue ? '#dc004e' : '#FFF3E0',
                  color: lastRandomValue ? '#fff' : '#dc004e',
                  border: lastRandomValue ? '2px solid #c51162' : '2px solid #FFCCBC',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: votingDisabled ? 'none' : 'translateY(-8px)',
                    boxShadow: '0 8px 20px rgba(220, 0, 78, 0.25)',
                    bgcolor: lastRandomValue ? '#c51162' : '#FFE0B2',
                    border: lastRandomValue ? '2px solid #c51162' : '2px solid #FFAB91',
                  },
                }}
              >
                {lastRandomValue ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontSize: '0.55rem', opacity: 0.7 }}>🎲</Typography>
                    <span>{lastRandomValue}</span>
                  </Box>
                ) : '?'}
              </Button>
            </Tooltip>
          </Grid>

          {/* Coffee Card */}
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
                  width: 66,
                  height: 92,
                  fontSize: '1.8rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  position: 'relative',
                  overflow: 'hidden',
                  bgcolor: selectedValue === '☕' ? '#795548' : '#EFEBE9',
                  color: selectedValue === '☕' ? '#fff' : '#795548',
                  border: selectedValue === '☕' ? '2px solid #4E342E' : '2px solid #D7CCC8',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: votingDisabled ? 'none' : 'translateY(-8px)',
                    boxShadow: '0 8px 20px rgba(121, 85, 72, 0.25)',
                    bgcolor: selectedValue === '☕' ? '#5d4037' : '#D7CCC8',
                    border: selectedValue === '☕' ? '2px solid #4E342E' : '2px solid #BCAAA4',
                  },
                }}
              >
                ☕
              </Button>
            </Tooltip>
          </Grid>
        </Grid>
      )}

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
