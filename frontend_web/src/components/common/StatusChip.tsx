import { Chip, ChipProps } from '@mui/material';
import { useT } from '@/i18n';

const COLORS: Record<string, ChipProps['color']> = {
  pending: 'warning', open: 'info', new: 'info', viewed: 'default', shortlisted: 'secondary',
  active: 'success', confirmed: 'success', accepted: 'success', assigned: 'success', hired: 'success', completed: 'primary',
  rejected: 'error', cancelled: 'default', closed: 'default', expired: 'default', withdrawn: 'default', no_show: 'error',
};

/** ns = i18n map under x.* e.g. 'apptStatus' | 'reqStatus' | 'quoteStatus' | 'listingStatus' | 'appStatus' | 'subStatus' */
export const StatusChip = ({ status, ns, size = 'small' }: { status: string; ns: string; size?: 'small' | 'medium' }) => {
  const { t } = useT();
  const label = t(`x.${ns}.${status}`);
  return <Chip size={size} color={COLORS[status] || 'default'} variant={status === 'pending' || status === 'open' ? 'outlined' : 'filled'} label={label.startsWith('x.') ? status : label} sx={{ fontWeight: 700 }} />;
};
