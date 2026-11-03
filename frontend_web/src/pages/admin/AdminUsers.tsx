import { Avatar, Box, Chip, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { userApi } from '@/api/services';
import type { User } from '@/api/types';
import { useAuthStore } from '@/store/authStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useNotify } from '@/hooks/useNotify';
import { useT } from '@/i18n';
import { PageHeader } from '@/components/common/Section';
import { DataTable } from '@/components/common/DataTable';
import { fmtDate, initials } from '@/utils/format';

export const AdminUsers = () => {
  const { t } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const ds = useDebounce(search, 350);
  const { data, isFetching } = useQuery({ queryKey: ['admin', 'users', { page, limit, ds, role, status }], queryFn: () => userApi.list({ page, limit, search: ds || undefined, role: role || undefined, status: status || undefined }), placeholderData: keepPreviousData });
  const done = () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); notify.success(t('common.saved')); };
  const setRoleM = useMutation({ mutationFn: (p: { id: string; role: string }) => userApi.setRole(p.id, p.role), onSuccess: done, onError: notify.error });
  const setStatusM = useMutation({ mutationFn: (p: { id: string; status: string }) => userApi.setStatus(p.id, p.status), onSuccess: done, onError: notify.error });
  const roles = ['user', 'business_owner', 'admin'];
  const statuses = ['active', 'inactive', 'suspended'];
  return (
    <Box>
      <PageHeader icon={<PeopleRounded />} title={t('nav.users')} />
      <DataTable<User>
        loading={isFetching} rows={data?.items || []} meta={data?.meta} rowKey={(u) => u.id} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }}
        toolbar={
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField size="small" placeholder={t('common.search')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> }} sx={{ flex: 1 }} />
            <TextField select size="small" label={t('admin.role')} value={role} onChange={(e) => setRole(e.target.value)} sx={{ minWidth: 170 }}><MenuItem value="">{t('common.all')}</MenuItem>{roles.map((r) => <MenuItem key={r} value={r}>{t(`admin.roles.${r}`)}</MenuItem>)}</TextField>
            <TextField select size="small" label={t('common.status')} value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 150 }}><MenuItem value="">{t('common.all')}</MenuItem>{statuses.map((s) => <MenuItem key={s} value={s}>{t(`admin.userStatus.${s}`)}</MenuItem>)}</TextField>
          </Stack>
        }
        columns={[
          { key: 'u', label: t('common.name'), render: (u) => <Stack direction="row" spacing={1.5} alignItems="center"><Avatar src={u.avatar || undefined} sx={{ width: 36, height: 36, fontSize: 14, background: (th) => th.custom.gradient }}>{initials(u.fullName)}</Avatar><Box><Typography fontWeight={700}>{u.fullName}</Typography><Typography variant="caption" color="text.secondary">{u.email}</Typography></Box></Stack> },
          { key: 'p', label: t('common.phone'), hideOnMobile: true, render: (u) => <span dir="ltr">{u.phone || '—'}</span> },
          { key: 'd', label: t('common.date'), hideOnMobile: true, render: (u) => fmtDate(u.createdAt) },
          { key: 'r', label: t('admin.role'), render: (u) => <TextField select size="small" value={u.role} disabled={u.id === me?.id} onChange={(e) => setRoleM.mutate({ id: u.id, role: e.target.value })} variant="standard" sx={{ minWidth: 120 }}>{roles.map((r) => <MenuItem key={r} value={r}>{t(`admin.roles.${r}`)}</MenuItem>)}</TextField> },
          { key: 's', label: t('common.status'), render: (u) => (
            <TextField select size="small" value={u.status} disabled={u.id === me?.id} onChange={(e) => setStatusM.mutate({ id: u.id, status: e.target.value })} variant="standard" SelectProps={{ renderValue: (v) => <Chip size="small" label={t(`admin.userStatus.${v}`)} color={v === 'active' ? 'success' : v === 'suspended' ? 'error' : 'default'} /> }}>
              {statuses.map((s) => <MenuItem key={s} value={s}>{t(`admin.userStatus.${s}`)}</MenuItem>)}
            </TextField>
          ) },
        ]}
      />
    </Box>
  );
};
