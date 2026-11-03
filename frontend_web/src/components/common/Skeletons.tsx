import { Card, Grid, Skeleton, Stack, Box } from '@mui/material';

export const CardSkeleton = () => (
  <Card sx={{ overflow: 'hidden' }}>
    <Skeleton variant="rectangular" sx={{ aspectRatio: '16/10', height: 'auto' }} />
    <Box sx={{ p: 2 }}>
      <Skeleton width="70%" height={26} />
      <Skeleton width="40%" />
      <Skeleton width="90%" />
    </Box>
  </Card>
);

export const GridSkeleton = ({ count = 8, md = 3 }: { count?: number; md?: number }) => (
  <Grid container spacing={2.5}>
    {Array.from({ length: count }).map((_, i) => (
      <Grid item xs={12} sm={6} md={md} key={i}>
        <CardSkeleton />
      </Grid>
    ))}
  </Grid>
);

export const RowsSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <Stack spacing={1.5}>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} variant="rounded" height={64} />
    ))}
  </Stack>
);
