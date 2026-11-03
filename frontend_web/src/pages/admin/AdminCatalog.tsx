import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, IconButton, Stack, Switch, Typography } from '@mui/material';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import CategoryRounded from '@mui/icons-material/CategoryRounded';
import LocationCityRounded from '@mui/icons-material/LocationCityRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { catalogApi } from '@/api/services';
import type { Category, City, SubCategory } from '@/api/types';
import { useCategories, useCities } from '@/hooks/queries';
import { useNotify } from '@/hooks/useNotify';
import { useT } from '@/i18n';
import { PageHeader } from '@/components/common/Section';
import { CategoryIcon, CATEGORY_ICONS } from '@/components/common/CategoryIcon';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTable } from '@/components/common/DataTable';
import { EntityDialog, FieldDef, nullify } from '@/components/forms/EntityDialog';
import { RowsSkeleton } from '@/components/common/Skeletons';

export const AdminCategories = () => {
  const { t } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const { data, isLoading } = useCategories(true);
  const [dlg, setDlg] = useState<{ kind: 'cat' | 'sub'; item?: Partial<Category & SubCategory> } | null>(null);
  const [del, setDel] = useState<{ kind: 'cat' | 'sub'; id: number } | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ['categories'] }); qc.invalidateQueries({ queryKey: ['home'] }); };
  const save = useMutation({
    mutationFn: async (v: Record<string, unknown>): Promise<unknown> => {
      const body = nullify(v) as Partial<Category>;
      if (dlg?.kind === 'sub') return dlg.item?.id ? catalogApi.updateSub(dlg.item.id, body as Partial<SubCategory>) : catalogApi.createSub(body as Partial<SubCategory>);
      return dlg?.item?.id ? catalogApi.updateCategory(dlg.item.id, body) : catalogApi.createCategory(body);
    },
    onSuccess: () => { setDlg(null); refresh(); notify.success(t('common.saved')); },
    onError: notify.error,
  });
  const toggle = useMutation({ mutationFn: (c: Category) => catalogApi.updateCategory(c.id, { isActive: !c.isActive }), onSuccess: refresh, onError: notify.error });
  const rm = useMutation({ mutationFn: () => (del!.kind === 'cat' ? catalogApi.deleteCategory(del!.id) : catalogApi.deleteSub(del!.id)), onSuccess: () => { setDel(null); refresh(); notify.success(t('common.deleted')); }, onError: (e) => { setDel(null); notify.error(e); } });
  const iconOpts = Object.keys(CATEGORY_ICONS).map((k) => ({ value: k, label: k }));
  const catFields: FieldDef[] = [
    { name: 'name', label: t('common.name'), required: true, half: true },
    { name: 'nameEn', label: t('admin.nameEn'), half: true, dir: 'ltr' },
    { name: 'icon', label: t('admin.icon'), type: 'select', options: iconOpts, half: true },
    { name: 'color', label: t('admin.color'), type: 'color', half: true },
    { name: 'keywords', label: t('admin.keywords'), helper: t('admin.keywordsHint'), type: 'textarea' },
    { name: 'description', label: t('common.description'), type: 'textarea' },
    { name: 'sortOrder', label: t('admin.sortOrder'), type: 'number', half: true },
    { name: 'isActive', label: t('common.active'), type: 'switch', half: true },
  ];
  const subFields: FieldDef[] = [catFields[0], catFields[1], catFields[4], catFields[6], catFields[7]];
  const pick = (o: object, keys: string[]) => Object.fromEntries(Object.entries(o).filter(([k]) => keys.includes(k)));
  return (
    <Box>
      <PageHeader icon={<CategoryRounded />} title={t('nav.categories')} actions={<Button variant="contained" startIcon={<AddRounded />} onClick={() => setDlg({ kind: 'cat', item: { color: '#5B3DF5', isActive: true, sortOrder: 0 } })}>{t('admin.addCategory')}</Button>} />
      {isLoading ? <RowsSkeleton /> : (data || []).map((c) => (
        <Accordion key={c.id} disableGutters sx={{ mb: 1.25, borderRadius: '16px !important', border: (th) => `1px solid ${th.custom.border}`, '&:before': { display: 'none' }, opacity: c.isActive ? 1 : 0.6 }} elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreRounded />}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              <CategoryIcon icon={c.icon} color={c.color} size={42} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontWeight={800} noWrap>{c.name} {c.nameEn && <Typography component="span" color="text.secondary" variant="body2">· {c.nameEn}</Typography>}</Typography>
                <Typography variant="caption" color="text.secondary">{t('common.businessesCount', { n: c.businessCount ?? 0 })} · {c.subCategories?.length || 0} {t('common.subCategory')}</Typography>
              </Box>
              <Switch checked={Boolean(c.isActive)} onClick={(e) => e.stopPropagation()} onChange={() => toggle.mutate(c)} />
              <IconButton onClick={(e) => { e.stopPropagation(); setDlg({ kind: 'cat', item: pick(c, ['id', ...catFields.map((f) => f.name)]) }); }}><EditRounded fontSize="small" /></IconButton>
              <IconButton color="error" onClick={(e) => { e.stopPropagation(); setDel({ kind: 'cat', id: c.id }); }}><DeleteOutlineRounded fontSize="small" /></IconButton>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {c.keywords && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>🔎 {c.keywords}</Typography>}
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
              {(c.subCategories || []).map((s) => (
                <Chip key={s.id} label={`${s.name} · ${s.businessCount ?? 0}`} variant="outlined" onClick={() => setDlg({ kind: 'sub', item: pick(s, ['id', 'categoryId', ...subFields.map((f) => f.name)]) })} onDelete={() => setDel({ kind: 'sub', id: s.id })} sx={{ opacity: s.isActive === false ? 0.5 : 1 }} />
              ))}
              <Chip icon={<AddRounded />} label={t('admin.addSub')} color="primary" onClick={() => setDlg({ kind: 'sub', item: { categoryId: c.id, isActive: true } })} />
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
      <EntityDialog open={Boolean(dlg)} title={dlg?.kind === 'sub' ? t('admin.addSub') : t('admin.addCategory')} fields={dlg?.kind === 'sub' ? subFields : catFields} initial={dlg?.item as Record<string, unknown>} onClose={() => setDlg(null)} loading={save.isPending} onSubmit={(v) => { const { id: _i, ...rest } = v; save.mutate(dlg?.kind === 'sub' ? { ...rest, categoryId: dlg.item?.categoryId } : rest); }} />
      <ConfirmDialog open={Boolean(del)} danger onClose={() => setDel(null)} onConfirm={() => rm.mutate()} />
    </Box>
  );
};

export const AdminCities = () => {
  const { t } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const { data, isLoading } = useCities(true);
  const [dlg, setDlg] = useState<Partial<City> | null>(null);
  const [del, setDel] = useState<City | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ['cities'] });
  const save = useMutation({
    mutationFn: (v: Record<string, unknown>) => { const { id: _i, ...body } = nullify(v); return dlg?.id ? catalogApi.updateCity(dlg.id, body as Partial<City>) : catalogApi.createCity(body as Partial<City>); },
    onSuccess: () => { setDlg(null); refresh(); notify.success(t('common.saved')); }, onError: notify.error,
  });
  const rm = useMutation({ mutationFn: (id: number) => catalogApi.deleteCity(id), onSuccess: () => { setDel(null); refresh(); }, onError: (e) => { setDel(null); notify.error(e); } });
  const fields: FieldDef[] = [
    { name: 'name', label: t('common.name'), required: true, half: true }, { name: 'nameEn', label: t('admin.nameEn'), half: true, dir: 'ltr' },
    { name: 'state', label: t('admin.state'), half: true }, { name: 'country', label: 'Country', half: true },
    { name: 'latitude', label: t('owner.lat'), type: 'number', half: true }, { name: 'longitude', label: t('owner.lng'), type: 'number', half: true },
    { name: 'sortOrder', label: t('admin.sortOrder'), type: 'number', half: true }, { name: 'isActive', label: t('common.active'), type: 'switch', half: true },
  ];
  return (
    <Box>
      <PageHeader icon={<LocationCityRounded />} title={t('nav.cities')} actions={<Button variant="contained" startIcon={<AddRounded />} onClick={() => setDlg({ country: 'سوريا', isActive: true })}>{t('admin.addCity')}</Button>} />
      <DataTable<City>
        loading={isLoading}
        rows={data || []}
        rowKey={(c) => c.id}
        columns={[
          { key: 'n', label: t('common.name'), render: (c) => <Typography fontWeight={700}>{c.name} <Typography component="span" variant="body2" color="text.secondary">{c.nameEn}</Typography></Typography> },
          { key: 's', label: t('admin.state'), hideOnMobile: true, render: (c) => c.state || '—' },
          { key: 'b', label: t('nav.businesses'), render: (c) => c.businessCount ?? 0 },
          { key: 'g', label: 'GPS', hideOnMobile: true, render: (c) => (c.latitude ? `${c.latitude}, ${c.longitude}` : '—') },
          { key: 'a', label: t('common.status'), render: (c) => <Chip size="small" label={c.isActive ? t('common.active') : t('common.inactive')} color={c.isActive ? 'success' : 'default'} /> },
          { key: 'x', label: t('common.actions'), align: 'right', render: (c) => <><IconButton onClick={() => setDlg(c)}><EditRounded fontSize="small" /></IconButton><IconButton color="error" onClick={() => setDel(c)}><DeleteOutlineRounded fontSize="small" /></IconButton></> },
        ]}
      />
      <EntityDialog open={Boolean(dlg)} title={t('admin.addCity')} fields={fields} initial={dlg as Record<string, unknown>} onClose={() => setDlg(null)} onSubmit={(v) => save.mutate(v)} loading={save.isPending} />
      <ConfirmDialog open={Boolean(del)} danger onClose={() => setDel(null)} onConfirm={() => del && rm.mutate(del.id)} />
    </Box>
  );
};
