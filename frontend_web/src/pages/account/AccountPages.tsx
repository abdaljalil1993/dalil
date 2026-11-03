import { Avatar, Box, Button, Card, Chip, Divider, Grid, IconButton, List, ListItemButton, ListItemIcon, ListItemText, MenuItem, Pagination, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import RateReviewRounded from '@mui/icons-material/RateReviewRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import NotificationsRounded from '@mui/icons-material/NotificationsRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import PhotoCameraRounded from '@mui/icons-material/PhotoCameraRounded';
import DoneAllRounded from '@mui/icons-material/DoneAllRounded';
import CircleRounded from '@mui/icons-material/CircleRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import AddBusinessRounded from '@mui/icons-material/AddBusinessRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import VerifiedUserRounded from '@mui/icons-material/VerifiedUserRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, favoriteApi, moderationApi, notificationApi, reviewApi, userApi } from '@/api/services';
import { useAuth } from '@/hooks/useAuth';
import { useCities } from '@/hooks/queries';
import { useNotify } from '@/hooks/useNotify';
import { usePrefs } from '@/store/prefsStore';
import { useAuthStore } from '@/store/authStore';
import { useLocalName, useT } from '@/i18n';
import { EmptyState, PageHeader } from '@/components/common/Section';
import { StatCard } from '@/components/common/StatCard';
import { BusinessGrid } from '@/components/business/BusinessGrid';
import { GridSkeleton, RowsSkeleton } from '@/components/common/Skeletons';
import { ReviewItem } from '@/components/business/ReviewsSection';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { fmtDate, fromNow, initials } from '@/utils/format';
import { SearchBar } from '@/components/common/SearchBar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const notifLink = (type: string, d: any): string | null => {
  const map: Record<string, string> = {
    subscription_activated: '/owner/subscription', subscription_expiring: '/owner/subscription', payment_rejected: '/owner/subscription',
    job_application: '/account/listings', listing_rejected: '/account/listings', application_update: '/account/applications',
    service_request: '/owner/requests', new_quote: '/account/requests', quote_accepted: '/owner/requests',
    new_appointment: '/owner/bookings', appointment_update: '/account/bookings',
  };
  if (type === 'listing_approved' && d?.listingSlug) return `/l/${d.listingSlug}`;
  if (map[type]) return map[type];
  return d?.slug ? `/b/${d.slug}` : null;
};

