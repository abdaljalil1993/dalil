import { AppBar, Badge, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Stack, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuRounded from '@mui/icons-material/MenuRounded';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import RateReviewRounded from '@mui/icons-material/RateReviewRounded';
import NotificationsRounded from '@mui/icons-material/NotificationsRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import ForumRounded from '@mui/icons-material/ForumRounded';
import CampaignRounded from '@mui/icons-material/CampaignRounded';
import InsightsRounded from '@mui/icons-material/InsightsRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import CategoryRounded from '@mui/icons-material/CategoryRounded';
import LocationCityRounded from '@mui/icons-material/LocationCityRounded';
import FlagRounded from '@mui/icons-material/FlagRounded';
import VerifiedUserRounded from '@mui/icons-material/VerifiedUserRounded';
import ViewCarouselRounded from '@mui/icons-material/ViewCarouselRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import MailRounded from '@mui/icons-material/MailRounded';
import ManageSearchRounded from '@mui/icons-material/ManageSearchRounded';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded';
import CampaignOutlined from '@mui/icons-material/CampaignOutlined';
import WorkRounded from '@mui/icons-material/WorkRounded';
import HandymanRounded from '@mui/icons-material/HandymanRounded';
import EventNoteRounded from '@mui/icons-material/EventNoteRounded';
import InboxRounded from '@mui/icons-material/InboxRounded';
import WorkspacePremiumRounded from '@mui/icons-material/WorkspacePremiumRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import ContactEmergencyRounded from '@mui/icons-material/ContactEmergencyRounded';
import { ReactNode, useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/queries';
import { adminApi } from '@/api/services';
import { useT } from '@/i18n';
import { Logo } from '../common/Logo';
import { PrefsToggles } from './PrefsToggles';
import { UserMenu } from './UserMenu';

const WIDTH = 272;

interface Item { to: string; label: string; icon: ReactNode; badge?: number; end?: boolean }

export const DashboardLayout = () => {
  const { t, isRtl } = useT();
  const { isAdmin } = useAuth();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { data: unread } = useUnreadCount();
  const { data: stats } = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.stats, enabled: isAdmin, staleTime: 60_000 });
  const p = stats?.pendingActions;
  useEffect(() => { setOpen(false); }, [pathname]);

  const groups: { title: string; items: Item[] }[] = [
    {
      title: t('nav.account'),
      items: [
        { to: '/account', label: t('nav.overview'), icon: <DashboardRounded />, end: true },
        { to: '/account/favorites', label: t('nav.favorites'), icon: <FavoriteRounded /> },
        { to: '/account/reviews', label: t('nav.myReviews'), icon: <RateReviewRounded /> },
        { to: '/account/bookings', label: t('x.myBookings'), icon: <EventAvailableRounded /> },
        { to: '/account/requests', label: t('x.myRequests'), icon: <HandymanRounded /> },
        { to: '/account/listings', label: t('x.myListings'), icon: <CampaignOutlined /> },
        { to: '/account/applications', label: t('x.myApplications'), icon: <WorkRounded /> },
        { to: '/account/notifications', label: t('nav.notifications'), icon: <NotificationsRounded />, badge: unread },
        { to: '/account/profile', label: t('nav.profile'), icon: <PersonRounded /> },
        { to: '/account/settings', label: t('nav.settings'), icon: <SettingsRounded /> },
      ],
    },
    {
      title: t('nav.myBusinesses'),
      items: [
        { to: '/owner/businesses', label: t('nav.myBusinesses'), icon: <StorefrontRounded /> },
        { to: '/owner/bookings', label: t('x.ownerBookings'), icon: <EventNoteRounded /> },
        { to: '/owner/requests', label: t('x.inbox'), icon: <InboxRounded /> },
        { to: '/owner/reviews', label: t('nav.ownerReviews'), icon: <ForumRounded /> },
        { to: '/owner/subscription', label: t('x.plans'), icon: <WorkspacePremiumRounded /> },
        { to: '/owner/promote', label: t('nav.promote'), icon: <CampaignRounded /> },
      ],
    },
  ];
  if (isAdmin) {
    groups.push({
      title: t('nav.admin'),
      items: [
        { to: '/admin', label: t('nav.overview'), icon: <InsightsRounded />, end: true },
        { to: '/admin/businesses', label: t('nav.businesses'), icon: <StorefrontRounded />, badge: p?.businesses },
        { to: '/admin/categories', label: t('nav.categories'), icon: <CategoryRounded /> },
        { to: '/admin/cities', label: t('nav.cities'), icon: <LocationCityRounded /> },
        { to: '/admin/users', label: t('nav.users'), icon: <PeopleRounded /> },
        { to: '/admin/reviews', label: t('nav.reviews'), icon: <RateReviewRounded /> },
        { to: '/admin/reports', label: t('nav.reports'), icon: <FlagRounded />, badge: p?.reports },
        { to: '/admin/claims', label: t('nav.claims'), icon: <VerifiedUserRounded />, badge: p?.claims },
        { to: '/admin/ads', label: t('nav.ads'), icon: <ViewCarouselRounded />, badge: p?.ads },
        { to: '/admin/featured', label: t('nav.featuredMgmt'), icon: <BoltRounded />, badge: p?.featured },
        { to: '/admin/billing', label: t('x.billing'), icon: <PaymentsRounded /> },
        { to: '/admin/listings', label: t('x.listingsMod'), icon: <CampaignOutlined /> },
        { to: '/admin/requests', label: t('x.requestsAdmin'), icon: <HandymanRounded /> },
        { to: '/admin/emergency', label: t('x.emergencyAdmin'), icon: <ContactEmergencyRounded /> },
        { to: '/admin/messages', label: t('nav.messages'), icon: <MailRounded />, badge: p?.messages },
        { to: '/admin/insights', label: t('nav.insights'), icon: <ManageSearchRounded /> },
        { to: '/admin/audit', label: t('nav.audit'), icon: <HistoryRounded /> },
      ],
    });
  }

  const nav = (
    <Box sx={{ p: 2 }}>
      <Box sx={{ px: 1, py: 1 }}><Logo /></Box>
      <Box sx={{ mt: 1 }}>
        {groups.map((g) => (
          <List key={g.title} dense subheader={<ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 700, lineHeight: '36px' }}>{g.title}</ListSubheader>}>
            {g.items.map((i) => (
              <ListItemButton key={i.to} component={NavLink} to={i.to} end={i.end} sx={{ mb: 0.25, '&.active': { background: (th) => th.custom.gradientSoft, color: 'primary.main', '& .MuiListItemIcon-root': { color: 'primary.main' } } }}>
                <ListItemIcon sx={{ minWidth: 38 }}>{i.icon}</ListItemIcon>
                <ListItemText primary={i.label} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
                {!!i.badge && <Badge color="error" badgeContent={i.badge} sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none' } }} />}
              </ListItemButton>
            ))}
          </List>
        ))}
      </Box>
      <Divider sx={{ my: 1 }} />
      <ListItemButton component={NavLink} to="/">
        <ListItemIcon sx={{ minWidth: 38 }}><ArrowBackRounded sx={{ transform: isRtl ? 'scaleX(-1)' : undefined }} /></ListItemIcon>
        <ListItemText primary={t('nav.backToSite')} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
      </ListItemButton>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer variant={desktop ? 'permanent' : 'temporary'} open={desktop || open} onClose={() => setOpen(false)} anchor="left" PaperProps={{ sx: { width: WIDTH, scrollbarWidth: 'thin', borderInlineEnd: (th) => `1px solid ${th.custom.border}`, bgcolor: 'background.paper' } }} sx={{ width: desktop ? WIDTH : 0, flexShrink: 0 }}>
        {nav}
      </Drawer>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <AppBar position="sticky" sx={{ bgcolor: (th) => th.custom.glass, backdropFilter: 'blur(14px)', borderBottom: (th) => `1px solid ${th.custom.border}` }}>
          <Toolbar sx={{ gap: 1 }}>
            {!desktop && <IconButton onClick={() => setOpen(true)}><MenuRounded /></IconButton>}
            <Typography fontWeight={700} sx={{ flex: 1 }} noWrap>{''}</Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}><PrefsToggles /><UserMenu /></Stack>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
