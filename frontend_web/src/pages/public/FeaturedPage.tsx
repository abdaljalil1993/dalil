import { Container } from '@mui/material';
import BoltRounded from '@mui/icons-material/BoltRounded';
import { useQuery } from '@tanstack/react-query';
import { promoApi } from '@/api/services';
import { usePrefs } from '@/store/prefsStore';
import { useT } from '@/i18n';
import { PageHeader, EmptyState } from '@/components/common/Section';
import { BusinessGrid } from '@/components/business/BusinessGrid';
import { GridSkeleton } from '@/components/common/Skeletons';

export const FeaturedPage = () => {
  const { t } = useT();
  const cityId = usePrefs((s) => s.cityId);
  const { data, isLoading } = useQuery({ queryKey: ['featured', cityId], queryFn: () => promoApi.activeFeatured({ cityId }) });
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader icon={<BoltRounded />} title={t('home.featured')} subtitle={t('home.featuredSub')} />
      {isLoading ? <GridSkeleton /> : data?.length ? <BusinessGrid items={data} /> : <EmptyState icon={<BoltRounded />} title={t('common.noResults')} />}
    </Container>
  );
};
