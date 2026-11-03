import { Box, Card, CardActionArea, Chip, Stack, Typography } from '@mui/material';
import LocalOfferRounded from '@mui/icons-material/LocalOfferRounded';
import PlaceRounded from '@mui/icons-material/PlaceRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import ApartmentRounded from '@mui/icons-material/ApartmentRounded';
import DirectionsCarRounded from '@mui/icons-material/DirectionsCarRounded';
import WorkRounded from '@mui/icons-material/WorkRounded';
import CategoryRounded from '@mui/icons-material/CategoryRounded';
import { Link } from 'react-router-dom';
import type { ReactElement } from 'react';
import type { Listing, ListingType, Offer } from '@/api/types';
import { useLocalName, useT } from '@/i18n';
import { Cover } from '../common/Cover';
import { fmtDate, formatPrice, fromNow } from '@/utils/format';

export const LISTING_META: Record<ListingType, { icon: ReactElement; color: string; path: string; key: 'realEstate' | 'cars' | 'jobs' | 'other' }> = {
  real_estate: { icon: <ApartmentRounded />, color: '#0EA5E9', path: '/real-estate', key: 'realEstate' },
  car: { icon: <DirectionsCarRounded />, color: '#F97316', path: '/cars', key: 'cars' },
  job: { icon: <WorkRounded />, color: '#12B76A', path: '/jobs', key: 'jobs' },
  other: { icon: <CategoryRounded />, color: '#64748B', path: '/listings', key: 'other' },
};

export const OfferCard = ({ offer: o }: { offer: Offer }) => {
  const { t, locale } = useT();
  const ln = useLocalName();
  const color = o.business?.category?.color || '#FF6A3D';
  return (
    <Card sx={{ height: '100%', overflow: 'hidden', transition: 'all .25s', '&:hover': { transform: 'translateY(-3px)', boxShadow: (th) => th.custom.cardShadowHover } }}>
      <CardActionArea component={Link} to={o.business ? `/b/${o.business.slug}` : '#'} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <Box sx={{ position: 'relative', aspectRatio: '16/9' }}>
          <Cover src={o.image || o.business?.coverImage} tint={color} icon={o.business?.category?.icon} />
          {(o.discountPercent || o.oldPrice) && (
            <Box sx={{ position: 'absolute', top: 12, insetInlineStart: 12, px: 1.25, py: 0.5, borderRadius: 2, background: (th) => th.custom.warmGradient, color: '#fff', fontWeight: 800 }}>
              {o.discountPercent ? t('x.off', { n: o.discountPercent }) : <LocalOfferRounded fontSize="small" />}
            </Box>
          )}
        </Box>
        <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography fontWeight={800} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{o.title}</Typography>
          {o.business && <Typography variant="body2" color="primary" fontWeight={600} noWrap>{ln(o.business)} · {ln(o.business.city)}</Typography>}
          {o.price && (
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography fontWeight={800} color="secondary.main">{formatPrice(o.price, o.currency, locale)}</Typography>
              {o.oldPrice && <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{formatPrice(o.oldPrice, o.currency, locale)}</Typography>}
            </Stack>
          )}
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">{t('x.validUntil', { date: fmtDate(o.endDate, 'D MMM') })}</Typography>
            {o.couponCode && <Chip size="small" label={o.couponCode} variant="outlined" color="secondary" sx={{ fontFamily: 'monospace' }} />}
          </Stack>
        </Box>
      </CardActionArea>
    </Card>
  );
};

/** One-line summary of the most useful attributes per listing type */
export const useListingSummary = () => {
  const { t } = useT();
  const opt = (v: unknown) => (typeof v === 'string' ? t(`x.options.${v}`) : String(v));
  return (l: Listing) => {
    const a = l.attributes || {};
    if (l.type === 'real_estate') return [a.propertyType && opt(a.propertyType), a.rooms && `${a.rooms} ${t('x.fields.rooms')}`, a.area && `${a.area} م²`, a.furnished && t('x.fields.furnished')].filter(Boolean).join(' · ');
    if (l.type === 'car') return [a.make, a.model, a.year, a.mileageKm && `${Number(a.mileageKm).toLocaleString()} km`, a.transmission && opt(a.transmission)].filter(Boolean).join(' · ');
    if (l.type === 'job') return [a.jobType && opt(a.jobType), a.field, a.experienceYears && `${a.experienceYears}+ ${t('x.fields.experienceYears')}`].filter(Boolean).join(' · ');
    return a.condition ? opt(a.condition) : '';
  };
};

export const ListingPrice = ({ l }: { l: Listing }) => {
  const { t, locale } = useT();
  if (l.price == null) return <Typography fontWeight={800} color="text.secondary">{t('x.priceOnRequest')}</Typography>;
  return (
    <Typography fontWeight={800} color="primary.main">
      {formatPrice(l.price, l.currency, locale)}
      {l.pricePeriod && <Typography component="span" variant="body2" color="text.secondary"> {t(`x.periods.${l.pricePeriod}`)}</Typography>}
    </Typography>
  );
};

export const ListingCard = ({ listing: l }: { listing: Listing }) => {
  const { t } = useT();
  const ln = useLocalName();
  const summary = useListingSummary();
  const meta = LISTING_META[l.type];
  return (
    <Card sx={{ height: '100%', overflow: 'hidden', transition: 'all .25s', '&:hover': { transform: 'translateY(-3px)', boxShadow: (th) => th.custom.cardShadowHover } }}>
      <CardActionArea component={Link} to={`/l/${l.slug}`} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <Box sx={{ position: 'relative', aspectRatio: '16/10' }}>
          {l.images?.[0] ? <Cover src={l.images[0].url} /> : <Box sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', bgcolor: `${meta.color}18`, color: meta.color, '& svg': { fontSize: 56 } }}>{meta.icon}</Box>}
          <Stack direction="row" spacing={0.75} sx={{ position: 'absolute', top: 10, insetInlineStart: 10 }}>
            <Chip size="small" label={t(`x.purposes.${l.purpose}`)} sx={{ bgcolor: meta.color, color: '#fff', fontWeight: 700 }} />
            {l.isFeatured && <Chip size="small" icon={<BoltRounded sx={{ color: '#fff !important' }} />} label={t('business.featured')} sx={{ background: (th) => th.custom.warmGradient, color: '#fff' }} />}
          </Stack>
          {l.images?.length > 1 && <Chip size="small" label={`📷 ${l.images.length}`} sx={{ position: 'absolute', bottom: 10, insetInlineEnd: 10, bgcolor: 'rgba(0,0,0,.6)', color: '#fff' }} />}
        </Box>
        <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <ListingPrice l={l} />
          <Typography fontWeight={700} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.title}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>{summary(l)}</Typography>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 0.5 }}>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary', minWidth: 0 }}>
              <PlaceRounded sx={{ fontSize: 16 }} />
              <Typography variant="caption" noWrap>{[l.district, ln(l.city)].filter(Boolean).join('، ')}</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">{fromNow(l.createdAt)}</Typography>
          </Stack>
        </Box>
      </CardActionArea>
    </Card>
  );
};
