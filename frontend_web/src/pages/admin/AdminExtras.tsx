import { Alert, Avatar, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, IconButton, MenuItem, Stack, Switch, Tab, Tabs, TextField, Typography } from '@mui/material';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import CampaignOutlined from '@mui/icons-material/CampaignOutlined';
import HandymanRounded from '@mui/icons-material/HandymanRounded';
import ContactEmergencyRounded from '@mui/icons-material/ContactEmergencyRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { billingApi, extrasApi, listingApi, requestApi } from '@/api/services';
import type { EmergencyContact, Plan, PlanFeatures, Settings, Subscription } from '@/api/types';
import { useCities } from '@/hooks/queries';
import { useNotify } from '@/hooks/useNotify';
import { useLocalName, useT } from '@/i18n';
import { PageHeader } from '@/components/common/Section';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusChip } from '@/components/common/StatusChip';
import { RowsSkeleton } from '@/components/common/Skeletons';
import { LISTING_META } from '@/components/business/ExtraCards';
import { RequestDetailDialog } from '@/pages/services/AccountExtras';
import { PlanCard } from '@/pages/services/OwnerExtras';
import { BusinessPicker } from './AdminPromotions';
import { fmtDate, formatPrice, fromNow, telLink } from '@/utils/format';

const METHODS = ['sham_cash', 'syriatel_cash', 'mtn_cash', 'bank', 'cash', 'other'];
const NUM_FEATS: (keyof PlanFeatures)[] = ['maxImages', 'maxItems', 'maxActiveOffers', 'maxActiveListings', 'featuredDaysPerMonth', 'priorityBoost'];
const BOOL_FEATS: (keyof PlanFeatures)[] = ['bookings', 'quotes', 'advancedStats', 'verifiedBadge', 'socialLinks', 'whatsappButton'];

