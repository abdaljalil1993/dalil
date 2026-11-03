import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeRounded from '@mui/icons-material/HomeRounded';
import CategoryRounded from '@mui/icons-material/CategoryRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRequireAuth } from '@/hooks/useAuth';
import { useT } from '@/i18n';

export const MobileNav = () => {
  const { t } = useT();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const requireAuth = useRequireAuth();
  const items = [
    { v: '/', label: t('nav.home'), icon: <HomeRounded />, auth: false },
    { v: '/categories', label: t('nav.categories'), icon: <CategoryRounded />, auth: false },
    { v: '/search', label: t('nav.search'), icon: <SearchRounded />, auth: true },
    { v: '/account/favorites', label: t('nav.favorites'), icon: <FavoriteRounded />, auth: true },
    { v: '/account', label: t('nav.account'), icon: <PersonRounded />, auth: true },
  ];
  const current = items.slice().reverse().find((i) => (i.v === '/' ? pathname === '/' : pathname.startsWith(i.v)))?.v ?? false;
  return (
    <Paper elevation={0} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: { md: 'none' }, zIndex: 1100, borderTop: (th) => `1px solid ${th.custom.border}`, bgcolor: (th) => th.custom.glass, backdropFilter: 'blur(14px)', borderRadius: 0 }}>
      <BottomNavigation showLabels value={current} sx={{ bgcolor: 'transparent', height: 64 }} onChange={(_, v: string) => { const it = items.find((i) => i.v === v)!; if (it.auth) requireAuth(() => navigate(v), v); else navigate(v); }}>
        {items.map((i) => <BottomNavigationAction key={i.v} value={i.v} label={i.label} icon={i.icon} sx={{ minWidth: 0, '&.Mui-selected': { color: 'primary.main' } }} />)}
      </BottomNavigation>
    </Paper>
  );
};
