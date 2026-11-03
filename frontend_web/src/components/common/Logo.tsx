import { Box, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useT } from '@/i18n';

export const LogoMark = ({ size = 36 }: { size?: number }) => (
  <Box sx={{ width: size, height: size, borderRadius: '30%', background: (t) => t.custom.gradient, display: 'grid', placeItems: 'center', boxShadow: '0 6px 18px -6px rgba(91,61,245,.6)' }}>
    <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="#fff" aria-hidden>
      <path d="M12 2C7.6 2 4 5.4 4 9.7 4 15.5 12 22 12 22s8-6.5 8-12.3C20 5.4 16.4 2 12 2zm0 10.6a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2z" />
    </svg>
  </Box>
);

export const Logo = ({ light = false }: { light?: boolean }) => {
  const { t } = useT();
  return (
    <Stack component={Link} to="/" direction="row" alignItems="center" spacing={1.1} sx={{ textDecoration: 'none' }}>
      <LogoMark />
      <Typography variant="h6" fontWeight={800} sx={{ color: light ? '#fff' : 'text.primary', letterSpacing: 0 }}>
        {t('app.name')}
      </Typography>
    </Stack>
  );
};
