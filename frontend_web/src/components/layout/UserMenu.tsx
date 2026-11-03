import { Avatar, Badge, Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import NotificationsRounded from '@mui/icons-material/NotificationsRounded';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import AdminPanelSettingsRounded from '@mui/icons-material/AdminPanelSettingsRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/queries';
import { useT } from '@/i18n';
import { initials } from '@/utils/format';

export const UserMenu = () => {
  const { user, isAdmin, logout } = useAuth();
  const { data: unread } = useUnreadCount();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const navigate = useNavigate();
  const { t } = useT();
  if (!user) return null;
  const go = (p: string) => { setAnchor(null); navigate(p); };
  return (
    <>
      <Tooltip title={t('nav.notifications')}>
        <IconButton onClick={() => navigate('/account/notifications')}>
          <Badge color="error" badgeContent={unread || 0} max={99}><NotificationsRounded /></Badge>
        </IconButton>
      </Tooltip>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)} sx={{ p: 0.5 }}>
        <Avatar src={user.avatar || undefined} sx={{ width: 38, height: 38, background: (th) => th.custom.gradient, fontSize: 15, fontWeight: 700 }}>{initials(user.fullName)}</Avatar>
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} PaperProps={{ sx: { width: 260, mt: 1, borderRadius: 3 } }} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography fontWeight={700} noWrap>{user.fullName}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>{user.email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => go('/account')}><ListItemIcon><DashboardRounded fontSize="small" /></ListItemIcon>{t('nav.dashboard')}</MenuItem>
        <MenuItem onClick={() => go('/account/favorites')}><ListItemIcon><FavoriteRounded fontSize="small" /></ListItemIcon>{t('nav.favorites')}</MenuItem>
        <MenuItem onClick={() => go('/owner/businesses')}><ListItemIcon><StorefrontRounded fontSize="small" /></ListItemIcon>{t('nav.myBusinesses')}</MenuItem>
        {isAdmin && <MenuItem onClick={() => go('/admin')}><ListItemIcon><AdminPanelSettingsRounded fontSize="small" color="primary" /></ListItemIcon>{t('nav.admin')}</MenuItem>}
        <MenuItem onClick={() => go('/account/settings')}><ListItemIcon><SettingsRounded fontSize="small" /></ListItemIcon>{t('nav.settings')}</MenuItem>
        <Divider />
        <MenuItem onClick={() => { setAnchor(null); logout(); }} sx={{ color: 'error.main' }}><ListItemIcon><LogoutRounded fontSize="small" color="error" /></ListItemIcon>{t('nav.logout')}</MenuItem>
      </Menu>
    </>
  );
};
