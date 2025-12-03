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
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { EditNameDialog } from './EditNameDialog';

export interface Player {
  userId: string;
  userName: string | null;
  hasVoted: boolean;
  vote: string | null;
  isOnline: boolean;
}

export type GameState = 'VOTING' | 'REVEALED';

interface PlayersTableProps {
  players: Player[];
  currentUserId: string;
  roomCreator: string | null;
  gameState: GameState;
  onNameChange: (newName: string) => void;
  currentUserName: string | null;
}

export const PlayersTable: React.FC<PlayersTableProps> = ({
  players,
  currentUserId,
  roomCreator,
  gameState,
  onNameChange,
  currentUserName,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleOpenEditDialog = () => {
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };

  const handleSaveName = (newName: string) => {
    onNameChange(newName);
  };
  const getStatusChip = (hasVoted: boolean, vote: string | null) => {
    // If game is revealed, show the actual vote
    if (gameState === 'REVEALED') {
      if (vote) {
        return (
          <Chip
            label={vote}
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
                  return (
                    <TableRow
                      key={player.userId}
                      sx={{
                        '&:hover': { bgcolor: 'action.hover' },
                        bgcolor: player.userId === currentUserId ? 'action.selected' : 'inherit',
                      }}
                    >
                      <TableCell>
                        {getUserAvatar(player.userId, player.userName)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {getDisplayName(player.userId, player.userName)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {player.userId.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {getStatusChip(player.hasVoted, player.vote)}
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
                      <TableCell align="center">
                        {player.userId === currentUserId ? (
                          <Tooltip title="Edit your name">
                            <IconButton
                              size="small"
                              onClick={handleOpenEditDialog}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Box sx={{ width: 40, height: 40 }} />
                        )}
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
    </Card>
  );
};

