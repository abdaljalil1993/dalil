import { Box, Typography } from '@mui/material';
import LocalOfferRounded from '@mui/icons-material/LocalOfferRounded';
import LocalPharmacyRounded from '@mui/icons-material/LocalPharmacyRounded';
import ContactEmergencyRounded from '@mui/icons-material/ContactEmergencyRounded';
import HomeWorkRounded from '@mui/icons-material/HomeWorkRounded';
import DirectionsCarRounded from '@mui/icons-material/DirectionsCarRounded';
import WorkRounded from '@mui/icons-material/WorkRounded';
import HandymanRounded from '@mui/icons-material/HandymanRounded';
import CleaningServicesRounded from '@mui/icons-material/CleaningServicesRounded';
import CelebrationRounded from '@mui/icons-material/CelebrationRounded';
import { motion } from 'framer-motion';
import { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '@/i18n';
import { useFeatures } from '@/hooks/useFeatures';
import type { FeatureKey } from '@/api/types';

type Tile = { to: string; label: string; icon: ReactElement; from: string; to2: string; badge?: string; f?: FeatureKey };

export const useServiceTiles = (counts?: { onDuty?: number; offers?: number }): Tile[] => {
  const { t } = useT();
  const { on } = useFeatures();
  const all: Tile[] = [
    { to: '/offers', label: t('x.offers'), icon: <LocalOfferRounded />, from: '#FF6A3D', to2: '#EC4899', badge: counts?.offers ? String(counts.offers) : undefined, f: 'offers' },
    { to: '/pharmacies', label: t('x.pharmacies'), icon: <LocalPharmacyRounded />, from: '#10B981', to2: '#059669', badge: counts?.onDuty ? String(counts.onDuty) : undefined, f: 'pharmacies' },
    { to: '/emergency', label: t('x.emergency'), icon: <ContactEmergencyRounded />, from: '#F04438', to2: '#B42318', f: 'emergency' },
    { to: '/request-service', label: t('x.requestService'), icon: <HandymanRounded />, from: '#5B3DF5', to2: '#8B5CF6', f: 'serviceRequests' },
    { to: '/real-estate', label: t('x.realEstate'), icon: <HomeWorkRounded />, from: '#0BA5EC', to2: '#2E90FA', f: 'realEstate' },
    { to: '/cars', label: t('x.cars'), icon: <DirectionsCarRounded />, from: '#475467', to2: '#1D2939', f: 'cars' },
    { to: '/jobs', label: t('x.jobs'), icon: <WorkRounded />, from: '#F79009', to2: '#DC6803', f: 'jobs' },
    { to: '/c/cleaning-home-services', label: t('x.cleaning'), icon: <CleaningServicesRounded />, from: '#06AED4', to2: '#0E9384' },
    { to: '/c/events-weddings', label: t('x.events'), icon: <CelebrationRounded />, from: '#D444F1', to2: '#9E77ED' },
  ];
  return all.filter((x) => !x.f || on(x.f));
};

export const QuickServices = ({ counts }: { counts?: { onDuty?: number; offers?: number } }) => {
  const tiles = useServiceTiles(counts);
  return (
    <Box className="no-scrollbar" sx={{ display: 'grid', gridAutoFlow: { xs: 'column', md: 'row' }, gridAutoColumns: { xs: '112px' }, gridTemplateColumns: { md: `repeat(${Math.max(tiles.length, 4)}, 1fr)` }, gap: 1.5, overflowX: 'auto', pb: 1 }}>
      {tiles.map((s, i) => (
        <Box key={s.to} component={motion.div} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
          <Box component={Link} to={s.to} sx={{
            position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, height: 118, borderRadius: 4, color: '#fff', textAlign: 'center', px: 1,
            background: `linear-gradient(135deg, ${s.from}, ${s.to2})`, boxShadow: `0 10px 24px -12px ${s.from}`, transition: 'transform .2s, box-shadow .2s',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 18px 30px -14px ${s.from}` }, '& svg': { fontSize: 34 },
          }}>
            {s.badge && <Box sx={{ position: 'absolute', top: 8, insetInlineEnd: 8, minWidth: 22, height: 22, px: 0.75, borderRadius: 11, bgcolor: '#fff', color: s.from, fontSize: 12, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{s.badge}</Box>}
            {s.icon}
            <Typography variant="body2" fontWeight={800} lineHeight={1.2}>{s.label}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};
