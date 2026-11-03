import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import CampaignRounded from '@mui/icons-material/CampaignRounded';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Advertisement } from '@/api/types';
import { promoApi } from '@/api/services';
import { useT } from '@/i18n';

const GRADS = [
  'linear-gradient(120deg,#5B3DF5 0%,#8B5CF6 50%,#EC4899 100%)',
  'linear-gradient(120deg,#FF6A3D 0%,#F79009 100%)',
  'linear-gradient(120deg,#0BA5EC 0%,#12B76A 100%)',
  'linear-gradient(120deg,#101828 0%,#5B3DF5 100%)',
];

/** Paid banner slider (auto-rotates, tracks impressions & clicks). */
export const AdSlider = ({ ads, height = 200 }: { ads: Advertisement[]; height?: number }) => {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const { t, isRtl } = useT();
  useEffect(() => {
    if (ads.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % ads.length), 6000);
    return () => clearInterval(id);
  }, [ads.length]);
  useEffect(() => { if (ads[i]) promoApi.adImpression(ads[i].id); }, [ads, i]);
  if (!ads.length) return null;
  const ad = ads[i % ads.length];
  const open = () => {
    promoApi.adClick(ad.id);
    const url = ad.targetUrl || (ad.business ? `/b/${ad.business.slug}` : null);
    if (!url) return;
    if (url.startsWith('/')) navigate(url);
    else window.open(url, '_blank', 'noopener');
  };
  const go = (d: number) => setI((x) => (x + d + ads.length) % ads.length);
  return (
    <Box sx={{ position: 'relative', borderRadius: 5, overflow: 'hidden', height: { xs: height * 0.9, md: height }, cursor: 'pointer' }} onClick={open}>
      <AnimatePresence mode="wait">
        <motion.div key={ad.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }} style={{ position: 'absolute', inset: 0 }}>
          <Box sx={{ position: 'absolute', inset: 0, background: GRADS[i % GRADS.length] }} />
          {ad.imageUrl && <Box component="img" src={ad.imageUrl} alt={ad.title} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
          <Box sx={{ position: 'absolute', inset: 0, background: ad.imageUrl ? 'linear-gradient(90deg,rgba(0,0,0,.6),rgba(0,0,0,.05))' : 'none' }} />
          <Box sx={{ position: 'absolute', insetInlineEnd: -40, bottom: -60, width: 260, height: 260, borderRadius: '50%', bgcolor: 'rgba(255,255,255,.12)' }} />
          <Stack justifyContent="center" spacing={1} sx={{ position: 'relative', height: '100%', px: { xs: 3, md: 6 }, color: '#fff', maxWidth: 680 }}>
            <Stack direction="row" spacing={1} alignItems="center"><CampaignRounded fontSize="small" /><Typography variant="caption" fontWeight={700} sx={{ opacity: 0.9 }}>{t('business.featured')}</Typography></Stack>
            <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.35rem', md: '2rem' } }}>{ad.title}</Typography>
            {ad.description && <Typography sx={{ opacity: 0.92 }}>{ad.description}</Typography>}
            {(ad.targetUrl || ad.business) && <Box><Button variant="contained" sx={{ mt: 1, bgcolor: '#fff', color: '#101828', background: '#fff', '&:hover': { background: '#f2f2f7' } }}>{t('common.more')}</Button></Box>}
          </Stack>
        </motion.div>
      </AnimatePresence>
      {ads.length > 1 && (
        <>
          <Stack direction="row" spacing={0.75} sx={{ position: 'absolute', bottom: 14, insetInlineStart: { xs: 24, md: 48 } }}>
            {ads.map((a, k) => <Box key={a.id} onClick={(e) => { e.stopPropagation(); setI(k); }} sx={{ width: k === i ? 22 : 8, height: 8, borderRadius: 4, bgcolor: k === i ? '#fff' : 'rgba(255,255,255,.5)', transition: 'all .3s' }} />)}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ position: 'absolute', bottom: 10, insetInlineEnd: 16 }}>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); go(-1); }} sx={{ bgcolor: 'rgba(255,255,255,.2)', color: '#fff' }}>{isRtl ? <ChevronRightRounded /> : <ChevronLeftRounded />}</IconButton>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); go(1); }} sx={{ bgcolor: 'rgba(255,255,255,.2)', color: '#fff' }}>{isRtl ? <ChevronLeftRounded /> : <ChevronRightRounded />}</IconButton>
          </Stack>
        </>
      )}
    </Box>
  );
};
