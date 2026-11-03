import { Box, Button, Card, Chip, Container, Grid, MenuItem, Pagination, Stack, TextField, Typography } from '@mui/material';
import LocalOfferRounded from '@mui/icons-material/LocalOfferRounded';
import LocalPharmacyRounded from '@mui/icons-material/LocalPharmacyRounded';
import EmergencyRounded from '@mui/icons-material/ContactEmergencyRounded';
import CallRounded from '@mui/icons-material/CallRounded';
import LocalHospitalRounded from '@mui/icons-material/LocalHospitalRounded';
import LocalFireDepartmentRounded from '@mui/icons-material/LocalFireDepartmentRounded';
import LocalPoliceRounded from '@mui/icons-material/LocalPoliceRounded';
import TrafficRounded from '@mui/icons-material/TrafficRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import WaterDropRounded from '@mui/icons-material/WaterDropRounded';
import PropaneTankRounded from '@mui/icons-material/PropaneTankRounded';
import PhoneInTalkRounded from '@mui/icons-material/PhoneInTalkRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import { useQuery } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { extrasApi } from '@/api/services';
import { useCategories, useCities } from '@/hooks/queries';
import { usePrefs } from '@/store/prefsStore';
import { useLocalName, useT } from '@/i18n';
import { EmptyState, PageHeader } from '@/components/common/Section';
import { GridSkeleton } from '@/components/common/Skeletons';
import { OfferCard } from '@/components/business/ExtraCards';
import { BusinessCard } from '@/components/business/BusinessCard';
import { isoDay, telLink, fmtDate } from '@/utils/format';

const CitySelect = () => {
  const { t } = useT();
  const ln = useLocalName();
  const { cityId, setCityId } = usePrefs();
  const { data: cities } = useCities();
  return (
    <TextField select size="small" value={cityId ?? ''} onChange={(e) => setCityId(e.target.value === '' ? null : Number(e.target.value))} sx={{ minWidth: 180 }} SelectProps={{ displayEmpty: true }}>
      <MenuItem value="">{t('common.allCities')}</MenuItem>
      {(cities || []).map((c) => <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>)}
    </TextField>
  );
};

export const OffersPage = () => {
  const { t } = useT();
  const ln = useLocalName();
  const cityId = usePrefs((s) => s.cityId);
  const { data: cats } = useCategories();
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['offers', cityId, categoryId, page], queryFn: () => extrasApi.offersFeed({ cityId, categoryId, page, limit: 12 }) });
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader icon={<LocalOfferRounded />} title={t('x.offers')} subtitle={t('x.offersSub')} actions={<CitySelect />} />
      <Stack direction="row" spacing={1} sx={{ mb: 3, overflowX: 'auto', pb: 0.5 }} className="no-scrollbar">
        <Chip label={t('common.all')} color={!categoryId ? 'primary' : 'default'} onClick={() => setCategoryId(undefined)} sx={{ flexShrink: 0 }} />
        {(cats || []).map((c) => <Chip key={c.id} label={ln(c)} color={categoryId === c.id ? 'primary' : 'default'} variant={categoryId === c.id ? 'filled' : 'outlined'} onClick={() => { setCategoryId(c.id); setPage(1); }} sx={{ flexShrink: 0 }} />)}
      </Stack>
      {isLoading ? <GridSkeleton /> : !data?.items.length ? <Card><EmptyState icon={<LocalOfferRounded />} title={t('x.noOffers')} /></Card> : (
        <>
          <Grid container spacing={2.5}>{data.items.map((o) => <Grid item xs={12} sm={6} md={4} lg={3} key={o.id}><OfferCard offer={o} /></Grid>)}</Grid>
          {data.meta.totalPages > 1 && <Pagination sx={{ mt: 3, display: 'flex', justifyContent: 'center' }} count={data.meta.totalPages} page={page} onChange={(_, p) => setPage(p)} />}
        </>
      )}
    </Container>
  );
};

