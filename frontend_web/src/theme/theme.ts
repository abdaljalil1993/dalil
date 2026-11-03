import { alpha, createTheme, Theme } from '@mui/material/styles';
import type { ThemeMode } from '@/store/prefsStore';

/** Brand tokens - change here to re-skin the whole app */
export const brand = {
  primary: '#5B3DF5', // electric indigo
  primaryDark: '#4325D9',
  secondary: '#FF6A3D', // warm coral
  pink: '#EC4899',
  success: '#12B76A',
  warning: '#F79009',
  error: '#F04438',
  info: '#0BA5EC',
  gradient: 'linear-gradient(135deg, #5B3DF5 0%, #8B5CF6 45%, #EC4899 100%)',
  gradientSoft: 'linear-gradient(135deg, rgba(91,61,245,.10) 0%, rgba(236,72,153,.10) 100%)',
  warmGradient: 'linear-gradient(135deg, #FF6A3D 0%, #F79009 100%)',
};

declare module '@mui/material/styles' {
  interface Theme {
    custom: { gradient: string; gradientSoft: string; warmGradient: string; cardShadow: string; cardShadowHover: string; border: string; glass: string };
  }
  interface ThemeOptions {
    custom?: Partial<Theme['custom']>;
  }
}

export const buildTheme = (mode: ThemeMode, direction: 'rtl' | 'ltr'): Theme => {
  const dark = mode === 'dark';
  const border = dark ? 'rgba(255,255,255,.08)' : 'rgba(16,24,40,.08)';
  const fontFamily = direction === 'rtl'
    ? '"IBM Plex Sans Arabic", "Inter", system-ui, sans-serif'
    : '"Inter", "IBM Plex Sans Arabic", system-ui, sans-serif';

  return createTheme({
    direction,
    palette: {
      mode,
      primary: { main: brand.primary, dark: brand.primaryDark, light: '#8B7BFF', contrastText: '#fff' },
      secondary: { main: brand.secondary, contrastText: '#fff' },
      success: { main: brand.success },
      warning: { main: brand.warning },
      error: { main: brand.error },
      info: { main: brand.info },
      background: { default: dark ? '#0B0A14' : '#F6F6FB', paper: dark ? '#14131F' : '#FFFFFF' },
      text: { primary: dark ? '#F4F4F8' : '#101828', secondary: dark ? '#A3A3B8' : '#5B6478' },
      divider: border,
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily,
      h1: { fontWeight: 800, letterSpacing: direction === 'rtl' ? 0 : '-0.02em' },
      h2: { fontWeight: 800, letterSpacing: direction === 'rtl' ? 0 : '-0.02em' },
      h3: { fontWeight: 800 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    custom: {
      gradient: brand.gradient,
      gradientSoft: brand.gradientSoft,
      warmGradient: brand.warmGradient,
      border,
      cardShadow: dark ? '0 1px 2px rgba(0,0,0,.4)' : '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)',
      cardShadowHover: dark ? '0 12px 32px rgba(0,0,0,.55)' : '0 16px 40px -12px rgba(91,61,245,.28)',
      glass: dark ? 'rgba(20,19,31,.72)' : 'rgba(255,255,255,.78)',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { scrollbarWidth: 'thin' },
          '::selection': { background: alpha(brand.primary, 0.25) },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 12, paddingInline: 18, minHeight: 42 },
          sizeLarge: { minHeight: 50, fontSize: '1rem', paddingInline: 24 },
          sizeSmall: { minHeight: 32, paddingInline: 12 },
          containedPrimary: { background: brand.gradient, '&:hover': { background: brand.gradient, filter: 'brightness(1.08)' } },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { border: `1px solid ${border}`, borderRadius: 18 } },
      },
      MuiPaper: { styleOverrides: { rounded: { borderRadius: 18 }, outlined: { borderColor: border } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 10, fontWeight: 600 } } },
      MuiTextField: { defaultProps: { variant: 'outlined', size: 'medium' } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12, backgroundColor: dark ? 'rgba(255,255,255,.02)' : '#fff' } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 20 } } },
      MuiTooltip: { defaultProps: { arrow: true } },
      MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, minHeight: 48 } } },
      MuiTableCell: { styleOverrides: { head: { fontWeight: 700, color: dark ? '#A3A3B8' : '#5B6478', whiteSpace: 'nowrap' } } },
      MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' } },
      MuiListItemButton: { styleOverrides: { root: { borderRadius: 12 } } },
    },
  });
};
