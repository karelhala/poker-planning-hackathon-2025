import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from '@mui/material';

interface EditNameDialogProps {
  open: boolean;
  currentName: string | null;
  onClose: () => void;
  onSave: (newName: string) => void;
}

export const EditNameDialog: React.FC<EditNameDialogProps> = ({
  open,
  currentName,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(currentName || '');

  useEffect(() => {
    if (open) {
      setName(currentName || '');
    }
  }, [open, currentName]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (trimmedName) {
      onSave(trimmedName);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Your Name</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 1 }}>
          Update your display name for this poker planning session. Other users will see
          the new name instantly.
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Your Name"
          type="text"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

