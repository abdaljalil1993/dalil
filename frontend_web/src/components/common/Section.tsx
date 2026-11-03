import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';
import { useT } from '@/i18n';

export const SectionHeader = ({ title, subtitle, to, action }: { title: ReactNode; subtitle?: ReactNode; to?: string; action?: ReactNode }) => {
  const { t, isRtl } = useT();
  return (
    <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={2} sx={{ mb: 2.5 }}>
      <Box>
        <Typography variant="h5" component="h2" fontWeight={800}>{title}</Typography>
        {subtitle && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
      </Box>
      {action}
      {to && (
        <Button component={Link} to={to} endIcon={<ArrowForwardRounded sx={{ transform: isRtl ? 'scaleX(-1)' : undefined }} />} sx={{ flexShrink: 0 }}>
          {t('common.viewAll')}
        </Button>
      )}
    </Stack>
  );
};

export const EmptyState = ({ icon, title, text, action }: { icon?: ReactNode; title: ReactNode; text?: ReactNode; action?: ReactNode }) => (
  <Box sx={{ textAlign: 'center', py: { xs: 6, md: 8 }, px: 2 }}>
    {icon && (
      <Box sx={{ width: 84, height: 84, mx: 'auto', mb: 2, borderRadius: '28%', display: 'grid', placeItems: 'center', background: (t) => t.custom.gradientSoft, color: 'primary.main', '& svg': { fontSize: 40 } }}>
        {icon}
      </Box>
    )}
    <Typography variant="h6" fontWeight={700}>{title}</Typography>
    {text && <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 420, mx: 'auto' }}>{text}</Typography>}
    {action && <Box sx={{ mt: 3 }}>{action}</Box>}
  </Box>
);

export const PageHeader = ({ title, subtitle, actions, icon }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; icon?: ReactNode }) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      {icon && <Box sx={{ width: 46, height: 46, borderRadius: 3, display: 'grid', placeItems: 'center', background: (t) => t.custom.gradient, color: '#fff' }}>{icon}</Box>}
      <Box>
        <Typography variant="h5" fontWeight={800}>{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{subtitle}</Typography>}
      </Box>
    </Stack>
    {actions && <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>{actions}</Stack>}
  </Stack>
);
