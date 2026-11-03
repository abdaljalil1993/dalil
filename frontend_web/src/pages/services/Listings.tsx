import { Alert, Box, Button, Card, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, Grid, IconButton, MenuItem, Pagination, Skeleton, Stack, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import TuneRounded from '@mui/icons-material/TuneRounded';
import CallRounded from '@mui/icons-material/CallRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import PlaceRounded from '@mui/icons-material/PlaceRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import ShareRounded from '@mui/icons-material/ShareRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import SendRounded from '@mui/icons-material/SendRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { businessApi, listingApi, ListingQuery } from '@/api/services';
import type { Listing, ListingField, ListingPurpose, ListingType } from '@/api/types';
import { useCities } from '@/hooks/queries';
import { useAuth, useRequireAuth } from '@/hooks/useAuth';
import { useNotify } from '@/hooks/useNotify';
import { usePrefs } from '@/store/prefsStore';
import { useLocalName, useT } from '@/i18n';
import { EmptyState, PageHeader } from '@/components/common/Section';
import { GridSkeleton } from '@/components/common/Skeletons';
import { ImageDropzone } from '@/components/common/ImageDropzone';
import { Lightbox } from '@/components/business/Gallery';
import { LISTING_META, ListingCard, ListingPrice } from '@/components/business/ExtraCards';
import { SingleLocationMap, LocationPicker } from '@/components/maps/MapView';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { fromNow, telLink, waLink } from '@/utils/format';

export const useListingFields = () => useQuery({ queryKey: ['listing-fields'], queryFn: listingApi.fields, staleTime: Infinity });

const useFieldLabels = () => {
  const { t } = useT();
  return {
    label: (k: string) => t(`x.fields.${k}`),
    opt: (v: string) => t(`x.options.${v}`),
    value: (f: ListingField | undefined, v: unknown) => (typeof v === 'boolean' ? t(v ? 'x.options.yes' : 'x.options.no') : f?.kind === 'enum' ? t(`x.options.${v}`) : String(v)),
  };
};

// ───────────── browse ─────────────
export const ListingsPage = ({ type }: { type: ListingType }) => {
  const { t } = useT();
  const ln = useLocalName();
  const meta = LISTING_META[type];
  const { isAuthenticated } = useAuth();
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();
  const { data: fieldsData } = useListingFields();
  const { data: cities } = useCities();
  const prefCity = usePrefs((s) => s.cityId);
  const L = useFieldLabels();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const q: ListingQuery = useMemo(() => {
    const attr: Record<string, string> = {}, attrMin: Record<string, string> = {}, attrMax: Record<string, string> = {};
    params.forEach((v, k) => {
      if (k.startsWith('a.')) attr[k.slice(2)] = v;
      if (k.startsWith('min.')) attrMin[k.slice(4)] = v;
      if (k.startsWith('max.')) attrMax[k.slice(4)] = v;
    });
    return {
      type, purpose: (params.get('purpose') as ListingPurpose) || undefined, cityId: params.get('cityId') ? Number(params.get('cityId')) : prefCity ?? undefined,
      district: params.get('district') || undefined, minPrice: params.get('minPrice') ? Number(params.get('minPrice')) : undefined, maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined,
      q: params.get('q') || undefined, sort: params.get('sort') || undefined, page: Number(params.get('page') || 1), limit: 12, attr, attrMin, attrMax,
    };
  }, [params, type, prefCity]);
  const set = (k: string, v?: string | number | null) => {
    const p = new URLSearchParams(params);
    if (v === undefined || v === null || v === '') p.delete(k);
    else p.set(k, String(v));
    if (k !== 'page') p.delete('page');
    setParams(p, { replace: true });
  };
  const { data, isLoading } = useQuery({ queryKey: ['listings', q, isAuthenticated], queryFn: () => listingApi.search(isAuthenticated ? q : { ...q, q: undefined }) });
  const fields = (fieldsData?.fields[type] || []).filter((f) => f.filter);
  const purposes = fieldsData?.purposes[type] || [];

  const filters = (
    <Stack spacing={2}>
      <TextField size="small" label={t('common.search')} defaultValue={q.q || ''} onKeyDown={(e) => { if (e.key === 'Enter') requireAuth(() => set('q', (e.target as HTMLInputElement).value)); }} onFocus={() => !isAuthenticated && requireAuth()} />
      <TextField select size="small" label={t('common.city')} value={q.cityId ?? ''} onChange={(e) => set('cityId', e.target.value)}>
        <MenuItem value="">{t('common.allCities')}</MenuItem>
        {(cities || []).map((c) => <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>)}
      </TextField>
      <TextField size="small" label={t('business.district')} defaultValue={q.district || ''} onBlur={(e) => set('district', e.target.value)} />
      <Stack direction="row" spacing={1}>
        <TextField size="small" type="number" label={t('x.minPrice')} defaultValue={q.minPrice ?? ''} onBlur={(e) => set('minPrice', e.target.value)} />
        <TextField size="small" type="number" label={t('x.maxPrice')} defaultValue={q.maxPrice ?? ''} onBlur={(e) => set('maxPrice', e.target.value)} />
      </Stack>
      {fields.map((f) =>
        f.kind === 'enum' ? (
          <TextField key={f.key} select size="small" label={L.label(f.key)} value={q.attr?.[f.key] || ''} onChange={(e) => set(`a.${f.key}`, e.target.value)}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            {f.options!.map((o) => <MenuItem key={o} value={o}>{L.opt(o)}</MenuItem>)}
          </TextField>
        ) : f.kind === 'bool' ? (
          <FormControlLabel key={f.key} control={<Switch checked={q.attr?.[f.key] === 'true'} onChange={(e) => set(`a.${f.key}`, e.target.checked ? 'true' : '')} />} label={L.label(f.key)} />
        ) : f.kind === 'num' ? (
          <Stack key={f.key} direction="row" spacing={1}>
            <TextField size="small" type="number" label={`${L.label(f.key)} ≥`} defaultValue={q.attrMin?.[f.key] || ''} onBlur={(e) => set(`min.${f.key}`, e.target.value)} />
            <TextField size="small" type="number" label="≤" defaultValue={q.attrMax?.[f.key] || ''} onBlur={(e) => set(`max.${f.key}`, e.target.value)} sx={{ maxWidth: 110 }} />
          </Stack>
        ) : (
          <TextField key={f.key} size="small" label={L.label(f.key)} defaultValue={q.attr?.[f.key] || ''} onBlur={(e) => set(`a.${f.key}`, e.target.value)} />
        )
      )}
      <Button color="inherit" onClick={() => setParams({}, { replace: true })}>{t('common.reset')}</Button>
    </Stack>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader icon={meta.icon} title={t(`x.${meta.key}`)} subtitle={t(`x.${meta.key}Sub`)} actions={<Button variant="contained" startIcon={<AddRounded />} onClick={() => requireAuth(() => navigate(`/account/listings/new?type=${type}`), `/account/listings/new?type=${type}`)}>{t('x.postListing')}</Button>} />
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }} flexWrap="wrap" useFlexGap>
        <ToggleButtonGroup exclusive size="small" value={q.purpose || ''} onChange={(_, v) => v !== null && set('purpose', v)}>
          <ToggleButton value="">{t('common.all')}</ToggleButton>
          {purposes.map((p) => <ToggleButton key={p} value={p}>{t(`x.purposes.${p}`)}</ToggleButton>)}
        </ToggleButtonGroup>
        <Box sx={{ flex: 1 }} />
        {data && <Typography color="text.secondary" fontWeight={700}>{t('common.results', { n: data.meta.total })}</Typography>}
        <TextField select size="small" value={q.sort || 'newest'} onChange={(e) => set('sort', e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="newest">{t('search.sort.newest')}</MenuItem>
          <MenuItem value="price_asc">{t('x.price')} ↑</MenuItem>
          <MenuItem value="price_desc">{t('x.price')} ↓</MenuItem>
          <MenuItem value="popular">{t('search.sort.popular')}</MenuItem>
        </TextField>
        <Button variant="outlined" startIcon={<TuneRounded />} onClick={() => setOpen(true)} sx={{ display: { md: 'none' } }}>{t('common.filters')}</Button>
      </Stack>
      <Grid container spacing={3}>
        <Grid item md={3} sx={{ display: { xs: 'none', md: 'block' } }}><Card sx={{ p: 2, position: 'sticky', top: 96 }}>{filters}</Card></Grid>
        <Grid item xs={12} md={9}>
          {isLoading ? <GridSkeleton md={4} count={6} /> : !data?.items.length ? <Card><EmptyState icon={meta.icon} title={t('x.noListings')} /></Card> : (
            <>
              <Grid container spacing={2.5}>{data.items.map((l) => <Grid item xs={12} sm={6} md={4} key={l.id}><ListingCard listing={l} /></Grid>)}</Grid>
              {data.meta.totalPages > 1 && <Pagination sx={{ mt: 3, display: 'flex', justifyContent: 'center' }} count={data.meta.totalPages} page={q.page || 1} onChange={(_, p) => set('page', p)} />}
            </>
          )}
        </Grid>
      </Grid>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs"><DialogContent>{filters}</DialogContent><DialogActions><Button onClick={() => setOpen(false)}>{t('common.apply')}</Button></DialogActions></Dialog>
    </Container>
  );
};

// ───────────── details ─────────────
export const ListingPage = () => {
  const { slug = '' } = useParams();
  const { t } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const requireAuth = useRequireAuth();
  const qc = useQueryClient();
  const L = useFieldLabels();
  const { data: fieldsData } = useListingFields();
  const { data: l, isLoading, isError } = useQuery({ queryKey: ['listing', slug], queryFn: () => listingApi.get(slug), retry: 0 });
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [cv, setCv] = useState<File | null>(null);
  const apply = useMutation({ mutationFn: () => listingApi.apply(l!.id, { message: msg }, cv), onSuccess: () => { notify.success(t('x.applicationSent')); setApplyOpen(false); qc.invalidateQueries({ queryKey: ['listing', slug] }); }, onError: notify.error });
  if (isLoading) return <Container sx={{ py: 3 }}><Skeleton variant="rounded" height={360} /></Container>;
  if (isError || !l) return <Container sx={{ py: 6 }}><EmptyState title={t('x.noListings')} /></Container>;
  const meta = LISTING_META[l.type];
  const fields = fieldsData?.fields[l.type] || [];
  const attrs = Object.entries(l.attributes || {});
  const share = async () => { if (navigator.share) await navigator.share({ title: l.title, url: location.href }).catch(() => undefined); else { await navigator.clipboard.writeText(location.href); notify.info(t('common.copied')); } };
  const isJob = l.type === 'job' && l.purpose === 'hire';
  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {l.viewer?.canManage && l.status !== 'active' && <Alert severity={l.status === 'rejected' ? 'error' : 'warning'} sx={{ mb: 2, borderRadius: 3 }}>{t(`x.listingStatus.${l.status}`)}{l.adminNote ? ` — ${l.adminNote}` : ''}</Alert>}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ overflow: 'hidden', mb: 2.5 }}>
            {l.images.length ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: l.images.length > 1 ? '2fr 1fr' : '1fr', gap: 1, height: { xs: 240, md: 380 } }}>
                <Box component="img" src={l.images[0].url} onClick={() => setLightbox(0)} sx={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in', gridRow: 'span 2' }} />
                {l.images.slice(1, 3).map((img, i) => <Box key={img.url} component="img" src={img.url} onClick={() => setLightbox(i + 1)} sx={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in', minHeight: 0 }} />)}
              </Box>
            ) : (
              <Box sx={{ height: 220, display: 'grid', placeItems: 'center', bgcolor: `${meta.color}18`, color: meta.color, '& svg': { fontSize: 80 } }}>{meta.icon}</Box>
            )}
            <Lightbox images={l.images.map((i) => i.url)} index={lightbox} onClose={() => setLightbox(null)} />
            <Box sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Chip size="small" label={t(`x.purposes.${l.purpose}`)} sx={{ bgcolor: meta.color, color: '#fff', fontWeight: 700 }} />
                <Chip size="small" label={t(`x.${meta.key}`)} variant="outlined" />
                {l.priceNegotiable && <Chip size="small" label={t('x.negotiable')} color="success" variant="outlined" />}
              </Stack>
              <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>{l.title}</Typography>
              <Box sx={{ my: 1 }}><ListingPrice l={l} /></Box>
              <Stack direction="row" spacing={2} sx={{ color: 'text.secondary' }} flexWrap="wrap" useFlexGap>
                <Stack direction="row" spacing={0.5} alignItems="center"><PlaceRounded fontSize="small" /><Typography variant="body2">{[l.address, l.district, ln(l.city)].filter(Boolean).join('، ')}</Typography></Stack>
                <Stack direction="row" spacing={0.5} alignItems="center"><VisibilityRounded fontSize="small" /><Typography variant="body2">{l.viewCount}</Typography></Stack>
                <Typography variant="body2">{fromNow(l.createdAt)}</Typography>
              </Stack>
            </Box>
          </Card>
          {attrs.length > 0 && (
            <Card sx={{ p: 3, mb: 2.5 }}>
              <Typography variant="h6" fontWeight={800} gutterBottom>{t('x.details')}</Typography>
              <Grid container spacing={1.5}>
                {attrs.map(([k, v]) => (
                  <Grid item xs={6} sm={4} key={k}>
                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'action.hover' }}>
                      <Typography variant="caption" color="text.secondary">{L.label(k)}</Typography>
                      <Typography fontWeight={700}>{L.value(fields.find((f) => f.key === k), v)}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          )}
          {l.description && <Card sx={{ p: 3, mb: 2.5 }}><Typography variant="h6" fontWeight={800} gutterBottom>{t('business.about')}</Typography><Typography sx={{ whiteSpace: 'pre-line', lineHeight: 1.9 }}>{l.description}</Typography></Card>}
          {l.latitude != null && l.longitude != null && <Card sx={{ p: 2, mb: 2.5 }}><SingleLocationMap lat={l.latitude} lng={l.longitude} color={meta.color} height={280} /></Card>}
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, position: { md: 'sticky' }, top: 96 }}>
            <Typography variant="body2" color="text.secondary">{t('x.postedBy')}</Typography>
            {l.business ? (
              <Typography fontWeight={800} component={Link} to={`/b/${l.business.slug}`} color="primary">{l.business.name}</Typography>
            ) : (
              <Typography fontWeight={800}>{l.user?.fullName}</Typography>
            )}
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1.25}>
              {isJob && !l.viewer?.canManage && (
                <Button variant="contained" size="large" startIcon={l.viewer?.hasApplied ? <CheckCircleRounded /> : <SendRounded />} disabled={l.viewer?.hasApplied || l.status !== 'active'} onClick={() => requireAuth(() => setApplyOpen(true))}>
                  {l.viewer?.hasApplied ? t('x.applied') : t('x.apply')}
                </Button>
              )}
              {l.contactPhone && <Button variant={isJob ? 'outlined' : 'contained'} size="large" startIcon={<CallRounded />} href={telLink(l.contactPhone)}>{l.contactPhone}</Button>}
              {l.whatsapp && <Button variant="contained" size="large" startIcon={<WhatsApp />} href={waLink(l.whatsapp, l.title)} target="_blank" sx={{ background: '#25D366' }}>{t('business.whatsapp')}</Button>}
              <Button variant="outlined" startIcon={<ShareRounded />} onClick={share}>{t('common.share')}</Button>
              {l.viewer?.canManage && <Button startIcon={<EditRounded />} component={Link} to={`/account/listings/${l.id}`}>{t('common.edit')}</Button>}
            </Stack>
          </Card>
        </Grid>
      </Grid>
      <Dialog open={applyOpen} onClose={() => setApplyOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle fontWeight={800}>{t('x.apply')}: {l.title}</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline minRows={4} label={t('x.applyMessage')} value={msg} onChange={(e) => setMsg(e.target.value)} sx={{ mt: 1 }} />
          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>{t('x.cvImage')}</Typography>
          <ImageDropzone multiple={false} height={90} onFiles={(f) => setCv(f[0])} hint={cv?.name} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}><Button color="inherit" onClick={() => setApplyOpen(false)}>{t('common.cancel')}</Button><Button variant="contained" disabled={apply.isPending} onClick={() => apply.mutate()}>{t('common.send')}</Button></DialogActions>
      </Dialog>
    </Container>
  );
};

