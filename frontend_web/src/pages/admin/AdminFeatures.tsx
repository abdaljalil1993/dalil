import { Alert, Box, Button, Card, Chip, Divider, Grid, Stack, Switch, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import ToggleOnRounded from '@mui/icons-material/ToggleOnRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import PublicRounded from '@mui/icons-material/PublicRounded';
import PlaceRounded from '@mui/icons-material/PlaceRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { featuresApi } from '@/api/services';
import type { City, FeatureKey, FeatureRule } from '@/api/types';
import { useCities } from '@/hooks/queries';
import { useNotify } from '@/hooks/useNotify';
import { useT } from '@/i18n';
import { PageHeader } from '@/components/common/Section';
import { RowsSkeleton } from '@/components/common/Skeletons';

type Gov = { name: string; cityIds: number[] };

/** Group cities by governorate (City.state), falling back to the city name. */
const useGovernorates = (cities: City[] | undefined): Gov[] =>
  useMemo(() => {
    const map = new Map<string, number[]>();
    (cities || []).forEach((c) => {
      const g = c.state || c.name;
      map.set(g, [...(map.get(g) || []), c.id]);
    });
    return [...map.entries()].map(([name, cityIds]) => ({ name, cityIds }));
  }, [cities]);

const FeatureRow = ({ k, rule, govs, onChange }: { k: FeatureKey; rule: FeatureRule; govs: Gov[]; onChange: (r: FeatureRule) => void }) => {
  const { t } = useT();
  const all = rule.cityIds.length === 0;
  const selectedGovs = govs.filter((g) => g.cityIds.some((id) => rule.cityIds.includes(id)));
  const toggleGov = (g: Gov) => {
    const has = g.cityIds.some((id) => rule.cityIds.includes(id));
    onChange({ ...rule, cityIds: has ? rule.cityIds.filter((id) => !g.cityIds.includes(id)) : [...new Set([...rule.cityIds, ...g.cityIds])] });
  };
  const status = !rule.enabled ? t('x.offEverywhere') : all ? t('x.onAll') : t('x.onCount', { n: selectedGovs.length });
  return (
    <Box sx={{ py: 1.75 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Switch checked={rule.enabled} onChange={(e) => onChange({ ...rule, enabled: e.target.checked })} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700}>{t(`x.fnames.${k}`)}</Typography>
          <Typography variant="caption" color={rule.enabled ? (all ? 'success.main' : 'warning.main') : 'text.disabled'} fontWeight={700}>{status}</Typography>
        </Box>
        {rule.enabled && (
          <ToggleButtonGroup size="small" exclusive value={all ? 'all' : 'some'} onChange={(_, v) => v && onChange({ ...rule, cityIds: v === 'all' ? [] : rule.cityIds.length ? rule.cityIds : govs[0]?.cityIds || [] })}>
            <ToggleButton value="all"><PublicRounded fontSize="small" sx={{ mr: 0.5 }} />{t('x.allGovs')}</ToggleButton>
            <ToggleButton value="some"><PlaceRounded fontSize="small" sx={{ mr: 0.5 }} />{t('x.someGovs')}</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Stack>
      {rule.enabled && !all && (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5, ps: { sm: 7 } }}>
          {govs.map((g) => {
            const on = g.cityIds.some((id) => rule.cityIds.includes(id));
            return <Chip key={g.name} label={g.name} size="small" color={on ? 'primary' : 'default'} variant={on ? 'filled' : 'outlined'} onClick={() => toggleGov(g)} />;
          })}
        </Stack>
      )}
    </Box>
  );
};

export const AdminFeatures = () => {
  const { t } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const { data: cities } = useCities(true);
  const govs = useGovernorates(cities);
  const { data } = useQuery({ queryKey: ['features', 'admin'], queryFn: featuresApi.admin });
  const [cfg, setCfg] = useState<Record<FeatureKey, FeatureRule> | null>(null);
  useEffect(() => { if (data) setCfg(data.config); }, [data]);
  const dirty = Boolean(data && cfg && JSON.stringify(data.config) !== JSON.stringify(cfg));
  const save = useMutation({
    mutationFn: () => featuresApi.save(cfg!),
    onSuccess: (r) => { qc.setQueryData(['features', 'admin'], r); qc.invalidateQueries({ queryKey: ['features'] }); qc.invalidateQueries({ queryKey: ['home'] }); notify.success(t('common.saved')); },
    onError: notify.error,
  });
  const setAll = (keys: FeatureKey[], enabled: boolean) => setCfg((c) => ({ ...c!, ...Object.fromEntries(keys.map((k) => [k, { ...c![k], enabled }])) }));

  return (
    <Box>
      <PageHeader icon={<ToggleOnRounded />} title={t('x.features')} subtitle={t('x.featuresSub')}
        actions={<Button variant="contained" startIcon={<SaveRounded />} disabled={!dirty || save.isPending} onClick={() => save.mutate()}>{t('common.save')}</Button>} />
      <Alert severity="info" sx={{ mb: 2.5, borderRadius: 3 }}>
        {t('x.catalogHint')} <Button size="small" component={Link} to="/admin/cities">{t('nav.cities')}</Button><Button size="small" component={Link} to="/admin/categories">{t('nav.categories')}</Button>
      </Alert>
      {!data || !cfg ? <RowsSkeleton rows={6} /> : (
        <Grid container spacing={2.5}>
          {Object.entries(data.groups).map(([g, keys]) => (
            <Grid item xs={12} lg={g === 'services' ? 12 : 6} key={g}>
              <Card sx={{ p: { xs: 2, md: 2.5 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" fontWeight={800}>{t(`x.fgroups.${g}`)}</Typography>
                  <Stack direction="row" spacing={0.5}>
                    <Button size="small" onClick={() => setAll(keys, true)}>{t('common.active')}</Button>
                    <Button size="small" color="inherit" onClick={() => setAll(keys, false)}>{t('common.inactive')}</Button>
                  </Stack>
                </Stack>
                <Stack divider={<Divider />}>
                  {keys.map((k) => <FeatureRow key={k} k={k} rule={cfg[k]} govs={govs} onChange={(r) => setCfg({ ...cfg, [k]: r })} />)}
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {dirty && (
        <Box sx={{ position: 'sticky', bottom: 16, mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button size="large" variant="contained" startIcon={<SaveRounded />} disabled={save.isPending} onClick={() => save.mutate()} sx={{ boxShadow: 6 }}>{t('common.save')}</Button>
        </Box>
      )}
    </Box>
  );
};
