import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, Divider, FormControlLabel, Grid, LinearProgress, MenuItem, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import TravelExploreRounded from '@mui/icons-material/TravelExploreRounded';
import CloudDownloadRounded from '@mui/icons-material/CloudDownloadRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import DeleteSweepRounded from '@mui/icons-material/DeleteSweepRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { osmApi } from '@/api/services';
import type { OsmJob } from '@/api/types';
import { useCities } from '@/hooks/queries';
import { useNotify } from '@/hooks/useNotify';
import { useT } from '@/i18n';
import { PageHeader } from '@/components/common/Section';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { fromNow } from '@/utils/format';

const Stat = ({ label, value, color }: { label: string; value: number; color?: string }) => (
  <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: 3, bgcolor: 'action.hover', flex: 1, minWidth: 110 }}>
    <Typography variant="h5" fontWeight={900} sx={{ color }}>{value}</Typography>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Box>
);

const JobView = ({ job, presetName, cityName }: { job: OsmJob; presetName: (k: string) => string; cityName: (id: number) => string }) => {
  const { t } = useT();
  const dry = job.options.dryRun;
  return (
    <Card sx={{ border: 2, borderColor: job.status === 'failed' ? 'error.main' : job.status === 'done' ? 'success.main' : 'primary.main' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
          <Typography fontWeight={800}>{cityName(job.options.cityId)} · {job.options.scope === 'governorate' ? t('x.osmWholeGov') : `${job.options.radiusKm || 10} km`}</Typography>
          {dry && <Chip size="small" label={t('x.osmPreview')} />}
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary">{fromNow(job.startedAt)}</Typography>
        </Stack>
        {job.status === 'running' && <><Typography variant="body2" sx={{ mb: 1 }}>{t('x.osmRunning')}</Typography><LinearProgress sx={{ mb: 2, height: 6, borderRadius: 3 }} /></>}
        {job.error && <Alert severity="error" sx={{ mb: 2 }}>{job.error}</Alert>}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Stat label={t('x.osmFound')} value={job.found} />
          <Stat label={dry ? t('x.osmWouldCreate') : t('x.osmCreated')} value={job.created} color="#12B76A" />
          <Stat label={t('x.osmDup')} value={job.skippedDuplicate} />
          <Stat label={t('x.osmNoName')} value={job.skippedNoName} />
          {job.updated > 0 && <Stat label={t('x.osmUpdated')} value={job.updated} color="#0BA5EC" />}
        </Stack>
        {Object.keys(job.byPreset).length > 0 && (
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead><TableRow><TableCell>{t('common.type')}</TableCell><TableCell align="center">{t('x.osmFound')}</TableCell><TableCell align="center">{dry ? t('x.osmWouldCreate') : t('x.osmCreated')}</TableCell></TableRow></TableHead>
            <TableBody>{Object.entries(job.byPreset).map(([k, v]) => <TableRow key={k}><TableCell>{presetName(k)}</TableCell><TableCell align="center">{v.found}</TableCell><TableCell align="center"><b>{v.created}</b></TableCell></TableRow>)}</TableBody>
          </Table>
        )}
        {job.samples.length > 0 && (
          <>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 2, mb: 1 }}>{t('x.osmSamples')}</Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {job.samples.map((s, i) => <Chip key={i} size="small" variant="outlined" label={`${s.name} · ${s.city}${s.phone ? ' · ☎' : ''}`} />)}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const AdminOsmImport = () => {
  const { t, locale } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const { data: cities } = useCities(true);
  const { data: presets } = useQuery({ queryKey: ['osm', 'presets'], queryFn: osmApi.presets });
  const { data: jobs } = useQuery({ queryKey: ['osm', 'jobs'], queryFn: osmApi.jobs });
  const [cityId, setCityId] = useState<number | ''>('');
  const [scope, setScope] = useState<'governorate' | 'radius'>('governorate');
  const [radiusKm, setRadius] = useState(10);
  const [picked, setPicked] = useState<string[]>([]);
  const [updateExisting, setUpdate] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ count: number } | null>(null);

  useEffect(() => { if (!cityId && cities?.length) setCityId(cities.find((c) => c.nameEn === 'Latakia')?.id || cities[0].id); }, [cities, cityId]);
  useEffect(() => { if (presets && !picked.length) setPicked(presets.map((p) => p.key)); }, [presets]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: job } = useQuery({
    queryKey: ['osm', 'job', jobId],
    queryFn: () => osmApi.job(jobId!),
    enabled: Boolean(jobId),
    refetchInterval: (q) => (q.state.data?.status === 'running' ? 2000 : false),
  });
  useEffect(() => {
    if (job && job.status !== 'running') { qc.invalidateQueries({ queryKey: ['osm', 'jobs'] }); if (!job.options.dryRun) qc.invalidateQueries({ queryKey: ['home'] }); }
  }, [job?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useMutation({
    mutationFn: (dryRun: boolean) => osmApi.start({ presets: picked, scope, cityId: Number(cityId), radiusKm: scope === 'radius' ? radiusKm : undefined, dryRun, updateExisting }),
    onSuccess: (j) => setJobId(j.id),
    onError: notify.error,
  });
  const removeCheck = useMutation({ mutationFn: () => osmApi.remove({ cityId: Number(cityId), scope: scope === 'governorate' ? 'governorate' : 'city', dryRun: true }), onSuccess: (r) => setUndo({ count: r.count }), onError: notify.error });
  const remove = useMutation({ mutationFn: () => osmApi.remove({ cityId: Number(cityId), scope: scope === 'governorate' ? 'governorate' : 'city' }), onSuccess: (r) => { setUndo(null); notify.success(t('x.osmDeleted', { n: r.count })); qc.invalidateQueries({ queryKey: ['home'] }); }, onError: notify.error });

  const presetName = (k: string) => { const p = presets?.find((x) => x.key === k); return p ? (locale === 'en' ? p.nameEn : p.name) : k; };
  const cityName = (id: number) => { const c = cities?.find((x) => x.id === id); return c ? (c.state && c.state !== c.name ? `${c.state} — ${c.name}` : c.name) : String(id); };
  const busy = start.isPending || job?.status === 'running';
  const cityOptions = useMemo(() => (cities || []).slice().sort((a, b) => (a.state || a.name).localeCompare(b.state || b.name, 'ar')), [cities]);

  return (
    <Box>
      <PageHeader icon={<TravelExploreRounded />} title={t('x.osm')} subtitle={t('x.osmSub')} />
      <Alert severity="info" sx={{ mb: 2.5, borderRadius: 3 }}>{t('x.osmNote')}</Alert>
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <Card><CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>{t('x.osmWhere')}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <TextField select label={t('common.city')} value={cityId} onChange={(e) => setCityId(Number(e.target.value))} sx={{ minWidth: 240 }}>
                {cityOptions.map((c) => <MenuItem key={c.id} value={c.id}>{cityName(c.id)}</MenuItem>)}
              </TextField>
              <ToggleButtonGroup exclusive size="small" value={scope} onChange={(_, v) => v && setScope(v)}>
                <ToggleButton value="governorate">{t('x.osmWholeGov')}</ToggleButton>
                <ToggleButton value="radius">{t('x.osmRadius')}</ToggleButton>
              </ToggleButtonGroup>
              {scope === 'radius' && <TextField type="number" size="small" label={t('x.radiusKm')} value={radiusKm} onChange={(e) => setRadius(Math.min(60, Math.max(1, Number(e.target.value))))} sx={{ width: 130 }} />}
            </Stack>

            <Divider sx={{ my: 2.5 }} />
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="h6" fontWeight={800}>{t('x.osmWhat')}</Typography>
              <Stack direction="row">
                <Button size="small" onClick={() => setPicked((presets || []).map((p) => p.key))}>{t('x.selectAll')}</Button>
                <Button size="small" color="inherit" onClick={() => setPicked([])}>{t('x.clearAll')}</Button>
              </Stack>
            </Stack>
            <Grid container>
              {(presets || []).map((p) => (
                <Grid item xs={12} sm={6} key={p.key}>
                  <FormControlLabel control={<Checkbox checked={picked.includes(p.key)} onChange={(e) => setPicked((s) => (e.target.checked ? [...s, p.key] : s.filter((x) => x !== p.key)))} />} label={locale === 'en' ? p.nameEn : p.name} />
                </Grid>
              ))}
            </Grid>
            <FormControlLabel sx={{ mt: 1 }} control={<Switch checked={updateExisting} onChange={(e) => setUpdate(e.target.checked)} />} label={t('x.osmUpdate')} />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2.5 }}>
              <Button variant="outlined" size="large" startIcon={<VisibilityRounded />} disabled={busy || !picked.length || !cityId} onClick={() => start.mutate(true)}>{t('x.osmPreview')}</Button>
              <Button variant="contained" size="large" startIcon={<CloudDownloadRounded />} disabled={busy || !picked.length || !cityId} onClick={() => start.mutate(false)}>{t('x.osmStart')}</Button>
            </Stack>
          </CardContent></Card>

          <Card sx={{ mt: 2.5 }}><CardContent>
            <Typography fontWeight={800}>{t('x.osmUndo')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{t('x.osmUndoHint')} ({cityId ? cityName(Number(cityId)) : ''} · {scope === 'governorate' ? t('x.osmWholeGov') : t('common.city')})</Typography>
            <Button color="error" variant="outlined" startIcon={<DeleteSweepRounded />} disabled={busy || !cityId || removeCheck.isPending} onClick={() => removeCheck.mutate()}>{t('x.osmUndo')}</Button>
          </CardContent></Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Stack spacing={2}>
            {job && <JobView job={job} presetName={presetName} cityName={cityName} />}
            {(jobs || []).filter((j) => j.id !== job?.id).length > 0 && (
              <>
                <Typography fontWeight={800}>{t('x.osmHistory')}</Typography>
                {(jobs || []).filter((j) => j.id !== job?.id).slice(0, 5).map((j) => (
                  <Card key={j.id} variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => setJobId(j.id)}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight={700}>{cityName(j.options.cityId)}</Typography>
                        {j.options.dryRun && <Chip size="small" label={t('x.osmPreview')} />}
                        <Box sx={{ flex: 1 }} />
                        <Typography variant="body2" color="success.main" fontWeight={800}>+{j.created}</Typography>
                        <Typography variant="caption" color="text.secondary">{fromNow(j.startedAt)}</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </Stack>
        </Grid>
      </Grid>
      <ConfirmDialog open={Boolean(undo)} danger title={t('x.osmUndo')} text={undo ? t('x.osmUndoCount', { n: undo.count }) : ''} loading={remove.isPending} onClose={() => setUndo(null)} onConfirm={() => remove.mutate()} />
    </Box>
  );
};
