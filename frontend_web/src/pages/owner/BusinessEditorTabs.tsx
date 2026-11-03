import { Alert, Avatar, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, Grid, IconButton, MenuItem, Radio, RadioGroup, Stack, Switch, TextField, Typography } from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import RestaurantMenuRounded from '@mui/icons-material/RestaurantMenuRounded';
import LocalOfferRounded from '@mui/icons-material/LocalOfferRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import ImageRounded from '@mui/icons-material/ImageRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { billingApi, bookingApi, extrasApi } from '@/api/services';
import type { Business, BusinessItem, Offer } from '@/api/types';
import { useNotify } from '@/hooks/useNotify';
import { useT } from '@/i18n';
import { EmptyState } from '@/components/common/Section';
import { RowsSkeleton } from '@/components/common/Skeletons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { fmtDate, formatPrice, isoDay, limitLabel } from '@/utils/format';

const Box3 = ({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) => (
  <Card sx={{ p: { xs: 2.25, md: 3 }, mb: 2.5 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Box><Typography variant="h6" fontWeight={800}>{title}</Typography>{hint && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{hint}</Typography>}</Box>
      {action}
    </Stack>
    <Box sx={{ mt: 2.5 }}>{children}</Box>
  </Card>
);

const FilePick = ({ file, current, onFile }: { file: File | null; current?: string | null; onFile: (f: File | null) => void }) => {
  const { t } = useT();
  const preview = file ? URL.createObjectURL(file) : current;
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar variant="rounded" src={preview || undefined} sx={{ width: 72, height: 72 }}><ImageRounded /></Avatar>
      <Button component="label" variant="outlined" size="small">{t('common.uploadImages')}<input hidden type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] || null)} /></Button>
    </Stack>
  );
};

const num = (v: string) => (v === '' ? null : Number(v));

/* ───────────── Items (menu / products / services) ───────────── */
type ItemForm = { section: string; name: string; description: string; price: string; oldPrice: string; unit: string; durationMinutes: string; isAvailable: boolean; isPopular: boolean };
const emptyItem = (section = ''): ItemForm => ({ section, name: '', description: '', price: '', oldPrice: '', unit: '', durationMinutes: '', isAvailable: true, isPopular: false });