export const PharmaciesPage = () => {
  const { t } = useT();
  const cityId = usePrefs((s) => s.cityId);
  const [offset, setOffset] = useState(0);
  const date = isoDay(offset);
  const { data, isLoading } = useQuery({ queryKey: ['duty', cityId, date], queryFn: () => extrasApi.onDuty({ cityId, date }) });
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader icon={<LocalPharmacyRounded />} title={t('x.pharmacies')} subtitle={t('x.pharmaciesSub')} actions={<CitySelect />} />
      <Stack direction="row" spacing={1} sx={{ mb: 3, overflowX: 'auto' }} className="no-scrollbar">
        {Array.from({ length: 7 }).map((_, i) => (
          <Chip key={i} label={i === 0 ? t('x.today') : i === 1 ? t('x.tomorrow') : fmtDate(isoDay(i), 'ddd D/M')} color={offset === i ? 'success' : 'default'} variant={offset === i ? 'filled' : 'outlined'} onClick={() => setOffset(i)} sx={{ flexShrink: 0 }} />
        ))}
      </Stack>
      {isLoading ? <GridSkeleton /> : !data?.items.length ? <Card><EmptyState icon={<LocalPharmacyRounded />} title={t('x.noDuty')} /></Card> : (
        <Grid container spacing={2.5}>
          {data.items.map((d) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={d.id}>
              <Box sx={{ position: 'relative', height: '100%' }}>
                <BusinessCard business={d.business} />
                {(d.startTime || d.note) && (
                  <Chip icon={<AccessTimeRounded />} color="success" size="small" label={[d.startTime && `${d.startTime} – ${d.endTime}`, d.note].filter(Boolean).join(' · ')} sx={{ position: 'absolute', top: 12, insetInlineStart: 12, zIndex: 2, fontWeight: 700 }} />
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

const EMERGENCY_ICON: Record<string, { icon: ReactNode; color: string }> = {
  ambulance: { icon: <LocalHospitalRounded />, color: '#F04438' },
  fire: { icon: <LocalFireDepartmentRounded />, color: '#F97316' },
  police: { icon: <LocalPoliceRounded />, color: '#2563EB' },
  traffic: { icon: <TrafficRounded />, color: '#F59E0B' },
  electricity: { icon: <BoltRounded />, color: '#EAB308' },
  water: { icon: <WaterDropRounded />, color: '#0EA5E9' },
  gas: { icon: <PropaneTankRounded />, color: '#64748B' },
  hospital: { icon: <LocalHospitalRounded />, color: '#E11D48' },
  other: { icon: <PhoneInTalkRounded />, color: '#5B3DF5' },
};

export const EmergencyPage = () => {
  const { t } = useT();
  const ln = useLocalName();
  const cityId = usePrefs((s) => s.cityId);
  const { data, isLoading } = useQuery({ queryKey: ['emergency', cityId], queryFn: () => extrasApi.emergency(cityId) });
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <PageHeader icon={<EmergencyRounded />} title={t('x.emergency')} subtitle={t('x.emergencySub')} actions={<CitySelect />} />
      {isLoading ? <GridSkeleton count={6} md={4} /> : (
        <Grid container spacing={2}>
          {(data || []).map((e) => {
            const m = EMERGENCY_ICON[e.type] || EMERGENCY_ICON.other;
            return (
              <Grid item xs={12} sm={6} md={4} key={e.id}>
                <Card component="a" href={telLink(e.phone)} sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%', transition: 'all .2s', '&:hover': { borderColor: m.color, transform: 'translateY(-2px)' } }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: '30%', display: 'grid', placeItems: 'center', bgcolor: `${m.color}1a`, color: m.color, flexShrink: 0, '& svg': { fontSize: 30 } }}>{m.icon}</Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={800} noWrap>{ln(e)}</Typography>
                    <Typography variant="caption" color="text.secondary">{e.cityId ? t('x.inCity', { city: ln(e.city) }) : t('x.nationwide')}{e.note ? ` · ${e.note}` : ''}</Typography>
                  </Box>
                  <Stack alignItems="flex-end">
                    <Typography variant="h5" fontWeight={800} sx={{ color: m.color, direction: 'ltr' }}>{e.phone}</Typography>
                    <Button size="small" startIcon={<CallRounded />} sx={{ color: m.color, minHeight: 24, p: 0 }}>{t('business.call')}</Button>
                  </Stack>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};
