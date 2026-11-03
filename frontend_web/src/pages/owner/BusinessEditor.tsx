import { Alert, Autocomplete, Box, Button, Card, Chip, FormControlLabel, Grid, IconButton, InputAdornment, MenuItem, Radio, RadioGroup, Stack, Tab, Tabs, TextField, Tooltip, Typography } from '@mui/material';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import MyLocationRounded from '@mui/icons-material/MyLocationRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import StarOutlineRounded from '@mui/icons-material/StarOutlineRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { businessApi, BusinessPayload } from '@/api/services';
import type { Business, WorkingHour } from '@/api/types';
import { useAuth } from '@/hooks/useAuth';
import { useCategories, useCities } from '@/hooks/queries';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNotify } from '@/hooks/useNotify';
import { useLocalName, useT } from '@/i18n';
import { PageHeader } from '@/components/common/Section';
import { StatCard } from '@/components/common/StatCard';
import { ImageDropzone } from '@/components/common/ImageDropzone';
import { HoursEditor, defaultHours } from '@/components/forms/HoursEditor';
import { LocationPicker } from '@/components/maps/MapView';
import { Cover } from '@/components/common/Cover';
import { STATUS_COLOR } from './MyBusinesses';
import { BookingTab, DutyTab, ItemsTab, OffersTab, PlanTab } from './BusinessEditorTabs';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import CallRounded from '@mui/icons-material/CallRounded';
import DirectionsRounded from '@mui/icons-material/DirectionsRounded';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import LanguageRounded from '@mui/icons-material/LanguageRounded';

type Form = {
  name: string; nameEn: string; shortDescription: string; description: string; categoryId: number | ''; subCategoryId: number | ''; cityId: number | '';
  district: string; address: string; latitude: number | null; longitude: number | null; phone: string; phone2: string; whatsapp: string; email: string; website: string;
  socialLinks: Record<string, string>; priceRange: number | ''; tags: string[]; amenities: string[]; attributes: { k: string; v: string }[]; workingHours: WorkingHour[]; isOwner: boolean;
};

const empty = (): Form => ({
  name: '', nameEn: '', shortDescription: '', description: '', categoryId: '', subCategoryId: '', cityId: '', district: '', address: '', latitude: null, longitude: null,
  phone: '', phone2: '', whatsapp: '', email: '', website: '', socialLinks: {}, priceRange: '', tags: [], amenities: [], attributes: [], workingHours: defaultHours(), isOwner: true,
});

const fromBusiness = (b: Business): Form => ({
  name: b.name, nameEn: b.nameEn || '', shortDescription: b.shortDescription || '', description: b.description || '', categoryId: b.categoryId, subCategoryId: b.subCategoryId ?? '', cityId: b.cityId,
  district: b.district || '', address: b.address || '', latitude: b.latitude, longitude: b.longitude, phone: b.phone || '', phone2: b.phone2 || '', whatsapp: b.whatsapp || '', email: b.email || '', website: b.website || '',
  socialLinks: b.socialLinks || {}, priceRange: b.priceRange ?? '', tags: b.tags, amenities: b.amenities,
  attributes: Object.entries(b.attributes || {}).map(([k, v]) => ({ k, v: Array.isArray(v) ? v.join(', ') : String(v) })),
  workingHours: b.workingHours.length ? b.workingHours : defaultHours(), isOwner: true,
});

