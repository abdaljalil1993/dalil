import { useFeatures } from '@/hooks/useFeatures';
import { Alert, Box, Breadcrumbs, Button, Card, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, MenuItem, Skeleton, Stack, TextField, Tooltip, Typography, Link as MLink } from '@mui/material';
import CallRounded from '@mui/icons-material/CallRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import DirectionsRounded from '@mui/icons-material/DirectionsRounded';
import LanguageRounded from '@mui/icons-material/LanguageRounded';
import ShareRounded from '@mui/icons-material/ShareRounded';
import FlagRounded from '@mui/icons-material/FlagRounded';
import PlaceRounded from '@mui/icons-material/PlaceRounded';
import VerifiedRounded from '@mui/icons-material/VerifiedRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import EmailRounded from '@mui/icons-material/EmailRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import Facebook from '@mui/icons-material/Facebook';
import Instagram from '@mui/icons-material/Instagram';
import Telegram from '@mui/icons-material/Telegram';
import YouTube from '@mui/icons-material/YouTube';
import XIcon from '@mui/icons-material/X';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import { ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { businessApi } from '@/api/services';
import type { Review } from '@/api/types';
import { useBusiness } from '@/hooks/queries';
import { useRequireAuth } from '@/hooks/useAuth';
import { useNotify } from '@/hooks/useNotify';
import { useLocalName, useT } from '@/i18n';
import { Cover } from '@/components/common/Cover';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { RatingStars } from '@/components/common/RatingStars';
import { OpenBadge } from '@/components/common/OpenBadge';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import { EmptyState } from '@/components/common/Section';
import { GalleryGrid, Lightbox } from '@/components/business/Gallery';
import { HoursList } from '@/components/business/HoursList';
import { ReviewsSection, useReport } from '@/components/business/ReviewsSection';
import { BusinessGrid } from '@/components/business/BusinessGrid';
import { BookingDialog, BusinessOffersBlock, MenuBlock } from '@/components/business/BusinessExtras';
import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded';
import RequestQuoteRounded from '@mui/icons-material/RequestQuoteRounded';
import { SingleLocationMap } from '@/components/maps/MapView';
import { openDirections, mapsLink, priceLabel, telLink, waLink, compact } from '@/utils/format';

const SOCIAL: Record<string, ReactNode> = { facebook: <Facebook />, instagram: <Instagram />, telegram: <Telegram />, youtube: <YouTube />, x: <XIcon /> };

const Block = ({ title, children, id, icon }: { title: ReactNode; children: ReactNode; id?: string; icon?: ReactNode }) => (
  <Card id={id} sx={{ p: { xs: 2.25, md: 3 }, mb: 2.5, scrollMarginTop: 96 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
      {icon && <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>}
      <Typography variant="h6" fontWeight={800}>{title}</Typography>
    </Stack>
    {children}
  </Card>
);

export const BusinessPage = () => {
  const { slug = '' } = useParams();
  const { t, dict, locale } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const requireAuth = useRequireAuth();
  const { data: b, isLoading, isError } = useBusiness(slug);
  const { data: related } = useQuery({ queryKey: ['related', slug], queryFn: () => businessApi.related(slug), enabled: Boolean(b) });
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [report, setReport] = useState<{ open: boolean; review?: Review }>({ open: false });
  const [reportType, setReportType] = useState('wrong_info');
  const [reportText, setReportText] = useState('');
  const [claimOpen, setClaimOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const { on } = useFeatures();
  const navigate = useNavigate();
  const [claimMsg, setClaimMsg] = useState('');
  const reportM = useReport(b?.id || '');
  const claimM = useMutation({ mutationFn: () => businessApi.claim(b!.id, { message: claimMsg }), onSuccess: () => { notify.success(t('business.claimSent')); setClaimOpen(false); }, onError: notify.error });

  useEffect(() => { if (b) document.title = `${ln(b)} · ${t('app.name')}`; return () => { document.title = t('app.name'); }; }, [b, ln, t]);

  if (isLoading)
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Skeleton variant="rounded" height={340} sx={{ borderRadius: 5 }} />
        <Skeleton width="40%" height={50} sx={{ mt: 2 }} />
        <Skeleton width="60%" />
      </Container>
    );
  if (isError || !b) return <Container sx={{ py: 6 }}><EmptyState icon={<StorefrontRounded />} title={t('business.notFound')} action={<Button component={Link} to="/" variant="contained">{t('notFound.home')}</Button>} /></Container>;

  const color = b.category?.color || '#5B3DF5';
  const photos = [b.coverImage, ...b.images.map((i) => i.url)].filter((x, i, a): x is string => Boolean(x) && a.indexOf(x) === i);
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: b.name, url }).catch(() => undefined);
    else { await navigator.clipboard.writeText(url); notify.info(t('common.copied')); }
  };
  const track = (type: 'phone' | 'whatsapp' | 'directions' | 'website') => businessApi.track(b.id, type);
  const dirLabel = [b.name, b.address, ln(b.city)].filter(Boolean).join(' ');
  const directions = mapsLink(b.latitude, b.longitude, dirLabel);
  const attrs = Object.entries(b.attributes || {}).filter(([, v]) => v !== '' && v !== null && v !== undefined);

  const actions = (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {b.phone && <Button variant="contained" size="large" startIcon={<CallRounded />} href={telLink(b.phone)} onClick={() => track('phone')}>{t('business.call')}</Button>}
      {b.whatsapp && <Button variant="contained" size="large" startIcon={<WhatsApp />} href={waLink(b.whatsapp)} target="_blank" onClick={() => track('whatsapp')} sx={{ background: '#25D366', '&:hover': { background: '#1EBE5A' } }}>{t('business.whatsapp')}</Button>}
      {directions && <Button variant="outlined" size="large" startIcon={<DirectionsRounded />} onClick={() => { track('directions'); openDirections(b.latitude, b.longitude, dirLabel); }}>{t('business.directions')}</Button>}
      {b.website && <Button variant="outlined" size="large" startIcon={<LanguageRounded />} href={b.website} target="_blank" rel="noopener" onClick={() => track('website')}>{t('business.website')}</Button>}
      {b.bookingEnabled && on('bookings') && <Button variant="contained" color="secondary" size="large" startIcon={<EventAvailableRounded />} onClick={() => requireAuth(() => setBookOpen(true))}>{t('x.booking')}</Button>}
      {b.acceptsQuotes && on('serviceRequests') && <Button variant="outlined" color="secondary" size="large" startIcon={<RequestQuoteRounded />} onClick={() => requireAuth(() => navigate(`/request-service?categoryId=${b.categoryId}${b.subCategoryId ? `&subCategoryId=${b.subCategoryId}` : ''}`), `/request-service?categoryId=${b.categoryId}`)}>{t('x.requestService')}</Button>}
    </Stack>
  );

  return (
    <Box sx={{ pb: { xs: 10, md: 0 } }}>
      <Container maxWidth="xl">
        <Breadcrumbs sx={{ mb: 1.5, fontSize: 14 }}>
          <MLink component={Link} to="/" color="inherit">{t('nav.home')}</MLink>
          {b.category && <MLink component={Link} to={`/c/${b.category.slug}`} color="inherit">{ln(b.category)}</MLink>}
          {b.subCategory && b.category && <MLink component={Link} to={`/c/${b.category.slug}?sub=${b.subCategory.id}`} color="inherit">{ln(b.subCategory)}</MLink>}
          <Typography color="text.primary" fontSize={14} noWrap sx={{ maxWidth: 220 }}>{ln(b)}</Typography>
        </Breadcrumbs>

        {b.viewer?.canManage && (
          <Alert severity={b.status === 'approved' ? 'info' : b.status === 'rejected' ? 'error' : 'warning'} sx={{ mb: 2, borderRadius: 3 }} action={<Button component={Link} to={`/owner/businesses/${b.id}`} startIcon={<EditRounded />} color="inherit">{t('business.manage')}</Button>}>
            {b.status === 'pending' ? t('business.pendingNotice') : b.status === 'rejected' ? t('business.rejectedNotice', { note: b.adminNote || '' }) : t(`owner.statuses.${b.status || 'approved'}`)}
          </Alert>
        )}

        {/* ── gallery header ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: photos.length > 2 ? '2fr 1fr' : '1fr' }, gridTemplateRows: { md: '170px 170px' }, gap: 1.25, borderRadius: 5, overflow: 'hidden', height: { xs: 240, md: 350 } }}>
          <Box sx={{ gridRow: { md: 'span 2' }, cursor: photos.length ? 'zoom-in' : 'default', position: 'relative' }} onClick={() => photos.length && setLightbox(0)}>
            <Cover src={photos[0]} tint={color} icon={b.category?.icon} alt={b.name} />
          </Box>
          {photos.length > 2 && photos.slice(1, 3).map((p, k) => (
            <Box key={p} sx={{ display: { xs: 'none', md: 'block' }, cursor: 'zoom-in', position: 'relative' }} onClick={() => setLightbox(k + 1)}>
              <Cover src={p} />
              {k === 1 && photos.length > 3 && <Stack sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,.45)', color: '#fff' }} alignItems="center" justifyContent="center"><Typography variant="h6" fontWeight={800}>+{photos.length - 3}</Typography></Stack>}
            </Box>
          ))}
        </Box>
        <Lightbox images={photos} index={lightbox} onClose={() => setLightbox(null)} />
        {b.bookingEnabled && <BookingDialog b={b} open={bookOpen} onClose={() => setBookOpen(false)} />}

        {/* ── title block ── */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ md: 'flex-end' }} sx={{ mt: { xs: -5, md: -6 }, px: { xs: 1, md: 3 }, position: 'relative' }}>
          <Box sx={{ width: { xs: 92, md: 116 }, height: { xs: 92, md: 116 }, borderRadius: '28%', overflow: 'hidden', border: '4px solid', borderColor: 'background.paper', bgcolor: 'background.paper', boxShadow: 3, flexShrink: 0 }}>
            {b.logoImage ? <Cover src={b.logoImage} tint={color} icon={b.category?.icon} /> : <CategoryIcon icon={b.category?.icon} color={color} size={116} variant="solid" sx={{ width: '100%', height: '100%', borderRadius: 0 }} />}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, pt: { md: 7 } }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h4" component="h1" fontWeight={800} sx={{ fontSize: { xs: '1.6rem', md: '2.1rem' } }}>{ln(b)}</Typography>
              {b.isVerified && <Tooltip title={t('business.verified')}><VerifiedRounded color="info" /></Tooltip>}
              {b.isFeatured && <Chip size="small" icon={<BoltRounded sx={{ color: '#fff !important' }} />} label={t('business.featured')} sx={{ background: (th) => th.custom.warmGradient, color: '#fff' }} />}
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
              <RatingStars value={b.averageRating} count={b.reviewCount} />
              {b.category && <Chip size="small" component={Link} to={`/c/${b.category.slug}`} clickable label={ln(b.subCategory) || ln(b.category)} sx={{ bgcolor: `${color}1f`, color, fontWeight: 700 }} />}
              {b.priceRange && <Typography fontWeight={700} color="text.secondary">{priceLabel(b.priceRange)}</Typography>}
              <OpenBadge isOpen={b.isOpenNow} size="medium" />
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary' }}><VisibilityRounded sx={{ fontSize: 16 }} /><Typography variant="body2">{compact(b.viewCount, locale)} {t('business.views')}</Typography></Stack>
            </Stack>
            {b.shortDescription && <Typography color="text.secondary" sx={{ mt: 1 }}>{b.shortDescription}</Typography>}
            {b.dataSource === 'osm' && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>{t('x.osmSource')}</Typography>}
          </Box>
          <Stack direction="row" spacing={1}>
            {on('favorites') && <FavoriteButton businessId={b.id} initial={b.viewer?.isFavorite} variant="plain" />}
            <Tooltip title={t('common.share')}><IconButton onClick={share}><ShareRounded /></IconButton></Tooltip>
            {on('reports') && <Tooltip title={t('common.report')}><IconButton onClick={() => requireAuth(() => setReport({ open: true }))}><FlagRounded /></IconButton></Tooltip>}
          </Stack>
        </Stack>
        <Box sx={{ mt: 2.5, px: { md: 3 } }}>{actions}</Box>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={8}>
            {(b.description || b.tags.length > 0) && (
              <Block title={t('business.about')}>
                {b.description && <Typography sx={{ whiteSpace: 'pre-line', lineHeight: 1.9 }}>{b.description}</Typography>}
                {b.tags.length > 0 && <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>{b.tags.map((tag) => <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" />)}</Stack>}
              </Block>
            )}
            {(b.amenities.length > 0 || attrs.length > 0) && (
              <Block title={t('business.details')}>
                {attrs.length > 0 && (
                  <Grid container spacing={1.5} sx={{ mb: b.amenities.length ? 2.5 : 0 }}>
                    {attrs.map(([k, v]) => (
                      <Grid item xs={12} sm={6} key={k}>
                        <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'action.hover' }}>
                          <Typography variant="caption" color="text.secondary">{(dict.attributes as Record<string, string>)[k] || k}</Typography>
                          <Typography fontWeight={700}>{Array.isArray(v) ? v.join('، ') : typeof v === 'boolean' ? (v ? t('common.yes') : t('common.no')) : String(v)}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
                {b.amenities.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {b.amenities.map((a) => <Chip key={a} icon={<CheckRounded />} label={(dict.amenities as Record<string, string>)[a] || a} sx={{ bgcolor: 'action.hover' }} />)}
                  </Stack>
                )}
              </Block>
            )}
            {on('offers') && <BusinessOffersBlock b={b} />}
            {on('menu') && <MenuBlock b={b} />}
            {b.images.length > 0 && <Block title={t('business.gallery')}><GalleryGrid images={b.images} /></Block>}
            <Block title={t('business.reviews')} id="reviews">
              <ReviewsSection b={b} onReport={(r) => setReport({ open: true, review: r })} />
            </Block>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ position: { md: 'sticky' }, top: 96 }}>
              <Block title={t('business.info')}>
                <Stack spacing={1.75}>
                  {(b.address || b.district || b.city) && (
                    <Stack direction="row" spacing={1.5}><PlaceRounded color="secondary" /><Typography>{[b.address, b.district, ln(b.city)].filter(Boolean).join('، ')}</Typography></Stack>
                  )}
                  {[b.phone, b.phone2].filter(Boolean).map((p) => (
                    <Stack key={p} direction="row" spacing={1.5} component="a" href={telLink(p)} onClick={() => track('phone')}><CallRounded color="primary" /><Typography sx={{ direction: 'ltr' }} fontWeight={600}>{p}</Typography></Stack>
                  ))}
                  {b.whatsapp && <Stack direction="row" spacing={1.5} component="a" href={waLink(b.whatsapp)} target="_blank" onClick={() => track('whatsapp')}><WhatsApp sx={{ color: '#25D366' }} /><Typography sx={{ direction: 'ltr' }} fontWeight={600}>{b.whatsapp}</Typography></Stack>}
                  {b.email && <Stack direction="row" spacing={1.5} component="a" href={`mailto:${b.email}`}><EmailRounded color="action" /><Typography noWrap>{b.email}</Typography></Stack>}
                  {b.website && <Stack direction="row" spacing={1.5} component="a" href={b.website} target="_blank" onClick={() => track('website')}><LanguageRounded color="action" /><Typography noWrap color="primary">{b.website.replace(/^https?:\/\//, '')}</Typography></Stack>}
                  {Object.keys(b.socialLinks || {}).length > 0 && (
                    <Stack direction="row" spacing={1}>
                      {Object.entries(b.socialLinks).filter(([, v]) => v).map(([k, v]) => <IconButton key={k} href={v} target="_blank" rel="noopener" sx={{ bgcolor: 'action.hover' }}>{SOCIAL[k] || <LanguageRounded />}</IconButton>)}
                    </Stack>
                  )}
                </Stack>
              </Block>
              <Block title={t('business.hours')} icon={<AccessTimeRounded />}><HoursList hours={b.workingHours} /></Block>
              <Block title={t('business.location')}>
                {b.latitude != null && b.longitude != null ? (
                  <>
                    <SingleLocationMap lat={b.latitude} lng={b.longitude} color={color} />
                    <Button fullWidth variant="outlined" startIcon={<DirectionsRounded />} onClick={() => { track('directions'); openDirections(b.latitude, b.longitude, dirLabel); }} sx={{ mt: 1.5 }}>{t('business.directions')}</Button>
                  </>
                ) : (
                  <Typography color="text.secondary">{t('business.mapUnavailable')}</Typography>
                )}
              </Block>
              {!b.isClaimed && !b.viewer?.canManage && on('claims') && (
                <Card sx={{ p: 2.5, mb: 2.5, background: (th) => th.custom.gradientSoft, border: 'none' }}>
                  <Typography fontWeight={800}>{t('business.claim')}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>{t('business.claimText')}</Typography>
                  <Button variant="contained" disabled={b.viewer?.hasPendingClaim} onClick={() => requireAuth(() => setClaimOpen(true))}>{b.viewer?.hasPendingClaim ? t('business.claimPending') : t('business.claimTitle')}</Button>
                </Card>
              )}
            </Box>
          </Grid>
        </Grid>

        {!!related?.length && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>{t('business.related')}</Typography>
            <BusinessGrid items={related.slice(0, 4)} />
          </Box>
        )}
      </Container>

      {/* mobile sticky action bar */}
      <Box sx={{ display: { md: 'none' }, position: 'fixed', bottom: 64, left: 0, right: 0, p: 1.25, zIndex: 1050, bgcolor: (th) => th.custom.glass, backdropFilter: 'blur(14px)', borderTop: (th) => `1px solid ${th.custom.border}` }}>
        <Stack direction="row" spacing={1}>
          {b.phone && <Button fullWidth variant="contained" startIcon={<CallRounded />} href={telLink(b.phone)} onClick={() => track('phone')}>{t('business.call')}</Button>}
          {b.whatsapp && <Button fullWidth variant="contained" startIcon={<WhatsApp />} href={waLink(b.whatsapp)} target="_blank" onClick={() => track('whatsapp')} sx={{ background: '#25D366' }}>{t('business.whatsapp')}</Button>}
          {directions && <Button fullWidth variant="outlined" startIcon={<DirectionsRounded />} onClick={() => { track('directions'); openDirections(b.latitude, b.longitude, dirLabel); }} sx={{ bgcolor: 'background.paper' }}>{t('business.directions')}</Button>}
        </Stack>
      </Box>

      <Dialog open={report.open} onClose={() => setReport({ open: false })} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={800}>{t('business.reportTitle')}</DialogTitle>
        <DialogContent>
          <TextField select fullWidth label={t('common.type')} value={report.review ? 'fake_review' : reportType} disabled={Boolean(report.review)} onChange={(e) => setReportType(e.target.value)} sx={{ mt: 1 }}>
            {Object.entries(dict.business.reportTypes).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </TextField>
          <TextField fullWidth multiline minRows={3} label={t('common.description')} value={reportText} onChange={(e) => setReportText(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setReport({ open: false })}>{t('common.cancel')}</Button>
          <Button variant="contained" disabled={reportM.isPending} onClick={() => reportM.mutate({ type: report.review ? 'fake_review' : reportType, description: reportText || undefined, reviewId: report.review?.id }, { onSuccess: () => { setReport({ open: false }); setReportText(''); } })}>{t('common.send')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={claimOpen} onClose={() => setClaimOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={800}>{t('business.claimTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t('business.claimText')}</Typography>
          <TextField fullWidth multiline minRows={3} value={claimMsg} onChange={(e) => setClaimMsg(e.target.value)} label={t('common.message')} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setClaimOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" disabled={claimMsg.length < 10 || claimM.isPending} onClick={() => claimM.mutate()}>{t('common.send')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
