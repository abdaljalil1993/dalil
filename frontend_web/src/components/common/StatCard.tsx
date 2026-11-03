import { Box, Card, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ReactNode } from 'react';

export const StatCard = ({ label, value, icon, color = '#5B3DF5', hint, onClick }: { label: ReactNode; value: ReactNode; icon: ReactNode; color?: string; hint?: ReactNode; onClick?: () => void }) => (
  <Card onClick={onClick} sx={{ p: 2.25, height: '100%', cursor: onClick ? 'pointer' : 'default', position: 'relative', overflow: 'hidden', transition: 'box-shadow .2s', '&:hover': onClick ? { boxShadow: (t) => t.custom.cardShadowHover } : undefined }}>
    <Box sx={{ position: 'absolute', insetInlineEnd: -24, top: -24, width: 96, height: 96, borderRadius: '50%', bgcolor: alpha(color, 0.08) }} />
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{ width: 48, height: 48, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: alpha(color, 0.12), color }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
        <Typography variant="h5" fontWeight={800}>{value}</Typography>
        {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
      </Box>
    </Stack>
  </Card>
);