export const Overview = () => {
  const { t } = useT();
  const navigate = useNavigate();
  const { data: p } = useQuery({ queryKey: ['profile'], queryFn: userApi.profile });
  const { data: claims } = useQuery({ queryKey: ['claims', 'my'], queryFn: moderationApi.myClaims });
  const user = useAuthStore((s) => s.user);
  return (
    <Box>
      <Card sx={{ p: { xs: 3, md: 4 }, mb: 3, background: (th) => th.custom.gradient, color: '#fff', border: 'none' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar src={user?.avatar || undefined} sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,.2)', fontSize: 24, fontWeight: 800 }}>{initials(user?.fullName)}</Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800}>{t('account.hello', { name: user?.firstName || '' })}</Typography>
            <Typography sx={{ opacity: 0.9 }}>{t('account.overviewText')}</Typography>
            {p && <Typography variant="caption" sx={{ opacity: 0.8 }}>{t('account.memberSince', { date: fmtDate(p.createdAt) })}</Typography>}
          </Box>
        </Stack>
        <Box sx={{ mt: 3, color: 'text.primary' }}><SearchBar size="medium" /></Box>
      </Card>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><StatCard label={t('nav.favorites')} value={p?.counts?.favorites ?? '—'} icon={<FavoriteRounded />} color="#F04438" onClick={() => navigate('/account/favorites')} /></Grid>
        <Grid item xs={6} md={3}><StatCard label={t('nav.myReviews')} value={p?.counts?.reviews ?? '—'} icon={<RateReviewRounded />} color="#F79009" onClick={() => navigate('/account/reviews')} /></Grid>
        <Grid item xs={6} md={3}><StatCard label={t('nav.myBusinesses')} value={p?.counts?.businesses ?? '—'} icon={<StorefrontRounded />} color="#5B3DF5" onClick={() => navigate('/owner/businesses')} /></Grid>
        <Grid item xs={6} md={3}><StatCard label={t('nav.notifications')} value={p?.counts?.unreadNotifications ?? '—'} icon={<NotificationsRounded />} color="#0BA5EC" onClick={() => navigate('/account/notifications')} /></Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <List>
              {[
                { to: '/search', i: <SearchRounded />, l: t('nav.search') },
                { to: '/owner/businesses/new', i: <AddBusinessRounded />, l: t('nav.addBusiness') },
                { to: '/account/profile', i: <PersonRounded />, l: t('nav.profile') },
                { to: '/account/settings', i: <SettingsRounded />, l: t('nav.settings') },
              ].map((x) => (
                <ListItemButton key={x.to} component={Link} to={x.to}><ListItemIcon sx={{ color: 'primary.main' }}>{x.i}</ListItemIcon><ListItemText primary={x.l} primaryTypographyProps={{ fontWeight: 600 }} /></ListItemButton>
              ))}
            </List>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2.5, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}><VerifiedUserRounded color="primary" /><Typography fontWeight={800}>{t('account.myClaims')}</Typography></Stack>
            {!claims?.length ? <Typography color="text.secondary">—</Typography> : claims.map((c) => (
              <Stack key={c.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                <Typography component={Link} to={c.business ? `/b/${c.business.slug}` : '#'} fontWeight={600}>{c.business?.name}</Typography>
                <Chip size="small" label={t(`admin.claimStatus.${c.status}`)} color={c.status === 'approved' ? 'success' : c.status === 'rejected' ? 'error' : 'warning'} />
              </Stack>
            ))}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export const Favorites = () => {
  const { t } = useT();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['favorites', page], queryFn: () => favoriteApi.list({ page, limit: 12 }) });
  return (
    <Box>
      <PageHeader icon={<FavoriteRounded />} title={t('nav.favorites')} />
      {isLoading ? <GridSkeleton md={4} count={6} /> : !data?.items.length ? (
        <Card><EmptyState icon={<FavoriteRounded />} title={t('account.noFavorites')} text={t('account.noFavoritesText')} action={<Button component={Link} to="/categories" variant="contained">{t('nav.categories')}</Button>} /></Card>
      ) : (
        <>
          <BusinessGrid items={data.items.map((f) => f.business)} md={4} />
          {data.meta.totalPages > 1 && <Pagination sx={{ mt: 3, display: 'flex', justifyContent: 'center' }} count={data.meta.totalPages} page={page} onChange={(_, p) => setPage(p)} />}
        </>
      )}
    </Box>
  );
};

export const MyReviews = () => {
  const { t } = useT();
  const qc = useQueryClient();
  const notify = useNotify();
  const [page, setPage] = useState(1);
  const [del, setDel] = useState<string | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['reviews', 'mine', page], queryFn: () => reviewApi.mine({ page, limit: 10 }) });
  const rm = useMutation({ mutationFn: (id: string) => reviewApi.remove(id), onSuccess: () => { notify.success(t('common.deleted')); setDel(null); qc.invalidateQueries({ queryKey: ['reviews'] }); }, onError: notify.error });
  return (
    <Box>
      <PageHeader icon={<RateReviewRounded />} title={t('nav.myReviews')} />
      <Card sx={{ px: 2.5 }}>
        {isLoading ? <Box sx={{ py: 2 }}><RowsSkeleton /></Box> : !data?.items.length ? <EmptyState icon={<RateReviewRounded />} title={t('account.noReviews')} /> : data.items.map((r) => (
          <Stack key={r.id} direction="row" alignItems="flex-start">
            <Box sx={{ flex: 1 }}><ReviewItem r={r} showBusiness /></Box>
            <Stack direction="row" sx={{ pt: 2 }}>
              <IconButton component={Link} to={`/b/${r.business?.slug}#reviews`}><EditRounded fontSize="small" /></IconButton>
              <IconButton color="error" onClick={() => setDel(r.id)}><DeleteOutlineRounded fontSize="small" /></IconButton>
            </Stack>
          </Stack>
        ))}
      </Card>
      {data && data.meta.totalPages > 1 && <Pagination sx={{ mt: 3, display: 'flex', justifyContent: 'center' }} count={data.meta.totalPages} page={page} onChange={(_, p) => setPage(p)} />}
      <ConfirmDialog open={Boolean(del)} danger onClose={() => setDel(null)} onConfirm={() => del && rm.mutate(del)} loading={rm.isPending} />
    </Box>
  );
};

