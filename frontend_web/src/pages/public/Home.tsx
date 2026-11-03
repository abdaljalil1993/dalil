import { Box, Button, Card, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import AddBusinessRounded from '@mui/icons-material/AddBusinessRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import CompareArrowsRounded from '@mui/icons-material/CompareArrowsRounded';
import CallRounded from '@mui/icons-material/CallRounded';
import LocationCityRounded from '@mui/icons-material/LocationCityRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useHome } from '@/hooks/queries';
import { usePrefs } from '@/store/prefsStore';
import { useRequireAuth } from '@/hooks/useAuth';
import { useLocalName, useT } from '@/i18n';
import { SearchBar } from '@/components/common/SearchBar';
import { AdSlider } from '@/components/common/AdSlider';
import { SectionHeader } from '@/components/common/Section';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { CategoryTile } from '@/components/business/CategoryTile';
import { BusinessGrid } from '@/components/business/BusinessGrid';
import { GridSkeleton } from '@/components/common/Skeletons';
import { compact } from '@/utils/format';

const POPULAR_AR = ['طبيب أسنان', 'صيدلية مناوبة', 'مطعم شاورما', 'كهربائي', 'نقل عفش', 'محامي', 'فندق'];
const POPULAR_EN = ['Dentist', 'Pharmacy', 'Shawarma', 'Electrician', 'Movers', 'Lawyer', 'Hotel'];

export const Home = () => {
  const { t, locale } = useT();
  const ln = useLocalName();
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const { cityId, setCityId } = usePrefs();
  const { data, isLoading } = useHome(cityId);

  const quickSearch = (q: string) => {
    const target = `/search?q=${encodeURIComponent(q)}${cityId ? `&cityId=${cityId}` : ''}`;
    requireAuth(() => navigate(target), target);
  };

  return (
    <Box>
      {/* ───────── HERO ───────── */}
      <Box sx={{ position: 'relative', overflow: 'hidden', color: '#fff', pt: { xs: 14, md: 18 }, pb: { xs: 12, md: 16 }, background: (th) => th.custom.gradient }}>
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.18, backgroundImage: 'radial-gradient(rgba(255,255,255,.7) 1px, transparent 1px)', backgroundSize: '22px 22px', maskImage: 'linear-gradient(180deg,#000 30%,transparent)' }} />
        <Box component={motion.div} animate={{ y: [0, -18, 0] }} transition={{ duration: 9, repeat: Infinity }} sx={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', top: -120, insetInlineEnd: -80, background: 'radial-gradient(circle, rgba(255,106,61,.55), transparent 65%)' }} />
        <Box component={motion.div} animate={{ y: [0, 22, 0] }} transition={{ duration: 11, repeat: Infinity }} sx={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', bottom: -160, insetInlineStart: -60, background: 'radial-gradient(circle, rgba(11,165,236,.5), transparent 65%)' }} />
        <Container maxWidth="lg" sx={{ position: 'relative', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Chip label={t('app.tagline')} sx={{ bgcolor: 'rgba(255,255,255,.16)', color: '#fff', mb: 2.5, backdropFilter: 'blur(6px)', fontWeight: 700 }} />
            <Typography variant="h2" component="h1" sx={{ fontSize: { xs: '2.1rem', sm: '2.9rem', md: '3.6rem' }, lineHeight: 1.15, mb: 2, textShadow: '0 2px 20px rgba(0,0,0,.12)' }}>
              {t('home.heroTitle')}
            </Typography>
            <Typography sx={{ opacity: 0.92, maxWidth: 720, mx: 'auto', fontSize: { xs: '1rem', md: '1.15rem' }, mb: 4 }}>{t('home.heroSubtitle')}</Typography>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}>
            <Box sx={{ maxWidth: 900, mx: 'auto', color: 'text.primary' }}>
              <SearchBar />
            </Box>
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ mt: 2.5 }}>
              <Typography variant="body2" sx={{ opacity: 0.85, alignSelf: 'center' }}>{t('home.popular')}</Typography>
              {(locale === 'ar' ? POPULAR_AR : POPULAR_EN).map((q) => (
                <Chip key={q} label={q} onClick={() => quickSearch(q)} sx={{ bgcolor: 'rgba(255,255,255,.14)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,.26)' } }} />
              ))}
            </Stack>
          </motion.div>
        </Container>
      </Box>

      {/* ───────── QUICK CATEGORIES (overlapping) ───────── */}
      <Container maxWidth="lg" sx={{ mt: { xs: -7, md: -9 }, position: 'relative', zIndex: 2 }}>
        <Card sx={{ p: { xs: 1.5, md: 2.5 }, boxShadow: '0 24px 60px -24px rgba(16,24,40,.35)' }}>
          <Box className="no-scrollbar" sx={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: { xs: '84px', md: '1fr' }, gap: 1, overflowX: 'auto' }}>
            {(data?.categories || Array.from({ length: 9 })).slice(0, 9).map((c, i) =>
              c ? (
                <Stack key={c.id} component={Link} to={`/c/${c.slug}`} alignItems="center" spacing={1} sx={{ p: 1, borderRadius: 3, textAlign: 'center', transition: 'all .2s', '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-2px)' } }}>
                  <CategoryIcon icon={c.icon} color={c.color} size={52} />
                  <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ln(c)}</Typography>
                </Stack>
              ) : (
                <Box key={i} sx={{ height: 90 }} />
              )
            )}
          </Box>
        </Card>
      </Container>

      <Container maxWidth="xl" sx={{ mt: { xs: 5, md: 7 } }}>
        {/* stats */}
        {data && (
          <Grid container spacing={2} sx={{ mb: 6 }}>
            {[
              { v: data.stats.businesses, l: t('home.statsBusinesses') },
              { v: data.stats.reviews, l: t('home.statsReviews') },
              { v: data.stats.cities, l: t('home.statsCities') },
              { v: data.stats.users, l: t('home.statsUsers') },
            ].map((s) => (
              <Grid item xs={6} md={3} key={s.l}>
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h4" fontWeight={800} sx={{ background: (th) => th.custom.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {compact(s.v, locale)}+
                  </Typography>
                  <Typography color="text.secondary" fontWeight={600}>{s.l}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ads slider */}
        {!!data?.ads.slider.length && (
          <Box sx={{ mb: 7 }}>
            <AdSlider ads={data.ads.slider} />
          </Box>
        )}

        {/* featured */}
        <Box sx={{ mb: 7 }}>
          <SectionHeader title={t('home.featured')} subtitle={t('home.featuredSub')} to="/featured" />
          {isLoading ? <GridSkeleton count={4} /> : <BusinessGrid items={(data?.featured || []).slice(0, 8)} />}
        </Box>

        {/* categories */}
        <Box sx={{ mb: 7 }}>
          <SectionHeader title={t('home.browseCategories')} subtitle={t('home.browseCategoriesSub')} to="/categories" />
          <Grid container spacing={2}>
            {(data?.categories || []).slice(0, 12).map((c) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={c.id}>
                <CategoryTile category={c} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* how it works */}
        <Card sx={{ mb: 7, p: { xs: 3, md: 5 }, background: (th) => th.custom.gradientSoft, border: 'none' }}>
          <Grid container spacing={3}>
            {[
              { i: <SearchRounded />, a: t('home.how1'), b: t('home.how1t') },
              { i: <CompareArrowsRounded />, a: t('home.how2'), b: t('home.how2t') },
              { i: <CallRounded />, a: t('home.how3'), b: t('home.how3t') },
            ].map((s, k) => (
              <Grid item xs={12} md={4} key={k}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ width: 56, height: 56, borderRadius: '30%', display: 'grid', placeItems: 'center', background: (th) => th.custom.gradient, color: '#fff', flexShrink: 0, position: 'relative' }}>
                    {s.i}
                    <Box sx={{ position: 'absolute', top: -6, insetInlineEnd: -6, width: 22, height: 22, borderRadius: '50%', bgcolor: 'secondary.main', color: '#fff', fontSize: 12, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{k + 1}</Box>
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>{s.a}</Typography>
                    <Typography color="text.secondary">{s.b}</Typography>
                  </Box>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Card>

        {/* top rated */}
        <Box sx={{ mb: 7 }}>
          <SectionHeader title={t('home.topRated')} subtitle={t('home.topRatedSub')} />
          {isLoading ? <GridSkeleton count={4} /> : <BusinessGrid items={data?.topRated || []} />}
        </Box>

        {!!data?.ads.banners.length && (
          <Box sx={{ mb: 7 }}>
            <AdSlider ads={data.ads.banners} height={130} />
          </Box>
        )}

        {/* newest */}
        <Box sx={{ mb: 7 }}>
          <SectionHeader title={t('home.newest')} subtitle={t('home.newestSub')} />
          {isLoading ? <GridSkeleton count={4} /> : <BusinessGrid items={data?.newest || []} />}
        </Box>

        {/* cities */}
        {!!data?.cities.length && (
          <Box sx={{ mb: 7 }}>
            <SectionHeader title={t('home.cities')} />
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.25}>
              {data.cities.map((c) => (
                <Chip
                  key={c.id}
                  icon={<LocationCityRounded />}
                  label={`${ln(c)} · ${c.businessCount ?? 0}`}
                  onClick={() => { setCityId(c.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  color={cityId === c.id ? 'primary' : 'default'}
                  variant={cityId === c.id ? 'filled' : 'outlined'}
                  sx={{ height: 40, px: 1, fontSize: 14 }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* CTA */}
        <Card sx={{ position: 'relative', overflow: 'hidden', border: 'none', color: '#fff', background: 'linear-gradient(120deg,#101828 0%,#2B1B7A 55%,#5B3DF5 100%)', p: { xs: 3.5, md: 6 } }}>
          <Box sx={{ position: 'absolute', insetInlineEnd: -80, top: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,.5), transparent 70%)' }} />
          <Grid container spacing={3} alignItems="center" sx={{ position: 'relative' }}>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.6rem', md: '2.2rem' } }}>{t('home.ctaTitle')}</Typography>
              <Typography sx={{ opacity: 0.85, mt: 1.5, maxWidth: 620 }}>{t('home.ctaText')}</Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                {[t('auth.benefits4'), t('owner.featuredPlan'), t('owner.insightsCalls')].map((x) => (
                  <Stack key={x} direction="row" spacing={0.75} alignItems="center"><CheckCircleRounded sx={{ color: '#32D583', fontSize: 18 }} /><Typography variant="body2">{x}</Typography></Stack>
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { md: 'end' } }}>
              <Button size="large" startIcon={<AddBusinessRounded />} onClick={() => requireAuth(() => navigate('/owner/businesses/new'), '/owner/businesses/new')} sx={{ bgcolor: '#fff', color: '#101828', px: 4, '&:hover': { bgcolor: '#F2F2F7' } }}>
                {t('home.ctaButton')}
              </Button>
            </Grid>
          </Grid>
        </Card>
      </Container>
    </Box>
  );
};
