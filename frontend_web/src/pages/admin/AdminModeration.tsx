import { Box, Button, Card, Chip, IconButton, Pagination, Stack, Tooltip, Typography } from '@mui/material';
import RateReviewRounded from '@mui/icons-material/RateReviewRounded';
import FlagRounded from '@mui/icons-material/FlagRounded';
import VerifiedUserRounded from '@mui/icons-material/VerifiedUserRounded';
import MailRounded from '@mui/icons-material/MailRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { moderationApi, reviewApi } from '@/api/services';
import type { Claim, ContactMessage, Report } from '@/api/types';
import { useNotify } from '@/hooks/useNotify';
import { useT } from '@/i18n';
import { EmptyState, PageHeader } from '@/components/common/Section';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ReviewItem } from '@/components/business/ReviewsSection';
import { fmtDate, fromNow } from '@/utils/format';

const StatusChips = ({ values, value, onChange, label }: { values: string[]; value: string; onChange: (v: string) => void; label: (v: string) => string }) => (
  <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
    {['', ...values].map((s) => <Chip key={s || 'all'} label={s ? label(s) : '•'} onClick={() => onChange(s)} color={value === s ? 'primary' : 'default'} variant={value === s ? 'filled' : 'outlined'} />)}
  </Stack>
);

export const AdminReviews = () => {
  const { t } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [hidden, setHidden] = useState<boolean | undefined>(undefined);
  const [del, setDel] = useState<string | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'reviews', { page, hidden }], queryFn: () => reviewApi.admin({ page, limit: 15, hidden }), placeholderData: keepPreviousData });
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
  const vis = useMutation({ mutationFn: (p: { id: string; isHidden: boolean }) => reviewApi.visibility(p.id, p.isHidden), onSuccess: refresh, onError: notify.error });
  const rm = useMutation({ mutationFn: (id: string) => reviewApi.remove(id), onSuccess: () => { setDel(null); refresh(); }, onError: notify.error });
  return (
    <Box>
      <PageHeader icon={<RateReviewRounded />} title={t('nav.reviews')} />
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip label={t('common.all')} color={hidden === undefined ? 'primary' : 'default'} onClick={() => setHidden(undefined)} />
        <Chip label={t('admin.show')} color={hidden === false ? 'primary' : 'default'} onClick={() => setHidden(false)} />
        <Chip label={t('admin.hide')} color={hidden === true ? 'primary' : 'default'} onClick={() => setHidden(true)} />
      </Stack>
      <Card sx={{ px: 2.5 }}>
        {!isLoading && !data?.items.length ? <EmptyState icon={<RateReviewRounded />} title={t('common.noResults')} /> : data?.items.map((r) => (
          <Stack key={r.id} direction="row" alignItems="flex-start">
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" component={Link} to={`/b/${r.business?.slug}`} color="primary" fontWeight={700} sx={{ display: 'block', pt: 1.5 }}>{r.business?.name}</Typography>
              <ReviewItem r={r} />
            </Box>
            <Stack direction="row" sx={{ pt: 3 }}>
              <Tooltip title={r.isHidden ? t('admin.show') : t('admin.hide')}><IconButton onClick={() => vis.mutate({ id: r.id, isHidden: !r.isHidden })}>{r.isHidden ? <VisibilityRounded /> : <VisibilityOffRounded />}</IconButton></Tooltip>
              <IconButton color="error" onClick={() => setDel(r.id)}><DeleteOutlineRounded /></IconButton>
            </Stack>
          </Stack>
        ))}
      </Card>
      {data && data.meta.totalPages > 1 && <Pagination sx={{ mt: 3, display: 'flex', justifyContent: 'center' }} count={data.meta.totalPages} page={page} onChange={(_, p) => setPage(p)} />}
      <ConfirmDialog open={Boolean(del)} danger onClose={() => setDel(null)} onConfirm={() => del && rm.mutate(del)} />
    </Box>
  );
};

export const AdminReports = () => {
  const { t, dict } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState('pending');
  const { data, isFetching } = useQuery({ queryKey: ['admin', 'reports', { page, limit, status }], queryFn: () => moderationApi.reports({ page, limit, status: status || undefined }), placeholderData: keepPreviousData });
  const upd = useMutation({ mutationFn: (p: { id: number; status: string }) => moderationApi.updateReport(p.id, p.status), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }), onError: notify.error });
  const hide = useMutation({ mutationFn: (id: string) => reviewApi.visibility(id, true), onSuccess: () => notify.success(t('common.saved')), onError: notify.error });
  return (
    <Box>
      <PageHeader icon={<FlagRounded />} title={t('nav.reports')} />
      <StatusChips values={['pending', 'reviewed', 'resolved', 'dismissed']} value={status} onChange={(v) => { setStatus(v); setPage(1); }} label={(v) => t(`admin.reportStatus.${v}`)} />
      <DataTable<Report>
        loading={isFetching} rows={data?.items || []} meta={data?.meta} rowKey={(r) => r.id} onPage={setPage} onLimit={setLimit}
        columns={[
          { key: 'b', label: t('nav.businesses'), render: (r) => <Typography component={Link} to={`/b/${r.business?.slug}`} fontWeight={700} color="primary">{r.business?.name}</Typography> },
          { key: 't', label: t('common.type'), render: (r) => <Chip size="small" label={(dict.business.reportTypes as Record<string, string>)[r.type] || r.type} /> },
          { key: 'd', label: t('common.description'), render: (r) => <Box><Typography variant="body2">{r.description || '—'}</Typography>{r.review && <Typography variant="caption" color="text.secondary">★{r.review.rating} “{r.review.content}”</Typography>}</Box> },
          { key: 'u', label: t('admin.owner'), hideOnMobile: true, render: (r) => <Typography variant="body2">{r.reporter?.fullName}<br /><Typography variant="caption" color="text.secondary">{fromNow(r.createdAt)}</Typography></Typography> },
          { key: 's', label: t('common.status'), render: (r) => <Chip size="small" label={t(`admin.reportStatus.${r.status}`)} color={r.status === 'pending' ? 'warning' : r.status === 'resolved' ? 'success' : 'default'} /> },
          { key: 'a', label: t('common.actions'), align: 'right', render: (r) => (
            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
              {r.review && !r.review.isHidden && <Button size="small" color="warning" onClick={() => hide.mutate(r.review!.id)}>{t('admin.hide')}</Button>}
              <Button size="small" color="success" onClick={() => upd.mutate({ id: r.id, status: 'resolved' })}>{t('admin.resolve')}</Button>
              <Button size="small" color="inherit" onClick={() => upd.mutate({ id: r.id, status: 'dismissed' })}>{t('admin.dismiss')}</Button>
            </Stack>
          ) },
        ]}
      />
    </Box>
  );
};