export const Notifications = () => {
  const { t } = useT();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['notifications', page], queryFn: () => notificationApi.list({ page, limit: 20 }) });
  const refresh = () => qc.invalidateQueries({ queryKey: ['notifications'] });
  const readAll = useMutation({ mutationFn: notificationApi.readAll, onSuccess: refresh });
  const read = useMutation({ mutationFn: notificationApi.read, onSuccess: refresh });
  const remove = useMutation({ mutationFn: notificationApi.remove, onSuccess: refresh });
  return (
    <Box>
      <PageHeader icon={<NotificationsRounded />} title={t('nav.notifications')} actions={<Button startIcon={<DoneAllRounded />} onClick={() => readAll.mutate()}>{t('account.markAllRead')}</Button>} />
      <Card>
        {isLoading ? <Box sx={{ p: 2 }}><RowsSkeleton /></Box> : !data?.items.length ? <EmptyState icon={<NotificationsRounded />} title={t('account.noNotifications')} /> : (
          <List disablePadding>
            {data.items.map((n, i) => (
              <Box key={n.id}>
                {i > 0 && <Divider />}
                <ListItemButton onClick={() => { if (!n.isRead) read.mutate(n.id); const to = notifLink(n.type, n.data); if (to) navigate(to); }} sx={{ borderRadius: 0, py: 1.75, bgcolor: n.isRead ? 'transparent' : 'action.hover' }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>{!n.isRead && <CircleRounded sx={{ fontSize: 10 }} color="primary" />}</ListItemIcon>
                  <ListItemText primary={n.title} secondary={[n.body, fromNow(n.createdAt)].filter(Boolean).join(' · ')} primaryTypographyProps={{ fontWeight: n.isRead ? 500 : 800 }} />
                  <IconButton edge="end" onClick={(e) => { e.stopPropagation(); remove.mutate(n.id); }}><DeleteOutlineRounded fontSize="small" /></IconButton>
                </ListItemButton>
              </Box>
            ))}
          </List>
        )}
      </Card>
      {data && data.meta.totalPages > 1 && <Pagination sx={{ mt: 3, display: 'flex', justifyContent: 'center' }} count={data.meta.totalPages} page={page} onChange={(_, p) => setPage(p)} />}
    </Box>
  );
};

