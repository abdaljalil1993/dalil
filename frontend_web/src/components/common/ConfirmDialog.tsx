import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, TextField } from '@mui/material';
import { ReactNode, useState, useEffect } from 'react';
import { useT } from '@/i18n';

interface Props {
  open: boolean;
  title?: ReactNode;
  text?: ReactNode;
  confirmText?: string;
  danger?: boolean;
  loading?: boolean;
  /** Ask for a note (e.g. rejection reason) */
  withNote?: string;
  onClose: () => void;
  onConfirm: (note?: string) => void;
}

export const ConfirmDialog = ({ open, title, text, confirmText, danger, loading, withNote, onClose, onConfirm }: Props) => {
  const { t } = useT();
  const [note, setNote] = useState('');
  useEffect(() => { if (open) setNote(''); }, [open]);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={800}>{title || t('common.areYouSure')}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{text || t('common.cannotUndo')}</Typography>
        {withNote && <TextField autoFocus fullWidth multiline minRows={2} label={withNote} value={note} onChange={(e) => setNote(e.target.value)} sx={{ mt: 2 }} />}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">{t('common.cancel')}</Button>
        <Button variant="contained" color={danger ? 'error' : 'primary'} disabled={loading} onClick={() => onConfirm(note || undefined)} sx={danger ? { background: 'none', bgcolor: 'error.main' } : undefined}>
          {confirmText || t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
