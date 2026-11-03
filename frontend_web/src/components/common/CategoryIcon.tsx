import type { SvgIconComponent } from '@mui/icons-material';
import MedicalServices from '@mui/icons-material/MedicalServices';
import LocalHospital from '@mui/icons-material/LocalHospital';
import LocalPharmacy from '@mui/icons-material/LocalPharmacy';
import Restaurant from '@mui/icons-material/Restaurant';
import LocalCafe from '@mui/icons-material/LocalCafe';
import Hotel from '@mui/icons-material/Hotel';
import Gavel from '@mui/icons-material/Gavel';
import Attractions from '@mui/icons-material/Attractions';
import Handyman from '@mui/icons-material/Handyman';
import LocalShipping from '@mui/icons-material/LocalShipping';
import LocalGroceryStore from '@mui/icons-material/LocalGroceryStore';
import Spa from '@mui/icons-material/Spa';
import DirectionsCar from '@mui/icons-material/DirectionsCar';
import School from '@mui/icons-material/School';
import BusinessCenter from '@mui/icons-material/BusinessCenter';
import ShoppingBag from '@mui/icons-material/ShoppingBag';
import AccountBalance from '@mui/icons-material/AccountBalance';
import Pets from '@mui/icons-material/Pets';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import Storefront from '@mui/icons-material/Storefront';
import Construction from '@mui/icons-material/Construction';
import Bolt from '@mui/icons-material/Bolt';
import Plumbing from '@mui/icons-material/Plumbing';
import Celebration from '@mui/icons-material/Celebration';
import Church from '@mui/icons-material/Church';
import Mosque from '@mui/icons-material/Mosque';
import Computer from '@mui/icons-material/Computer';
import PhoneIphone from '@mui/icons-material/PhoneIphone';
import Checkroom from '@mui/icons-material/Checkroom';
import Chair from '@mui/icons-material/Chair';
import Category from '@mui/icons-material/Category';
import { Box, BoxProps } from '@mui/material';
import { alpha } from '@mui/material/styles';

export const CATEGORY_ICONS: Record<string, SvgIconComponent> = {
  MedicalServices, LocalHospital, LocalPharmacy, Restaurant, LocalCafe, Hotel, Gavel, Attractions, Handyman, LocalShipping,
  LocalGroceryStore, Spa, DirectionsCar, School, BusinessCenter, ShoppingBag, AccountBalance, Pets, FitnessCenter, Storefront,
  Construction, Bolt, Plumbing, Celebration, Church, Mosque, Computer, PhoneIphone, Checkroom, Chair, Category,
};

export const getCategoryIcon = (name?: string | null): SvgIconComponent => (name && CATEGORY_ICONS[name]) || Category;

interface Props extends Omit<BoxProps, 'color'> {
  icon?: string | null;
  color?: string | null;
  size?: number;
  variant?: 'soft' | 'solid';
}

/** Rounded colored tile with the category icon (emoji also supported). */
export const CategoryIcon = ({ icon, color, size = 48, variant = 'soft', sx, ...rest }: Props) => {
  const c = color || '#5B3DF5';
  const isEmoji = icon && !CATEGORY_ICONS[icon] && /\p{Extended_Pictographic}/u.test(icon);
  const Icon = getCategoryIcon(icon);
  return (
    <Box
      {...rest}
      sx={{
        width: size, height: size, minWidth: size, borderRadius: size > 40 ? '30%' : '28%', display: 'grid', placeItems: 'center',
        bgcolor: variant === 'solid' ? c : alpha(c, 0.12), color: variant === 'solid' ? '#fff' : c, fontSize: size * 0.5,
        ...sx,
      }}
    >
      {isEmoji ? icon : <Icon sx={{ fontSize: size * 0.52 }} />}
    </Box>
  );
};
