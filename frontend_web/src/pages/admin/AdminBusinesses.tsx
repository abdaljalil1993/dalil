import { Box, Button, Chip, IconButton, InputAdornment, Menu, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import AddBusinessRounded from '@mui/icons-material/AddBusinessRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import VerifiedRounded from '@mui/icons-material/VerifiedRounded';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { businessApi } from '@/api/services';
import type { Business } from '@/api/types';
import { useCategories, useCities } from '@/hooks/queries';
import { useDebounce } from '@/hooks/useDebounce';
import { useNotify } from '@/hooks/useNotify';
import { useLocalName, useT } from '@/i18n';
import { PageHeader } from '@/components/common/Section';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { fmtDate } from '@/utils/format';
import { STATUS_COLOR } from '../owner/MyBusinesses';

export const AdminBusinesses = () => {
  const { t } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'all';
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [cityId, setCityId] = useState<number | ''>('');
  const dq = useDebounce(q, 350);
  const { data: cats } = useCategories();
  const { data: cities } = useCities();
  const { data, isFetching } = useQuery({
    queryKey: ['admin', 'businesses', { status, page, limit, dq, categoryId, cityId }],
    queryFn: () => businessApi.adminList({ status, page, limit, q: dq || undefined, categoryId: categoryId || undefined, cityId: cityId || undefined }),
    placeholderData: keepPreviousData,
  });
  const [reject, setReject] = useState<Business | null>(null);
  const [del, setDel] = useState<Business | null>(null);
  const [menu, setMenu] = useState<{ el: HTMLElement; b: Business } | null>(null);
  const done = () => { qc.invalidateQueries({ queryKey: ['admin'] }); notify.success(t('common.saved')); };
  const setStatus = useMutation({ mutationFn: (p: { id: string; status: string; note?: string }) => businessApi.setStatus(p.id, p.status, p.note), onSuccess: () => { setReject(null); done(); }, onError: notify.error });
  const flags = useMutation({ mutationFn: (p: { id: string; isVerified?: boolean; isActive?: boolean }) => businessApi.setFlags(p.id, p), onSuccess: done, onError: notify.error });
  const rm = useMutation({ mutationFn: (id: string) => businessApi.remove(id), onSuccess: () => { setDel(null); done(); }, onError: notify.error });

  return (
    <Box>
      <PageHeader icon={<StorefrontRounded />} title={t('nav.businesses')} actions={<Button variant="contained" startIcon={<AddBusinessRounded />} component={Link} to="/owner/businesses/new">{t('admin.createBusiness')}</Button>} />
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        {['all', 'pending', 'approved', 'rejected', 'suspended'].map((s) => (
          <Chip key={s} label={s === 'all' ? t('common.all') : t(`owner.statuses.${s}`)} onClick={() => { setParams(s === 'all' ? {} : { status: s }); setPage(1); }} color={status === s ? 'primary' : 'default'} variant={status === s ? 'filled' : 'outlined'} />
        ))}
      </Stack>
      <DataTable<Business>
        loading={isFetching}
        rows={data?.items || []}
        meta={data?.meta}
        rowKey={(b) => b.id}
        onPage={setPage}
        onLimit={(l) => { setLimit(l); setPage(1); }}
        toolbar={
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField size="small" placeholder={t('common.search')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> }} sx={{ flex: 1 }} />
            <TextField select size="small" label={t('common.category')} value={categoryId} onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))} sx={{ minWidth: 180 }}>
              <MenuItem value="">{t('common.all')}</MenuItem>{(cats || []).map((c) => <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>)}
            </TextField>
            <TextField select size="small" label={t('common.city')} value={cityId} onChange={(e) => setCityId(e.target.value === '' ? '' : Number(e.target.value))} sx={{ minWidth: 160 }}>
              <MenuItem value="">{t('common.all')}</MenuItem>{(cities || []).map((c) => <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>)}
            </TextField>
          </Stack>
        }
        columns={[
          { key: 'name', label: t('common.name'), render: (b) => (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CategoryIcon icon={b.category?.icon} color={b.category?.color} size={38} />
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={0.5} alignItems="center"><Typography fontWeight={700} component={Link} to={`/b/${b.slug}`} noWrap sx={{ maxWidth: 240 }}>{b.name}</Typography>{b.isVerified && <VerifiedRounded color="info" sx={{ fontSize: 16 }} />}{b.isFeatured && <Chip size="small" label="★" color="warning" sx={{ height: 18 }} />}</Stack>
                <Typography variant="caption" color="text.secondary">{ln(b.subCategory) || ln(b.category)} · {ln(b.city)}</Typography>
              </Box>
            </Stack>
          ) },
          { key: 'owner', label: t('admin.owner'), hideOnMobile: true, render: (b) => b.owner ? <Box><Typography variant="body2" fontWeight={600}>{b.owner.fullName}</Typography><Typography variant="caption" color="text.secondary">{b.owner.phone || b.owner.email}</Typography></Box> : <Typography variant="caption" color="text.secondary">{t(`admin.sources.${b.source || 'admin'}`)}</Typography> },
          { key: 'rating', label: '★', hideOnMobile: true, render: (b) => `${b.averageRating.toFixed(1)} (${b.reviewCount})` },
          { key: 'date', label: t('common.date'), hideOnMobile: true, render: (b) => fmtDate(b.createdAt) },
          { key: 'status', label: t('common.status'), render: (b) => <Stack spacing={0.5} alignItems="flex-start"><Chip size="small" label={t(`owner.statuses.${b.status || 'pending'}`)} color={STATUS_COLOR[b.status || 'pending']} />{b.isActive === false && <Chip size="small" label={t('common.inactive')} />}</Stack> },
          { key: 'actions', label: t('common.actions'), align: 'right', render: (b) => (
            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
              {b.status !== 'approved' && <Tooltip title={t('admin.approve')}><IconButton color="success" onClick={() => setStatus.mutate({ id: b.id, status: 'approved' })}><CheckRounded /></IconButton></Tooltip>}
              {b.status === 'pending' && <Tooltip title={t('admin.reject')}><IconButton color="error" onClick={() => setReject(b)}><CloseRounded /></IconButton></Tooltip>}
              <IconButton onClick={(e) => setMenu({ el: e.currentTarget, b })}><MoreVertRounded /></IconButton>
            </Stack>
          ) },
        ]}
      />
      <Menu anchorEl={menu?.el} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {menu && [
          <MenuItem key="e" component={Link} to={`/owner/businesses/${menu.b.id}`}>{t('common.edit')}</MenuItem>,
          <MenuItem key="v" onClick={() => { flags.mutate({ id: menu.b.id, isVerified: !menu.b.isVerified }); setMenu(null); }}>{menu.b.isVerified ? t('admin.unverify') : t('admin.verify')}</MenuItem>,
          <MenuItem key="a" onClick={() => { flags.mutate({ id: menu.b.id, isActive: menu.b.isActive === false }); setMenu(null); }}>{menu.b.isActive === false ? t('admin.activate') : t('common.inactive')}</MenuItem>,
          menu.b.status === 'approved' && <MenuItem key="s" onClick={() => { setStatus.mutate({ id: menu.b.id, status: 'suspended' }); setMenu(null); }}>{t('admin.suspend')}</MenuItem>,
          menu.b.status !== 'pending' && menu.b.status !== 'rejected' && <MenuItem key="r" onClick={() => { setReject(menu.b); setMenu(null); }}>{t('admin.reject')}</MenuItem>,
          <MenuItem key="d" sx={{ color: 'error.main' }} onClick={() => { setDel(menu.b); setMenu(null); }}>{t('common.delete')}</MenuItem>,
        ]}
      </Menu>
      <ConfirmDialog open={Boolean(reject)} title={`${t('admin.reject')}: ${reject?.name || ''}`} text=" " withNote={t('admin.rejectReason')} danger confirmText={t('admin.reject')} onClose={() => setReject(null)} onConfirm={(note) => reject && setStatus.mutate({ id: reject.id, status: 'rejected', note })} />
      <ConfirmDialog open={Boolean(del)} danger text={t('owner.deleteConfirm')} onClose={() => setDel(null)} onConfirm={() => del && rm.mutate(del.id)} confirmText={t('common.delete')} />
    </Box>
  );
};
