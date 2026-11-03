import { ReactNode, useEffect, useMemo } from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { CssBaseline, ThemeProvider } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import relativeTime from 'dayjs/plugin/relativeTime';
import { usePrefs } from '@/store/prefsStore';
import { buildTheme } from './theme';

dayjs.extend(relativeTime);

const rtlCache = createCache({ key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] });
const ltrCache = createCache({ key: 'muiltr', stylisPlugins: [prefixer] });

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const { locale, mode } = usePrefs();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const theme = useMemo(() => buildTheme(mode, direction), [mode, direction]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    document.documentElement.style.colorScheme = mode;
    dayjs.locale(locale);
  }, [locale, direction, mode]);

  return (
    <CacheProvider value={direction === 'rtl' ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
};
