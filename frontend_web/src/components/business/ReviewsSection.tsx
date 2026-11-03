import { Avatar, Box, Button, Card, Chip, IconButton, LinearProgress, Menu, MenuItem, Rating, Stack, TextField, Typography } from '@mui/material';
import StarRounded from '@mui/icons-material/StarRounded';
import ThumbUpAltRounded from '@mui/icons-material/ThumbUpAltRounded';
import ThumbUpOffAltRounded from '@mui/icons-material/ThumbUpOffAltRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import RateReviewRounded from '@mui/icons-material/RateReviewRounded';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { BusinessDetails, Review } from '@/api/types';
import { businessApi, reviewApi } from '@/api/services';
import { useAuth, useRequireAuth } from '@/hooks/useAuth';
import { useNotify } from '@/hooks/useNotify';
import { useT } from '@/i18n';
import { fromNow, initials } from '@/utils/format';
import { EmptyState } from '../common/Section';

const Stars = ({ value, size = 'small' }: { value: number; size?: 'small' | 'medium' | 'large' }) => (
  <Rating value={value} readOnly size={size} precision={0.5} icon={<StarRounded fontSize="inherit" />} emptyIcon={<StarRounded fontSize="inherit" />} sx={{ color: '#FDB022' }} />
);

export const RatingSummary = ({ b }: { b: BusinessDetails }) => {
  const { t } = useT();
  const total = Object.values(b.ratingBreakdown).reduce((s, n) => s + n, 0) || 1;
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
      <Box sx={{ textAlign: 'center', minWidth: 150 }}>
        <Typography sx={{ fontSize: 52, fontWeight: 800, lineHeight: 1 }}>{b.averageRating ? b.averageRating.toFixed(1) : '—'}</Typography>
        <Stars value={b.averageRating} />
        <Typography variant="body2" color="text.secondary">{t('business.basedOn', { n: b.reviewCount })}</Typography>
      </Box>
      <Stack spacing={0.75} sx={{ flex: 1 }}>
        {[5, 4, 3, 2, 1].map((n) => {
          const c = b.ratingBreakdown[String(n) as '1'];
          return (
            <Stack key={n} direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" fontWeight={700} sx={{ width: 16 }}>{n}</Typography>
              <LinearProgress variant="determinate" value={(c / total) * 100} sx={{ flex: 1, height: 9, borderRadius: 5, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 5, bgcolor: n >= 4 ? 'success.main' : n === 3 ? 'warning.main' : 'error.main' } }} />
              <Typography variant="body2" color="text.secondary" sx={{ width: 28, textAlign: 'end' }}>{c}</Typography>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
};

const ReviewForm = ({ b }: { b: BusinessDetails }) => {
  const { t } = useT();
  const mine = b.viewer?.myReview;
  const [rating, setRating] = useState<number | null>(mine?.rating ?? null);
  const [content, setContent] = useState(mine?.content ?? '');
  const [open, setOpen] = useState(false);
  useEffect(() => { setRating(mine?.rating ?? null); setContent(mine?.content ?? ''); }, [mine]);
  const requireAuth = useRequireAuth();
  const notify = useNotify();
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => (mine ? reviewApi.update(mine.id, { rating: rating!, content }) : reviewApi.create(b.id, { rating: rating!, content: content || undefined })),
    onSuccess: () => {
      notify.success(t('business.reviewThanks'));
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['business', b.slug] });
      qc.invalidateQueries({ queryKey: ['reviews', b.id] });
    },
    onError: notify.error,
  });
  if (b.viewer?.canManage) return null;
  if (!open)
    return (
      <Button variant="contained" startIcon={<RateReviewRounded />} onClick={() => requireAuth(() => setOpen(true))}>
        {mine ? t('business.editReview') : t('business.writeReview')}
      </Button>
    );
  return (
    <Card sx={{ p: 2.5, bgcolor: 'action.hover', border: 'none' }}>
      <Typography fontWeight={700} gutterBottom>{t('business.yourReview')}</Typography>
      <Rating value={rating} onChange={(_, v) => setRating(v)} size="large" icon={<StarRounded fontSize="inherit" />} emptyIcon={<StarRounded fontSize="inherit" />} sx={{ color: '#FDB022', mb: 1.5 }} />
      <TextField fullWidth multiline minRows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('business.reviewPlaceholder')} inputProps={{ maxLength: 2000 }} sx={{ bgcolor: 'background.paper', borderRadius: 3 }} />
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} justifyContent="flex-end">
        <Button color="inherit" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
        <Button variant="contained" disabled={!rating || m.isPending} onClick={() => m.mutate()}>{t('common.submit')}</Button>
      </Stack>
    </Card>
  );
};

