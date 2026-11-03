import { Box, Container, Grid, Stack, Typography, Link as MLink } from '@mui/material';
import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/queries';
import { useLocalName, useT } from '@/i18n';
import { Logo } from '../common/Logo';

export const Footer = () => {
  const { t } = useT();
  const ln = useLocalName();
  const { data: cats } = useCategories();
  const col = (title: string, links: { to: string; label: string }[]) => (
    <Box>
      <Typography fontWeight={700} sx={{ mb: 1.5 }}>{title}</Typography>
      <Stack spacing={1}>
        {links.map((l) => (
          <MLink key={l.to + l.label} component={Link} to={l.to} color="text.secondary" underline="hover" variant="body2">{l.label}</MLink>
        ))}
      </Stack>
    </Box>
  );
  return (
    <Box component="footer" sx={{ mt: 10, borderTop: (th) => `1px solid ${th.custom.border}`, bgcolor: 'background.paper', pb: { xs: 10, md: 0 } }}>
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Logo />
            <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 360 }}>{t('app.slogan')}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>{col(t('footer.explore'), (cats || []).slice(0, 6).map((c) => ({ to: `/c/${c.slug}`, label: ln(c) })))}</Grid>
          <Grid item xs={6} md={2.5}>{col(t('footer.forBusiness'), [{ to: '/owner/businesses/new', label: t('footer.listFree') }, { to: '/owner/promote', label: t('footer.advertise') }, { to: '/featured', label: t('nav.featured') }])}</Grid>
          <Grid item xs={6} md={2.5}>{col(t('footer.company'), [{ to: '/about', label: t('nav.about') }, { to: '/contact', label: t('nav.contact') }, { to: '/categories', label: t('nav.categories') }])}</Grid>
        </Grid>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 5 }}>© {new Date().getFullYear()} {t('app.name')} — {t('footer.rights')}</Typography>
      </Container>
    </Box>
  );
};