/* ───────────── settings ───────────── */
const SettingsPanel = () => {
  const { t } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['billing', 'settings'], queryFn: billingApi.settings });
  const [f, setF] = useState<Settings | null>(null);
  useEffect(() => { if (data) setF(data); }, [data]);
  const save = useMutation({ mutationFn: (body: Partial<Settings>) => billingApi.saveSettings(body), onSuccess: (s) => { setF(s); qc.invalidateQueries({ queryKey: ['billing'] }); qc.invalidateQueries({ queryKey: ['entitlements'] }); notify.success(t('common.saved')); }, onError: notify.error });
  if (!f) return <RowsSkeleton />;
  return (
    <Stack spacing={2.5}>
      <Card sx={{ border: 2, borderColor: f.billingEnabled ? 'warning.main' : 'success.main' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={800}>{t('x.billingEnabled')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('x.billingEnabledHint')}</Typography>
            </Box>
            <Switch checked={f.billingEnabled} onChange={(e) => save.mutate({ billingEnabled: e.target.checked })} sx={{ transform: 'scale(1.3)' }} />
          </Stack>
          {!f.billingEnabled && <Alert severity="success" sx={{ mt: 2 }}>{t('x.allFree')}</Alert>}
        </CardContent>
      </Card>
      <Card><CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth multiline minRows={3} label={t('x.paymentInstructions')} value={f.paymentInstructions} onChange={(e) => setF({ ...f, paymentInstructions: e.target.value })} /></Grid>
          <Grid item xs={6} md={3}><TextField fullWidth type="number" label={t('x.listingDays')} value={f.listingDurationDays} onChange={(e) => setF({ ...f, listingDurationDays: Number(e.target.value) })} /></Grid>
          <Grid item xs={6} md={3}><TextField fullWidth type="number" label={t('x.requestDays')} value={f.serviceRequestDurationDays} onChange={(e) => setF({ ...f, serviceRequestDurationDays: Number(e.target.value) })} /></Grid>
          <Grid item xs={6} md={3}><TextField fullWidth label={t('x.supportPhone')} value={f.supportPhone} onChange={(e) => setF({ ...f, supportPhone: e.target.value })} /></Grid>
          <Grid item xs={6} md={3}><TextField fullWidth label={t('x.supportWhatsapp')} value={f.supportWhatsapp} onChange={(e) => setF({ ...f, supportWhatsapp: e.target.value })} /></Grid>
          <Grid item xs={12}><FormControlLabel control={<Switch checked={f.listingsRequireApproval} onChange={(e) => setF({ ...f, listingsRequireApproval: e.target.checked })} />} label={t('x.listingsApproval')} /></Grid>
        </Grid>
        <Stack direction="row" justifyContent="flex-end"><Button variant="contained" startIcon={<SaveRounded />} disabled={save.isPending} onClick={() => { const { billingEnabled: _b, ...rest } = f; save.mutate(rest); }}>{t('common.save')}</Button></Stack>
      </CardContent></Card>
    </Stack>
  );
};

/* ───────────── plans ───────────── */
const emptyPlan = (): Partial<Plan> => ({ code: '', name: '', nameEn: '', description: '', priceMonthly: '0', priceYearly: '0', currency: 'SYP', color: '#5B3DF5', isDefault: false, isRecommended: false, isActive: true, sortOrder: 0, features: { maxImages: 5, maxItems: 20, maxActiveOffers: 1, maxActiveListings: 2, bookings: false, quotes: false, advancedStats: false, verifiedBadge: false, priorityBoost: 0, featuredDaysPerMonth: 0, socialLinks: true, whatsappButton: true } });

const PlansPanel = () => {
  const { t } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['billing', 'plans', 'all'], queryFn: () => billingApi.plans(true) });
  const [f, setF] = useState<Partial<Plan> | null>(null);
  const [del, setDel] = useState<Plan | null>(null);
  const inv = () => qc.invalidateQueries({ queryKey: ['billing'] });
  const save = useMutation({
    mutationFn: () => {
      const { id, ...body } = f!;
      const payload = { ...body, priceMonthly: Number(body.priceMonthly), priceYearly: Number(body.priceYearly), nameEn: body.nameEn || null, description: body.description || null };
      return id ? billingApi.updatePlan(id, payload) : billingApi.createPlan(payload);
    },
    onSuccess: () => { setF(null); inv(); notify.success(t('common.saved')); }, onError: notify.error,
  });
  const rm = useMutation({ mutationFn: (id: number) => billingApi.deletePlan(id), onSuccess: () => { setDel(null); inv(); }, onError: notify.error });
  const feat = (k: keyof PlanFeatures, v: number | boolean) => setF((p) => ({ ...p!, features: { ...p!.features!, [k]: v } }));
  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}><Button variant="contained" startIcon={<AddRounded />} onClick={() => setF(emptyPlan())}>{t('x.newPlan')}</Button></Stack>
      <Grid container spacing={2.5}>
        {(data || []).map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p.id}>
            <Box sx={{ opacity: p.isActive ? 1 : 0.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <PlanCard p={p} period="monthly" />
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
                <Chip size="small" label={p.code} sx={{ fontFamily: 'monospace' }} />
                {p.isDefault && <Chip size="small" color="info" label={t('x.isDefault')} />}
                <Box sx={{ flex: 1 }} />
                <IconButton size="small" onClick={() => setF(p)}><EditRounded fontSize="small" /></IconButton>
                {!p.isDefault && <IconButton size="small" color="error" onClick={() => setDel(p)}><DeleteOutlineRounded fontSize="small" /></IconButton>}
              </Stack>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Dialog open={Boolean(f)} onClose={() => setF(null)} fullWidth maxWidth="md">
        <DialogTitle>{f?.id ? t('common.edit') : t('x.newPlan')}</DialogTitle>
        {f && (
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}><TextField fullWidth required label={t('x.code_')} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toLowerCase() })} /></Grid>
              <Grid item xs={6} md={3}><TextField fullWidth required label={t('common.name')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Grid>
              <Grid item xs={6} md={3}><TextField fullWidth label="Name (EN)" value={f.nameEn || ''} onChange={(e) => setF({ ...f, nameEn: e.target.value })} /></Grid>
              <Grid item xs={6} md={3}><TextField fullWidth type="color" label="Color" value={f.color || '#5B3DF5'} onChange={(e) => setF({ ...f, color: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth label={t('common.description')} value={f.description || ''} onChange={(e) => setF({ ...f, description: e.target.value })} /></Grid>
              <Grid item xs={4}><TextField fullWidth type="number" label={t('x.priceMonthly')} value={Number(f.priceMonthly)} onChange={(e) => setF({ ...f, priceMonthly: e.target.value })} /></Grid>
              <Grid item xs={4}><TextField fullWidth type="number" label={t('x.priceYearly')} value={Number(f.priceYearly)} onChange={(e) => setF({ ...f, priceYearly: e.target.value })} /></Grid>
              <Grid item xs={2}><TextField fullWidth label="Currency" value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} /></Grid>
              <Grid item xs={2}><TextField fullWidth type="number" label="#" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} /></Grid>
              <Grid item xs={12}><Typography variant="subtitle2" fontWeight={800}>{t('x.usage')} <Typography component="span" variant="caption" color="text.secondary">({t('x.limitsHint')})</Typography></Typography></Grid>
              {NUM_FEATS.map((k) => <Grid item xs={6} md={4} key={k}><TextField fullWidth size="small" type="number" label={t(`x.feat.${k}`)} value={f.features![k] as number} onChange={(e) => feat(k, Number(e.target.value))} inputProps={{ min: -1 }} /></Grid>)}
              {BOOL_FEATS.map((k) => <Grid item xs={6} md={4} key={k}><FormControlLabel control={<Switch checked={Boolean(f.features![k])} onChange={(e) => feat(k, e.target.checked)} />} label={t(`x.feat.${k}`)} /></Grid>)}
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <FormControlLabel control={<Switch checked={Boolean(f.isDefault)} onChange={(e) => setF({ ...f, isDefault: e.target.checked })} />} label={t('x.isDefault')} />
                  <FormControlLabel control={<Switch checked={Boolean(f.isRecommended)} onChange={(e) => setF({ ...f, isRecommended: e.target.checked })} />} label={t('x.isRecommended')} />
                  <FormControlLabel control={<Switch checked={Boolean(f.isActive)} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />} label={t('common.active')} />
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions><Button onClick={() => setF(null)}>{t('common.cancel')}</Button><Button variant="contained" disabled={save.isPending || !f?.code || !f?.name} onClick={() => save.mutate()}>{t('common.save')}</Button></DialogActions>
      </Dialog>
      <ConfirmDialog open={Boolean(del)} danger title={t('common.delete')} text={del?.name} onClose={() => setDel(null)} onConfirm={() => rm.mutate(del!.id)} />
    </>
  );
};

