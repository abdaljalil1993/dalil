import { Box } from '@mui/material';
import { useT } from '@/i18n';

export const OpenBadge = ({ isOpen, size = 'small' }: { isOpen: boolean | null | undefined; size?: 'small' | 'medium' }) => {
  const { t } = useT();
  if (isOpen === null || isOpen === undefined) return null;
  const color = isOpen ? '#12B76A' : '#F04438';
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontWeight: 700, fontSize: size === 'small' ? 12.5 : 14, color }}>
      <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 0 3px ${color}33` }} />
      {isOpen ? t('business.openNow') : t('business.closedNow')}
    </Box>
  );
};
