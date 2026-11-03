import { Avatar, Box, Card, Chip, Grid, List, ListItemAvatar, ListItemButton, ListItemText, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import InsightsRounded from '@mui/icons-material/InsightsRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import RateReviewRounded from '@mui/icons-material/RateReviewRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import PendingActionsRounded from '@mui/icons-material/PendingActionsRounded';
import FlagRounded from '@mui/icons-material/FlagRounded';
import VerifiedUserRounded from '@mui/icons-material/VerifiedUserRounded';
import ViewCarouselRounded from '@mui/icons-material/ViewCarouselRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import MailRounded from '@mui/icons-material/MailRounded';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ReactNode } from 'react';
import { adminApi } from '@/api/services';
import { useT } from '@/i18n';
import { PageHeader } from '@/components/common/Section';
import { StatCard } from '@/components/common/StatCard';
import { RowsSkeleton } from '@/components/common/Skeletons';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { STATUS_COLOR } from '../owner/MyBusinesses';

const ChartCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <Card sx={{ p: 2.5, height: '100%' }}>
    <Typography fontWeight={800} sx={{ mb: 2 }}>{title}</Typography>
    <Box sx={{ height: 260, direction: 'ltr' }}>{children}</Box>
  </Card>
);

export const AdminDashboard = () => {
  const { t } = useT();
  const theme = useTheme();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.stats });
  if (isLoading || !data) return <RowsSkeleton rows={8} />;
  const ink = theme.palette.text.secondary;
  const grid = theme.custom.border;
  const primary = theme.palette.primary.main;
  const tip = { contentStyle: { borderRadius: 12, border: `1px solid ${grid}`, background: theme.palette.background.paper, color: theme.palette.text.primary }, cursor: { fill: theme.palette.action.hover } };
  const p = data.pendingActions;
  const pending = [
    { k: 'businesses', l: t('nav.businesses'), v: p.businesses, i: <StorefrontRounded />, to: '/admin/businesses?status=pending' },
    { k: 'reports', l: t('nav.reports'), v: p.reports, i: <FlagRounded />, to: '/admin/reports' },
    { k: 'claims', l: t('nav.claims'), v: p.claims, i: <VerifiedUserRounded />, to: '/admin/claims' },
    { k: 'ads', l: t('nav.ads'), v: p.ads, i: <ViewCarouselRounded />, to: '/admin/ads' },
    { k: 'featured', l: t('nav.featuredMgmt'), v: p.featured, i: <BoltRounded />, to: '/admin/featured' },
    { k: 'messages', l: t('nav.messages'), v: p.messages, i: <MailRounded />, to: '/admin/messages' },
  ];
  return (
    <Box>
      <PageHeader icon={<InsightsRounded />} title={t('admin.welcome')} subtitle={t('admin.subtitle')} />
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={6} md={3}><StatCard label={t('nav.users')} value={data.totals.users} icon={<PeopleRounded />} onClick={() => navigate('/admin/users')} /></Grid>
        <Grid item xs={6} md={3}><StatCard label={t('nav.businesses')} value={data.totals.businesses} icon={<StorefrontRounded />} color="#12B76A" hint={`${data.totals.approved} ✓`} onClick={() => navigate('/admin/businesses')} /></Grid>
        <Grid item xs={6} md={3}><StatCard label={t('nav.reviews')} value={data.totals.reviews} icon={<RateReviewRounded />} color="#F79009" onClick={() => navigate('/admin/reviews')} /></Grid>
        <Grid item xs={6} md={3}><StatCard label={t('nav.insights')} value={data.totals.searches} icon={<SearchRounded />} color="#0BA5EC" onClick={() => navigate('/admin/insights')} /></Grid>
      </Grid>
      <Card sx={{ p: 2.5, mb: 2.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}><PendingActionsRounded color="warning" /><Typography fontWeight={800}>{t('admin.pending')}</Typography></Stack>
        <Grid container spacing={1.5}>
          {pending.map((x) => (
            <Grid item xs={6} sm={4} md={2} key={x.k}>
              <Box component={Link} to={x.to} sx={{ display: 'block', p: 1.75, borderRadius: 3, bgcolor: x.v ? 'warning.main' : 'action.hover', color: x.v ? '#fff' : 'text.primary', transition: 'transform .2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">{x.i}<Typography variant="h5" fontWeight={800}>{x.v}</Typography></Stack>
                <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>{x.l}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Card>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <ChartCard title={t('admin.newBusinesses')}>
            <ResponsiveContainer>
              <AreaChart data={data.charts.businessesByMonth} margin={{ left: -20, right: 8 }}>
                <defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={primary} stopOpacity={0.35} /><stop offset="1" stopColor={primary} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: ink, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: ink, fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="count" stroke={primary} strokeWidth={2} fill="url(#gA)" activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title={`${t('admin.newUsers')} · ${t('admin.newReviews')}`}>
            <ResponsiveContainer>
              <BarChart data={data.charts.usersByMonth.map((u, i) => ({ month: u.month, users: u.count, reviews: data.charts.reviewsByMonth[i]?.count || 0 }))} margin={{ left: -20, right: 8 }} barGap={2}>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: ink, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: ink, fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip {...tip} />
                <Bar dataKey="users" name={t('admin.newUsers')} fill={primary} radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="reviews" name={t('admin.newReviews')} fill="#F79009" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title={t('admin.byCategory')}>
            <ResponsiveContainer>
              <BarChart data={data.charts.businessesByCategory} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid stroke={grid} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: ink, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: ink, fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip {...tip} />
                <Bar dataKey="count" fill={primary} radius={[0, 4, 4, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title={t('admin.byCity')}>
            <ResponsiveContainer>
              <BarChart data={data.charts.businessesByCity} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid stroke={grid} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: ink, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: ink, fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip {...tip} />
                <Bar dataKey="count" fill="#0BA5EC" radius={[0, 4, 4, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        {[{ title: t('admin.recent'), items: data.recentBusinesses }, { title: t('admin.top'), items: data.topBusinesses }].map((g) => (
          <Grid item xs={12} md={6} key={g.title}>
            <Card sx={{ p: 2, height: '100%' }}>
              <Typography fontWeight={800} sx={{ px: 1, mb: 1 }}>{g.title}</Typography>
              <List dense>
                {g.items.map((b) => (
                  <ListItemButton key={b.id} component={Link} to={`/b/${b.slug}`}>
                    <ListItemAvatar><Avatar variant="rounded" src={b.logoImage || undefined} sx={{ bgcolor: 'transparent' }}><CategoryIcon icon={b.category?.icon} color={b.category?.color} size={40} /></Avatar></ListItemAvatar>
                    <ListItemText primary={b.name} secondary={`${b.category?.name || ''} · ${b.city?.name || ''}`} primaryTypographyProps={{ fontWeight: 700, noWrap: true }} />
                    {b.status ? <Chip size="small" label={t(`owner.statuses.${b.status}`)} color={STATUS_COLOR[b.status]} /> : <Typography fontWeight={700}>★ {b.averageRating.toFixed(1)}</Typography>}
                  </ListItemButton>
                ))}
              </List>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
