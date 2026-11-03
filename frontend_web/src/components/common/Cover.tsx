import { Box, BoxProps } from '@mui/material';
import { useState } from 'react';
import { getCategoryIcon } from './CategoryIcon';

/** Image with graceful branded fallback (gradient + category icon) when missing/broken. */
export const Cover = ({ src, tint, icon, alt, sx, ...rest }: { src?: string | null; tint?: string | null; icon?: string | null; alt?: string } & Omit<BoxProps, 'color'>) => {
  const [failed, setFailed] = useState(false);
  const c = tint || '#5B3DF5';
  const Icon = getCategoryIcon(icon);
  if (src && !failed) {
    return <Box component="img" src={src} alt={alt || ''} loading="lazy" onError={() => setFailed(true)} sx={{ width: '100%', height: '100%', objectFit: 'cover', ...sx }} {...rest} />;
  }
  return (
    <Box
      sx={{
        width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.9)', position: 'relative', overflow: 'hidden',
        background: `radial-gradient(circle at 20% 20%, ${c}cc 0%, transparent 55%), radial-gradient(circle at 80% 90%, #EC489999 0%, transparent 50%), linear-gradient(135deg, ${c} 0%, #5B3DF5 100%)`,
        ...sx,
      }}
      {...rest}
    >
      <Icon sx={{ fontSize: 56, opacity: 0.9, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.18))' }} />
    </Box>
  );
};