export const Profile = () => {
  const { t } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const qc = useQueryClient();
  const { setUser } = useAuth();
  const { data: cities } = useCities();
  const { data: p } = useQuery({ queryKey: ['profile'], queryFn: userApi.profile });
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<{ firstName?: string; lastName?: string; phone?: string; bio?: string; cityId?: number | '' }>({});
  const v = { firstName: p?.firstName, lastName: p?.lastName, phone: p?.phone || '', bio: p?.bio || '', cityId: p?.cityId ?? '', ...form };
  const save = useMutation({
    mutationFn: () => userApi.update({ firstName: v.firstName, lastName: v.lastName, phone: v.phone || undefined, bio: v.bio || undefined, cityId: v.cityId === '' ? undefined : Number(v.cityId) } as never),
    onSuccess: (u) => { setUser(u); qc.invalidateQueries({ queryKey: ['profile'] }); notify.success(t('common.saved')); setForm({}); },
    onError: notify.error,
  });
  const avatar = useMutation({ mutationFn: userApi.avatar, onSuccess: (u) => { setUser({ ...u }); qc.invalidateQueries({ queryKey: ['profile'] }); notify.success(t('common.saved')); }, onError: notify.error });
  return (
    <Box>
      <PageHeader icon={<PersonRounded />} title={t('nav.profile')} />
      <Card sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 760 }}>
        <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar src={p?.avatar || undefined} sx={{ width: 96, height: 96, fontSize: 32, fontWeight: 800, background: (th) => th.custom.gradient }}>{initials(p?.fullName)}</Avatar>
            <IconButton onClick={() => fileRef.current?.click()} sx={{ position: 'absolute', bottom: -4, insetInlineEnd: -4, bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: 'background.paper' } }} size="small"><PhotoCameraRounded fontSize="small" /></IconButton>
            <input ref={fileRef} type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) avatar.mutate(f); e.target.value = ''; }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800}>{p?.fullName}</Typography>
            <Typography color="text.secondary">{p?.email}</Typography>
            {p && <Chip size="small" label={t(`admin.roles.${p.role}`)} color="primary" variant="outlined" sx={{ mt: 0.5 }} />}
          </Box>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField fullWidth label={t('auth.firstName')} value={v.firstName || ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label={t('auth.lastName')} value={v.lastName || ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label={t('common.phone')} value={v.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputProps={{ dir: 'ltr' }} /></Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label={t('common.city')} value={v.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value === '' ? '' : Number(e.target.value) })}>
              <MenuItem value="">—</MenuItem>
              {(cities || []).map((c) => <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}><TextField fullWidth multiline minRows={3} label={t('account.bio')} value={v.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Grid>
        </Grid>
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}><Button variant="contained" onClick={() => save.mutate()} disabled={save.isPending || !Object.keys(form).length}>{t('common.save')}</Button></Stack>
      </Card>
    </Box>
  );
};

export const Settings = () => {
  const { t } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const { logout } = useAuth();
  const { locale, setLocale, mode, setMode, cityId, setCityId } = usePrefs();
  const { data: cities } = useCities();
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const change = useMutation({ mutationFn: () => authApi.changePassword({ currentPassword: cur, newPassword: pw }), onSuccess: () => { notify.success(t('account.passwordChanged')); setCur(''); setPw(''); }, onError: notify.error });
  const all = useMutation({ mutationFn: authApi.logoutAll, onSuccess: () => logout() });
  return (
    <Box>
      <PageHeader icon={<SettingsRounded />} title={t('nav.settings')} />
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>{t('account.preferences')}</Typography>
            <Stack spacing={2.5}>
              <Box><Typography variant="body2" fontWeight={600} gutterBottom>{t('account.language')}</Typography>
                <ToggleButtonGroup exclusive value={locale} onChange={(_, v) => v && setLocale(v)} fullWidth><ToggleButton value="ar">العربية</ToggleButton><ToggleButton value="en">English</ToggleButton></ToggleButtonGroup></Box>
              <Box><Typography variant="body2" fontWeight={600} gutterBottom>{t('account.theme')}</Typography>
                <ToggleButtonGroup exclusive value={mode} onChange={(_, v) => v && setMode(v)} fullWidth><ToggleButton value="light">{t('account.light')}</ToggleButton><ToggleButton value="dark">{t('account.dark')}</ToggleButton></ToggleButtonGroup></Box>
              <TextField select label={t('account.defaultCity')} value={cityId ?? ''} onChange={(e) => setCityId(e.target.value === '' ? null : Number(e.target.value))}>
                <MenuItem value="">{t('common.allCities')}</MenuItem>
                {(cities || []).map((c) => <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>)}
              </TextField>
            </Stack>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>{t('account.security')}</Typography>
            <Stack spacing={2}>
              <TextField type="password" label={t('auth.currentPassword')} value={cur} onChange={(e) => setCur(e.target.value)} />
              <TextField type="password" label={t('auth.newPassword')} value={pw} onChange={(e) => setPw(e.target.value)} helperText={t('auth.passwordHint')} />
              <Button variant="contained" disabled={!cur || pw.length < 8 || change.isPending} onClick={() => change.mutate()}>{t('account.changePassword')}</Button>
              <Divider />
              <Button color="error" variant="outlined" onClick={() => all.mutate()}>{t('account.logoutAll')}</Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
