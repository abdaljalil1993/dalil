import { Box, Button, Card, Chip, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import CampaignRounded from '@mui/icons-material/CampaignRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import ViewCarouselRounded from '@mui/icons-material/ViewCarouselRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ReactNode, useState } from 'react';
import { businessApi, promoApi } from '@/api/services';
import { useNotify } from '@/hooks/useNotify';
import { useT } from '@/i18n';
import { PageHeader } from '@/components/common/Section';
import { ImageDropzone } from '@/components/common/ImageDropzone';
import { fmtDate } from '@/utils/format';

const Plan = ({ icon, title, text, children, gradient }: { icon: ReactNode; title: string; text: string; children: ReactNode; gradient: string }) => (
  <Card sx={{ height: '100%', overflow: 'hidden' }}>
    <Box sx={{ p: 3, color: '#fff', background: gradient }}>
      <Stack direction="row" spacing={1.5} alignItems="center">{icon}<Typography variant="h6" fontWeight={800}>{title}</Typography></Stack>
      <Typography sx={{ mt: 1, opacity: 0.92 }}>{text}</Typography>
    </Box>
    <Box sx={{ p: 3 }}>{children}</Box>
  </Card>
);

export const Promote = () => {
  const { t } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const { data: mine } = useQuery({ queryKey: ['businesses', 'mine'], queryFn: () => businessApi.mine({ limit: 50 }) });
  const { data: myFeatured } = useQuery({ queryKey: ['promo', 'featured', 'mine'], queryFn: promoApi.myFeatured });
  const { data: myAds } = useQuery({ queryKey: ['promo', 'ads', 'mine'], queryFn: promoApi.myAds });
  const approved = (mine?.items || []).filter((b) => b.status === 'approved');
  const today = dayjs().format('YYYY-MM-DD');
  const [fe, setFe] = useState({ businessId: '', startDate: today, endDate: dayjs().add(30, 'day').format('YYYY-MM-DD'), note: '' });
  const [ad, setAd] = useState({ businessId: '', title: '', description: '', placement: 'home_slider', startDate: today, endDate: dayjs().add(30, 'day').format('YYYY-MM-DD'), contactPhone: '' });
  const [file, setFile] = useState<File | null>(null);
  const reqF = useMutation({ mutationFn: () => promoApi.requestFeatured(fe), onSuccess: () => { notify.success(t('owner.requestSent')); qc.invalidateQueries({ queryKey: ['promo'] }); }, onError: notify.error });
  const reqA = useMutation({ mutationFn: () => promoApi.requestAd({ ...ad, businessId: ad.businessId || undefined }, file), onSuccess: () => { notify.success(t('owner.requestSent')); setFile(null); qc.invalidateQueries({ queryKey: ['promo'] }); }, onError: notify.error });
  const bizSelect = (value: string, onChange: (v: string) => void, required = true) => (
    <TextField select fullWidth label={t('owner.pickBusiness')} value={value} onChange={(e) => onChange(e.target.value)} required={required}>
      {!required && <MenuItem value="">—</MenuItem>}
      {approved.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
    </TextField>
  );
  const statusColor = (s: string) => (s === 'active' ? 'success' : s === 'pending' ? 'warning' : s === 'rejected' ? 'error' : 'default');
  return (
    <Box>
      <PageHeader icon={<CampaignRounded />} title={t('owner.promoteTitle')} subtitle={t('owner.promoteText')} />
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Plan icon={<BoltRounded />} title={t('owner.featuredPlan')} text={t('owner.featuredPlanText')} gradient="linear-gradient(135deg,#FF6A3D,#F79009)">
            <Stack spacing={2}>
              {bizSelect(fe.businessId, (v) => setFe({ ...fe, businessId: v }))}
              <Stack direction="row" spacing={1.5}>
                <TextField fullWidth type="date" label={t('admin.startDate')} value={fe.startDate} onChange={(e) => setFe({ ...fe, startDate: e.target.value })} InputLabelProps={{ shrink: true }} />
                <TextField fullWidth type="date" label={t('admin.endDate')} value={fe.endDate} onChange={(e) => setFe({ ...fe, endDate: e.target.value })} InputLabelProps={{ shrink: true }} />
              </Stack>
              <TextField multiline minRows={2} label={t('common.note')} value={fe.note} onChange={(e) => setFe({ ...fe, note: e.target.value })} />
              <Button variant="contained" disabled={!fe.businessId || reqF.isPending} onClick={() => reqF.mutate()}>{t('common.send')}</Button>
            </Stack>
          </Plan>
        </Grid>
        <Grid item xs={12} md={6}>
          <Plan icon={<ViewCarouselRounded />} title={t('owner.adPlan')} text={t('owner.adPlanText')} gradient="linear-gradient(135deg,#5B3DF5,#EC4899)">
            <Stack spacing={2}>
              {bizSelect(ad.businessId, (v) => setAd({ ...ad, businessId: v }), false)}
              <TextField label={t('admin.title')} value={ad.title} onChange={(e) => setAd({ ...ad, title: e.target.value })} required />
              <TextField label={t('common.description')} value={ad.description} onChange={(e) => setAd({ ...ad, description: e.target.value })} />
              <TextField select label={t('admin.placement')} value={ad.placement} onChange={(e) => setAd({ ...ad, placement: e.target.value })}>
                {['home_slider', 'homepage_banner', 'category_page', 'search_results'].map((p) => <MenuItem key={p} value={p}>{t(`admin.placements.${p}`)}</MenuItem>)}
              </TextField>
              <Stack direction="row" spacing={1.5}>
                <TextField fullWidth type="date" label={t('admin.startDate')} value={ad.startDate} onChange={(e) => setAd({ ...ad, startDate: e.target.value })} InputLabelProps={{ shrink: true }} />
                <TextField fullWidth type="date" label={t('admin.endDate')} value={ad.endDate} onChange={(e) => setAd({ ...ad, endDate: e.target.value })} InputLabelProps={{ shrink: true }} />
              </Stack>
              <TextField label={t('common.phone')} value={ad.contactPhone} onChange={(e) => setAd({ ...ad, contactPhone: e.target.value })} inputProps={{ dir: 'ltr' }} />
              <ImageDropzone multiple={false} height={90} onFiles={(f) => setFile(f[0])} hint={file ? file.name : t('common.image')} />
              <Button variant="contained" disabled={!ad.title || reqA.isPending} onClick={() => reqA.mutate()}>{t('common.send')}</Button>
            </Stack>
          </Plan>
        </Grid>
      </Grid>
      <Card sx={{ p: 3, mt: 2.5 }}>
        <Typography variant="h6" fontWeight={800} gutterBottom>{t('owner.myRequests')}</Typography>
        {[...(myFeatured || []).map((x) => ({ k: `f${x.id}`, type: t('owner.featuredPlan'), name: x.business?.name || '', status: x.status, dates: `${fmtDate(x.startDate)} → ${fmtDate(x.endDate)}` })),
          ...(myAds || []).map((x) => ({ k: `a${x.id}`, type: t('owner.adPlan'), name: x.title, status: x.status, dates: `${fmtDate(x.startDate)} → ${fmtDate(x.endDate)}` }))].map((r) => (
          <Stack key={r.k} direction="row" alignItems="center" spacing={2} sx={{ py: 1.25, borderBottom: (th) => `1px solid ${th.custom.border}` }}>
            <Chip size="small" label={r.type} variant="outlined" />
            <Typography fontWeight={600} sx={{ flex: 1 }} noWrap>{r.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{r.dates}</Typography>
            <Chip size="small" label={t(`admin.adStatus.${r.status}`)} color={statusColor(r.status)} />
          </Stack>
        ))}
        {!myFeatured?.length && !myAds?.length && <Typography color="text.secondary">—</Typography>}
      </Card>
    </Box>
  );
};