/* ───────────── subscriptions ───────────── */
const SubscriptionsPanel = () => {
  const { t } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [grant, setGrant] = useState<{ businessId: string | null; planId: number | ''; period: 'monthly' | 'yearly'; amount: string; method: string; reference: string; note: string } | null>(null);
  const [edit, setEdit] = useState<Subscription | null>(null);
  const [endDate, setEnd] = useState('');
  const { data: plans } = useQuery({ queryKey: ['billing', 'plans', 'all'], queryFn: () => billingApi.plans(true) });
  const { data, isFetching } = useQuery({ queryKey: ['billing', 'subs', status, page], queryFn: () => billingApi.subscriptions({ status: status || undefined, page, limit: 20 }), placeholderData: keepPreviousData });
  const inv = () => { qc.invalidateQueries({ queryKey: ['billing'] }); qc.invalidateQueries({ queryKey: ['entitlements'] }); };
  const g = useMutation({ mutationFn: () => billingApi.grant({ businessId: grant!.businessId, planId: grant!.planId, period: grant!.period, amount: grant!.amount ? Number(grant!.amount) : undefined, method: grant!.method, reference: grant!.reference || undefined, note: grant!.note || undefined }), onSuccess: () => { setGrant(null); inv(); notify.success(t('common.saved')); }, onError: notify.error });
  const u = useMutation({ mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => billingApi.updateSubscription(id, body), onSuccess: () => { setEdit(null); inv(); notify.success(t('common.saved')); }, onError: notify.error });
  return (
    <>
      <DataTable
        loading={isFetching} rows={data?.items || []} rowKey={(s) => s.id} meta={data?.meta} onPage={setPage}
        toolbar={
          <Stack direction="row" spacing={1.5} justifyContent="space-between" sx={{ width: '100%' }}>
            <TextField select size="small" label={t('common.status')} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} sx={{ minWidth: 160 }}>
              <MenuItem value="">{t('common.all')}</MenuItem>
              {['pending', 'active', 'expired', 'cancelled'].map((s) => <MenuItem key={s} value={s}>{t(`x.subStatus.${s}`)}</MenuItem>)}
            </TextField>
            <Button variant="contained" startIcon={<AddRounded />} onClick={() => setGrant({ businessId: null, planId: '', period: 'monthly', amount: '', method: 'cash', reference: '', note: '' })}>{t('x.grant')}</Button>
          </Stack>
        }
        columns={[
          { key: 'b', label: t('nav.businesses'), render: (s) => s.business ? <Link to={`/b/${s.business.slug}`}>{s.business.name}</Link> : '—' },
          { key: 'p', label: t('x.plans'), render: (s) => s.plan ? <Chip size="small" label={ln(s.plan)} sx={{ bgcolor: s.plan.color || undefined, color: '#fff', fontWeight: 700 }} /> : '' },
          { key: 'per', label: t('common.type'), hideOnMobile: true, render: (s) => t(`x.${s.period}`) },
          { key: 'd', label: t('common.date'), render: (s) => s.endDate ? `${fmtDate(s.startDate)} → ${fmtDate(s.endDate)}` : fromNow(s.createdAt) },
          { key: 's', label: t('common.status'), render: (s) => <StatusChip status={s.status} ns="subStatus" /> },
          {
            key: 'a', label: t('common.actions'), render: (s) => (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={() => { setEdit(s); setEnd(s.endDate ? dayjs(s.endDate).format('YYYY-MM-DD') : ''); }}><EditRounded fontSize="small" /></IconButton>
                {s.status === 'active' && <Button size="small" color="error" onClick={() => u.mutate({ id: s.id, body: { status: 'cancelled' } })}>{t('common.cancel')}</Button>}
              </Stack>
            ),
          },
        ]}
      />
      <Dialog open={Boolean(grant)} onClose={() => setGrant(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('x.grant')}</DialogTitle>
        {grant && (
          <DialogContent dividers>
            <BusinessPicker value={grant.businessId} onChange={(id) => setGrant({ ...grant, businessId: id })} />
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={6}><TextField select fullWidth label={t('x.plans')} value={grant.planId} onChange={(e) => setGrant({ ...grant, planId: Number(e.target.value) })}>{(plans || []).map((p) => <MenuItem key={p.id} value={p.id}>{ln(p)}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6}><TextField select fullWidth label={t('common.type')} value={grant.period} onChange={(e) => setGrant({ ...grant, period: e.target.value as 'monthly' | 'yearly' })}><MenuItem value="monthly">{t('x.monthly')}</MenuItem><MenuItem value="yearly">{t('x.yearly')}</MenuItem></TextField></Grid>
              <Grid item xs={6}><TextField fullWidth type="number" label={t('x.amount')} value={grant.amount} onChange={(e) => setGrant({ ...grant, amount: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField select fullWidth label={t('x.method')} value={grant.method} onChange={(e) => setGrant({ ...grant, method: e.target.value })}>{METHODS.map((m) => <MenuItem key={m} value={m}>{t(`x.methods.${m}`)}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12}><TextField fullWidth label={t('x.reference')} value={grant.reference} onChange={(e) => setGrant({ ...grant, reference: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth label={t('common.note')} value={grant.note} onChange={(e) => setGrant({ ...grant, note: e.target.value })} /></Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions><Button onClick={() => setGrant(null)}>{t('common.cancel')}</Button><Button variant="contained" disabled={!grant?.businessId || !grant?.planId || g.isPending} onClick={() => g.mutate()}>{t('common.save')}</Button></DialogActions>
      </Dialog>
      <Dialog open={Boolean(edit)} onClose={() => setEdit(null)} fullWidth maxWidth="xs">
        <DialogTitle>{edit?.business?.name}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField select label={t('x.plans')} defaultValue={edit?.planId} onChange={(e) => edit && u.mutate({ id: edit.id, body: { planId: Number(e.target.value) } })}>{(plans || []).map((p) => <MenuItem key={p.id} value={p.id}>{ln(p)}</MenuItem>)}</TextField>
            <TextField type="date" label={t('x.to')} InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEnd(e.target.value)} />
            <TextField select label={t('common.status')} defaultValue={edit?.status} onChange={(e) => edit && u.mutate({ id: edit.id, body: { status: e.target.value } })}>{['pending', 'active', 'expired', 'cancelled'].map((s) => <MenuItem key={s} value={s}>{t(`x.subStatus.${s}`)}</MenuItem>)}</TextField>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setEdit(null)}>{t('common.close')}</Button><Button variant="contained" disabled={!endDate} onClick={() => edit && u.mutate({ id: edit.id, body: { endDate: dayjs(endDate).endOf('day').toISOString() } })}>{t('common.save')}</Button></DialogActions>
      </Dialog>
    </>
  );
};

/* ───────────── payments ───────────── */
const PaymentsPanel = () => {
  const { t, locale } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [reject, setReject] = useState<number | null>(null);
  const [rec, setRec] = useState<{ businessId: string | null; purpose: string; amount: string; method: string; reference: string; note: string } | null>(null);
  const { data, isFetching } = useQuery({ queryKey: ['billing', 'payments', status, page], queryFn: () => billingApi.payments({ status: status || undefined, page, limit: 20 }), placeholderData: keepPreviousData });
  const inv = () => { qc.invalidateQueries({ queryKey: ['billing'] }); qc.invalidateQueries({ queryKey: ['entitlements'] }); };
  const d = useMutation({ mutationFn: ({ id, s, note }: { id: number; s: 'confirmed' | 'rejected'; note?: string }) => billingApi.decidePayment(id, s, note), onSuccess: () => { setReject(null); inv(); notify.success(t('common.saved')); }, onError: notify.error });
  const r = useMutation({ mutationFn: () => billingApi.recordPayment({ businessId: rec!.businessId, purpose: rec!.purpose, amount: Number(rec!.amount), method: rec!.method, reference: rec!.reference || null, note: rec!.note || null }), onSuccess: () => { setRec(null); inv(); notify.success(t('common.saved')); }, onError: notify.error });
  const label = (s: string) => (s === 'confirmed' ? t('x.confirmPayment') : s === 'rejected' ? t('x.rejectPayment') : t('x.subStatus.pending'));
  return (
    <>
      <DataTable
        loading={isFetching} rows={data?.items || []} rowKey={(p) => p.id} meta={data?.meta} onPage={setPage}
        toolbar={
          <Stack direction="row" spacing={1.5} justifyContent="space-between" sx={{ width: '100%' }}>
            <TextField select size="small" label={t('common.status')} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} sx={{ minWidth: 160 }}>
              <MenuItem value="">{t('common.all')}</MenuItem>
              {['pending', 'confirmed', 'rejected'].map((s) => <MenuItem key={s} value={s}>{label(s)}</MenuItem>)}
            </TextField>
            <Button variant="outlined" startIcon={<AddRounded />} onClick={() => setRec({ businessId: null, purpose: 'featured', amount: '', method: 'cash', reference: '', note: '' })}>{t('x.payments')}</Button>
          </Stack>
        }
        columns={[
          { key: 'who', label: t('common.name'), render: (p) => <><Typography variant="body2" fontWeight={700}>{p.business?.name || p.user?.fullName || '—'}</Typography><Typography variant="caption" color="text.secondary">{p.user?.phone || p.user?.email}</Typography></> },
          { key: 'pur', label: t('x.purpose'), hideOnMobile: true, render: (p) => t(`x.purposes2.${p.purpose}`) },
          { key: 'amt', label: t('x.amount'), render: (p) => <Typography fontWeight={800}>{formatPrice(p.amount, p.currency, locale)}</Typography> },
          { key: 'm', label: t('x.method'), hideOnMobile: true, render: (p) => <>{t(`x.methods.${p.method}`)}{p.reference && <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace' }}>{p.reference}</Typography>}</> },
          { key: 'dt', label: t('common.date'), hideOnMobile: true, render: (p) => fromNow(p.createdAt) },
          { key: 's', label: t('common.status'), render: (p) => <Chip size="small" label={label(p.status)} color={p.status === 'confirmed' ? 'success' : p.status === 'rejected' ? 'error' : 'warning'} /> },
          {
            key: 'a', label: t('common.actions'), render: (p) => p.status === 'pending' && (
              <Stack direction="row" spacing={0.5}>
                <Button size="small" variant="contained" color="success" onClick={() => d.mutate({ id: p.id, s: 'confirmed' })}>{t('x.confirmPayment')}</Button>
                <Button size="small" color="error" onClick={() => setReject(p.id)}>{t('x.rejectPayment')}</Button>
              </Stack>
            ),
          },
        ]}
      />
      <ConfirmDialog open={Boolean(reject)} danger title={t('x.rejectPayment')} withNote={t('common.note')} onClose={() => setReject(null)} onConfirm={(note) => d.mutate({ id: reject!, s: 'rejected', note })} />
      <Dialog open={Boolean(rec)} onClose={() => setRec(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('x.payments')}</DialogTitle>
        {rec && (
          <DialogContent dividers>
            <BusinessPicker value={rec.businessId} onChange={(id) => setRec({ ...rec, businessId: id })} />
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={6}><TextField select fullWidth label={t('x.purpose')} value={rec.purpose} onChange={(e) => setRec({ ...rec, purpose: e.target.value })}>{['subscription', 'featured', 'advertisement', 'listing', 'other'].map((m) => <MenuItem key={m} value={m}>{t(`x.purposes2.${m}`)}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6}><TextField fullWidth type="number" label={t('x.amount')} value={rec.amount} onChange={(e) => setRec({ ...rec, amount: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField select fullWidth label={t('x.method')} value={rec.method} onChange={(e) => setRec({ ...rec, method: e.target.value })}>{METHODS.map((m) => <MenuItem key={m} value={m}>{t(`x.methods.${m}`)}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6}><TextField fullWidth label={t('x.reference')} value={rec.reference} onChange={(e) => setRec({ ...rec, reference: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth label={t('common.note')} value={rec.note} onChange={(e) => setRec({ ...rec, note: e.target.value })} /></Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions><Button onClick={() => setRec(null)}>{t('common.cancel')}</Button><Button variant="contained" disabled={!rec?.amount || r.isPending} onClick={() => r.mutate()}>{t('common.save')}</Button></DialogActions>
      </Dialog>
    </>
  );
};

export const AdminBilling = () => {
  const { t } = useT();
  const [tab, setTab] = useState('settings');
  return (
    <Box>
      <PageHeader icon={<PaymentsRounded />} title={t('x.billing')} />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ mb: 2.5 }}>
        <Tab value="settings" label={t('x.settings')} />
        <Tab value="plans" label={t('x.plans')} />
        <Tab value="subs" label={t('x.subscriptions')} />
        <Tab value="payments" label={t('x.payments')} />
      </Tabs>
      {tab === 'settings' && <SettingsPanel />}
      {tab === 'plans' && <PlansPanel />}
      {tab === 'subs' && <SubscriptionsPanel />}
      {tab === 'payments' && <PaymentsPanel />}
    </Box>
  );
};

/* ───────────── listings moderation ───────────── */
export const AdminListings = () => {
  const { t } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const qc = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [reject, setReject] = useState<string | null>(null);
  const { data, isFetching } = useQuery({ queryKey: ['admin', 'listings', status, type, page], queryFn: () => listingApi.admin({ status: status || undefined, type: (type || undefined) as never, page, limit: 20 }), placeholderData: keepPreviousData });
  const m = useMutation({ mutationFn: ({ id, body }: { id: string; body: { status: string; adminNote?: string; isFeatured?: boolean } }) => listingApi.moderate(id, body), onSuccess: () => { setReject(null); qc.invalidateQueries({ queryKey: ['admin', 'listings'] }); qc.invalidateQueries({ queryKey: ['listings'] }); notify.success(t('common.saved')); }, onError: notify.error });
  return (
    <Box>
      <PageHeader icon={<CampaignOutlined />} title={t('x.listingsMod')} />
      <DataTable
        loading={isFetching} rows={data?.items || []} rowKey={(l) => l.id} meta={data?.meta} onPage={setPage}
        toolbar={
          <Stack direction="row" spacing={1.5}>
            <TextField select size="small" label={t('common.status')} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} sx={{ minWidth: 150 }}>
              <MenuItem value="">{t('common.all')}</MenuItem>
              {['pending', 'active', 'rejected', 'closed', 'expired'].map((s) => <MenuItem key={s} value={s}>{t(`x.listingStatus.${s}`)}</MenuItem>)}
            </TextField>
            <TextField select size="small" label={t('common.type')} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} sx={{ minWidth: 130 }}>
              <MenuItem value="">{t('common.all')}</MenuItem>
              {(['real_estate', 'car', 'job', 'other'] as const).map((ty) => <MenuItem key={ty} value={ty}>{t(`x.${LISTING_META[ty].key}`)}</MenuItem>)}
            </TextField>
          </Stack>
        }
        columns={[
          { key: 'img', label: '', width: 64, render: (l) => <Avatar variant="rounded" src={l.images?.[0]?.url} sx={{ bgcolor: LISTING_META[l.type].color }}>{LISTING_META[l.type].icon}</Avatar> },
          { key: 't', label: t('common.name'), render: (l) => <><Typography component={Link} to={`/l/${l.slug}`} fontWeight={700} sx={{ color: 'inherit' }}>{l.title}</Typography><Typography variant="caption" display="block" color="text.secondary">{t(`x.purposes.${l.purpose}`)} · {ln(l.city)} · {l.user?.fullName || l.business?.name}</Typography></> },
          { key: 'd', label: t('common.date'), hideOnMobile: true, render: (l) => fromNow(l.createdAt) },
          { key: 's', label: t('common.status'), render: (l) => <Stack direction="row" spacing={0.5}><StatusChip status={l.status} ns="listingStatus" />{l.isFeatured && <StarRounded color="warning" />}</Stack> },
          {
            key: 'a', label: t('common.actions'), render: (l) => (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {l.status !== 'active' && <Button size="small" color="success" onClick={() => m.mutate({ id: l.id, body: { status: 'active' } })}>{t('x.approve')}</Button>}
                {l.status !== 'rejected' && <Button size="small" color="error" onClick={() => setReject(l.id)}>{t('x.rejectL')}</Button>}
                <Button size="small" onClick={() => m.mutate({ id: l.id, body: { status: l.status, isFeatured: !l.isFeatured } })}>{l.isFeatured ? '−' : '+'} {t('x.feature')}</Button>
              </Stack>
            ),
          },
        ]}
      />
      <ConfirmDialog open={Boolean(reject)} danger title={t('x.rejectL')} withNote={t('common.note')} onClose={() => setReject(null)} onConfirm={(note) => m.mutate({ id: reject!, body: { status: 'rejected', adminNote: note } })} />
    </Box>
  );
};

/* ───────────── service requests (admin) ───────────── */
export const AdminRequests = () => {
  const { t } = useT();
  const ln = useLocalName();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<number | null>(null);
  const { data, isFetching } = useQuery({ queryKey: ['service-requests', 'admin', status, page], queryFn: () => requestApi.admin({ status: status || undefined, page, limit: 20 }), placeholderData: keepPreviousData });
  return (
    <Box>
      <PageHeader icon={<HandymanRounded />} title={t('x.requestsAdmin')} />
      <DataTable
        loading={isFetching} rows={data?.items || []} rowKey={(r) => r.id} meta={data?.meta} onPage={setPage}
        toolbar={
          <TextField select size="small" label={t('common.status')} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} sx={{ minWidth: 150 }}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            {['open', 'assigned', 'closed', 'cancelled'].map((s) => <MenuItem key={s} value={s}>{t(`x.reqStatus.${s}`)}</MenuItem>)}
          </TextField>
        }
        columns={[
          { key: 't', label: t('x.requestTitle'), render: (r) => <><Typography fontWeight={700} sx={{ cursor: 'pointer' }} onClick={() => setOpen(r.id)}>{r.title}</Typography><Typography variant="caption" color="text.secondary">{ln(r.category)}{r.subCategory ? ` · ${ln(r.subCategory)}` : ''} · {ln(r.city)}</Typography></> },
          { key: 'u', label: t('common.name'), hideOnMobile: true, render: (r) => r.user?.fullName },
          { key: 'q', label: t('x.quotes'), render: (r) => r.quotesCount },
          { key: 'd', label: t('common.date'), hideOnMobile: true, render: (r) => fromNow(r.createdAt) },
          { key: 's', label: t('common.status'), render: (r) => <StatusChip status={r.status} ns="reqStatus" /> },
        ]}
      />
      <RequestDetailDialog id={open} onClose={() => setOpen(null)} />
    </Box>
  );
};

/* ───────────── emergency numbers ───────────── */
const TYPES = ['ambulance', 'fire', 'police', 'traffic', 'electricity', 'water', 'gas', 'hospital', 'other'];
export const AdminEmergency = () => {
  const { t } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const qc = useQueryClient();
  const { data: cities } = useCities(true);
  const { data, isFetching } = useQuery({ queryKey: ['emergency', 'admin'], queryFn: extrasApi.adminEmergency });
  const [f, setF] = useState<Partial<EmergencyContact> | null>(null);
  const [del, setDel] = useState<EmergencyContact | null>(null);
  const inv = () => qc.invalidateQueries({ queryKey: ['emergency'] });
  const save = useMutation({
    mutationFn: () => {
      const { id, city: _c, ...rest } = f!;
      const body = { cityId: rest.cityId ?? null, type: rest.type, name: rest.name, nameEn: rest.nameEn || null, phone: rest.phone, phone2: rest.phone2 || null, note: rest.note || null, isActive: rest.isActive, sortOrder: rest.sortOrder ?? 0 };
      return id ? extrasApi.updateEmergency(id, body) : extrasApi.createEmergency(body);
    },
    onSuccess: () => { setF(null); inv(); notify.success(t('common.saved')); }, onError: notify.error,
  });
  const rm = useMutation({ mutationFn: (id: number) => extrasApi.deleteEmergency(id), onSuccess: () => { setDel(null); inv(); }, onError: notify.error });
  return (
    <Box>
      <PageHeader icon={<ContactEmergencyRounded />} title={t('x.emergencyAdmin')} actions={<Button variant="contained" startIcon={<AddRounded />} onClick={() => setF({ type: 'ambulance', cityId: null, isActive: true, sortOrder: 0 })}>{t('common.add')}</Button>} />
      <DataTable
        loading={isFetching} rows={data || []} rowKey={(e) => e.id}
        columns={[
          { key: 'ty', label: t('common.type'), render: (e) => <Chip size="small" label={t(`x.emergencyTypes.${e.type}`)} /> },
          { key: 'n', label: t('common.name'), render: (e) => <Typography fontWeight={700}>{ln(e)}</Typography> },
          { key: 'p', label: t('common.phone'), render: (e) => <Typography component="a" href={telLink(e.phone)} fontWeight={800} color="primary.main" sx={{ direction: 'ltr' }}>{e.phone}{e.phone2 ? ` / ${e.phone2}` : ''}</Typography> },
          { key: 'c', label: t('common.city'), render: (e) => (e.city ? ln(e.city) : t('x.nationwide')) },
          { key: 's', label: t('common.status'), hideOnMobile: true, render: (e) => <Chip size="small" color={e.isActive ? 'success' : 'default'} label={e.isActive ? t('common.active') : t('common.inactive')} /> },
          { key: 'a', label: '', render: (e) => <Stack direction="row"><IconButton size="small" onClick={() => setF(e)}><EditRounded fontSize="small" /></IconButton><IconButton size="small" color="error" onClick={() => setDel(e)}><DeleteOutlineRounded fontSize="small" /></IconButton></Stack> },
        ]}
      />
      <Dialog open={Boolean(f)} onClose={() => setF(null)} fullWidth maxWidth="sm">
        <DialogTitle>{f?.id ? t('common.edit') : t('common.add')}</DialogTitle>
        {f && (
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField select fullWidth label={t('common.type')} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{TYPES.map((ty) => <MenuItem key={ty} value={ty}>{t(`x.emergencyTypes.${ty}`)}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6}><TextField select fullWidth label={t('common.city')} value={f.cityId ?? ''} onChange={(e) => setF({ ...f, cityId: e.target.value === '' ? null : Number(e.target.value) })}><MenuItem value="">{t('x.nationwide')}</MenuItem>{(cities || []).map((c) => <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6}><TextField fullWidth required label={t('common.name')} value={f.name || ''} onChange={(e) => setF({ ...f, name: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Name (EN)" value={f.nameEn || ''} onChange={(e) => setF({ ...f, nameEn: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth required label={t('common.phone')} value={f.phone || ''} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth label={`${t('common.phone')} 2`} value={f.phone2 || ''} onChange={(e) => setF({ ...f, phone2: e.target.value })} /></Grid>
              <Grid item xs={8}><TextField fullWidth label={t('common.note')} value={f.note || ''} onChange={(e) => setF({ ...f, note: e.target.value })} /></Grid>
              <Grid item xs={4}><TextField fullWidth type="number" label="#" value={f.sortOrder ?? 0} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} /></Grid>
              <Grid item xs={12}><FormControlLabel control={<Switch checked={Boolean(f.isActive)} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />} label={t('common.active')} /></Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions><Button onClick={() => setF(null)}>{t('common.cancel')}</Button><Button variant="contained" disabled={!f?.name || !f?.phone || save.isPending} onClick={() => save.mutate()}>{t('common.save')}</Button></DialogActions>
      </Dialog>
      <ConfirmDialog open={Boolean(del)} danger title={t('common.delete')} text={del?.name} onClose={() => setDel(null)} onConfirm={() => rm.mutate(del!.id)} />
    </Box>
  );
};
