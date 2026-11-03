import { Alert, Avatar, Box, Button, Card, CardContent, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, Grid, IconButton, MenuItem, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import HandymanRounded from '@mui/icons-material/HandymanRounded';
import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded';
import CampaignRounded from '@mui/icons-material/CampaignRounded';
import WorkRounded from '@mui/icons-material/WorkRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import CallRounded from '@mui/icons-material/CallRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import VerifiedRounded from '@mui/icons-material/VerifiedRounded';
import SendRounded from '@mui/icons-material/SendRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingApi, listingApi, requestApi } from '@/api/services';
import type { Listing, ServiceRequest } from '@/api/types';
import { useCategories, useCities } from '@/hooks/queries';
import { useNotify } from '@/hooks/useNotify';
import { usePrefs } from '@/store/prefsStore';
import { useLocalName, useT } from '@/i18n';
import { EmptyState, PageHeader } from '@/components/common/Section';
import { GridSkeleton, RowsSkeleton } from '@/components/common/Skeletons';
import { ImageDropzone } from '@/components/common/ImageDropzone';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusChip } from '@/components/common/StatusChip';
import { RatingStars } from '@/components/common/RatingStars';
import { LISTING_META, ListingPrice } from '@/components/business/ExtraCards';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { fmtDate, formatPrice, fromNow, telLink, waLink } from '@/utils/format';

