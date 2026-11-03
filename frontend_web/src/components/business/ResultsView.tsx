import { Box, Button, CircularProgress } from '@mui/material';
import SearchOffRounded from '@mui/icons-material/SearchOffRounded';
import { useEffect, useRef } from 'react';
import type { Business } from '@/api/types';
import { usePrefs } from '@/store/prefsStore';
import { useT } from '@/i18n';
import { BusinessGrid } from './BusinessGrid';
import { BusinessesMap } from '../maps/MapView';
import { GridSkeleton } from '../common/Skeletons';
import { EmptyState } from '../common/Section';

/** Grid / list / map with infinite scroll. */
export const ResultsView = ({ items, loading, hasNext, fetchNext, fetchingNext, md = 4 }: { items: Business[]; loading: boolean; hasNext?: boolean; fetchNext: () => void; fetchingNext: boolean; md?: number }) => {
  const { t } = useT();
  const view = usePrefs((s) => s.view);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNext || view === 'map') return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && !fetchingNext && fetchNext(), { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNext, fetchNext, fetchingNext, view]);

  if (loading) return <GridSkeleton count={6} md={md} />;
  if (!items.length) return <EmptyState icon={<SearchOffRounded />} title={t('search.emptyTitle')} text={t('search.emptyText')} />;
  return (
    <Box>
      {view === 'map' ? <BusinessesMap businesses={items} height="70vh" /> : <BusinessGrid items={items} view={view} md={md} />}
      <Box ref={sentinel} sx={{ display: 'grid', placeItems: 'center', py: 3 }}>
        {fetchingNext && <CircularProgress size={28} />}
        {hasNext && !fetchingNext && view === 'map' && <Button onClick={fetchNext}>{t('search.loadMore')}</Button>}
      </Box>
    </Box>
  );
};
