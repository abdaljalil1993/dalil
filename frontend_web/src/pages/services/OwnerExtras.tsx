import { Alert, AlertTitle, Avatar, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, LinearProgress, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import EventNoteRounded from '@mui/icons-material/EventNoteRounded';
import InboxRounded from '@mui/icons-material/InboxRounded';
import WorkspacePremiumRounded from '@mui/icons-material/WorkspacePremiumRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import CallRounded from '@mui/icons-material/CallRounded';
import CelebrationRounded from '@mui/icons-material/CelebrationRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { billingApi, bookingApi, businessApi, requestApi } from '@/api/services';
import type { Plan, PlanFeatures, ServiceRequest } from '@/api/types';
import { useNotify } from '@/hooks/useNotify';
import { useLocalName, useT } from '@/i18n';
import { EmptyState, PageHeader } from '@/components/common/Section';
import { RowsSkeleton } from '@/components/common/Skeletons';
import { StatusChip } from '@/components/common/StatusChip';
import { DataTable } from '@/components/common/DataTable';
import { fmtDate, formatPrice, fromNow, limitLabel, telLink } from '@/utils/format';
import { RequestRow } from './AccountExtras';

export const useMyBusinesses = () => useQuery({ queryKey: ['businesses', 'mine'], queryFn: () => businessApi.mine({ limit: 50 }) });

const BizSelect = ({ value, onChange, allowAll = true }: { value: string; onChange: (v: string) => void; allowAll?: boolean }) => {
  const { t } = useT();
  const { data } = useMyBusinesses();
  return (
    <TextField select size="small" label={t('nav.myBusinesses')} value={value} onChange={(e) => onChange(e.target.value)} sx={{ minWidth: 220 }}>
      {allowAll && <MenuItem value="">{t('common.all')}</MenuItem>}
      {(data?.items || []).map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
    </TextField>
  );
};

/* ───────────── Owner bookings ───────────── */
export const OwnerBookings = () => {
  const { t } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const [businessId, setBiz] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { data, isLoading } = useQuery({ queryKey: ['appointments', 'owner', businessId, status, date, page, limit], queryFn: () => bookingApi.owner({ businessId: businessId || undefined, status: status || undefined, date: date || undefined, page, limit }) });
  const m = useMutation({ mutationFn: ({ id, s }: { id: number; s: string }) => bookingApi.setStatus(id, s), onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); notify.success(t('common.saved')); }, onError: notify.error });
  const act = (id: number, s: string, label: string, color: 'success' | 'error' | 'primary' | 'inherit' = 'primary') => <Button key={s} size="small" color={color} onClick={() => m.mutate({ id, s })}>{label}</Button>;
  return (
    <Box>
      <PageHeader icon={<EventNoteRounded />} title={t('x.ownerBookings')} />
      <DataTable
        loading={isLoading}
        rows={data?.items || []}
        rowKey={(r) => r.id}
        meta={data?.meta}
        onPage={setPage}
        onLimit={(l) => { setLimit(l); setPage(1); }}
        toolbar={
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <BizSelect value={businessId} onChange={(v) => { setBiz(v); setPage(1); }} />
            <TextField select size="small" label={t('common.status')} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} sx={{ minWidth: 160 }}>
              <MenuItem value="">{t('common.all')}</MenuItem>
              {['pending', 'confirmed', 'completed', 'rejected', 'cancelled', 'no_show'].map((s) => <MenuItem key={s} value={s}>{t(`x.apptStatus.${s}`)}</MenuItem>)}
            </TextField>
            <TextField size="small" type="date" label={t('common.date')} InputLabelProps={{ shrink: true }} value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} />
          </Stack>
        }
        empty={<EmptyState icon={<EventNoteRounded />} title={t('x.noBookings')} />}
        columns={[
          { key: 'date', label: t('common.date'), render: (a) => <><Typography fontWeight={700}>{fmtDate(a.date, 'ddd D MMM')}</Typography><Typography variant="caption" color="text.secondary">{a.time?.slice(0, 5) || t('x.bookDay')}</Typography></> },
          { key: 'user', label: t('common.name'), render: (a) => <Stack direction="row" spacing={1} alignItems="center"><Avatar src={a.user?.avatar || undefined} sx={{ width: 30, height: 30 }}>{a.user?.fullName?.[0]}</Avatar><Box><Typography variant="body2" fontWeight={600}>{a.user?.fullName}</Typography>{(a.phone || a.user?.phone) && <Typography variant="caption" component="a" href={telLink(a.phone || a.user?.phone)} color="primary.main">{a.phone || a.user?.phone}</Typography>}</Box></Stack> },
          { key: 'biz', label: t('x.service'), hideOnMobile: true, render: (a) => <><Typography variant="body2">{a.business?.name}</Typography><Typography variant="caption" color="text.secondary">{a.item?.name || ''}{a.partySize > 1 ? ` · ${a.partySize}` : ''}</Typography>{a.note && <Typography variant="caption" display="block">“{a.note}”</Typography>}</> },
          { key: 'status', label: t('common.status'), render: (a) => <StatusChip status={a.status} ns="apptStatus" /> },
          {
            key: 'actions', label: t('common.actions'), render: (a) => (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {a.status === 'pending' && [act(a.id, 'confirmed', t('x.confirm'), 'success'), act(a.id, 'rejected', t('x.reject'), 'error')]}
                {a.status === 'confirmed' && [act(a.id, 'completed', t('x.complete')), act(a.id, 'no_show', t('x.noShow'), 'inherit')]}
              </Stack>
            ),
          },
        ]}
      />
    </Box>
  );
};