export const ItemsTab = ({ business }: { business: Business }) => {
  const { t, locale } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const key = ['items', business.id, 'all'];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => extrasApi.items(business.id, true) });
  const [edit, setEdit] = useState<BusinessItem | 'new' | null>(null);
  const [f, setF] = useState<ItemForm>(emptyItem());
  const [file, setFile] = useState<File | null>(null);
  const [del, setDel] = useState<BusinessItem | null>(null);
  const sections = (data?.sections || []).map((s) => s.name).filter(Boolean);
  const open = (it: BusinessItem | 'new', section = '') => {
    setEdit(it); setFile(null);
    setF(it === 'new' ? emptyItem(section) : { section: it.section || '', name: it.name, description: it.description || '', price: it.price ? String(Number(it.price)) : '', oldPrice: it.oldPrice ? String(Number(it.oldPrice)) : '', unit: it.unit || '', durationMinutes: it.durationMinutes ? String(it.durationMinutes) : '', isAvailable: it.isAvailable, isPopular: it.isPopular });
  };
  const inv = () => qc.invalidateQueries({ queryKey: ['items', business.id] });
  const save = useMutation({
    mutationFn: () => {
      const body = { section: f.section, name: f.name, description: f.description || null, price: num(f.price), oldPrice: num(f.oldPrice), unit: f.unit || null, durationMinutes: num(f.durationMinutes), isAvailable: f.isAvailable, isPopular: f.isPopular };
      const payload = file ? Object.fromEntries(Object.entries(body).filter(([, v]) => v !== null)) : body;
      return edit === 'new' ? extrasApi.createItem(business.id, payload, file) : extrasApi.updateItem(business.id, (edit as BusinessItem).id, payload, file);
    },
    onSuccess: () => { inv(); setEdit(null); notify.success(t('common.saved')); },
    onError: notify.error,
  });
  const remove = useMutation({ mutationFn: (id: number) => extrasApi.deleteItem(business.id, id), onSuccess: () => { inv(); setDel(null); }, onError: notify.error });
  const toggle = useMutation({ mutationFn: (it: BusinessItem) => extrasApi.updateItem(business.id, it.id, { isAvailable: !it.isAvailable }), onSuccess: inv, onError: notify.error });

  return (
    <Box3 title={t('x.tabItems')} action={<Button variant="contained" startIcon={<AddRounded />} onClick={() => open('new')}>{t('x.addItem')}</Button>}>
      {isLoading ? <RowsSkeleton /> : !data?.total ? <EmptyState icon={<RestaurantMenuRounded />} title={t('x.noItems')} /> : (
        <Stack spacing={3}>
          {data.sections.map((s) => (
            <Box key={s.name}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography fontWeight={800} color="primary.main">{s.name || '—'}</Typography>
                <Button size="small" startIcon={<AddRounded />} onClick={() => open('new', s.name)}>{t('common.add')}</Button>
              </Stack>
              <Stack divider={<Divider />} sx={{ border: 1, borderColor: 'divider', borderRadius: 3 }}>
                {s.items.map((it) => (
                  <Stack key={it.id} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.25, opacity: it.isAvailable ? 1 : 0.55 }}>
                    <Avatar variant="rounded" src={it.image || undefined} sx={{ width: 48, height: 48 }}><RestaurantMenuRounded /></Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>{it.name} {it.isPopular && <Chip size="small" color="secondary" label={t('x.popular')} sx={{ ml: 0.5 }} />}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{it.description}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'end' }}>
                      {it.price && <Typography fontWeight={800}>{formatPrice(it.price, it.currency, locale)}</Typography>}
                      {it.oldPrice && <Typography variant="caption" sx={{ textDecoration: 'line-through' }} color="text.secondary">{formatPrice(it.oldPrice, it.currency, locale)}</Typography>}
                    </Box>
                    <Switch size="small" checked={it.isAvailable} onChange={() => toggle.mutate(it)} />
                    <IconButton size="small" onClick={() => open(it)}><EditRounded fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDel(it)}><DeleteOutlineRounded fontSize="small" /></IconButton>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
      <Dialog open={Boolean(edit)} onClose={() => setEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>{edit === 'new' ? t('x.addItem') : t('common.edit')}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}><FilePick file={file} current={edit && edit !== 'new' ? edit.image : null} onFile={setFile} /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('x.section')} placeholder={t('x.sectionPh')} value={f.section} onChange={(e) => setF({ ...f, section: e.target.value })} inputProps={{ list: 'item-sections' }} />
              <datalist id="item-sections">{sections.map((s) => <option key={s} value={s} />)}</datalist>
            </Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth required label={t('x.itemName')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={2} label={t('common.description')} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth type="number" label={t('x.price')} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth type="number" label={t('x.oldPrice')} value={f.oldPrice} onChange={(e) => setF({ ...f, oldPrice: e.target.value })} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth label={t('x.unit')} placeholder={t('x.unitPh')} value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth type="number" label={t('x.duration')} value={f.durationMinutes} onChange={(e) => setF({ ...f, durationMinutes: e.target.value })} /></Grid>
            <Grid item xs={6}><FormControlLabel control={<Switch checked={f.isAvailable} onChange={(e) => setF({ ...f, isAvailable: e.target.checked })} />} label={t('x.available')} /></Grid>
            <Grid item xs={6}><FormControlLabel control={<Switch checked={f.isPopular} onChange={(e) => setF({ ...f, isPopular: e.target.checked })} />} label={t('x.popular')} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setEdit(null)}>{t('common.cancel')}</Button><Button variant="contained" disabled={!f.name.trim() || save.isPending} onClick={() => save.mutate()}>{t('common.save')}</Button></DialogActions>
      </Dialog>
      <ConfirmDialog open={Boolean(del)} danger title={t('common.delete')} text={del?.name} onClose={() => setDel(null)} onConfirm={() => remove.mutate(del!.id)} />
    </Box3>
  );
};

/* ───────────── Offers ───────────── */
type OfferForm = { title: string; description: string; discountPercent: string; price: string; oldPrice: string; couponCode: string; terms: string; startDate: string; endDate: string; isActive: boolean };
export const OffersTab = ({ business }: { business: Business }) => {
  const { t } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['offers', 'biz', business.id], queryFn: () => extrasApi.businessOffers(business.id) });
  const [edit, setEdit] = useState<Offer | 'new' | null>(null);
  const [f, setF] = useState<OfferForm | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [del, setDel] = useState<Offer | null>(null);
  const open = (o: Offer | 'new') => {
    setEdit(o); setFile(null);
    setF(o === 'new'
      ? { title: '', description: '', discountPercent: '', price: '', oldPrice: '', couponCode: '', terms: '', startDate: isoDay(), endDate: isoDay(14), isActive: true }
      : { title: o.title, description: o.description || '', discountPercent: o.discountPercent ? String(o.discountPercent) : '', price: o.price ? String(Number(o.price)) : '', oldPrice: o.oldPrice ? String(Number(o.oldPrice)) : '', couponCode: o.couponCode || '', terms: o.terms || '', startDate: o.startDate.slice(0, 10), endDate: o.endDate.slice(0, 10), isActive: o.isActive });
  };
  const inv = () => qc.invalidateQueries({ queryKey: ['offers'] });
  const save = useMutation({
    mutationFn: () => {
      const v = f!;
      const body: Record<string, unknown> = { title: v.title, description: v.description || null, discountPercent: num(v.discountPercent), price: num(v.price), oldPrice: num(v.oldPrice), couponCode: v.couponCode || null, terms: v.terms || null, startDate: dayjs(v.startDate).startOf('day').toISOString(), endDate: dayjs(v.endDate).endOf('day').toISOString(), isActive: v.isActive };
      const payload = file ? Object.fromEntries(Object.entries(body).filter(([, x]) => x !== null)) : body;
      return edit === 'new' ? extrasApi.createOffer(business.id, payload, file) : extrasApi.updateOffer(business.id, (edit as Offer).id, payload, file);
    },
    onSuccess: () => { inv(); setEdit(null); notify.success(t('common.saved')); },
    onError: notify.error,
  });
  const remove = useMutation({ mutationFn: (id: number) => extrasApi.deleteOffer(business.id, id), onSuccess: () => { inv(); setDel(null); }, onError: notify.error });
  const now = Date.now();
  return (
    <Box3 title={t('x.tabOffers')} action={<Button variant="contained" startIcon={<AddRounded />} onClick={() => open('new')}>{t('x.addOffer')}</Button>}>
      {isLoading ? <RowsSkeleton /> : !data?.length ? <EmptyState icon={<LocalOfferRounded />} title={t('x.noOffers')} /> : (
        <Grid container spacing={2}>
          {data.map((o) => {
            const expired = new Date(o.endDate).getTime() < now;
            return (
              <Grid item xs={12} sm={6} key={o.id}>
                <Card variant="outlined" sx={{ opacity: expired || !o.isActive ? 0.6 : 1 }}>
                  <CardContent>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar variant="rounded" src={o.image || undefined} sx={{ width: 56, height: 56, bgcolor: 'secondary.main' }}><LocalOfferRounded /></Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap>{o.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{fmtDate(o.startDate)} → {fmtDate(o.endDate)}</Typography>
                      </Box>
                      {o.discountPercent ? <Chip color="secondary" label={t('x.off', { n: o.discountPercent })} /> : null}
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
                      {expired ? <Chip size="small" label={t('x.expired')} /> : !o.isActive ? <Chip size="small" label={t('common.inactive')} /> : <Chip size="small" color="success" label={t('common.active')} />}
                      <Box sx={{ flex: 1 }} />
                      <IconButton size="small" onClick={() => open(o)}><EditRounded fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setDel(o)}><DeleteOutlineRounded fontSize="small" /></IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      <Dialog open={Boolean(edit && f)} onClose={() => setEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>{edit === 'new' ? t('x.addOffer') : t('common.edit')}</DialogTitle>
        {f && (
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}><FilePick file={file} current={edit && edit !== 'new' ? edit.image : null} onFile={setFile} /></Grid>
              <Grid item xs={12}><TextField fullWidth required label={t('x.offerTitle')} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline minRows={2} label={t('common.description')} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Grid>
              <Grid item xs={4}><TextField fullWidth type="number" label={t('x.discount')} value={f.discountPercent} onChange={(e) => setF({ ...f, discountPercent: e.target.value })} inputProps={{ min: 1, max: 100 }} /></Grid>
              <Grid item xs={4}><TextField fullWidth type="number" label={t('x.price')} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Grid>
              <Grid item xs={4}><TextField fullWidth type="number" label={t('x.oldPrice')} value={f.oldPrice} onChange={(e) => setF({ ...f, oldPrice: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth type="date" label={t('x.from')} InputLabelProps={{ shrink: true }} value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth type="date" label={t('x.to')} InputLabelProps={{ shrink: true }} value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={t('x.coupon')} value={f.couponCode} onChange={(e) => setF({ ...f, couponCode: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />} label={t('common.active')} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline minRows={2} label={t('x.terms')} value={f.terms} onChange={(e) => setF({ ...f, terms: e.target.value })} /></Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions><Button onClick={() => setEdit(null)}>{t('common.cancel')}</Button><Button variant="contained" disabled={!f?.title.trim() || save.isPending} onClick={() => save.mutate()}>{t('common.save')}</Button></DialogActions>
      </Dialog>
      <ConfirmDialog open={Boolean(del)} danger title={t('common.delete')} text={del?.title} onClose={() => setDel(null)} onConfirm={() => remove.mutate(del!.id)} />
    </Box3>
  );
};

/* ───────────── Booking & quotes settings ───────────── */
export const BookingTab = ({ business, onSaved }: { business: Business; onSaved?: () => void }) => {
  const { t } = useT();
  const notify = useNotify();
  const init = business.bookingSettings || { bookingEnabled: false, bookingMode: 'slot' as const, slotMinutes: 30, slotCapacity: 1, bookingDaysAhead: 30, bookingAutoConfirm: false, bookingNote: null, acceptsQuotes: false };
  const [f, setF] = useState(init);
  useEffect(() => { if (business.bookingSettings) setF(business.bookingSettings); }, [business.bookingSettings]);
  const save = useMutation({ mutationFn: () => bookingApi.saveSettings(business.id, { ...f, bookingNote: f.bookingNote || null }), onSuccess: () => { notify.success(t('common.saved')); onSaved?.(); }, onError: notify.error });
  return (
    <>
      <Box3 title={t('x.enableBooking')} action={<Switch checked={f.bookingEnabled} onChange={(e) => setF({ ...f, bookingEnabled: e.target.checked })} />}>
        <Stack spacing={2} sx={{ opacity: f.bookingEnabled ? 1 : 0.5, pointerEvents: f.bookingEnabled ? 'auto' : 'none' }}>
          <RadioGroup value={f.bookingMode} onChange={(e) => setF({ ...f, bookingMode: e.target.value as 'slot' | 'day' })}>
            <FormControlLabel value="slot" control={<Radio />} label={t('x.modeSlot')} />
            <FormControlLabel value="day" control={<Radio />} label={t('x.modeDay')} />
          </RadioGroup>
          <Grid container spacing={2}>
            {f.bookingMode === 'slot' && <Grid item xs={6} md={4}><TextField fullWidth select label={t('x.slotMinutes')} value={f.slotMinutes} onChange={(e) => setF({ ...f, slotMinutes: Number(e.target.value) })}>{[10, 15, 20, 30, 45, 60, 90, 120].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}</TextField></Grid>}
            <Grid item xs={6} md={4}><TextField fullWidth type="number" label={t('x.slotCapacity')} value={f.slotCapacity} onChange={(e) => setF({ ...f, slotCapacity: Math.max(1, Number(e.target.value)) })} /></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth type="number" label={t('x.daysAhead')} value={f.bookingDaysAhead} onChange={(e) => setF({ ...f, bookingDaysAhead: Math.max(1, Number(e.target.value)) })} /></Grid>
          </Grid>
          <FormControlLabel control={<Switch checked={f.bookingAutoConfirm} onChange={(e) => setF({ ...f, bookingAutoConfirm: e.target.checked })} />} label={t('x.autoConfirm')} />
          <TextField multiline minRows={2} label={t('x.bookingNote')} value={f.bookingNote || ''} onChange={(e) => setF({ ...f, bookingNote: e.target.value })} />
          <Alert severity="info">{t('x.bookingHoursHint')}</Alert>
        </Stack>
      </Box3>
      <Box3 title={t('x.acceptsQuotes')} hint={t('x.inboxSub')} action={<Switch checked={f.acceptsQuotes} onChange={(e) => setF({ ...f, acceptsQuotes: e.target.checked })} />}>
        <Button component={Link} to="/owner/requests" variant="outlined">{t('x.inbox')}</Button>
      </Box3>
      <Stack direction="row" justifyContent="flex-end"><Button variant="contained" size="large" startIcon={<SaveRounded />} disabled={save.isPending} onClick={() => save.mutate()}>{t('common.save')}</Button></Stack>
    </>
  );
};

/* ───────────── Pharmacy duty days ───────────── */
type Duty = { date: string; startTime: string; endTime: string; note: string };
export const DutyTab = ({ business }: { business: Business }) => {
  const { t } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['duties', business.id], queryFn: () => extrasApi.duties(business.id) });
  const [rows, setRows] = useState<Duty[]>([]);
  useEffect(() => { if (data) setRows(data.map((d) => ({ date: d.date.slice(0, 10), startTime: d.startTime?.slice(0, 5) || '', endTime: d.endTime?.slice(0, 5) || '', note: d.note || '' }))); }, [data]);
  const save = useMutation({
    mutationFn: () => extrasApi.setDuties(business.id, rows.filter((r) => r.date).map((r) => ({ date: r.date, startTime: r.startTime || undefined, endTime: r.endTime || undefined, note: r.note || undefined }))),
    onSuccess: () => { notify.success(t('common.saved')); qc.invalidateQueries({ queryKey: ['duties', business.id] }); },
    onError: notify.error,
  });
  const upd = (i: number, k: keyof Duty, v: string) => setRows((p) => p.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <Box3 title={t('x.dutyTitle')} hint={t('x.dutyHint')} action={<Button startIcon={<AddRounded />} onClick={() => setRows((p) => [...p, { date: isoDay(p.length), startTime: '', endTime: '', note: '' }])}>{t('x.addDuty')}</Button>}>
      <Stack spacing={1.5}>
        {rows.map((r, i) => (
          <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <TextField size="small" type="date" label={t('common.date')} InputLabelProps={{ shrink: true }} value={r.date} onChange={(e) => upd(i, 'date', e.target.value)} />
            <TextField size="small" type="time" label={t('x.from')} InputLabelProps={{ shrink: true }} value={r.startTime} onChange={(e) => upd(i, 'startTime', e.target.value)} />
            <TextField size="small" type="time" label={t('x.to')} InputLabelProps={{ shrink: true }} value={r.endTime} onChange={(e) => upd(i, 'endTime', e.target.value)} />
            <TextField size="small" sx={{ flex: 1 }} label={t('common.note')} value={r.note} onChange={(e) => upd(i, 'note', e.target.value)} />
            <IconButton color="error" onClick={() => setRows((p) => p.filter((_, j) => j !== i))}><DeleteOutlineRounded /></IconButton>
          </Stack>
        ))}
        {!rows.length && <Typography color="text.secondary">{t('x.noDuty')}</Typography>}
      </Stack>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}><Button variant="contained" startIcon={<SaveRounded />} disabled={save.isPending} onClick={() => save.mutate()}>{t('common.save')}</Button></Stack>
    </Box3>
  );
};

/* ───────────── Plan & usage ───────────── */
export const PlanTab = ({ business }: { business: Business }) => {
  const { t } = useT();
  const { data: e } = useQuery({ queryKey: ['entitlements', business.id], queryFn: () => billingApi.entitlements(business.id) });
  if (!e) return <RowsSkeleton rows={3} />;
  const rows: [string, number, number][] = [
    [t('x.feat.maxImages'), e.usage.images, e.features.maxImages],
    [t('x.feat.maxItems'), e.usage.items, e.features.maxItems],
    [t('x.feat.maxActiveOffers'), e.usage.activeOffers, e.features.maxActiveOffers],
    [t('x.feat.maxActiveListings'), e.usage.activeListings, e.features.maxActiveListings],
  ];
  return (
    <Box3 title={`${t('x.currentPlan')}: ${e.plan.code === 'launch' ? t('x.allFree') : e.plan.name}`} hint={!e.billingEnabled ? t('x.allFreeText') : undefined} action={<Button variant="contained" component={Link} to="/owner/subscription">{t('x.plans')}</Button>}>
      <Grid container spacing={2}>
        {rows.map(([l, u, m]) => (
          <Grid item xs={6} md={3} key={l}>
            <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={900}>{u}<Typography component="span" color="text.secondary"> / {limitLabel(m, t('x.unlimited'))}</Typography></Typography>
              <Typography variant="body2" color="text.secondary">{l}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box3>
  );
};
