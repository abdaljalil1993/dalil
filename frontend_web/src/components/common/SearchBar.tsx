import { Autocomplete, Box, Button, Divider, InputAdornment, MenuItem, Paper, Select, Stack, TextField, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchRounded from '@mui/icons-material/SearchRounded';
import PlaceRounded from '@mui/icons-material/PlaceRounded';
import { useQuery } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessApi } from '@/api/services';
import { useCities } from '@/hooks/queries';
import { useDebounce } from '@/hooks/useDebounce';
import { useRequireAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { usePrefs } from '@/store/prefsStore';
import { useLocalName, useT } from '@/i18n';
import { CategoryIcon } from './CategoryIcon';

type Option =
  | { kind: 'business'; label: string; slug: string; sub?: string }
  | { kind: 'category'; label: string; slug: string; icon?: string | null; color?: string | null }
  | { kind: 'sub'; label: string; slug: string; categorySlug?: string; id: number };

/** Big "what + where" search used in the hero and search page. Guests get the login prompt. */
export const SearchBar = ({ initialQuery = '', size = 'large', onSearch }: { initialQuery?: string; size?: 'large' | 'medium'; onSearch?: (q: string, cityId: number | null) => void }) => {
  const { t } = useT();
  const ln = useLocalName();
  const navigate = useNavigate();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { cityId, setCityId } = usePrefs();
  const isAuth = useAuthStore((s) => Boolean(s.accessToken));
  const requireAuth = useRequireAuth();
  const { data: cities } = useCities();
  const [q, setQ] = useState(initialQuery);
  const dq = useDebounce(q.trim(), 250);

  const { data: suggestions } = useQuery({
    queryKey: ['suggest', dq, cityId],
    queryFn: () => businessApi.suggest(dq, cityId),
    enabled: isAuth && dq.length >= 2,
    staleTime: 30_000,
  });

  const options: Option[] = [
    ...(suggestions?.subCategories || []).map((s) => ({ kind: 'sub' as const, label: ln(s), slug: s.slug, categorySlug: s.categorySlug, id: s.id })),
    ...(suggestions?.categories || []).map((c) => ({ kind: 'category' as const, label: ln(c), slug: c.slug, icon: c.icon, color: c.color })),
    ...(suggestions?.businesses || []).map((b) => ({ kind: 'business' as const, label: b.name, slug: b.slug, sub: [b.category, b.city].filter(Boolean).join(' · ') })),
  ];

  const submit = (value = q) => {
    const params = new URLSearchParams();
    if (value.trim()) params.set('q', value.trim());
    if (cityId) params.set('cityId', String(cityId));
    const target = `/search?${params.toString()}`;
    requireAuth(() => (onSearch ? onSearch(value.trim(), cityId) : navigate(target)), target);
  };

  const pick = (o: Option | string | null) => {
    if (!o) return;
    if (typeof o === 'string') return submit(o);
    if (o.kind === 'business') return navigate(`/b/${o.slug}`);
    if (o.kind === 'category') return navigate(`/c/${o.slug}`);
    if (o.kind === 'sub' && o.categorySlug) return navigate(`/c/${o.categorySlug}?sub=${o.id}`);
  };

  const height = size === 'large' ? 60 : 50;

  return (
    <Paper
      component="form"
      onSubmit={(e: FormEvent) => { e.preventDefault(); submit(); }}
      elevation={0}
      sx={{ p: 0.75, borderRadius: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch', gap: 0.75, boxShadow: '0 20px 50px -20px rgba(16,24,40,.35)', border: (th) => `1px solid ${th.custom.border}` }}
    >
      <Autocomplete<Option, false, false, true>
        freeSolo
        fullWidth
        options={options}
        filterOptions={(x) => x}
        inputValue={q}
        onInputChange={(_, v) => setQ(v)}
        onChange={(_, v) => pick(v)}
        getOptionLabel={(o) => (typeof o === 'string' ? o : o.label)}
        groupBy={(o) => (typeof o === 'string' ? '' : o.kind === 'business' ? t('nav.businesses') : t('nav.categories'))}
        renderOption={(props, o) => (
          <Box component="li" {...props} key={`${o.kind}-${o.slug}`}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              {o.kind === 'category' ? <CategoryIcon icon={o.icon} color={o.color} size={30} /> : <SearchRounded fontSize="small" color="action" />}
              <Box>
                <Typography variant="body2" fontWeight={600}>{o.label}</Typography>
                {o.kind === 'business' && o.sub && <Typography variant="caption" color="text.secondary">{o.sub}</Typography>}
              </Box>
            </Stack>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={t('home.searchPlaceholder')}
            sx={{ '& .MuiOutlinedInput-root': { height, bgcolor: 'transparent', '& fieldset': { border: 'none' } } }}
            InputProps={{ ...params.InputProps, startAdornment: <InputAdornment position="start"><SearchRounded color="primary" /></InputAdornment> }}
          />
        )}
      />
      {!mobile && <Divider orientation="vertical" flexItem sx={{ my: 1 }} />}
      <Select
        value={cityId ?? ''}
        displayEmpty
        onChange={(e) => setCityId(e.target.value === '' ? null : Number(e.target.value))}
        startAdornment={<PlaceRounded color="secondary" sx={{ mx: 1 }} />}
        sx={{ minWidth: { sm: 190 }, height, '& fieldset': { border: 'none' }, fontWeight: 600 }}
        MenuProps={{ PaperProps: { sx: { maxHeight: 360 } } }}
      >
        <MenuItem value="">{t('common.allCities')}</MenuItem>
        {(cities || []).map((c) => (
          <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>
        ))}
      </Select>
      <Button type="submit" variant="contained" size="large" sx={{ height, px: 4, borderRadius: 3, flexShrink: 0 }} startIcon={<SearchRounded />}>
        {t('common.search')}
      </Button>
    </Paper>
  );
};
