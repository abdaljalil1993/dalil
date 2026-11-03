import { AppBar, Box, Button, Container, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Stack, Toolbar } from '@mui/material';
import MenuRounded from '@mui/icons-material/MenuRounded';
import AddBusinessRounded from '@mui/icons-material/AddBusinessRounded';
import HomeRounded from '@mui/icons-material/HomeRounded';
import CategoryRounded from '@mui/icons-material/CategoryRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import InfoRounded from '@mui/icons-material/InfoRounded';
import MailRounded from '@mui/icons-material/MailRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useRequireAuth } from '@/hooks/useAuth';
import { useT } from '@/i18n';
import { Logo } from '../common/Logo';
import { PrefsToggles } from './PrefsToggles';
import { UserMenu } from './UserMenu';

export const Navbar = ({ transparent = false }: { transparent?: boolean }) => {
  const { t } = useT();
  const { isAuthenticated } = useAuth();
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const solid = !transparent || scrolled;
  const fg = solid ? undefined : '#fff';
  const links = [
    { to: '/', label: t('nav.home'), icon: <HomeRounded /> },
    { to: '/categories', label: t('nav.categories'), icon: <CategoryRounded /> },
    { to: '/featured', label: t('nav.featured'), icon: <BoltRounded /> },
    { to: '/about', label: t('nav.about'), icon: <InfoRounded /> },
    { to: '/contact', label: t('nav.contact'), icon: <MailRounded /> },
  ];
  const addBusiness = () => requireAuth(() => navigate('/owner/businesses/new'), '/owner/businesses/new');

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: solid ? (th) => th.custom.glass : 'transparent', backdropFilter: solid ? 'saturate(180%) blur(14px)' : 'none',
        borderBottom: (th) => (solid ? `1px solid ${th.custom.border}` : '1px solid transparent'), transition: 'all .25s', color: fg || 'text.primary',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 1, minHeight: { xs: 64, md: 72 } }}>
          <IconButton onClick={() => setOpen(true)} sx={{ display: { md: 'none' }, color: fg }}><MenuRounded /></IconButton>
          <Logo light={!solid} />
          <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' }, mx: 3 }}>
            {links.map((l) => (
              <Button key={l.to} component={NavLink} to={l.to} end={l.to === '/'} sx={{ color: fg || 'text.secondary', fontWeight: 600, '&.active': { color: fg || 'primary.main', bgcolor: solid ? 'action.selected' : 'rgba(255,255,255,.15)' } }}>
                {l.label}
              </Button>
            ))}
          </Stack>
          <Box sx={{ flex: 1 }} />
          <IconButton sx={{ color: fg }} onClick={() => requireAuth(() => navigate('/search'), '/search')} aria-label="search"><SearchRounded /></IconButton>
          <Box sx={{ display: { xs: 'none', sm: 'flex' } }}><PrefsToggles color={fg} /></Box>
          <Button onClick={addBusiness} variant={solid ? 'outlined' : 'contained'} startIcon={<AddBusinessRounded />} sx={{ display: { xs: 'none', lg: 'inline-flex' }, ...(solid ? {} : { background: 'rgba(255,255,255,.18)', '&:hover': { background: 'rgba(255,255,255,.28)' } }) }}>
            {t('nav.addBusiness')}
          </Button>
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Stack direction="row" spacing={1}>
              <Button component={Link} to="/login" sx={{ color: fg || 'text.primary', display: { xs: 'none', sm: 'inline-flex' } }}>{t('nav.login')}</Button>
              <Button component={Link} to="/register" variant="contained" sx={!solid ? { background: '#fff', color: '#101828', '&:hover': { background: '#f2f2f7' } } : undefined}>{t('nav.register')}</Button>
            </Stack>
          )}
        </Toolbar>
      </Container>
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: 290, p: 2 } }}>
        <Logo />
        <List sx={{ mt: 2 }}>
          {links.map((l) => (
            <ListItemButton key={l.to} component={NavLink} to={l.to} end={l.to === '/'} sx={{ '&.active': { bgcolor: 'action.selected', color: 'primary.main' } }}>
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{l.icon}</ListItemIcon>
              <ListItemText primary={l.label} />
            </ListItemButton>
          ))}
        </List>
        <Divider sx={{ my: 1 }} />
        <Button fullWidth variant="contained" startIcon={<AddBusinessRounded />} onClick={addBusiness} sx={{ my: 1 }}>{t('nav.addBusiness')}</Button>
        <Stack direction="row" justifyContent="center"><PrefsToggles /></Stack>
      </Drawer>
    </AppBar>
  );
};
