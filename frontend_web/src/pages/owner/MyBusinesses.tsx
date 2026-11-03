import { Box, Button, Card, Chip, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import AddBusinessRounded from '@mui/icons-material/AddBusinessRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import CallRounded from '@mui/icons-material/CallRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { businessApi } from '@/api/services';
import type { Business } from '@/api/types';
import { useNotify } from '@/hooks/useNotify';
import { useLocalName, useT } from '@/i18n';
import { EmptyState, PageHeader } from '@/components/common/Section';
import { Cover } from '@/components/common/Cover';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { GridSkeleton } from '@/components/common/Skeletons';

export const STATUS_COLOR: Record<string, 'warning' | 'success' | 'error' | 'default'> = { pending: 'warning', approved: 'success', rejected: 'error', suspended: 'default' };

export const MyBusinesses = () => {
  const { t } = useT();
  const ln = useLocalName();
  const notify = useNotify();
  const qc = useQueryClient();
  const [del, setDel] = useState<Business | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['businesses', 'mine'], queryFn: () => businessApi.mine({ limit: 50 }) });
  const rm = useMutation({ mutationFn: (id: string) => businessApi.remove(id), onSuccess: () => { notify.success(t('common.deleted')); setDel(null); qc.invalidateQueries({ queryKey: ['businesses'] }); }, onError: notify.error });

  return (
    <Box>
      <PageHeader icon={<StorefrontRounded />} title={t('owner.title')} subtitle={t('owner.subtitle')} actions={<Button variant="contained" startIcon={<AddBusinessRounded />} component={Link} to="/owner/businesses/new">{t('owner.add')}</Button>} />
      {isLoading ? <GridSkeleton md={4} count={3} /> : !data?.items.length ? (
        <Card><EmptyState icon={<StorefrontRounded />} title={t('owner.empty')} text={t('owner.emptyText')} action={<Button variant="contained" size="large" startIcon={<AddBusinessRounded />} component={Link} to="/owner/businesses/new">{t('owner.add')}</Button>} /></Card>
      ) : (
        <Grid container spacing={2.5}>
          {data.items.map((b) => (
            <Grid item xs={12} sm={6} lg={4} key={b.id}>
              <Card sx={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ height: 150, position: 'relative' }}>
                  <Cover src={b.coverImage} tint={b.category?.color} icon={b.category?.icon} />
                  <Chip label={t(`owner.statuses.${b.status || 'pending'}`)} color={STATUS_COLOR[b.status || 'pending']} size="small" sx={{ position: 'absolute', top: 12, insetInlineStart: 12, fontWeight: 700 }} />
                </Box>
                <Box sx={{ p: 2, flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={800} noWrap>{ln(b)}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>{[ln(b.subCategory) || ln(b.category), ln(b.city)].filter(Boolean).join(' · ')}</Typography>
                  {b.status === 'rejected' && b.adminNote && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{b.adminNote}</Typography>}
                  <Stack direction="row" spacing={2} sx={{ mt: 1.5, color: 'text.secondary' }}>
                    <Stack direction="row" spacing={0.5} alignItems="center"><VisibilityRounded sx={{ fontSize: 16 }} /><Typography variant="body2">{b.stats?.views ?? b.viewCount}</Typography></Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center"><CallRounded sx={{ fontSize: 16 }} /><Typography variant="body2">{(b.stats?.phoneClicks || 0) + (b.stats?.whatsappClicks || 0)}</Typography></Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center"><StarRounded sx={{ fontSize: 16, color: '#FDB022' }} /><Typography variant="body2">{b.averageRating.toFixed(1)} ({b.reviewCount})</Typography></Stack>
                  </Stack>
                </Box>
                <Stack direction="row" spacing={1} sx={{ p: 1.5, pt: 0 }}>
                  <Button fullWidth variant="contained" startIcon={<EditRounded />} component={Link} to={`/owner/businesses/${b.id}`}>{t('common.edit')}</Button>
                  <Tooltip title={t('owner.viewPublic')}><IconButton component={Link} to={`/b/${b.slug}`}><OpenInNewRounded /></IconButton></Tooltip>
                  <Tooltip title={t('common.delete')}><IconButton color="error" onClick={() => setDel(b)}><DeleteOutlineRounded /></IconButton></Tooltip>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <ConfirmDialog open={Boolean(del)} danger text={t('owner.deleteConfirm')} onClose={() => setDel(null)} onConfirm={() => del && rm.mutate(del.id)} loading={rm.isPending} confirmText={t('common.delete')} />
    </Box>
  );
};