export const AdminClaims = () => {
  const { t } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('pending');
  const [reject, setReject] = useState<Claim | null>(null);
  const { data, isFetching } = useQuery({ queryKey: ['admin', 'claims', { page, status }], queryFn: () => moderationApi.claims({ page, limit: 20, status: status || undefined }), placeholderData: keepPreviousData });
  const decide = useMutation({ mutationFn: (p: { id: number; status: 'approved' | 'rejected'; note?: string }) => moderationApi.decideClaim(p.id, p.status, p.note), onSuccess: () => { setReject(null); qc.invalidateQueries({ queryKey: ['admin'] }); notify.success(t('common.saved')); }, onError: notify.error });
  return (
    <Box>
      <PageHeader icon={<VerifiedUserRounded />} title={t('nav.claims')} />
      <StatusChips values={['pending', 'approved', 'rejected']} value={status} onChange={(v) => { setStatus(v); setPage(1); }} label={(v) => t(`admin.claimStatus.${v}`)} />
      <DataTable<Claim>
        loading={isFetching} rows={data?.items || []} meta={data?.meta} rowKey={(c) => c.id} onPage={setPage}
        columns={[
          { key: 'b', label: t('nav.businesses'), render: (c) => <Typography component={Link} to={`/b/${c.business?.slug}`} fontWeight={700} color="primary">{c.business?.name}</Typography> },
          { key: 'u', label: t('admin.owner'), render: (c) => <Box><Typography variant="body2" fontWeight={700}>{c.user?.fullName}</Typography><Typography variant="caption" color="text.secondary" dir="ltr">{c.user?.email} {c.phone || c.user?.phone || ''}</Typography></Box> },
          { key: 'm', label: t('common.message'), render: (c) => <Typography variant="body2" sx={{ maxWidth: 360 }}>{c.message}</Typography> },
          { key: 'd', label: t('common.date'), hideOnMobile: true, render: (c) => fmtDate(c.createdAt) },
          { key: 'a', label: t('common.actions'), align: 'right', render: (c) => c.status === 'pending' ? (
            <Stack direction="row" spacing={0.5} justifyContent="flex-end"><Button size="small" variant="contained" onClick={() => decide.mutate({ id: c.id, status: 'approved' })}>{t('admin.approve')}</Button><Button size="small" color="error" onClick={() => setReject(c)}>{t('admin.reject')}</Button></Stack>
          ) : <Chip size="small" label={t(`admin.claimStatus.${c.status}`)} color={c.status === 'approved' ? 'success' : 'error'} /> },
        ]}
      />
      <ConfirmDialog open={Boolean(reject)} danger text=" " withNote={t('admin.rejectReason')} onClose={() => setReject(null)} onConfirm={(note) => reject && decide.mutate({ id: reject.id, status: 'rejected', note })} />
    </Box>
  );
};

export const AdminMessages = () => {
  const { t } = useT();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isFetching } = useQuery({ queryKey: ['admin', 'messages', page], queryFn: () => moderationApi.messages({ page, limit: 20 }), placeholderData: keepPreviousData });
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin'] });
  const mark = useMutation({ mutationFn: (m: ContactMessage) => moderationApi.markMessage(m.id, !m.isRead), onSuccess: refresh });
  const rm = useMutation({ mutationFn: (id: number) => moderationApi.deleteMessage(id), onSuccess: refresh });
  return (
    <Box>
      <PageHeader icon={<MailRounded />} title={t('nav.messages')} />
      <DataTable<ContactMessage>
        loading={isFetching} rows={data?.items || []} meta={data?.meta} rowKey={(m) => m.id} onPage={setPage}
        columns={[
          { key: 'f', label: t('common.name'), render: (m) => <Box><Typography fontWeight={m.isRead ? 500 : 800}>{m.name}</Typography><Typography variant="caption" color="text.secondary" dir="ltr">{[m.email, m.phone].filter(Boolean).join(' · ')}</Typography></Box> },
          { key: 'm', label: t('common.message'), render: (m) => <Box sx={{ maxWidth: 480 }}>{m.subject && <Typography variant="body2" fontWeight={700}>{m.subject}</Typography>}<Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{m.message}</Typography></Box> },
          { key: 'd', label: t('common.date'), hideOnMobile: true, render: (m) => fromNow(m.createdAt) },
          { key: 'a', label: t('common.actions'), align: 'right', render: (m) => <Stack direction="row" justifyContent="flex-end"><Button size="small" onClick={() => mark.mutate(m)}>{m.isRead ? t('admin.unread') : t('admin.markRead')}</Button><IconButton color="error" onClick={() => rm.mutate(m.id)}><DeleteOutlineRounded fontSize="small" /></IconButton></Stack> },
        ]}
      />
    </Box>
  );
};
