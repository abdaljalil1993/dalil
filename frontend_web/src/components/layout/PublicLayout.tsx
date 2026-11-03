import { Box, Container } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';

/** Pages with a full-bleed hero render under a transparent navbar. */
const HERO_PAGES = ['/'];

export const PublicLayout = () => {
  const { pathname } = useLocation();
  const hero = HERO_PAGES.includes(pathname);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar transparent={hero} />
      <Box component="main" sx={{ flex: 1, pt: hero ? 0 : { xs: 10, md: 12 } }}>
        <Outlet />
      </Box>
      <Footer />
      <MobileNav />
    </Box>
  );
};

export const PageContainer = ({ children, maxWidth = 'xl' }: { children: React.ReactNode; maxWidth?: 'lg' | 'xl' | 'md' | 'sm' }) => (
  <Container maxWidth={maxWidth} sx={{ py: { xs: 2, md: 3 } }}>{children}</Container>
);
