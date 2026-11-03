import { Box, Button, Dialog, DialogContent, IconButton, Stack, Typography } from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import { useNavigate } from 'react-router-dom';
import { useUi } from '@/store/uiStore';
import { useT } from '@/i18n';

/** Shown when a guest tries a members-only action (search, review, favorite, add business). */
export const LoginPromptDialog = () => {
  const { loginPrompt, closeLoginPrompt } = useUi();
  const navigate = useNavigate();
  const { t } = useT();
  const go = (path: string) => {
    const redirect = loginPrompt.redirect;
    closeLoginPrompt();
    navigate(path, { state: { from: redirect } });
  };
  return (
    <Dialog open={loginPrompt.open} onClose={closeLoginPrompt} maxWidth="xs" fullWidth>
      <IconButton onClick={closeLoginPrompt} sx={{ position: 'absolute', top: 10, insetInlineEnd: 10 }}><CloseRounded /></IconButton>
      <DialogContent sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ width: 72, height: 72, mx: 'auto', borderRadius: '30%', display: 'grid', placeItems: 'center', background: (th) => th.custom.gradient, color: '#fff', mb: 2 }}>
          <LockRounded sx={{ fontSize: 34 }} />
        </Box>
        <Typography variant="h6" fontWeight={800}>{t('auth.requiredTitle')}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>{t('auth.requiredText')}</Typography>
        <Stack spacing={1} sx={{ my: 2.5, textAlign: 'start' }}>
          {(['benefits1', 'benefits2', 'benefits3', 'benefits4'] as const).map((k) => (
            <Stack key={k} direction="row" spacing={1} alignItems="center">
              <CheckCircleRounded color="success" fontSize="small" />
              <Typography variant="body2">{t(`auth.${k}`)}</Typography>
            </Stack>
          ))}
        </Stack>
        <Stack spacing={1.25}>
          <Button variant="contained" size="large" onClick={() => go('/register')}>{t('auth.registerNow')}</Button>
          <Button variant="outlined" size="large" onClick={() => go('/login')}>{t('auth.loginNow')}</Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
