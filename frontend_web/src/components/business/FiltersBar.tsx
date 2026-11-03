import { Box, Button, Chip, Divider, Drawer, FormControlLabel, IconButton, MenuItem, Slider, Stack, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TuneRounded from '@mui/icons-material/TuneRounded';
import GridViewRounded from '@mui/icons-material/GridViewRounded';
import ViewListRounded from '@mui/icons-material/ViewListRounded';
import MapRounded from '@mui/icons-material/MapRounded';
import MyLocationRounded from '@mui/icons-material/MyLocationRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import { useState } from 'react';
import type { BusinessFilters, Category } from '@/api/types';
import { useCategories, useCities } from '@/hooks/queries';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNotify } from '@/hooks/useNotify';
import { usePrefs } from '@/store/prefsStore';
import { useLocalName, useT } from '@/i18n';

interface Props {
  filters: BusinessFilters;
  onChange: (f: BusinessFilters) => void;
  total?: number;
  /** hide category select (category page) */
  fixedCategory?: Category;
  allowText?: boolean;
}

const SORTS = ['relevance', 'popular', 'rating', 'reviews', 'newest', 'distance', 'name'] as const;

export const useFiltersUI = ({ filters: f, onChange, total, fixedCategory, allowText = true }: Props) => {
  const { t } = useT();
  const ln = useLocalName();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const { data: cats } = useCategories();
  const { data: cities } = useCities();
  const { view, setView, setCityId } = usePrefs();
  const geo = useGeolocation();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<BusinessFilters>) => onChange({ ...f, ...patch, page: 1 });
  const category = fixedCategory || cats?.find((c) => c.id === f.categoryId);

  const nearMe = async () => {
    if (f.lat) return set({ lat: undefined, lng: undefined, radius: undefined, sort: f.sort === 'distance' ? undefined : f.sort });
    const c = await geo.locate();
    if (!c) return notify.error(t('search.locationDenied'));
    set({ lat: c.lat, lng: c.lng, radius: f.radius || 10, sort: 'distance' });
  };

  const panel = (
    <Stack spacing={2.5} sx={{ p: desktop ? 0 : 2.5, width: desktop ? '100%' : 320 }}>
      {!desktop && (
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={800}>{t('common.filters')}</Typography>
          <IconButton onClick={() => setOpen(false)}><CloseRounded /></IconButton>
        </Stack>
      )}
      {!fixedCategory && (
        <TextField select label={t('common.category')} value={f.categoryId ?? ''} onChange={(e) => set({ categoryId: e.target.value ? Number(e.target.value) : undefined, subCategoryId: undefined })} fullWidth size="small">
          <MenuItem value="">{t('common.all')}</MenuItem>
          {(cats || []).map((c) => <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>)}
        </TextField>
      )}
      {category?.subCategories?.length ? (
        <TextField select label={t('common.subCategory')} value={f.subCategoryId ?? ''} onChange={(e) => set({ subCategoryId: e.target.value ? Number(e.target.value) : undefined })} fullWidth size="small">
          <MenuItem value="">{t('common.all')}</MenuItem>
          {category.subCategories.map((s) => <MenuItem key={s.id} value={s.id}>{ln(s)}</MenuItem>)}
        </TextField>
      ) : null}
      <TextField select label={t('common.city')} value={f.cityId ?? ''} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : undefined; setCityId(v ?? null); set({ cityId: v }); }} fullWidth size="small">
        <MenuItem value="">{t('common.allCities')}</MenuItem>
        {(cities || []).map((c) => <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>)}
      </TextField>
      {allowText && (
        <TextField label={t('business.district')} value={f.district ?? ''} onChange={(e) => set({ district: e.target.value || undefined })} fullWidth size="small" />
      )}
      <Box>
        <Typography variant="body2" fontWeight={600} gutterBottom>{t('search.minRating')}</Typography>
        <ToggleButtonGroup exclusive size="small" fullWidth value={f.minRating ?? 0} onChange={(_, v) => v !== null && set({ minRating: v || undefined })}>
          <ToggleButton value={0}>{t('common.all')}</ToggleButton>
          <ToggleButton value={3}>3+★</ToggleButton>
          <ToggleButton value={4}>4+★</ToggleButton>
          <ToggleButton value={4.5}>4.5+</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box>
        <Typography variant="body2" fontWeight={600} gutterBottom>{t('business.price')}</Typography>
        <ToggleButtonGroup exclusive size="small" fullWidth value={f.priceRange ?? 0} onChange={(_, v) => v !== null && set({ priceRange: v || undefined })}>
          <ToggleButton value={0}>{t('common.all')}</ToggleButton>
          {[1, 2, 3, 4].map((n) => <ToggleButton key={n} value={n}>{'$'.repeat(n)}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>
      <Stack>
        <FormControlLabel control={<Switch checked={Boolean(f.openNow)} onChange={(e) => set({ openNow: e.target.checked || undefined })} />} label={t('search.openNow')} />
        <FormControlLabel control={<Switch checked={Boolean(f.verified)} onChange={(e) => set({ verified: e.target.checked || undefined })} />} label={t('search.verified')} />
        <FormControlLabel control={<Switch checked={Boolean(f.hasPhotos)} onChange={(e) => set({ hasPhotos: e.target.checked || undefined })} />} label={t('search.hasPhotos')} />
      </Stack>
      <Divider />
      <Box>
        <Button fullWidth variant={f.lat ? 'contained' : 'outlined'} startIcon={<MyLocationRounded />} onClick={nearMe} disabled={geo.loading}>
          {geo.loading ? t('search.locating') : t('search.nearMe')}
        </Button>
        {f.lat && (
          <Box sx={{ px: 1, mt: 2 }}>
            <Typography variant="body2" gutterBottom>{t('search.radius')}: {f.radius} {t('common.km')}</Typography>
            <Slider min={1} max={50} value={f.radius || 10} onChange={(_, v) => set({ radius: v as number })} valueLabelDisplay="auto" />
          </Box>
        )}
      </Box>
      <Button color="inherit" onClick={() => onChange({ q: f.q, categoryId: fixedCategory?.id, page: 1 })}>{t('common.reset')}</Button>
    </Stack>
  );

  const activeCount = [f.subCategoryId, f.cityId, f.minRating, f.priceRange, f.openNow, f.verified, f.hasPhotos, f.lat, f.district].filter(Boolean).length;

  return {
    panel: desktop ? panel : null,
    toolbar: (
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
        {!desktop && (
          <Button variant="outlined" startIcon={<TuneRounded />} onClick={() => setOpen(true)}>
            {t('common.filters')} {activeCount ? `(${activeCount})` : ''}
          </Button>
        )}
        {total !== undefined && <Typography fontWeight={700} color="text.secondary">{t('common.results', { n: total })}</Typography>}
        {f.openNow && <Chip size="small" label={t('search.openNow')} onDelete={() => set({ openNow: undefined })} color="success" variant="outlined" />}
        <Box sx={{ flex: 1 }} />
        <TextField select size="small" value={f.sort || (f.q ? 'relevance' : 'popular')} onChange={(e) => set({ sort: e.target.value as BusinessFilters['sort'] })} sx={{ minWidth: 160 }}>
          {SORTS.filter((s) => (s === 'relevance' ? Boolean(f.q) : s === 'distance' ? Boolean(f.lat) : true)).map((s) => <MenuItem key={s} value={s}>{t(`search.sort.${s}`)}</MenuItem>)}
        </TextField>
        <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="grid" aria-label="grid"><GridViewRounded fontSize="small" /></ToggleButton>
          <ToggleButton value="list" aria-label="list"><ViewListRounded fontSize="small" /></ToggleButton>
          <ToggleButton value="map" aria-label="map"><MapRounded fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
        <Drawer anchor="left" open={open && !desktop} onClose={() => setOpen(false)}>{panel}</Drawer>
      </Stack>
    ),
  };
};
