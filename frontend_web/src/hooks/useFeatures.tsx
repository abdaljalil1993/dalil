import { useQuery } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Card, Container } from '@mui/material';
import BlockRounded from '@mui/icons-material/BlockRounded';
import { featuresApi } from '@/api/services';
import type { FeatureKey } from '@/api/types';
import { usePrefs } from '@/store/prefsStore';
import { useT } from '@/i18n';
import { EmptyState } from '@/components/common/Section';

/** Admin feature switches resolved for the visitor's governorate. Unknown/loading → treated as ON. */
export const useFeatures = () => {
  const cityId = usePrefs((s) => s.cityId);
  const { data, isLoading } = useQuery({ queryKey: ['features', cityId ?? 0], queryFn: () => featuresApi.get(cityId), staleTime: 60_000 });
  const on = (k: FeatureKey) => (data ? data.enabled[k] !== false : true);
  return { on, loading: isLoading, data };
};

/** Route guard: shows a friendly "not available in your area" page when the service is switched off. */
export const FeatureGate = ({ k, children }: { k: FeatureKey; children: ReactNode }) => {
  const { t } = useT();
  const { on, loading } = useFeatures();
  if (loading || on(k)) return <>{children}</>;
  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Card><EmptyState icon={<BlockRounded />} title={t('x.featureOff')} text={t('x.featureOffText')} action={<Box><Button variant="contained" component={Link} to="/">{t('nav.home')}</Button></Box>} /></Card>
    </Container>
  );
};