/* ───────────── Service requests inbox ───────────── */
const QuoteDialog = ({ r, onClose }: { r: ServiceRequest | null; onClose: () => void }) => {
  const { t, locale } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const qc = useQueryClient();
  const [f, setF] = useState({ businessId: '', price: '', message: '', etaDays: '' });
  useEffect(() => { if (r) setF({ businessId: r.myQuote?.business?.id || r.matchingBusinesses?.[0]?.id || '', price: r.myQuote?.price ? String(Number(r.myQuote.price)) : '', message: r.myQuote?.message || '', etaDays: r.myQuote?.etaDays ? String(r.myQuote.etaDays) : '' }); }, [r]);
  const send = useMutation({
    mutationFn: () => requestApi.quote(r!.id, { businessId: f.businessId, message: f.message, price: f.price ? Number(f.price) : undefined, etaDays: f.etaDays ? Number(f.etaDays) : undefined }),
    onSuccess: () => { notify.success(t('common.saved')); qc.invalidateQueries({ queryKey: ['service-requests'] }); onClose(); },
    onError: notify.error,
  });
  const withdraw = useMutation({ mutationFn: () => requestApi.withdraw(r!.myQuote!.id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['service-requests'] }); onClose(); }, onError: notify.error });
  return (
    <Dialog open={Boolean(r)} onClose={onClose} fullWidth maxWidth="sm">
      {r && (
        <>
          <DialogTitle>{r.title}</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary">{r.user?.fullName} · {ln(r.category)}{r.subCategory ? ` · ${ln(r.subCategory)}` : ''} · {ln(r.city)}{r.district ? ` · ${r.district}` : ''} · {fromNow(r.createdAt)}</Typography>
            <Typography sx={{ mt: 1.5, whiteSpace: 'pre-line' }}>{r.description}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
              {r.budget && <Chip label={`${t('x.budget')}: ${r.budget}`} />}
              {r.preferredDate && <Chip label={`${t('x.preferredDate')}: ${fmtDate(r.preferredDate)}`} />}
              {r.phone && <Chip color="primary" icon={<CallRounded />} label={r.phone} component="a" href={telLink(r.phone)} clickable />}
            </Stack>
            {r.images?.length > 0 && <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>{r.images.map((im, i) => <Box key={i} component="a" href={im.url} target="_blank"><Box component="img" src={im.url} sx={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 2 }} /></Box>)}</Stack>}
            <Divider sx={{ my: 2 }} />
            {r.myQuote && <Alert severity="info" sx={{ mb: 2 }}>{t('x.yourQuote')}: <StatusChip status={r.myQuote.status} ns="quoteStatus" /> {r.myQuote.price && formatPrice(r.myQuote.price, r.myQuote.currency, locale)}</Alert>}
            {r.status === 'open' && (!r.myQuote || r.myQuote.status === 'pending') && (
              <Stack spacing={2}>
                {(r.matchingBusinesses?.length || 0) > 1 && (
                  <TextField select label={t('nav.myBusinesses')} value={f.businessId} onChange={(e) => setF({ ...f, businessId: e.target.value })}>
                    {r.matchingBusinesses!.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                  </TextField>
                )}
                <Stack direction="row" spacing={2}>
                  <TextField fullWidth type="number" label={t('x.price')} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
                  <TextField fullWidth type="number" label={t('x.etaDays')} value={f.etaDays} onChange={(e) => setF({ ...f, etaDays: e.target.value })} />
                </Stack>
                <TextField multiline minRows={3} required label={t('x.quoteMessage')} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            {r.myQuote?.status === 'pending' && <Button color="error" onClick={() => withdraw.mutate()}>{t('common.delete')}</Button>}
            <Button onClick={onClose}>{t('common.close')}</Button>
            {r.status === 'open' && (!r.myQuote || r.myQuote.status === 'pending') && <Button variant="contained" disabled={f.message.trim().length < 5 || !f.businessId || send.isPending} onClick={() => send.mutate()}>{t('x.sendQuote')}</Button>}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export const RequestsInbox = () => {
  const { t } = useT();
  const [open, setOpen] = useState<ServiceRequest | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['service-requests', 'inbox'], queryFn: () => requestApi.inbox({ limit: 50 }) });
  return (
    <Box>
      <PageHeader icon={<InboxRounded />} title={t('x.inbox')} subtitle={t('x.inboxSub')} />
      {isLoading ? <RowsSkeleton /> : !data?.items.length ? <Card><EmptyState icon={<InboxRounded />} title={t('common.noResults')} text={t('x.enableQuotesHint')} /></Card> : (
        <Stack spacing={1.5}>
          {data.items.map((r) => (
            <RequestRow key={r.id} r={r} onClick={() => setOpen(r)} extra={r.myQuote ? <Box sx={{ mt: 1 }}><Chip size="small" color="primary" variant="outlined" label={`${t('x.yourQuote')}: ${t(`x.quoteStatus.${r.myQuote.status}`)}`} /></Box> : undefined} />
          ))}
        </Stack>
      )}
      <QuoteDialog r={open} onClose={() => setOpen(null)} />
    </Box>
  );
};

/* ───────────── Subscription / plans ───────────── */
const FEATURE_KEYS: (keyof PlanFeatures)[] = ['maxImages', 'maxItems', 'maxActiveOffers', 'maxActiveListings', 'bookings', 'quotes', 'advancedStats', 'verifiedBadge', 'whatsappButton', 'socialLinks', 'featuredDaysPerMonth', 'priorityBoost'];

export const FeatureValue = ({ k, v }: { k: keyof PlanFeatures; v: number | boolean }) => {
  const { t } = useT();
  if (typeof v === 'boolean') return v ? <CheckRounded color="success" fontSize="small" /> : <CloseRounded color="disabled" fontSize="small" />;
  if (k === 'priorityBoost') return <>{v > 0 ? <CheckRounded color="success" fontSize="small" /> : <CloseRounded color="disabled" fontSize="small" />}</>;
  return <Typography variant="body2" fontWeight={700}>{v === 0 ? <CloseRounded color="disabled" fontSize="small" /> : limitLabel(v, t('x.unlimited'))}</Typography>;
};

export const PlanCard = ({ p, period, current, onChoose, disabled }: { p: Plan; period: 'monthly' | 'yearly'; current?: boolean; onChoose?: () => void; disabled?: boolean }) => {
  const { t, locale } = useT();
  const ln = useLocalName();
  const price = Number(period === 'monthly' ? p.priceMonthly : p.priceYearly);
  const color = p.color || '#5B3DF5';
  return (
    <Card sx={{ height: '100%', position: 'relative', border: 2, borderColor: p.isRecommended ? color : current ? 'success.main' : 'divider', display: 'flex', flexDirection: 'column' }}>
      {p.isRecommended && <Chip label={t('x.recommended')} size="small" sx={{ position: 'absolute', top: 12, insetInlineEnd: 12, bgcolor: color, color: '#fff', fontWeight: 700 }} />}
      <Box sx={{ p: 2.5, background: `linear-gradient(135deg, ${color}22, transparent)` }}>
        <Typography variant="h6" fontWeight={800} sx={{ color }}>{ln(p)}</Typography>
        {p.description && <Typography variant="body2" color="text.secondary">{p.description}</Typography>}
        <Typography variant="h4" fontWeight={900} sx={{ mt: 1 }}>
          {price === 0 ? t('x.free') : formatPrice(price, p.currency, locale)}
          {price > 0 && <Typography component="span" color="text.secondary" variant="body2"> {t(period === 'monthly' ? 'x.perMonth' : 'x.perYear')}</Typography>}
        </Typography>
      </Box>
      <CardContent sx={{ flex: 1 }}>
        <Stack spacing={1}>
          {FEATURE_KEYS.map((k) => (
            <Stack key={k} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">{t(`x.feat.${k}`)}</Typography>
              <FeatureValue k={k} v={p.features[k]} />
            </Stack>
          ))}
        </Stack>
      </CardContent>
      {onChoose && (
        <Box sx={{ p: 2, pt: 0 }}>
          <Button fullWidth variant={p.isRecommended ? 'contained' : 'outlined'} disabled={disabled || current} onClick={onChoose} sx={p.isRecommended ? { bgcolor: color, '&:hover': { bgcolor: color } } : undefined}>
            {current ? t('x.currentPlan') : t('x.choose')}
          </Button>
        </Box>
      )}
    </Card>
  );
};

const UsageBar = ({ label, used, max }: { label: string; used: number; max: number }) => {
  const { t } = useT();
  const pct = max === -1 ? 8 : max === 0 ? 100 : Math.min(100, (used / max) * 100);
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between"><Typography variant="body2">{label}</Typography><Typography variant="body2" fontWeight={700}>{used} / {limitLabel(max, t('x.unlimited'))}</Typography></Stack>
      <LinearProgress variant="determinate" value={pct} color={max !== -1 && used >= max ? 'error' : 'primary'} sx={{ height: 8, borderRadius: 4, mt: 0.5 }} />
    </Box>
  );
};

export const SubscriptionPage = () => {
  const { t } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const qc = useQueryClient();
  const { data: mine } = useMyBusinesses();
  const [businessId, setBiz] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [choose, setChoose] = useState<Plan | null>(null);
  const [pay, setPay] = useState({ method: 'sham_cash', reference: '', note: '' });
  useEffect(() => { if (!businessId && mine?.items[0]) setBiz(mine.items[0].id); }, [mine, businessId]);
  const { data: settings } = useQuery({ queryKey: ['billing', 'public'], queryFn: billingApi.publicSettings });
  const { data: plans } = useQuery({ queryKey: ['billing', 'plans'], queryFn: () => billingApi.plans() });
  const { data: ent, isLoading } = useQuery({ queryKey: ['entitlements', businessId], queryFn: () => billingApi.entitlements(businessId), enabled: Boolean(businessId) });
  const { data: subs } = useQuery({ queryKey: ['billing', 'my-subs'], queryFn: billingApi.mySubscriptions });
  const req = useMutation({
    mutationFn: () => billingApi.requestSubscription({ businessId, planId: choose!.id, period, method: pay.method, reference: pay.reference || undefined, note: pay.note || undefined }),
    onSuccess: () => { notify.success(t('x.subRequested')); setChoose(null); qc.invalidateQueries({ queryKey: ['billing'] }); qc.invalidateQueries({ queryKey: ['entitlements'] }); },
    onError: notify.error,
  });

  if (mine && !mine.items.length) return <Box><PageHeader icon={<WorkspacePremiumRounded />} title={t('x.plans')} /><Card><EmptyState icon={<WorkspacePremiumRounded />} title={t('owner.empty')} action={<Button variant="contained" component={Link} to="/owner/businesses/new">{t('nav.addBusiness')}</Button>} /></Card></Box>;

  return (
    <Box>
      <PageHeader icon={<WorkspacePremiumRounded />} title={t('x.plans')} actions={<BizSelect value={businessId} onChange={setBiz} allowAll={false} />} />
      {settings && !settings.billingEnabled && (
        <Alert icon={<CelebrationRounded />} severity="success" sx={{ mb: 3, borderRadius: 3 }}>
          <AlertTitle sx={{ fontWeight: 800 }}>{t('x.allFree')}</AlertTitle>{t('x.allFreeText')}
        </Alert>
      )}
      {isLoading || !ent ? <RowsSkeleton rows={3} /> : (
        <Card sx={{ mb: 3 }}><CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Typography variant="overline" color="text.secondary">{t('x.currentPlan')}</Typography>
              <Typography variant="h5" fontWeight={900} sx={{ color: ent.plan.color || 'primary.main' }}>{ent.plan.code === 'launch' ? t('x.allFree') : ln(ent.plan)}</Typography>
              {ent.subscription?.endDate && <Typography variant="body2" color="text.secondary">{t('x.until', { date: fmtDate(ent.subscription.endDate) })}</Typography>}
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{t('x.usage')}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><UsageBar label={t('x.feat.maxImages')} used={ent.usage.images} max={ent.features.maxImages} /></Grid>
                <Grid item xs={12} sm={6}><UsageBar label={t('x.feat.maxItems')} used={ent.usage.items} max={ent.features.maxItems} /></Grid>
                <Grid item xs={12} sm={6}><UsageBar label={t('x.feat.maxActiveOffers')} used={ent.usage.activeOffers} max={ent.features.maxActiveOffers} /></Grid>
                <Grid item xs={12} sm={6}><UsageBar label={t('x.feat.maxActiveListings')} used={ent.usage.activeListings} max={ent.features.maxActiveListings} /></Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent></Card>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={800}>{t('x.plans')}</Typography>
        <ToggleButtonGroup size="small" exclusive value={period} onChange={(_, v) => v && setPeriod(v)}>
          <ToggleButton value="monthly">{t('x.monthly')}</ToggleButton>
          <ToggleButton value="yearly">{t('x.yearly')}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {(plans || []).map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p.id}>
            <PlanCard p={p} period={period} current={ent?.plan.id === p.id} disabled={!settings?.billingEnabled || Number(p.priceMonthly) === 0} onChoose={() => setChoose(p)} />
          </Grid>
        ))}
      </Grid>

      {(subs?.length || 0) > 0 && (
        <>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>{t('x.subscriptions')}</Typography>
          <DataTable rows={subs || []} rowKey={(s) => s.id} columns={[
            { key: 'biz', label: t('nav.myBusinesses'), render: (s) => s.business?.name },
            { key: 'plan', label: t('x.plans'), render: (s) => s.plan ? ln(s.plan) : '' },
            { key: 'period', label: t('common.type'), hideOnMobile: true, render: (s) => t(`x.${s.period}`) },
            { key: 'dates', label: t('common.date'), render: (s) => s.endDate ? `${fmtDate(s.startDate)} → ${fmtDate(s.endDate)}` : fmtDate(s.createdAt) },
            { key: 'st', label: t('common.status'), render: (s) => <StatusChip status={s.status} ns="subStatus" /> },
          ]} />
        </>
      )}

      <Dialog open={Boolean(choose)} onClose={() => setChoose(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('x.subscribe')} — {choose && ln(choose)}</DialogTitle>
        <DialogContent dividers>
          {choose && <Typography variant="h5" fontWeight={900} color="primary.main" sx={{ mb: 2 }}>{formatPrice(period === 'monthly' ? choose.priceMonthly : choose.priceYearly, choose.currency)} <Typography component="span" variant="body2" color="text.secondary">{t(period === 'monthly' ? 'x.perMonth' : 'x.perYear')}</Typography></Typography>}
          {settings?.paymentInstructions && <Alert severity="info" sx={{ mb: 2, whiteSpace: 'pre-line' }}>{settings.paymentInstructions}</Alert>}
          <Stack spacing={2}>
            <TextField select label={t('x.method')} value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
              {['sham_cash', 'syriatel_cash', 'mtn_cash', 'bank', 'cash', 'other'].map((m) => <MenuItem key={m} value={m}>{t(`x.methods.${m}`)}</MenuItem>)}
            </TextField>
            <TextField label={t('x.reference')} value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} />
            <TextField label={t('common.note')} multiline minRows={2} value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChoose(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" disabled={req.isPending} onClick={() => req.mutate()}>{t('common.submit')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
