import { Box, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useBusinessInfinite, useCategory } from '@/hooks/queries';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { usePrefs } from '@/store/prefsStore';
import { useQuery } from '@tanstack/react-query';
import { promoApi } from '@/api/services';
import { useLocalName, useT } from '@/i18n';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { useFiltersUI } from '@/components/business/FiltersBar';
import { ResultsView } from '@/components/business/ResultsView';
import { AdSlider } from '@/components/common/AdSlider';
import { alpha } from '@mui/material/styles';

/** Public browsing of a category (no text search → guests allowed). */
export const CategoryPage = () => {
  const { slug = '' } = useParams();
  const { t } = useT();
  const ln = useLocalName();
  const { data: category } = useCategory(slug);
  const defaultCity = usePrefs((s) => s.cityId);
  const defaults = useMemo(() => ({ cityId: defaultCity ?? undefined }), [defaultCity]);
  const [filters, setFilters] = useUrlFilters(defaults);
  const effective = { ...filters, categoryId: category?.id };
  const list = useBusinessInfinite('browse', effective, Boolean(category));
  const items = list.data?.pages.flatMap((p) => p.items) || [];
  const total = list.data?.pages[0]?.meta.total;
  const { data: ads } = useQuery({ queryKey: ['ads', 'category', category?.id, filters.cityId], queryFn: () => promoApi.activeAds({ placement: 'category_page', categoryId: category?.id, cityId: filters.cityId }), enabled: Boolean(category) });
  const ui = useFiltersUI({ filters: effective, onChange: setFilters, total, fixedCategory: category, allowText: true });
  const color = category?.color || '#5B3DF5';

  return (
    <Box>
      <Box sx={{ background: `linear-gradient(135deg, ${alpha(color, 0.16)} 0%, ${alpha('#EC4899', 0.08)} 100%)`, borderBottom: (th) => `1px solid ${th.custom.border}`, py: { xs: 3, md: 5 }, mt: -2 }}>
        <Container maxWidth="xl">
          <Stack direction="row" spacing={2} alignItems="center">
            <CategoryIcon icon={category?.icon} color={color} size={72} variant="solid" />
            <Box>
              <Typography variant="h4" fontWeight={800}>{ln(category)}</Typography>
              {category?.description && <Typography color="text.secondary">{category.description}</Typography>}
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 3, overflowX: 'auto', pb: 0.5 }} className="no-scrollbar">
            <Chip label={t('common.all')} onClick={() => setFilters({ ...filters, subCategoryId: undefined })} color={!filters.subCategoryId ? 'primary' : 'default'} sx={{ flexShrink: 0 }} />
            {(category?.subCategories || []).map((s) => (
              <Chip key={s.id} label={ln(s)} onClick={() => setFilters({ ...filters, subCategoryId: s.id })} color={filters.subCategoryId === s.id ? 'primary' : 'default'} variant={filters.subCategoryId === s.id ? 'filled' : 'outlined'} sx={{ flexShrink: 0, bgcolor: filters.subCategoryId === s.id ? undefined : 'background.paper' }} />
            ))}
          </Stack>
        </Container>
      </Box>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {!!ads?.length && <Box sx={{ mb: 3 }}><AdSlider ads={ads} height={150} /></Box>}
        <Grid container spacing={3}>
          {ui.panel && <Grid item md={3}><Box sx={{ position: 'sticky', top: 96 }}>{ui.panel}</Box></Grid>}
          <Grid item xs={12} md={ui.panel ? 9 : 12}>
            {ui.toolbar}
            <ResultsView items={items} loading={list.isLoading || !category} hasNext={list.hasNextPage} fetchNext={() => list.fetchNextPage()} fetchingNext={list.isFetchingNextPage} md={4} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