// ───────────── editor ─────────────
const Section = ({ title, children }: { title: string; children: ReactNode }) => <Card sx={{ p: { xs: 2.25, md: 3 }, mb: 2.5 }}><Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>{title}</Typography>{children}</Card>;

export const ListingEditor = () => {
  const { id } = useParams();
  const isNew = !id;
  const [params] = useSearchParams();
  const { t } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const L = useFieldLabels();
  const { data: fieldsData } = useListingFields();
  const { data: cities } = useCities();
  const { data: mine } = useQuery({ queryKey: ['businesses', 'mine'], queryFn: () => businessApi.mine({ limit: 50 }) });
  const { data: existing } = useQuery({ queryKey: ['listing', 'edit', id], queryFn: () => listingApi.get(id!), enabled: !isNew });
  const prefCity = usePrefs((s) => s.cityId);
  const [f, setF] = useState<Record<string, unknown>>({ type: (params.get('type') as ListingType) || 'real_estate', purpose: '', title: '', description: '', price: '', currency: 'SYP', priceNegotiable: false, pricePeriod: '', cityId: prefCity ?? '', district: '', address: '', latitude: null, longitude: null, contactPhone: '', whatsapp: '', businessId: '', attributes: {} });
  const [del, setDel] = useState(false);
  useEffect(() => {
    if (existing) setF({ ...existing, price: existing.price ?? '', pricePeriod: existing.pricePeriod || '', businessId: existing.business?.id || '', contactPhone: existing.contactPhone || '', whatsapp: existing.whatsapp || '', district: existing.district || '', address: existing.address || '', description: existing.description || '' });
  }, [existing]);
  const type = f.type as ListingType;
  const fields = fieldsData?.fields[type] || [];
  const purposes = fieldsData?.purposes[type] || [];
  const attrs = (f.attributes || {}) as Record<string, unknown>;
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));
  const setAttr = (k: string, v: unknown) => setF((s) => ({ ...s, attributes: { ...(s.attributes as object), [k]: v } }));
  const city = cities?.find((c) => c.id === f.cityId);
  const payload = () => {
    const { id: _i, slug: _s, city: _c, user: _u, business: _b, images: _im, viewer: _v, status: _st, isFeatured: _f, viewCount: _vc, applicationsCount: _a, adminNote: _an, expiresAt: _e, createdAt: _ca, updatedAt: _ua, ...rest } = f as Record<string, unknown>;
    return Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v === '' ? null : v]));
  };
  const save = useMutation({
    mutationFn: () => (isNew ? listingApi.create(payload()) : listingApi.update(id!, payload())),
    onSuccess: (l: Listing) => { qc.invalidateQueries({ queryKey: ['listings'] }); notify.success(l.status === 'active' ? t('x.listingPublished') : t('x.listingSubmitted')); if (isNew) navigate(`/account/listings/${l.id}`, { replace: true }); },
    onError: notify.error,
  });
  const onImg = (l: Listing) => qc.setQueryData(['listing', 'edit', id], l);
  const up = useMutation({ mutationFn: (files: File[]) => listingApi.addImages(id!, files), onSuccess: onImg, onError: notify.error });
  const rmImg = useMutation({ mutationFn: (i: number) => listingApi.removeImage(id!, i), onSuccess: onImg, onError: notify.error });
  const rm = useMutation({ mutationFn: () => listingApi.remove(id!), onSuccess: () => { qc.invalidateQueries({ queryKey: ['listings'] }); navigate('/account/listings'); } });
  const valid = f.purpose && String(f.title).length >= 3 && f.cityId;

  return (
    <Box>
      <PageHeader icon={LISTING_META[type].icon} title={isNew ? t('x.postListing') : t('x.editListing')} subtitle={existing ? t(`x.listingStatus.${existing.status}`) : undefined}
        actions={<>{!isNew && <Button component={Link} to={`/l/${existing?.slug}`}>{t('owner.viewPublic')}</Button>}{!isNew && <IconButton color="error" onClick={() => setDel(true)}><DeleteOutlineRounded /></IconButton>}<Button variant="contained" disabled={!valid || save.isPending} onClick={() => save.mutate()}>{t('common.save')}</Button></>} />
      <Section title={t('owner.steps.basic')}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <ToggleButtonGroup exclusive value={type} onChange={(_, v) => v && setF((s) => ({ ...s, type: v, purpose: '', attributes: {} }))} disabled={!isNew}>
              {(['real_estate', 'car', 'job', 'other'] as ListingType[]).map((x) => <ToggleButton key={x} value={x} sx={{ gap: 1 }}>{LISTING_META[x].icon}{t(`x.${LISTING_META[x].key}`)}</ToggleButton>)}
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth required label={t('common.type')} value={f.purpose || ''} onChange={(e) => set('purpose', e.target.value)}>
              {purposes.map((p) => <MenuItem key={p} value={p}>{t(`x.purposes.${p}`)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={8}><TextField fullWidth required label={t('admin.title')} value={f.title} onChange={(e) => set('title', e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline minRows={4} label={t('common.description')} value={f.description} onChange={(e) => set('description', e.target.value)} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth type="number" label={type === 'job' ? t('x.fields.salaryMax') : t('x.price')} value={f.price} onChange={(e) => set('price', e.target.value === '' ? '' : Number(e.target.value))} /></Grid>
          <Grid item xs={6} sm={2}><TextField select fullWidth label="" value={f.currency} onChange={(e) => set('currency', e.target.value)}><MenuItem value="SYP">ل.س</MenuItem><MenuItem value="USD">$</MenuItem></TextField></Grid>
          <Grid item xs={6} sm={3}>
            <TextField select fullWidth label={t('x.periods.monthly').replace(/.*/, '⏱')} value={f.pricePeriod} onChange={(e) => set('pricePeriod', e.target.value)}>
              <MenuItem value="">—</MenuItem>{['daily', 'monthly', 'yearly', 'hourly'].map((p) => <MenuItem key={p} value={p}>{t(`x.periods.${p}`)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}><FormControlLabel control={<Switch checked={Boolean(f.priceNegotiable)} onChange={(e) => set('priceNegotiable', e.target.checked)} />} label={t('x.negotiable')} /></Grid>
          {!!mine?.items.length && (
            <Grid item xs={12}>
              <TextField select fullWidth label={t('x.postOnBehalf')} value={f.businessId || ''} onChange={(e) => set('businessId', e.target.value)}>
                <MenuItem value="">{t('x.personal')}</MenuItem>
                {mine.items.filter((b) => b.status === 'approved').map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </TextField>
            </Grid>
          )}
        </Grid>
      </Section>
      <Section title={t('x.details')}>
        <Grid container spacing={2}>
          {fields.map((fd) => (
            <Grid item xs={12} sm={fd.kind === 'bool' ? 4 : 6} md={fd.kind === 'bool' ? 3 : 4} key={fd.key}>
              {fd.kind === 'enum' ? (
                <TextField select fullWidth label={L.label(fd.key)} value={attrs[fd.key] ?? ''} onChange={(e) => setAttr(fd.key, e.target.value)}>
                  <MenuItem value="">—</MenuItem>{fd.options!.map((o) => <MenuItem key={o} value={o}>{L.opt(o)}</MenuItem>)}
                </TextField>
              ) : fd.kind === 'bool' ? (
                <FormControlLabel control={<Switch checked={Boolean(attrs[fd.key])} onChange={(e) => setAttr(fd.key, e.target.checked)} />} label={L.label(fd.key)} />
              ) : (
                <TextField fullWidth type={fd.kind === 'num' ? 'number' : 'text'} label={L.label(fd.key)} value={attrs[fd.key] ?? ''} onChange={(e) => setAttr(fd.key, fd.kind === 'num' && e.target.value !== '' ? Number(e.target.value) : e.target.value)} />
              )}
            </Grid>
          ))}
        </Grid>
      </Section>
      <Section title={t('owner.steps.location')}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth required label={t('common.city')} value={f.cityId ?? ''} onChange={(e) => set('cityId', Number(e.target.value))}>
              {(cities || []).map((c) => <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label={t('business.district')} value={f.district} onChange={(e) => set('district', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label={t('business.address')} value={f.address} onChange={(e) => set('address', e.target.value)} /></Grid>
        </Grid>
        <LocationPicker height={280} lat={f.latitude as number | null} lng={f.longitude as number | null} fallback={city?.latitude && city.longitude ? [city.latitude, city.longitude] : undefined} onChange={(lat, lng) => setF((s) => ({ ...s, latitude: lat, longitude: lng }))} />
      </Section>
      <Section title={t('owner.steps.contact')}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField fullWidth label={t('common.phone')} value={f.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} inputProps={{ dir: 'ltr' }} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label={t('business.whatsapp')} value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} inputProps={{ dir: 'ltr' }} /></Grid>
        </Grid>
      </Section>
      <Section title={t('x.images')}>
        {isNew || !existing ? <Alert severity="info">{t('owner.saveFirst')}</Alert> : (
          <>
            <ImageDropzone loading={up.isPending} onFiles={(fs) => up.mutate(fs)} hint={t('owner.dropHint')} />
            <Grid container spacing={1.5} sx={{ mt: 1 }}>
              {existing.images.map((img, i) => (
                <Grid item xs={6} sm={3} key={img.url}>
                  <Box sx={{ position: 'relative', aspectRatio: '1', borderRadius: 3, overflow: 'hidden' }}>
                    <Box component="img" src={img.url} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <IconButton size="small" onClick={() => rmImg.mutate(i)} sx={{ position: 'absolute', top: 6, insetInlineEnd: 6, bgcolor: 'rgba(255,255,255,.9)' }}><DeleteOutlineRounded fontSize="small" color="error" /></IconButton>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Section>
      <Stack direction="row" justifyContent="flex-end"><Button variant="contained" size="large" disabled={!valid || save.isPending} onClick={() => save.mutate()}>{t('common.save')}</Button></Stack>
      <ConfirmDialog open={del} danger onClose={() => setDel(false)} onConfirm={() => rm.mutate()} />
    </Box>
  );
};
