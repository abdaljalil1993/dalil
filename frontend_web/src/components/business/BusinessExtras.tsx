import { Alert, Avatar, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import RestaurantMenuRounded from '@mui/icons-material/RestaurantMenuRounded';
import LocalOfferRounded from '@mui/icons-material/LocalOfferRounded';
import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ReactNode, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { bookingApi, extrasApi } from '@/api/services';
import type { Business } from '@/api/types';
import { useNotify } from '@/hooks/useNotify';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n';
import { formatPrice, isoDay } from '@/utils/format';
import { OfferCard } from './ExtraCards';

const Block = ({ title, icon, children, id }: { title: ReactNode; icon: ReactNode; children: ReactNode; id?: string }) => (
  <Card id={id} sx={{ p: { xs: 2.25, md: 3 }, mb: 2.5, scrollMarginTop: 96 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="h6" fontWeight={800}>{title}</Typography>
    </Stack>
    {children}
  </Card>
);

export const MenuBlock = ({ b }: { b: Business }) => {
  const { t, locale } = useT();
  const { data } = useQuery({ queryKey: ['items', b.id], queryFn: () => extrasApi.items(b.id) });
  const [sec, setSec] = useState(0);
  if (!data?.total) return null;
  const sections = data.sections;
  const cur = sections[Math.min(sec, sections.length - 1)];
  return (
    <Block title={t('x.menu')} icon={<RestaurantMenuRounded />} id="menu">
      {sections.length > 1 && (
        <Tabs value={Math.min(sec, sections.length - 1)} onChange={(_, v) => setSec(v)} variant="scrollable" sx={{ mb: 2, minHeight: 40, '& .MuiTab-root': { minHeight: 40 } }}>
          {sections.map((s, i) => <Tab key={s.name || i} value={i} label={`${s.name || t('common.all')} (${s.items.length})`} />)}
        </Tabs>
      )}
      <Grid container spacing={1.5}>
        {cur.items.map((it) => (
          <Grid item xs={12} sm={6} key={it.id}>
            <Stack direction="row" spacing={1.5} sx={{ p: 1.25, borderRadius: 3, border: 1, borderColor: 'divider', height: '100%', opacity: it.isAvailable ? 1 : 0.5 }}>
              {it.image && <Avatar variant="rounded" src={it.image} sx={{ width: 72, height: 72 }} />}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography fontWeight={700} noWrap>{it.name}</Typography>
                  {it.isPopular && <Chip size="small" label={t('x.popular')} sx={{ height: 20, fontSize: 11, background: (th) => th.custom.warmGradient, color: '#fff' }} />}
                </Stack>
                {it.description && <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{it.description}</Typography>}
                <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mt: 0.5 }}>
                  {it.price && <Typography fontWeight={800} color="primary.main">{formatPrice(it.price, it.currency, locale)}</Typography>}
                  {it.oldPrice && <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{formatPrice(it.oldPrice, it.currency, locale)}</Typography>}
                  {it.unit && <Typography variant="caption" color="text.secondary">{it.unit}</Typography>}
                  {it.durationMinutes && <Typography variant="caption" color="text.secondary">· {it.durationMinutes} min</Typography>}
                </Stack>
              </Box>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Block>
  );
};

export const BusinessOffersBlock = ({ b }: { b: Business }) => {
  const { t } = useT();
  const { data } = useQuery({ queryKey: ['offers', 'biz', b.id], queryFn: () => extrasApi.businessOffers(b.id) });
  const active = (data || []).filter((o) => o.isActive && new Date(o.endDate).getTime() > Date.now());
  if (!active.length) return null;
  return (
    <Block title={t('x.bizOffers')} icon={<LocalOfferRounded />} id="offers">
      <Grid container spacing={2}>{active.map((o) => <Grid item xs={12} sm={6} key={o.id}><OfferCard offer={{ ...o, business: { id: b.id, name: b.name, nameEn: b.nameEn, slug: b.slug, logoImage: b.logoImage, coverImage: b.coverImage, city: b.city, category: b.category } }} /></Grid>)}</Grid>
    </Block>
  );
};

export const BookingDialog = ({ b, open, onClose }: { b: Business; open: boolean; onClose: () => void }) => {
  const { t, locale } = useT();
  const notify = useNotify();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [date, setDate] = useState(isoDay());
  const [time, setTime] = useState<string | null>(null);
  const [itemId, setItemId] = useState<number | ''>('');
  const [partySize, setParty] = useState(1);
  const [phone, setPhone] = useState(user?.phone || '');
  const [note, setNote] = useState('');
  const { data: av, isFetching } = useQuery({ queryKey: ['availability', b.id, date], queryFn: () => bookingApi.availability(b.id, date), enabled: open });
  const { data: items } = useQuery({ queryKey: ['items', b.id], queryFn: () => extrasApi.items(b.id), enabled: open });
  const days = useMemo(() => Array.from({ length: Math.min(av?.bookingDaysAhead || 14, 30) }, (_, i) => isoDay(i)), [av?.bookingDaysAhead]);
  const services = (items?.sections || []).flatMap((s) => s.items).filter((i) => i.isAvailable);
  const book = useMutation({
    mutationFn: () => bookingApi.book(b.id, { date, time: av?.bookingMode === 'slot' ? time : null, itemId: itemId || null, partySize, phone: phone || undefined, note: note || undefined }),
    onSuccess: (a) => { notify.success(a.status === 'confirmed' ? t('x.bookingConfirmed') : t('x.bookingSent')); onClose(); navigate('/account/bookings'); },
    onError: notify.error,
  });
  const canBook = av?.bookingMode === 'day' ? av.available : Boolean(time);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><EventAvailableRounded color="primary" /> {t('x.booking')} — {b.name}</DialogTitle>
      <DialogContent dividers>
        {av?.bookingNote && <Alert severity="info" sx={{ mb: 2 }}>{av.bookingNote}</Alert>}
        <Typography fontWeight={700} sx={{ mb: 1 }}>{t('x.pickDate')}</Typography>
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }} className="no-scrollbar">
          {days.map((d, i) => (
            <Box key={d} onClick={() => { setDate(d); setTime(null); }} sx={{ cursor: 'pointer', flexShrink: 0, width: 64, py: 1, textAlign: 'center', borderRadius: 3, border: 2, borderColor: d === date ? 'primary.main' : 'divider', bgcolor: d === date ? 'primary.main' : 'transparent', color: d === date ? '#fff' : 'text.primary', transition: '.15s' }}>
              <Typography variant="caption" display="block">{i === 0 ? t('x.today') : i === 1 ? t('x.tomorrow') : dayjs(d).format('ddd')}</Typography>
              <Typography variant="h6" fontWeight={800} lineHeight={1.2}>{dayjs(d).format('D')}</Typography>
              <Typography variant="caption">{dayjs(d).format('MMM')}</Typography>
            </Box>
          ))}
        </Stack>
        {av?.bookingMode !== 'day' && (
          <>
            <Typography fontWeight={700} sx={{ mt: 2, mb: 1 }}>{t('x.pickTime')}</Typography>
            {isFetching ? <Typography color="text.secondary">{t('common.loading')}</Typography> : !av?.slots.length ? <Alert severity="warning">{t('x.noSlots')}</Alert> : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))', gap: 1 }}>
                {av.slots.map((s) => <Chip key={s.time} label={s.time} color={time === s.time ? 'primary' : 'default'} variant={time === s.time ? 'filled' : 'outlined'} onClick={() => setTime(s.time)} sx={{ fontWeight: 700 }} />)}
              </Box>
            )}
          </>
        )}
        {av?.bookingMode === 'day' && !isFetching && !av.available && <Alert severity="warning" sx={{ mt: 2 }}>{t('x.noSlots')}</Alert>}
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          {services.length > 0 && (
            <Grid item xs={12}>
              <TextField select fullWidth label={t('x.service')} value={itemId} onChange={(e) => setItemId(e.target.value === '' ? '' : Number(e.target.value))}>
                <MenuItem value="">{t('x.anyService')}</MenuItem>
                {services.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}{s.price ? ` — ${formatPrice(s.price, s.currency, locale)}` : ''}</MenuItem>)}
              </TextField>
            </Grid>
          )}
          <Grid item xs={6}><TextField fullWidth type="number" label={t('x.partySize')} value={partySize} onChange={(e) => setParty(Math.max(1, Number(e.target.value)))} /></Grid>
          <Grid item xs={6}><TextField fullWidth label={t('common.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline minRows={2} label={t('common.note')} value={note} onChange={(e) => setNote(e.target.value)} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" disabled={!canBook || book.isPending} onClick={() => book.mutate()}>{t('x.bookNow')}</Button>
      </DialogActions>
    </Dialog>
  );
};
