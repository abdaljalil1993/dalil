import { Box, Container, Grid, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useBusinessInfinite } from '@/hooks/queries';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { usePrefs } from '@/store/prefsStore';
import { promoApi } from '@/api/services';
import { useT } from '@/i18n';
import { SearchBar } from '@/components/common/SearchBar';
import { useFiltersUI } from '@/components/business/FiltersBar';
import { ResultsView } from '@/components/business/ResultsView';
import { AdSlider } from '@/components/common/AdSlider';

/** Authenticated full-text + filters + geo search. */
export const SearchPage = () => {
  const { t } = useT();
  const defaultCity = usePrefs((s) => s.cityId);
  const defaults = useMemo(() => ({}), []);
  const [filters, setFilters] = useUrlFilters(defaults);
  const effective = { ...filters, cityId: filters.cityId ?? defaultCity ?? undefined };
  const list = useBusinessInfinite('search', effective);
  const items = list.data?.pages.flatMap((p) => p.items) || [];
  const total = list.data?.pages[0]?.meta.total;
  const ui = useFiltersUI({ filters: effective, onChange: setFilters, total });
  const { data: ads } = useQuery({ queryKey: ['ads', 'search', effective.cityId], queryFn: () => promoApi.activeAds({ placement: 'search_results', cityId: effective.cityId }) });

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box sx={{ mb: 3 }}>
        <SearchBar key={filters.q} initialQuery={filters.q} size="medium" onSearch={(q, cityId) => setFilters({ ...filters, q: q || undefined, cityId: cityId ?? undefined })} />
      </Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>{filters.q ? t('search.resultsFor', { q: filters.q }) : t('search.allResults')}</Typography>
      {!!ads?.length && <Box sx={{ mb: 3 }}><AdSlider ads={ads} height={140} /></Box>}
      <Grid container spacing={3}>
        {ui.panel && <Grid item md={3}><Box sx={{ position: 'sticky', top: 96 }}>{ui.panel}</Box></Grid>}
        <Grid item xs={12} md={ui.panel ? 9 : 12}>
          {ui.toolbar}
          <ResultsView items={items} loading={list.isLoading} hasNext={list.hasNextPage} fetchNext={() => list.fetchNextPage()} fetchingNext={list.isFetchingNextPage} />
        </Grid>
      </Grid>
    </Container>
  );
};
