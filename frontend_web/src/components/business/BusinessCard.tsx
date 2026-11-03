import { Box, Card, CardActionArea, Chip, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import PlaceRounded from '@mui/icons-material/PlaceRounded';
import VerifiedRounded from '@mui/icons-material/VerifiedRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import NearMeRounded from '@mui/icons-material/NearMeRounded';
import { Link } from 'react-router-dom';
import type { Business } from '@/api/types';
import { useLocalName, useT } from '@/i18n';
import { Cover } from '../common/Cover';
import { RatingPill } from '../common/RatingStars';
import { OpenBadge } from '../common/OpenBadge';
import { FavoriteButton } from '../common/FavoriteButton';
import { CategoryIcon } from '../common/CategoryIcon';
import { priceLabel } from '@/utils/format';

export const BusinessCard = ({ business: b }: { business: Business }) => {
  const { t } = useT();
  const ln = useLocalName();
  return (
    <Card sx={{ height: '100%', overflow: 'hidden', transition: 'transform .25s, box-shadow .25s', '&:hover': { transform: 'translateY(-4px)', boxShadow: (th) => th.custom.cardShadowHover } }}>
      <CardActionArea component={Link} to={`/b/${b.slug}`} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <Box sx={{ position: 'relative', aspectRatio: '16 / 10', overflow: 'hidden' }}>
          <Cover src={b.coverImage} tint={b.category?.color} icon={b.category?.icon} alt={b.name} />
          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.0) 45%, rgba(0,0,0,.55) 100%)' }} />
          <Stack direction="row" spacing={0.75} sx={{ position: 'absolute', top: 12, insetInlineStart: 12 }}>
            {b.isFeatured && <Chip size="small" icon={<BoltRounded sx={{ color: '#fff !important' }} />} label={t('business.featured')} sx={{ background: (th) => th.custom.warmGradient, color: '#fff', height: 26 }} />}
          </Stack>
          <Box sx={{ position: 'absolute', top: 10, insetInlineEnd: 10 }}>
            <FavoriteButton businessId={b.id} initial={b.isFavorite} />
          </Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ position: 'absolute', bottom: 10, insetInlineStart: 12, insetInlineEnd: 12, color: '#fff' }}>
            {b.logoImage ? (
              <Box sx={{ width: 36, height: 36, borderRadius: 2, overflow: 'hidden', border: '2px solid #fff', bgcolor: '#fff' }}><Cover src={b.logoImage} tint={b.category?.color} icon={b.category?.icon} sx={{ '& svg': { fontSize: 18 } }} /></Box>
            ) : (
              <CategoryIcon icon={b.category?.icon} color={b.category?.color} size={34} variant="solid" sx={{ border: '2px solid #fff' }} />
            )}
            <Box sx={{ flex: 1 }} />
            <RatingPill value={b.averageRating} />
          </Stack>
        </Box>
        <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ flex: 1, minWidth: 0 }}>
              {ln(b)}
            </Typography>
            {b.isVerified && <VerifiedRounded sx={{ fontSize: 18, color: 'info.main' }} />}
          </Stack>
          <Typography variant="body2" color="primary" fontWeight={600} noWrap>
            {ln(b.subCategory) || ln(b.category)}
            {b.priceRange ? <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}> · {priceLabel(b.priceRange)}</Box> : null}
          </Typography>
          {b.shortDescription && (
            <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {b.shortDescription}
            </Typography>
          )}
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ pt: 0.5 }}>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', minWidth: 0 }}>
              <PlaceRounded sx={{ fontSize: 16 }} />
              <Typography variant="caption" noWrap>
                {[b.district, ln(b.city)].filter(Boolean).join('، ')}
              </Typography>
            </Stack>
            {b.distanceKm != null ? (
              <Chip size="small" icon={<NearMeRounded />} label={t('business.km', { n: b.distanceKm })} sx={{ bgcolor: (th) => alpha(th.palette.primary.main, 0.08), color: 'primary.main' }} />
            ) : (
              <OpenBadge isOpen={b.isOpenNow} />
            )}
          </Stack>
        </Box>
      </CardActionArea>
    </Card>
  );
};

/** Compact horizontal row for list view */
export const BusinessRow = ({ business: b }: { business: Business }) => {
  const { t } = useT();
  const ln = useLocalName();
  return (
    <Card sx={{ transition: 'box-shadow .2s', '&:hover': { boxShadow: (th) => th.custom.cardShadowHover } }}>
      <CardActionArea component={Link} to={`/b/${b.slug}`} sx={{ display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start' }}>
        <Box sx={{ width: { xs: 110, sm: 180 }, minHeight: 130, flexShrink: 0, position: 'relative' }}>
          <Cover src={b.coverImage} tint={b.category?.color} icon={b.category?.icon} />
          {b.isFeatured && <Chip size="small" label={t('business.featured')} sx={{ position: 'absolute', top: 8, insetInlineStart: 8, background: (th) => th.custom.warmGradient, color: '#fff', height: 22 }} />}
        </Box>
        <Box sx={{ p: 2, flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>{ln(b)}</Typography>
                {b.isVerified && <VerifiedRounded sx={{ fontSize: 18, color: 'info.main' }} />}
              </Stack>
              <Typography variant="body2" color="primary" fontWeight={600} noWrap>{ln(b.subCategory) || ln(b.category)}</Typography>
            </Box>
            <FavoriteButton businessId={b.id} initial={b.isFavorite} variant="plain" />
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
            <RatingPill value={b.averageRating} />
            <Typography variant="caption" color="text.secondary">{t('common.reviewsCount', { n: b.reviewCount })}</Typography>
            <OpenBadge isOpen={b.isOpenNow} />
            {b.distanceKm != null && <Typography variant="caption" color="primary" fontWeight={700}>{t('business.km', { n: b.distanceKm })}</Typography>}
          </Stack>
          {b.shortDescription && <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.75 }}>{b.shortDescription}</Typography>}
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', mt: 0.5 }}>
            <PlaceRounded sx={{ fontSize: 16 }} />
            <Typography variant="caption" noWrap>{[b.address || b.district, ln(b.city)].filter(Boolean).join('، ')}</Typography>
          </Stack>
        </Box>
      </CardActionArea>
    </Card>
  );
};
