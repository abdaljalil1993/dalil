import { Box, Button, Card, FormControlLabel, MenuItem, Pagination, Stack, Switch, TextField } from '@mui/material';
import ForumRounded from '@mui/icons-material/ForumRounded';
import ReplyRounded from '@mui/icons-material/ReplyRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { businessApi, reviewApi } from '@/api/services';
import type { Review } from '@/api/types';
import { useNotify } from '@/hooks/useNotify';
import { useT } from '@/i18n';
import { EmptyState, PageHeader } from '@/components/common/Section';
import { ReviewItem } from '@/components/business/ReviewsSection';
import { RowsSkeleton } from '@/components/common/Skeletons';

const ReplyBox = ({ r }: { r: Review }) => {
  const { t } = useT();
  const notify = useNotify();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(r.ownerReply || '');
  const m = useMutation({ mutationFn: () => reviewApi.reply(r.id, text), onSuccess: () => { notify.success(t('owner.replySaved')); setOpen(false); qc.invalidateQueries({ queryKey: ['reviews', 'owner'] }); }, onError: notify.error });
  if (!open) return <Button size="small" startIcon={<ReplyRounded />} onClick={() => setOpen(true)} sx={{ mb: 1.5 }}>{r.ownerReply ? t('common.edit') : t('owner.reply')}</Button>;
  return (
    <Stack spacing={1} sx={{ mb: 2 }}>
      <TextField multiline minRows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('owner.replyPlaceholder')} />
      <Stack direction="row" spacing={1} justifyContent="flex-end"><Button color="inherit" onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button variant="contained" disabled={text.trim().length < 2 || m.isPending} onClick={() => m.mutate()}>{t('common.send')}</Button></Stack>
    </Stack>
  );
};

export const OwnerReviews = () => {
  const { t } = useT();
  const [page, setPage] = useState(1);
  const [businessId, setBusinessId] = useState('');
  const [unanswered, setUnanswered] = useState(false);
  const { data: mine } = useQuery({ queryKey: ['businesses', 'mine'], queryFn: () => businessApi.mine({ limit: 50 }) });
  const { data, isLoading } = useQuery({ queryKey: ['reviews', 'owner', { page, businessId, unanswered }], queryFn: () => reviewApi.owner({ page, limit: 10, businessId: businessId || undefined, unanswered }) });
  return (
    <Box>
      <PageHeader icon={<ForumRounded />} title={t('nav.ownerReviews')} actions={
        <>
          <TextField select size="small" value={businessId} onChange={(e) => { setBusinessId(e.target.value); setPage(1); }} sx={{ minWidth: 220 }} SelectProps={{ displayEmpty: true }}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            {(mine?.items || []).map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
          </TextField>
          <FormControlLabel control={<Switch checked={unanswered} onChange={(e) => { setUnanswered(e.target.checked); setPage(1); }} />} label={t('owner.unanswered')} />
        </>
      } />
      <Card sx={{ px: 2.5 }}>
        {isLoading ? <Box sx={{ py: 2 }}><RowsSkeleton /></Box> : !data?.items.length ? <EmptyState icon={<ForumRounded />} title={t('business.noReviews')} /> : data.items.map((r) => (
          <Box key={r.id}>
            <ReviewItem r={{ ...r, user: r.user ? { ...r.user, fullName: `${r.user.fullName} → ${r.business?.name || ''}` } : null }} />
            <ReplyBox r={r} />
          </Box>
        ))}
      </Card>
      {data && data.meta.totalPages > 1 && <Pagination sx={{ mt: 3, display: 'flex', justifyContent: 'center' }} count={data.meta.totalPages} page={page} onChange={(_, p) => setPage(p)} />}
    </Box>
  );
};
