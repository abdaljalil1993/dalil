import { Box, Card, Chip, Container, Grid, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useCategories } from '@/hooks/queries';
import { useLocalName, useT } from '@/i18n';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { PageHeader } from '@/components/common/Section';
import { RowsSkeleton } from '@/components/common/Skeletons';
import { normalize } from '@/utils/text';
import CategoryRounded from '@mui/icons-material/CategoryRounded';

export const Categories = () => {
  const { t } = useT();
  const ln = useLocalName();
  const { data, isLoading } = useCategories();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const n = normalize(q);
    if (!n) return data || [];
    return (data || []).filter((c) => [c.name, c.nameEn, c.keywords, ...(c.subCategories || []).flatMap((s) => [s.name, s.nameEn, s.keywords])].some((x) => normalize(x || '').includes(n)));
  }, [data, q]);
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader icon={<CategoryRounded />} title={t('nav.categories')} subtitle={t('home.browseCategoriesSub')} actions={
        <TextField size="small" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common.search')} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> }} sx={{ minWidth: 260 }} />
      } />
      {isLoading ? <RowsSkeleton rows={6} /> : (
        <Grid container spacing={2.5}>
          {list.map((c) => (
            <Grid item xs={12} sm={6} lg={4} key={c.id}>
              <Card sx={{ p: 2.5, height: '100%' }}>
                <Stack direction="row" spacing={2} alignItems="center" component={Link} to={`/c/${c.slug}`}>
                  <CategoryIcon icon={c.icon} color={c.color} size={60} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={800} noWrap>{ln(c)}</Typography>
                    <Typography variant="body2" sx={{ color: c.color || 'primary.main', fontWeight: 700 }}>{t('common.businessesCount', { n: c.businessCount ?? 0 })}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} sx={{ mt: 2 }}>
                  {(c.subCategories || []).map((s) => (
                    <Chip key={s.id} size="small" component={Link} to={`/c/${c.slug}?sub=${s.id}`} clickable label={`${ln(s)}${s.businessCount ? ` · ${s.businessCount}` : ''}`} variant="outlined" />
                  ))}
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};