export const ReviewItem = ({ r, onReport, showBusiness = false }: { r: Review; onReport?: (r: Review) => void; showBusiness?: boolean }) => {
  const { t } = useT();
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const notify = useNotify();
  const [liked, setLiked] = useState(Boolean(r.likedByMe));
  const [likes, setLikes] = useState(r.likesCount);
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const like = useMutation({
    mutationFn: () => reviewApi.like(r.id),
    onSuccess: (x) => { setLiked(x.liked); setLikes(x.likesCount); },
    onError: notify.error,
  });
  return (
    <Box sx={{ py: 2.25, '&:not(:last-of-type)': { borderBottom: (th) => `1px solid ${th.custom.border}` } }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Avatar src={r.user?.avatar || undefined} sx={{ background: (th) => th.custom.gradient, fontWeight: 700 }}>{initials(r.user?.fullName)}</Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            <Typography fontWeight={700}>{showBusiness && r.business ? r.business.name : r.user?.fullName}</Typography>
            <Typography variant="caption" color="text.secondary">{fromNow(r.createdAt)}</Typography>
            {r.isHidden && <Chip size="small" label="hidden" color="warning" />}
          </Stack>
          <Stars value={r.rating} />
          {r.content && <Typography sx={{ mt: 0.75, whiteSpace: 'pre-line' }}>{r.content}</Typography>}
          {r.ownerReply && (
            <Box sx={{ mt: 1.5, p: 1.75, borderRadius: 3, bgcolor: 'action.hover', borderInlineStart: (th) => `3px solid ${th.palette.primary.main}` }}>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                <StorefrontRounded fontSize="small" color="primary" />
                <Typography variant="body2" fontWeight={700}>{t('business.ownerReply')}</Typography>
              </Stack>
              <Typography variant="body2">{r.ownerReply}</Typography>
            </Box>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button size="small" color={liked ? 'primary' : 'inherit'} startIcon={liked ? <ThumbUpAltRounded /> : <ThumbUpOffAltRounded />} disabled={user?.id === r.user?.id} onClick={() => requireAuth(() => like.mutate())}>
              {t('business.helpful')} {likes ? `(${likes})` : ''}
            </Button>
          </Stack>
        </Box>
        {onReport && user?.id !== r.user?.id && (
          <>
            <IconButton size="small" onClick={(e) => setMenu(e.currentTarget)}><MoreVertRounded fontSize="small" /></IconButton>
            <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)}>
              <MenuItem onClick={() => { setMenu(null); requireAuth(() => onReport(r)); }}>{t('common.report')}</MenuItem>
            </Menu>
          </>
        )}
      </Stack>
    </Box>
  );
};

export const ReviewsSection = ({ b, onReport }: { b: BusinessDetails; onReport: (r?: Review) => void }) => {
  const { t } = useT();
  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const q = useInfiniteQuery({
    queryKey: ['reviews', b.id, { sort }],
    queryFn: ({ pageParam }) => reviewApi.forBusiness(b.id, { page: pageParam, limit: 8, sort }),
    initialPageParam: 1,
    getNextPageParam: (l) => (l.meta.hasNext ? l.meta.page + 1 : undefined),
  });
  const items = q.data?.pages.flatMap((p) => p.items) || [];
  return (
    <Box>
      <RatingSummary b={b} />
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 3, mb: 1 }} flexWrap="wrap" useFlexGap spacing={1}>
        <ReviewForm b={b} />
        <Stack direction="row" spacing={0.75}>
          {(['newest', 'highest', 'lowest', 'helpful'] as const).map((s) => (
            <Chip key={s} label={t(`business.sortReviews.${s}`)} onClick={() => setSort(s)} color={sort === s ? 'primary' : 'default'} variant={sort === s ? 'filled' : 'outlined'} size="small" />
          ))}
        </Stack>
      </Stack>
      {!q.isLoading && !items.length ? (
        <EmptyState icon={<RateReviewRounded />} title={t('business.noReviews')} />
      ) : (
        items.map((r) => <ReviewItem key={r.id} r={r} onReport={onReport} />)
      )}
      {q.hasNextPage && <Button fullWidth onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage} sx={{ mt: 1 }}>{t('common.more')}</Button>}
    </Box>
  );
};

/** Report dialog body helper */
export const useReport = (businessId: string) => {
  const notify = useNotify();
  const { t } = useT();
  return useMutation({
    mutationFn: (p: { type: string; description?: string; reviewId?: string }) => businessApi.report(businessId, p),
    onSuccess: () => notify.success(t('business.reportSent')),
    onError: notify.error,
  });
};
