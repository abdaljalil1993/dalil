import { Button, IconButton, Tooltip } from '@mui/material';
import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import TranslateRounded from '@mui/icons-material/TranslateRounded';
import { usePrefs } from '@/store/prefsStore';

export const PrefsToggles = ({ color }: { color?: string }) => {
  const { mode, toggleMode, locale, setLocale } = usePrefs();
  return (
    <>
      <Tooltip title={locale === 'ar' ? 'English' : 'العربية'}>
        <Button onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')} startIcon={<TranslateRounded />} sx={{ color: color || 'text.primary', minWidth: 0, px: 1.25 }}>
          {locale === 'ar' ? 'EN' : 'ع'}
        </Button>
      </Tooltip>
      <IconButton onClick={toggleMode} sx={{ color: color || 'text.primary' }} aria-label="theme">
        {mode === 'dark' ? <LightModeRounded /> : <DarkModeRounded />}
      </IconButton>
    </>
  );
};
