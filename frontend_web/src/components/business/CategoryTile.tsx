import { Box, Card, CardActionArea, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import type { Category } from '@/api/types';
import { useLocalName, useT } from '@/i18n';
import { CategoryIcon } from '../common/CategoryIcon';

export const CategoryTile = ({ category: c, compact = false }: { category: Category; compact?: boolean }) => {
  const ln = useLocalName();
  const { t } = useT();
  const color = c.color || '#5B3DF5';
  return (
    <Card sx={{ height: '100%', transition: 'all .25s', '&:hover': { transform: 'translateY(-3px)', borderColor: alpha(color, 0.5), boxShadow: `0 14px 30px -14px ${alpha(color, 0.55)}` } }}>
      <CardActionArea component={Link} to={`/c/${c.slug}`} sx={{ p: compact ? 1.75 : 2.25, height: '100%' }}>
        <Stack direction={compact ? 'column' : 'row'} spacing={compact ? 1.25 : 2} alignItems={compact ? 'center' : 'center'} textAlign={compact ? 'center' : 'start'}>
          <CategoryIcon icon={c.icon} color={color} size={compact ? 52 : 56} />
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700} noWrap={!compact} sx={{ fontSize: compact ? 14 : 16 }}>{ln(c)}</Typography>
            {!compact && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {(c.subCategories || []).slice(0, 3).map((s) => ln(s)).join('، ')}
              </Typography>
            )}
            <Typography variant="caption" sx={{ color, fontWeight: 700 }}>{t('common.businessesCount', { n: c.businessCount ?? 0 })}</Typography>
          </Box>
        </Stack>
      </CardActionArea>
    </Card>
  );
};
