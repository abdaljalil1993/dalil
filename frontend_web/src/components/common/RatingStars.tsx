import { Box, Rating, Stack, Typography } from '@mui/material';
import StarRounded from '@mui/icons-material/StarRounded';

export const RatingStars = ({ value, count, size = 'small', showValue = true }: { value: number; count?: number; size?: 'small' | 'medium' | 'large'; showValue?: boolean }) => (
  <Stack direction="row" alignItems="center" spacing={0.5}>
    <Rating value={value} precision={0.5} readOnly size={size} icon={<StarRounded fontSize="inherit" />} emptyIcon={<StarRounded fontSize="inherit" />} sx={{ color: '#FDB022' }} />
    {showValue && (
      <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1 }}>
        {value ? value.toFixed(1) : '—'}
      </Typography>
    )}
    {count !== undefined && (
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1 }}>
        ({count})
      </Typography>
    )}
  </Stack>
);

export const RatingPill = ({ value }: { value: number }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, px: 0.9, py: 0.3, borderRadius: 2, bgcolor: value >= 4 ? 'success.main' : value >= 3 ? 'warning.main' : value > 0 ? 'error.main' : 'grey.500', color: '#fff', fontWeight: 700, fontSize: 13 }}>
    <StarRounded sx={{ fontSize: 15 }} />
    {value ? value.toFixed(1) : '—'}
  </Box>
);