/* ───────────── Request a service (quote) ───────────── */
export const RequestServicePage = () => {
  const { t } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const navigate = useNavigate();
  const prefCity = usePrefs((s) => s.cityId);
  const { data: cats } = useCategories();
  const { data: cities } = useCities();
  const [f, setF] = useState({ categoryId: '' as number | '', subCategoryId: '' as number | '', cityId: (prefCity ?? '') as number | '', district: '', title: '', description: '', budget: '', preferredDate: '', sharePhone: true });
  const [files, setFiles] = useState<File[]>([]);
  const set = (k: keyof typeof f, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const cat = cats?.find((c) => c.id === f.categoryId);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = Number(p.get('categoryId'));
    if (c) setF((s) => ({ ...s, categoryId: c, subCategoryId: Number(p.get('subCategoryId')) || '' }));
  }, []);

  const m = useMutation({
    mutationFn: () => requestApi.create({
      categoryId: f.categoryId, subCategoryId: f.subCategoryId || undefined, cityId: f.cityId, district: f.district || undefined, title: f.title, description: f.description,
      budget: f.budget || undefined, preferredDate: f.preferredDate || undefined, sharePhone: f.sharePhone,
    }, files),
    onSuccess: (r) => { notify.success(t('x.requestSent', { n: r.notifiedBusinesses })); navigate('/account/requests'); },
    onError: notify.error,
  });
  const valid = f.categoryId && f.cityId && f.title.trim().length >= 3 && f.description.trim().length >= 10;

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <PageHeader icon={<HandymanRounded />} title={t('x.requestService')} subtitle={t('x.requestServiceSub')} />
      <Card><CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth required label={t('common.category')} value={f.categoryId} onChange={(e) => { set('categoryId', Number(e.target.value)); set('subCategoryId', ''); }}>
              {(cats || []).map((c) => <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label={t('common.subCategory')} value={f.subCategoryId} disabled={!cat?.subCategories?.length} onChange={(e) => set('subCategoryId', e.target.value === '' ? '' : Number(e.target.value))}>
              <MenuItem value="">{t('common.all')}</MenuItem>
              {(cat?.subCategories || []).map((s) => <MenuItem key={s.id} value={s.id}>{ln(s)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth required label={t('common.city')} value={f.cityId} onChange={(e) => set('cityId', Number(e.target.value))}>
              {(cities || []).map((c) => <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label={t('business.district')} value={f.district} onChange={(e) => set('district', e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth required label={t('x.requestTitle')} placeholder={t('x.requestTitlePh')} value={f.title} onChange={(e) => set('title', e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth required multiline minRows={4} label={t('x.requestDesc')} value={f.description} onChange={(e) => set('description', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label={t('x.budget')} value={f.budget} onChange={(e) => set('budget', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth type="date" label={t('x.preferredDate')} InputLabelProps={{ shrink: true }} value={f.preferredDate} onChange={(e) => set('preferredDate', e.target.value)} /></Grid>
          <Grid item xs={12}>
            <ImageDropzone onFiles={(fs) => setFiles((p) => [...p, ...fs].slice(0, 5))} height={110} />
            {files.length > 0 && <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>{files.map((fl, i) => <Chip key={i} label={fl.name} onDelete={() => setFiles((p) => p.filter((_, j) => j !== i))} />)}</Stack>}
          </Grid>
          <Grid item xs={12}><FormControlLabel control={<Switch checked={f.sharePhone} onChange={(e) => set('sharePhone', e.target.checked)} />} label={t('x.sharePhone')} /></Grid>
        </Grid>
        <Button fullWidth size="large" variant="contained" sx={{ mt: 2 }} startIcon={<SendRounded />} disabled={!valid || m.isPending} onClick={() => m.mutate()}>{t('common.submit')}</Button>
      </CardContent></Card>
    </Container>
  );
};

/* ───────────── My service requests ───────────── */
export const RequestDetailDialog = ({ id, onClose }: { id: number | null; onClose: () => void }) => {
  const { t, locale } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const qc = useQueryClient();
  const { data: r } = useQuery({ queryKey: ['service-request', id], queryFn: () => requestApi.get(id!), enabled: Boolean(id) });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['service-request', id] }); qc.invalidateQueries({ queryKey: ['service-requests'] }); };
  const decide = useMutation({ mutationFn: ({ qid, s }: { qid: number; s: 'accepted' | 'rejected' }) => requestApi.decide(qid, s), onSuccess: refresh, onError: notify.error });
  const status = useMutation({ mutationFn: (s: string) => requestApi.setStatus(id!, s), onSuccess: () => { refresh(); notify.success(t('common.saved')); }, onError: notify.error });
  return (
    <Dialog open={Boolean(id)} onClose={onClose} fullWidth maxWidth="md">
      {!r ? <DialogContent><RowsSkeleton rows={3} /></DialogContent> : (
        <>
          <DialogTitle sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {r.title} <StatusChip status={r.status} ns="reqStatus" />
          </DialogTitle>
          <DialogContent dividers>
            <Typography color="text.secondary" variant="body2">{ln(r.category)}{r.subCategory ? ` · ${ln(r.subCategory)}` : ''} · {ln(r.city)}{r.district ? ` · ${r.district}` : ''} · {fromNow(r.createdAt)}</Typography>
            <Typography sx={{ mt: 1.5, whiteSpace: 'pre-line' }}>{r.description}</Typography>
            {(r.budget || r.preferredDate) && <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>{r.budget && <Chip label={`${t('x.budget')}: ${r.budget}`} />}{r.preferredDate && <Chip label={`${t('x.preferredDate')}: ${fmtDate(r.preferredDate)}`} />}</Stack>}
            {r.images?.length > 0 && <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>{r.images.map((im, i) => <Box key={i} component="img" src={im.url} sx={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 2 }} />)}</Stack>}
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>{t('x.quotes')} ({r.quotes?.length || 0})</Typography>
            {!r.quotes?.length ? <Alert severity="info">{t('x.noQuotes')}</Alert> : (
              <Stack spacing={1.5}>
                {r.quotes.map((q) => (
                  <Card key={q.id} variant="outlined" sx={{ borderColor: q.status === 'accepted' ? 'success.main' : undefined }}>
                    <CardContent>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar src={q.business?.logoImage || undefined}>{q.business?.name[0]}</Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontWeight={700} component={Link} to={`/b/${q.business?.slug}`} sx={{ color: 'inherit', textDecoration: 'none' }}>
                            {q.business?.name} {q.business?.isVerified && <VerifiedRounded color="primary" sx={{ fontSize: 16, verticalAlign: 'middle' }} />}
                          </Typography>
                          {q.business && <RatingStars value={q.business.averageRating} count={q.business.reviewCount} />}
                        </Box>
                        <Box sx={{ textAlign: 'end' }}>
                          {q.price && <Typography fontWeight={800} color="primary.main">{formatPrice(q.price, q.currency, locale)}</Typography>}
                          {q.etaDays && <Typography variant="caption" color="text.secondary">{t('x.days', { n: q.etaDays })}</Typography>}
                        </Box>
                      </Stack>
                      <Typography sx={{ mt: 1, whiteSpace: 'pre-line' }}>{q.message}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} alignItems="center" flexWrap="wrap" useFlexGap>
                        <StatusChip status={q.status} ns="quoteStatus" />
                        <Box sx={{ flex: 1 }} />
                        {q.business?.phone && <IconButton size="small" color="primary" href={telLink(q.business.phone)}><CallRounded /></IconButton>}
                        {q.business?.whatsapp && <IconButton size="small" sx={{ color: '#25D366' }} href={waLink(q.business.whatsapp, r.title)} target="_blank"><WhatsApp /></IconButton>}
                        {q.status === 'pending' && r.status === 'open' && (
                          <>
                            <Button size="small" color="error" onClick={() => decide.mutate({ qid: q.id, s: 'rejected' })}>{t('x.reject')}</Button>
                            <Button size="small" variant="contained" color="success" onClick={() => decide.mutate({ qid: q.id, s: 'accepted' })}>{t('x.accept')}</Button>
                          </>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            {(r.status === 'open' || r.status === 'assigned') && <Button color="inherit" onClick={() => status.mutate('closed')}>{t('x.closeRequest')}</Button>}
            {r.status === 'open' && <Button color="error" onClick={() => status.mutate('cancelled')}>{t('x.cancelRequest')}</Button>}
            <Button variant="contained" onClick={onClose}>{t('common.close')}</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

const RequestRow = ({ r, onClick, extra }: { r: ServiceRequest; onClick: () => void; extra?: React.ReactNode }) => {
  const { t } = useT();
  const ln = useLocalName();
  return (
    <Card sx={{ cursor: 'pointer', transition: '.2s', '&:hover': { boxShadow: 6 } }} onClick={onClick}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <CategoryIcon icon={r.category?.icon} color={r.category?.color} size={46} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={700} noWrap>{r.title}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{ln(r.category)}{r.subCategory ? ` · ${ln(r.subCategory)}` : ''} · {ln(r.city)} · {fromNow(r.createdAt)}</Typography>
          </Box>
          <Stack alignItems="flex-end" spacing={0.5}>
            <StatusChip status={r.status} ns="reqStatus" />
            <Typography variant="caption" color="text.secondary">{t('x.quotes')}: {r.quotesCount}</Typography>
          </Stack>
        </Stack>
        {extra}
      </CardContent>
    </Card>
  );
};

export const MyRequests = () => {
  const { t } = useT();
  const [open, setOpen] = useState<number | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['service-requests', 'mine'], queryFn: () => requestApi.mine({ limit: 50 }) });
  return (
    <Box>
      <PageHeader icon={<HandymanRounded />} title={t('x.myRequests')} actions={<Button variant="contained" startIcon={<AddRounded />} component={Link} to="/request-service">{t('x.requestService')}</Button>} />
      {isLoading ? <RowsSkeleton /> : !data?.items.length ? <Card><EmptyState icon={<HandymanRounded />} title={t('x.myRequests')} text={t('x.requestServiceSub')} action={<Button variant="contained" component={Link} to="/request-service">{t('x.requestService')}</Button>} /></Card> : (
        <Stack spacing={1.5}>{data.items.map((r) => <RequestRow key={r.id} r={r} onClick={() => setOpen(r.id)} />)}</Stack>
      )}
      <RequestDetailDialog id={open} onClose={() => setOpen(null)} />
    </Box>
  );
};
export { RequestRow };

/* ───────────── My bookings ───────────── */
export const MyBookings = () => {
  const { t, locale } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const [all, setAll] = useState(false);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['appointments', 'mine', all], queryFn: () => bookingApi.mine(all) });
  const cancel = useMutation({ mutationFn: (id: number) => bookingApi.setStatus(id, 'cancelled'), onSuccess: () => { setCancelId(null); qc.invalidateQueries({ queryKey: ['appointments'] }); notify.success(t('common.saved')); }, onError: notify.error });
  return (
    <Box>
      <PageHeader icon={<EventAvailableRounded />} title={t('x.myBookings')} actions={<FormControlLabel control={<Switch checked={all} onChange={(e) => setAll(e.target.checked)} />} label={t('common.all')} />} />
      {isLoading ? <RowsSkeleton /> : !data?.length ? <Card><EmptyState icon={<EventAvailableRounded />} title={t('x.noBookings')} /></Card> : (
        <Grid container spacing={2}>
          {data.map((a) => (
            <Grid item xs={12} md={6} key={a.id}>
              <Card><CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 64, textAlign: 'center', borderRadius: 3, py: 1, background: (th) => th.custom.gradient, color: '#fff' }}>
                    <Typography variant="h5" fontWeight={800} lineHeight={1}>{fmtDate(a.date, 'D')}</Typography>
                    <Typography variant="caption">{fmtDate(a.date, 'MMM')}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} component={Link} to={`/b/${a.business?.slug}`} sx={{ color: 'inherit', textDecoration: 'none' }} noWrap>{a.business?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{fmtDate(a.date, 'dddd')} {a.time ? `· ${a.time.slice(0, 5)}` : ''} {a.partySize > 1 ? `· ${t('x.partySize')}: ${a.partySize}` : ''}</Typography>
                    {a.item && <Typography variant="body2">{a.item.name}{a.item.price ? ` — ${formatPrice(a.item.price, 'SYP', locale)}` : ''}</Typography>}
                  </Box>
                  <StatusChip status={a.status} ns="apptStatus" />
                </Stack>
                {a.ownerNote && <Alert severity="info" sx={{ mt: 1.5 }}>{a.ownerNote}</Alert>}
                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} justifyContent="flex-end">
                  {a.business?.phone && <Button size="small" startIcon={<CallRounded />} href={telLink(a.business.phone)}>{t('common.phone')}</Button>}
                  {['pending', 'confirmed'].includes(a.status) && <Button size="small" color="error" onClick={() => setCancelId(a.id)}>{t('x.cancelBooking')}</Button>}
                </Stack>
              </CardContent></Card>
            </Grid>
          ))}
        </Grid>
      )}
      <ConfirmDialog open={Boolean(cancelId)} danger title={t('x.cancelBooking')} text={t('common.areYouSure')} loading={cancel.isPending} onClose={() => setCancelId(null)} onConfirm={() => cancel.mutate(cancelId!)} />
    </Box>
  );
};

/* ───────────── My listings ───────────── */
const ApplicantsDialog = ({ listing, onClose }: { listing: Listing | null; onClose: () => void }) => {
  const { t } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['applications', listing?.id], queryFn: () => listingApi.applications(listing!.id), enabled: Boolean(listing) });
  const m = useMutation({ mutationFn: ({ id, s }: { id: number; s: string }) => listingApi.setApplicationStatus(id, s), onSuccess: () => qc.invalidateQueries({ queryKey: ['applications', listing?.id] }), onError: notify.error });
  return (
    <Dialog open={Boolean(listing)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('x.applicants')} — {listing?.title}</DialogTitle>
      <DialogContent dividers>
        {isLoading ? <RowsSkeleton rows={3} /> : !data?.length ? <EmptyState icon={<PeopleRounded />} title={t('common.noResults')} /> : (
          <Stack spacing={1.5} divider={<Divider />}>
            {data.map((a) => (
              <Box key={a.id}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar src={a.user?.avatar || undefined}>{a.user?.fullName?.[0]}</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={700}>{a.user?.fullName}</Typography>
                    <Typography variant="caption" color="text.secondary">{fromNow(a.createdAt)} · {a.phone || a.user?.phone || a.user?.email}</Typography>
                  </Box>
                  <TextField select size="small" value={a.status} onChange={(e) => m.mutate({ id: a.id, s: e.target.value })} sx={{ minWidth: 130 }}>
                    {['new', 'viewed', 'shortlisted', 'rejected', 'hired'].map((s) => <MenuItem key={s} value={s}>{t(`x.appStatus.${s}`)}</MenuItem>)}
                  </TextField>
                </Stack>
                {a.message && <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-line' }}>{a.message}</Typography>}
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {(a.phone || a.user?.phone) && <Button size="small" startIcon={<CallRounded />} href={telLink(a.phone || a.user?.phone)}>{t('common.phone')}</Button>}
                  {a.cvUrl && <Button size="small" href={a.cvUrl} target="_blank">CV</Button>}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>{t('common.close')}</Button></DialogActions>
    </Dialog>
  );
};

export const MyListings = () => {
  const { t } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const qc = useQueryClient();
  const [del, setDel] = useState<Listing | null>(null);
  const [apps, setApps] = useState<Listing | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['listings', 'mine'], queryFn: () => listingApi.mine({ limit: 50 }) });
  const inv = () => qc.invalidateQueries({ queryKey: ['listings'] });
  const status = useMutation({ mutationFn: ({ id, s }: { id: string; s: 'closed' | 'active' }) => listingApi.setStatus(id, s), onSuccess: () => { inv(); notify.success(t('common.saved')); }, onError: notify.error });
  const remove = useMutation({ mutationFn: (id: string) => listingApi.remove(id), onSuccess: () => { setDel(null); inv(); notify.success(t('common.deleted')); }, onError: notify.error });
  const newBtns = (
    <>
      {(['real_estate', 'car', 'job'] as const).map((ty) => (
        <Button key={ty} variant="outlined" startIcon={LISTING_META[ty].icon} component={Link} to={`/account/listings/new?type=${ty}`}>{t(`x.${LISTING_META[ty].key}`)}</Button>
      ))}
    </>
  );
  return (
    <Box>
      <PageHeader icon={<CampaignRounded />} title={t('x.myListings')} actions={newBtns} />
      {isLoading ? <GridSkeleton md={4} count={3} /> : !data?.items.length ? <Card><EmptyState icon={<CampaignRounded />} title={t('x.noListings')} action={<Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>{newBtns}</Stack>} /></Card> : (
        <Grid container spacing={2}>
          {data.items.map((l) => (
            <Grid item xs={12} sm={6} lg={4} key={l.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box component={Link} to={`/l/${l.slug}`} sx={{ position: 'relative', aspectRatio: '16/9', bgcolor: 'action.hover', display: 'block' }}>
                  {l.images?.[0] ? <Box component="img" src={l.images[0].url} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', color: LISTING_META[l.type].color, '& svg': { fontSize: 48 } }}>{LISTING_META[l.type].icon}</Box>}
                  <Box sx={{ position: 'absolute', top: 8, insetInlineStart: 8 }}><StatusChip status={l.status} ns="listingStatus" /></Box>
                </Box>
                <CardContent sx={{ flex: 1 }}>
                  <Typography fontWeight={700} noWrap>{l.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{t(`x.purposes.${l.purpose}`)} · {ln(l.city)} · {fromNow(l.createdAt)}</Typography>
                  <Box sx={{ mt: 1 }}><ListingPrice l={l} /></Box>
                  {l.status === 'rejected' && l.adminNote && <Alert severity="error" sx={{ mt: 1 }}>{l.adminNote}</Alert>}
                </CardContent>
                <Divider />
                <Stack direction="row" spacing={0.5} sx={{ p: 1 }} alignItems="center">
                  <Tooltip title={t('common.edit')}><IconButton component={Link} to={`/account/listings/${l.id}`}><EditRounded /></IconButton></Tooltip>
                  {l.type === 'job' && <Button size="small" startIcon={<PeopleRounded />} onClick={() => setApps(l)}>{t('x.applicants')} ({l.applicationsCount ?? 0})</Button>}
                  <Box sx={{ flex: 1 }} />
                  {l.status === 'active' && <Button size="small" onClick={() => status.mutate({ id: l.id, s: 'closed' })}>{t('x.closeListing')}</Button>}
                  {['closed', 'expired'].includes(l.status) && <Button size="small" onClick={() => status.mutate({ id: l.id, s: 'active' })}>{t('x.reopen')}</Button>}
                  <IconButton color="error" onClick={() => setDel(l)}><DeleteOutlineRounded /></IconButton>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <ApplicantsDialog listing={apps} onClose={() => setApps(null)} />
      <ConfirmDialog open={Boolean(del)} danger title={t('common.delete')} text={t('common.cannotUndo')} loading={remove.isPending} onClose={() => setDel(null)} onConfirm={() => remove.mutate(del!.id)} />
    </Box>
  );
};

/* ───────────── My job applications ───────────── */
export const MyApplications = () => {
  const { t } = useT();
  const { data, isLoading } = useQuery({ queryKey: ['applications', 'mine'], queryFn: listingApi.myApplications });
  return (
    <Box>
      <PageHeader icon={<WorkRounded />} title={t('x.myApplications')} actions={<Button variant="outlined" component={Link} to="/jobs">{t('x.jobs')}</Button>} />
      {isLoading ? <RowsSkeleton /> : !data?.length ? <Card><EmptyState icon={<WorkRounded />} title={t('common.noResults')} action={<Button variant="contained" component={Link} to="/jobs">{t('x.jobs')}</Button>} /></Card> : (
        <Stack spacing={1.5}>
          {data.map((a) => (
            <Card key={a.id}><CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: LISTING_META.job.color }}><WorkRounded /></Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={700} component={Link} to={`/l/${a.listing?.slug}`} sx={{ color: 'inherit', textDecoration: 'none' }} noWrap>{a.listing?.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{a.listing?.city} · {fromNow(a.createdAt)}</Typography>
                </Box>
                <StatusChip status={a.status} ns="appStatus" />
              </Stack>
            </CardContent></Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};