const toPayload = (f: Form, create: boolean): BusinessPayload => ({
  name: f.name.trim(), nameEn: f.nameEn || null, shortDescription: f.shortDescription || null, description: f.description || null,
  categoryId: Number(f.categoryId), subCategoryId: f.subCategoryId === '' ? null : Number(f.subCategoryId), cityId: Number(f.cityId),
  district: f.district || null, address: f.address || null, latitude: f.latitude, longitude: f.longitude,
  phone: f.phone || null, phone2: f.phone2 || null, whatsapp: f.whatsapp || null, email: f.email || null, website: f.website ? (/^https?:\/\//.test(f.website) ? f.website : `https://${f.website}`) : null,
  socialLinks: Object.fromEntries(Object.entries(f.socialLinks).filter(([, v]) => v)), priceRange: f.priceRange === '' ? null : Number(f.priceRange),
  tags: f.tags, amenities: f.amenities, attributes: Object.fromEntries(f.attributes.filter((a) => a.k.trim()).map((a) => [a.k.trim(), a.v])),
  workingHours: f.workingHours.map(({ dayOfWeek, openTime, closeTime, isClosed, isOpen24Hours }) => ({ dayOfWeek, openTime, closeTime, isClosed, isOpen24Hours })),
  ...(create && { isOwner: f.isOwner }),
});

const AMENITY_KEYS = ['parking', 'wifi', 'delivery', 'takeaway', 'card_payment', 'appointments', 'kids_friendly', 'family', 'outdoor_seating', 'sea_view', 'pool', 'ac', 'generator', 'wheelchair', 'home_visits', 'emergency'];
const SOCIAL_KEYS = ['facebook', 'instagram', 'telegram', 'tiktok', 'youtube', 'x'];

const Section = ({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) => (
  <Card sx={{ p: { xs: 2.25, md: 3 }, mb: 2.5 }}>
    <Typography variant="h6" fontWeight={800}>{title}</Typography>
    {hint && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{hint}</Typography>}
    <Box sx={{ mt: 2.5 }}>{children}</Box>
  </Card>
);

export const BusinessEditor = () => {
  const { id } = useParams();
  const isNew = !id;
  const { t, dict } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const geo = useGeolocation();
  const { data: cats } = useCategories();
  const { data: cities } = useCities();
  const { data: existing } = useQuery({ queryKey: ['business', 'managed', id], queryFn: () => businessApi.managed(id!), enabled: !isNew });
  const { data: stats } = useQuery({ queryKey: ['business', 'stats', id], queryFn: () => businessApi.stats(id!), enabled: !isNew });
  const [f, setF] = useState<Form>(empty());
  const [tab, setTab] = useState('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => { if (existing) setF(fromBusiness(existing)); }, [existing]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));
  const category = cats?.find((c) => c.id === f.categoryId);
  const city = cities?.find((c) => c.id === f.cityId);
  const fallbackCenter = useMemo<[number, number] | undefined>(() => (city?.latitude && city.longitude ? [city.latitude, city.longitude] : undefined), [city]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = t('common.required');
    if (!f.categoryId) e.categoryId = t('common.required');
    if (!f.cityId) e.cityId = t('common.required');
    setErrors(e);
    if (Object.keys(e).length) setTab('basic');
    return !Object.keys(e).length;
  };

  const save = useMutation({
    mutationFn: () => (isNew ? businessApi.create(toPayload(f, true)) : businessApi.update(id!, toPayload(f, false))),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: ['businesses'] });
      qc.invalidateQueries({ queryKey: ['business'] });
      if (isNew) {
        notify.success(b.status === 'approved' ? t('owner.published') : t('owner.created'));
        navigate(`/owner/businesses/${b.id}`, { replace: true });
        setTab('media');
      } else notify.success(t('common.saved'));
    },
    onError: notify.error,
  });
  const onMedia = (b: Business) => qc.setQueryData(['business', 'managed', id], b);
  const upload = useMutation({ mutationFn: (files: File[]) => businessApi.addImages(id!, files), onSuccess: onMedia, onError: notify.error });
  const cover = useMutation({ mutationFn: (file: File) => businessApi.cover(id!, file), onSuccess: onMedia, onError: notify.error });
  const logo = useMutation({ mutationFn: (file: File) => businessApi.logo(id!, file), onSuccess: onMedia, onError: notify.error });
  const rmImg = useMutation({ mutationFn: (imageId: number) => businessApi.removeImage(id!, imageId), onSuccess: onMedia, onError: notify.error });
  const primary = useMutation({ mutationFn: (imageId: number) => businessApi.primaryImage(id!, imageId), onSuccess: onMedia, onError: notify.error });

  const isPharmacy = /pharmac/i.test(`${existing?.category?.slug || ''} ${existing?.category?.nameEn || ''}`) || /صيدل/.test(existing?.category?.name || '');
  const tabs = [
    { v: 'basic', l: t('owner.steps.basic') },
    { v: 'contact', l: t('owner.steps.contact') },
    { v: 'location', l: t('owner.steps.location') },
    { v: 'hours', l: t('owner.steps.hours') },
    { v: 'media', l: t('owner.steps.media') },
    ...(!isNew ? [
      { v: 'items', l: t('x.tabItems') },
      { v: 'offers', l: t('x.tabOffers') },
      { v: 'booking', l: t('x.tabBooking') },
      ...(isPharmacy ? [{ v: 'duty', l: t('x.tabDuty') }] : []),
      { v: 'plan', l: t('x.tabPlan') },
      { v: 'insights', l: t('owner.steps.insights') },
    ] : []),
  ];

  return (
    <Box>
      <PageHeader
        icon={<StorefrontRounded />}
        title={isNew ? (isAdmin ? t('admin.createBusiness') : t('owner.createTitle')) : existing?.name || t('owner.editTitle')}
        subtitle={isNew ? (isAdmin ? t('owner.adminHint') : t('owner.createHint')) : undefined}
        actions={
          <>
            {existing?.status && <Chip label={t(`owner.statuses.${existing.status}`)} color={STATUS_COLOR[existing.status]} sx={{ fontWeight: 700 }} />}
            {existing && <Button component={Link} to={`/b/${existing.slug}`} startIcon={<OpenInNewRounded />}>{t('owner.viewPublic')}</Button>}
            <Button variant="contained" startIcon={<SaveRounded />} disabled={save.isPending} onClick={() => validate() && save.mutate()}>{t('common.save')}</Button>
          </>
        }
      />
      {existing?.status === 'rejected' && existing.adminNote && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{existing.adminNote}</Alert>}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ mb: 2.5, '& .MuiTabs-indicator': { height: 3, borderRadius: 3 } }}>
        {tabs.map((x) => <Tab key={x.v} value={x.v} label={x.l} />)}
      </Tabs>

      {tab === 'basic' && (
        <>
          {isNew && !isAdmin && (
            <Section title={t('owner.steps.basic')}>
              <RadioGroup value={f.isOwner ? 'owner' : 'suggest'} onChange={(e) => set('isOwner', e.target.value === 'owner')}>
                <FormControlLabel value="owner" control={<Radio />} label={t('owner.isOwner')} />
                <FormControlLabel value="suggest" control={<Radio />} label={t('owner.suggestion')} />
              </RadioGroup>
            </Section>
          )}
          <Section title={t('owner.steps.basic')}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth required label={t('owner.nameAr')} value={f.name} onChange={(e) => set('name', e.target.value)} error={!!errors.name} helperText={errors.name} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label={t('owner.nameEn')} value={f.nameEn} onChange={(e) => set('nameEn', e.target.value)} inputProps={{ dir: 'ltr' }} /></Grid>
              <Grid item xs={12} md={4}>
                <TextField select fullWidth required label={t('common.category')} value={f.categoryId} onChange={(e) => setF((s) => ({ ...s, categoryId: Number(e.target.value), subCategoryId: '' }))} error={!!errors.categoryId} helperText={errors.categoryId}>
                  {(cats || []).map((c) => <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField select fullWidth label={t('common.subCategory')} value={f.subCategoryId} onChange={(e) => set('subCategoryId', e.target.value === '' ? '' : Number(e.target.value))} disabled={!category?.subCategories?.length}>
                  <MenuItem value="">—</MenuItem>
                  {(category?.subCategories || []).map((s) => <MenuItem key={s.id} value={s.id}>{ln(s)}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField select fullWidth required label={t('common.city')} value={f.cityId} onChange={(e) => set('cityId', Number(e.target.value))} error={!!errors.cityId} helperText={errors.cityId}>
                  {(cities || []).map((c) => <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}><TextField fullWidth label={t('owner.short')} value={f.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} inputProps={{ maxLength: 300 }} helperText={`${f.shortDescription.length}/300`} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline minRows={5} label={t('owner.descr')} value={f.description} onChange={(e) => set('description', e.target.value)} /></Grid>
              <Grid item xs={12} md={8}>
                <Autocomplete multiple freeSolo options={[]} value={f.tags} onChange={(_, v) => set('tags', (v as string[]).map((x) => x.trim()).filter(Boolean))}
                  renderTags={(v, getTagProps) => v.map((o, i) => <Chip {...getTagProps({ index: i })} key={o} label={o} size="small" />)}
                  renderInput={(p) => <TextField {...p} label={t('owner.tags')} helperText={t('owner.tagsHint')} />} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField select fullWidth label={t('business.price')} value={f.priceRange} onChange={(e) => set('priceRange', e.target.value === '' ? '' : Number(e.target.value))}>
                  <MenuItem value="">—</MenuItem>
                  {[1, 2, 3, 4].map((n) => <MenuItem key={n} value={n}>{'$'.repeat(n)}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </Section>
          <Section title={t('owner.amenities')}>
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
              {AMENITY_KEYS.map((k) => {
                const on = f.amenities.includes(k);
                return <Chip key={k} label={(dict.amenities as Record<string, string>)[k]} color={on ? 'primary' : 'default'} variant={on ? 'filled' : 'outlined'} onClick={() => set('amenities', on ? f.amenities.filter((a) => a !== k) : [...f.amenities, k])} />;
              })}
            </Stack>
          </Section>
          <Section title={t('owner.attributes')} hint={Object.values(dict.attributes).slice(0, 4).join('، ') + '...'}>
            <Stack spacing={1.5}>
              {f.attributes.map((a, i) => (
                <Stack key={i} direction="row" spacing={1}>
                  <Autocomplete freeSolo options={Object.keys(dict.attributes)} getOptionLabel={(o) => (dict.attributes as Record<string, string>)[o] || o} value={a.k} onInputChange={(_, v) => set('attributes', f.attributes.map((x, j) => (j === i ? { ...x, k: Object.entries(dict.attributes).find(([, l]) => l === v)?.[0] || v } : x)))} sx={{ flex: 1 }} renderInput={(p) => <TextField {...p} size="small" label={t('owner.attrKey')} />} />
                  <TextField size="small" sx={{ flex: 1.4 }} label={t('owner.attrValue')} value={a.v} onChange={(e) => set('attributes', f.attributes.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))} />
                  <IconButton onClick={() => set('attributes', f.attributes.filter((_, j) => j !== i))}><DeleteOutlineRounded /></IconButton>
                </Stack>
              ))}
              <Box><Button startIcon={<AddRounded />} onClick={() => set('attributes', [...f.attributes, { k: '', v: '' }])}>{t('owner.addAttr')}</Button></Box>
            </Stack>
          </Section>
        </>
      )}

      {tab === 'contact' && (
        <Section title={t('owner.steps.contact')}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField fullWidth label={t('common.phone')} value={f.phone} onChange={(e) => set('phone', e.target.value)} inputProps={{ dir: 'ltr' }} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label={t('owner.phone2')} value={f.phone2} onChange={(e) => set('phone2', e.target.value)} inputProps={{ dir: 'ltr' }} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label={t('business.whatsapp')} value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} inputProps={{ dir: 'ltr' }} InputProps={{ startAdornment: <InputAdornment position="start"><WhatsApp sx={{ color: '#25D366' }} /></InputAdornment> }} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label={t('common.email')} value={f.email} onChange={(e) => set('email', e.target.value)} inputProps={{ dir: 'ltr' }} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label={t('business.website')} value={f.website} onChange={(e) => set('website', e.target.value)} inputProps={{ dir: 'ltr' }} placeholder="https://" /></Grid>
            <Grid item xs={12}><Typography fontWeight={700} sx={{ mt: 1 }}>{t('owner.social')}</Typography></Grid>
            {SOCIAL_KEYS.map((k) => (
              <Grid item xs={12} md={6} key={k}><TextField fullWidth size="small" label={k} value={f.socialLinks[k] || ''} onChange={(e) => set('socialLinks', { ...f.socialLinks, [k]: e.target.value })} inputProps={{ dir: 'ltr' }} placeholder="https://" /></Grid>
            ))}
          </Grid>
        </Section>
      )}

      {tab === 'location' && (
        <Section title={t('owner.steps.location')} hint={t('owner.pickOnMap')}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}><TextField fullWidth label={t('business.district')} value={f.district} onChange={(e) => set('district', e.target.value)} /></Grid>
            <Grid item xs={12} md={8}><TextField fullWidth label={t('business.address')} value={f.address} onChange={(e) => set('address', e.target.value)} /></Grid>
          </Grid>
          <LocationPicker lat={f.latitude} lng={f.longitude} fallback={fallbackCenter} onChange={(lat, lng) => setF((s) => ({ ...s, latitude: lat, longitude: lng }))} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }} alignItems={{ sm: 'center' }}>
            <Button variant="outlined" startIcon={<MyLocationRounded />} disabled={geo.loading} onClick={async () => { const c = await geo.locate(); if (c) setF((s) => ({ ...s, latitude: c.lat, longitude: c.lng })); else notify.error(t('search.locationDenied')); }}>{t('owner.useMyLocation')}</Button>
            <TextField size="small" type="number" label={t('owner.lat')} value={f.latitude ?? ''} onChange={(e) => set('latitude', e.target.value === '' ? null : Number(e.target.value))} />
            <TextField size="small" type="number" label={t('owner.lng')} value={f.longitude ?? ''} onChange={(e) => set('longitude', e.target.value === '' ? null : Number(e.target.value))} />
          </Stack>
        </Section>
      )}

      {tab === 'hours' && (
        <Section title={t('owner.steps.hours')}>
          <HoursEditor value={f.workingHours} onChange={(v) => set('workingHours', v)} />
        </Section>
      )}

      {tab === 'media' && (
        isNew || !existing ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>{t('owner.saveFirst')}</Alert>
        ) : (
          <>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={8}>
                <Section title={t('owner.cover')}>
                  <Box sx={{ height: 200, borderRadius: 3, overflow: 'hidden', mb: 1.5 }}><Cover src={existing.coverImage} tint={existing.category?.color} icon={existing.category?.icon} /></Box>
                  <ImageDropzone multiple={false} height={80} loading={cover.isPending} onFiles={(fs) => cover.mutate(fs[0])} hint={t('common.change')} />
                </Section>
              </Grid>
              <Grid item xs={12} md={4}>
                <Section title={t('owner.logo')}>
                  <Box sx={{ width: 120, height: 120, borderRadius: '28%', overflow: 'hidden', mx: 'auto', mb: 1.5, border: (th) => `1px solid ${th.custom.border}` }}><Cover src={existing.logoImage} tint={existing.category?.color} icon={existing.category?.icon} /></Box>
                  <ImageDropzone multiple={false} height={80} loading={logo.isPending} onFiles={(fs) => logo.mutate(fs[0])} hint={t('common.change')} />
                </Section>
              </Grid>
            </Grid>
            <Section title={t('owner.gallery')}>
              <ImageDropzone loading={upload.isPending} onFiles={(fs) => upload.mutate(fs)} hint={t('owner.dropHint')} />
              <Grid container spacing={1.5} sx={{ mt: 1 }}>
                {existing.images.map((img) => (
                  <Grid item xs={6} sm={4} md={3} key={img.id}>
                    <Box sx={{ position: 'relative', aspectRatio: '1', borderRadius: 3, overflow: 'hidden', outline: img.isPrimary ? '3px solid' : 'none', outlineColor: 'primary.main' }}>
                      <Box component="img" src={img.url} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 6, insetInlineEnd: 6 }}>
                        <Tooltip title={img.isPrimary ? t('owner.primary') : t('owner.setPrimary')}><IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,.9)' }} onClick={() => primary.mutate(img.id)}>{img.isPrimary ? <StarRounded fontSize="small" color="warning" /> : <StarOutlineRounded fontSize="small" />}</IconButton></Tooltip>
                        <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,.9)' }} onClick={() => rmImg.mutate(img.id)}><DeleteOutlineRounded fontSize="small" color="error" /></IconButton>
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Section>
          </>
        )
      )}

      {tab === 'insights' && stats && (
        <Grid container spacing={2}>
          <Grid item xs={6} md={4}><StatCard label={t('owner.insightsViews')} value={stats.views} icon={<VisibilityRounded />} /></Grid>
          <Grid item xs={6} md={4}><StatCard label={t('owner.insightsCalls')} value={stats.clicks.phone} icon={<CallRounded />} color="#12B76A" /></Grid>
          <Grid item xs={6} md={4}><StatCard label={t('owner.insightsWhatsapp')} value={stats.clicks.whatsapp} icon={<WhatsApp />} color="#25D366" /></Grid>
          <Grid item xs={6} md={4}><StatCard label={t('owner.insightsDirections')} value={stats.clicks.directions} icon={<DirectionsRounded />} color="#0BA5EC" /></Grid>
          <Grid item xs={6} md={4}><StatCard label={t('owner.insightsWebsite')} value={stats.clicks.website} icon={<LanguageRounded />} color="#475569" /></Grid>
          <Grid item xs={6} md={4}><StatCard label={t('owner.insightsFavorites')} value={stats.favorites} icon={<FavoriteRounded />} color="#F04438" /></Grid>
          <Grid item xs={12} md={6}><StatCard label={t('nav.reviews')} value={`${stats.averageRating.toFixed(1)} ★ (${stats.reviews})`} icon={<StarRounded />} color="#F79009" hint={`+${stats.reviewsLast30Days} / 30d`} /></Grid>
        </Grid>
      )}

      {existing && tab === 'items' && <ItemsTab business={existing} />}
      {existing && tab === 'offers' && <OffersTab business={existing} />}
      {existing && tab === 'booking' && <BookingTab business={existing} onSaved={() => qc.invalidateQueries({ queryKey: ['business', 'managed', id] })} />}
      {existing && tab === 'duty' && <DutyTab business={existing} />}
      {existing && tab === 'plan' && <PlanTab business={existing} />}

      {['basic', 'contact', 'location', 'hours'].includes(tab) && (
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
          <Button variant="contained" size="large" startIcon={<SaveRounded />} disabled={save.isPending} onClick={() => validate() && save.mutate()}>{t('common.save')}</Button>
        </Stack>
      )}
    </Box>
  );
};
