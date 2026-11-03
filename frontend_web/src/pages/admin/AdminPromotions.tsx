import { Autocomplete, Box, Button, Chip, IconButton, Stack, TextField, Typography } from '@mui/material';
import ViewCarouselRounded from '@mui/icons-material/ViewCarouselRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { businessApi, promoApi } from '@/api/services';
import type { Advertisement, FeaturedEntry } from '@/api/types';
import { useCategories, useCities } from '@/hooks/queries';
import { useDebounce } from '@/hooks/useDebounce';
import { useNotify } from '@/hooks/useNotify';
import { useLocalName, useT } from '@/i18n';
import { PageHeader } from '@/components/common/Section';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ImageDropzone } from '@/components/common/ImageDropzone';
import { EntityDialog, FieldDef, nullify } from '@/components/forms/EntityDialog';
import { fmtDate } from '@/utils/format';

const color = (s: string) => (s === 'active' ? 'success' : s === 'pending' ? 'warning' : s === 'rejected' ? 'error' : 'default') as 'success' | 'warning' | 'error' | 'default';
const toInput = (d?: string) => (d ? dayjs(d).format('YYYY-MM-DD') : '');

export const BusinessPicker = ({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) => {
  const { t } = useT();
  const [q, setQ] = useState('');
  const dq = useDebounce(q, 300);
  const { data } = useQuery({ queryKey: ['admin', 'bizpick', dq], queryFn: () => businessApi.adminList({ q: dq || undefined, status: 'approved', limit: 15 }) });
  const opts = data?.items || [];
  return (
    <Autocomplete options={opts} getOptionLabel={(o) => `${o.name} · ${o.city?.name || ''}`} value={opts.find((o) => o.id === value) || null} onChange={(_, v) => onChange(v?.id || null)} onInputChange={(_, v) => setQ(v)} filterOptions={(x) => x}
      renderInput={(p) => <TextField {...p} label={t('admin.businessSearch')} sx={{ mt: 2 }} />} />
  );
};

export const AdminAds = () => {
  const { t } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const qc = useQueryClient();
  const { data: cats } = useCategories();
  const { data: cities } = useCities();
  const [page, setPage] = useState(1);
  const [dlg, setDlg] = useState<Partial<Advertisement> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [biz, setBiz] = useState<string | null>(null);
  const [del, setDel] = useState<number | null>(null);
  const { data, isFetching } = useQuery({ queryKey: ['admin', 'ads', page], queryFn: () => promoApi.adminAds({ page, limit: 20 }), placeholderData: keepPreviousData });
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin'] });
  const save = useMutation({
    mutationFn: (v: Record<string, unknown>) => {
      const { id: _i, ...body } = nullify({ ...v, businessId: biz });
      return dlg?.id ? promoApi.updateAd(dlg.id, body, file) : promoApi.createAd(body, file);
    },
    onSuccess: () => { setDlg(null); setFile(null); refresh(); notify.success(t('common.saved')); }, onError: notify.error,
  });
  const rm = useMutation({ mutationFn: (id: number) => promoApi.deleteAd(id), onSuccess: () => { setDel(null); refresh(); } });
  const placements = ['home_slider', 'homepage_banner', 'search_results', 'category_page', 'business_details', 'sidebar'];
  const fields: FieldDef[] = [
    { name: 'title', label: t('admin.title'), required: true },
    { name: 'description', label: t('common.description'), type: 'textarea' },
    { name: 'placement', label: t('admin.placement'), type: 'select', required: true, half: true, options: placements.map((p) => ({ value: p, label: t(`admin.placements.${p}`) })) },
    { name: 'status', label: t('common.status'), type: 'select', half: true, options: ['pending', 'active', 'paused', 'rejected', 'expired'].map((s) => ({ value: s, label: t(`admin.adStatus.${s}`) })) },
    { name: 'startDate', label: t('admin.startDate'), type: 'date', required: true, half: true },
    { name: 'endDate', label: t('admin.endDate'), type: 'date', required: true, half: true },
    { name: 'cityId', label: t('common.city'), type: 'select', half: true, options: [{ value: '', label: t('common.allCities') }, ...(cities || []).map((c) => ({ value: c.id, label: ln(c) }))] },
    { name: 'categoryId', label: t('common.category'), type: 'select', half: true, options: [{ value: '', label: t('common.all') }, ...(cats || []).map((c) => ({ value: c.id, label: ln(c) }))] },
    { name: 'targetUrl', label: t('admin.targetUrl'), dir: 'ltr', helper: '/b/slug  or  https://...' },
    { name: 'imageUrl', label: t('admin.imageUrl'), dir: 'ltr' },
    { name: 'priority', label: t('common.priority'), type: 'number', half: true },
    { name: 'price', label: t('common.price'), type: 'number', half: true },
    { name: 'adminNote', label: t('common.note'), type: 'textarea' },
  ];
  const open = (a?: Advertisement) => {
    setFile(null);
    setBiz(a?.businessId || null);
    setDlg(a ? { ...a, startDate: toInput(a.startDate), endDate: toInput(a.endDate) } : { placement: 'home_slider', status: 'active', startDate: dayjs().format('YYYY-MM-DD'), endDate: dayjs().add(30, 'day').format('YYYY-MM-DD'), priority: 0 });
  };
  return (
    <Box>
      <PageHeader icon={<ViewCarouselRounded />} title={t('nav.ads')} actions={<Button variant="contained" startIcon={<AddRounded />} onClick={() => open()}>{t('admin.newAd')}</Button>} />
      <DataTable<Advertisement>
        loading={isFetching} rows={data?.items || []} meta={data?.meta} rowKey={(a) => a.id} onPage={setPage}
        columns={[
          { key: 'i', label: '', width: 90, render: (a) => <Box sx={{ width: 76, height: 44, borderRadius: 2, overflow: 'hidden', background: (th) => th.custom.gradient }}>{a.imageUrl && <Box component="img" src={a.imageUrl} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</Box> },
          { key: 't', label: t('admin.title'), render: (a) => <Box><Typography fontWeight={700}>{a.title}</Typography><Typography variant="caption" color="text.secondary">{t(`admin.placements.${a.placement}`)}{a.business ? ` · ${a.business.name}` : ''}{a.requestedById ? ' · 🙋' : ''}</Typography></Box> },
          { key: 'd', label: t('common.date'), hideOnMobile: true, render: (a) => `${fmtDate(a.startDate, 'D MMM')} → ${fmtDate(a.endDate, 'D MMM YY')}` },
          { key: 'c', label: `${t('admin.impressions')} / ${t('admin.clicks')}`, hideOnMobile: true, render: (a) => `${a.impressionCount ?? 0} / ${a.clickCount ?? 0}` },
          { key: 's', label: t('common.status'), render: (a) => <Chip size="small" label={t(`admin.adStatus.${a.status}`)} color={color(a.status)} /> },
          { key: 'x', label: t('common.actions'), align: 'right', render: (a) => <><IconButton onClick={() => open(a)}><EditRounded fontSize="small" /></IconButton><IconButton color="error" onClick={() => setDel(a.id)}><DeleteOutlineRounded fontSize="small" /></IconButton></> },
        ]}
      />
      <EntityDialog open={Boolean(dlg)} title={t('admin.newAd')} fields={fields} initial={dlg as Record<string, unknown>} onClose={() => setDlg(null)} loading={save.isPending} onSubmit={(v) => save.mutate(v)}
        extra={<><BusinessPicker value={biz} onChange={setBiz} /><Box sx={{ mt: 2 }}><ImageDropzone multiple={false} height={90} onFiles={(f) => setFile(f[0])} hint={file ? file.name : t('common.uploadImages')} /></Box></>} />
      <ConfirmDialog open={del !== null} danger onClose={() => setDel(null)} onConfirm={() => del && rm.mutate(del)} />
    </Box>
  );
};

export const AdminFeatured = () => {
  const { t } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [dlg, setDlg] = useState<Partial<FeaturedEntry> | null>(null);
  const [biz, setBiz] = useState<string | null>(null);
  const [del, setDel] = useState<number | null>(null);
  const { data, isFetching } = useQuery({ queryKey: ['admin', 'featured', { page, status }], queryFn: () => promoApi.adminFeatured({ page, limit: 20, status: status || undefined }), placeholderData: keepPreviousData });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin'] }); qc.invalidateQueries({ queryKey: ['home'] }); };
  const save = useMutation({
    mutationFn: (v: Record<string, unknown>) => {
      const { id: _i, business: _b, requestedById: _r, createdAt: _c, updatedAt: _u, ...body } = nullify(v);
      return dlg?.id ? promoApi.updateFeatured(dlg.id, body) : promoApi.addFeatured({ ...body, businessId: biz });
    },
    onSuccess: () => { setDlg(null); refresh(); notify.success(t('common.saved')); }, onError: notify.error,
  });
  const rm = useMutation({ mutationFn: (id: number) => promoApi.removeFeatured(id), onSuccess: () => { setDel(null); refresh(); } });
  const fields: FieldDef[] = [
    { name: 'startDate', label: t('admin.startDate'), type: 'date', required: true, half: true },
    { name: 'endDate', label: t('admin.endDate'), type: 'date', required: true, half: true },
    { name: 'status', label: t('common.status'), type: 'select', half: true, options: ['pending', 'active', 'rejected', 'expired'].map((s) => ({ value: s, label: t(`admin.adStatus.${s}`) })) },
    { name: 'priority', label: t('common.priority'), type: 'number', half: true },
    { name: 'price', label: t('common.price'), type: 'number', half: true },
    { name: 'note', label: t('common.note'), type: 'textarea' },
  ];
  return (
    <Box>
      <PageHeader icon={<BoltRounded />} title={t('nav.featuredMgmt')} actions={<Button variant="contained" startIcon={<AddRounded />} onClick={() => { setBiz(null); setDlg({ status: 'active', priority: 1, startDate: dayjs().format('YYYY-MM-DD'), endDate: dayjs().add(30, 'day').format('YYYY-MM-DD') }); }}>{t('admin.addFeatured')}</Button>} />
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {['', 'pending', 'active', 'expired'].map((s) => <Chip key={s || 'all'} label={s ? t(`admin.adStatus.${s}`) : t('common.all')} color={status === s ? 'primary' : 'default'} onClick={() => setStatus(s)} />)}
      </Stack>
      <DataTable<FeaturedEntry>
        loading={isFetching} rows={data?.items || []} meta={data?.meta} rowKey={(f) => f.id} onPage={setPage}
        columns={[
          { key: 'b', label: t('nav.businesses'), render: (f) => <Box><Typography component={Link} to={`/b/${f.business?.slug}`} fontWeight={700} color="primary">{f.business?.name}</Typography><Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{f.business?.city}{f.requestedById ? ' · 🙋' : ''}</Typography></Box> },
          { key: 'd', label: t('common.date'), render: (f) => `${fmtDate(f.startDate, 'D MMM')} → ${fmtDate(f.endDate, 'D MMM YY')}` },
          { key: 'p', label: t('common.priority'), hideOnMobile: true, render: (f) => f.priority },
          { key: 'n', label: t('common.note'), hideOnMobile: true, render: (f) => <Typography variant="body2" color="text.secondary">{f.note || '—'}</Typography> },
          { key: 's', label: t('common.status'), render: (f) => <Chip size="small" label={t(`admin.adStatus.${f.status}`)} color={color(f.status)} /> },
          { key: 'x', label: t('common.actions'), align: 'right', render: (f) => <>{f.status === 'pending' && <Button size="small" variant="contained" onClick={() => promoApi.updateFeatured(f.id, { status: 'active' }).then(refresh)}>{t('admin.approve')}</Button>}<IconButton onClick={() => setDlg({ ...f, startDate: toInput(f.startDate), endDate: toInput(f.endDate) })}><EditRounded fontSize="small" /></IconButton><IconButton color="error" onClick={() => setDel(f.id)}><DeleteOutlineRounded fontSize="small" /></IconButton></> },
        ]}
      />
      <EntityDialog open={Boolean(dlg)} title={t('admin.addFeatured')} fields={fields} initial={dlg as Record<string, unknown>} onClose={() => setDlg(null)} loading={save.isPending} onSubmit={(v) => save.mutate(v)} extra={!dlg?.id ? <BusinessPicker value={biz} onChange={setBiz} /> : undefined} />
      <ConfirmDialog open={del !== null} danger onClose={() => setDel(null)} onConfirm={() => del && rm.mutate(del)} />
    </Box>
  );
};
