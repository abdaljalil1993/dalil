import { Box, Card, Chip, Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ManageSearchRounded from '@mui/icons-material/ManageSearchRounded';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminApi } from '@/api/services';
import { useT } from '@/i18n';
import { PageHeader } from '@/components/common/Section';
import { DataTable } from '@/components/common/DataTable';
import { fmtDate } from '@/utils/format';

export const AdminInsights = () => {
  const { t } = useT();
  const theme = useTheme();
  const [days, setDays] = useState(30);
  const { data } = useQuery({ queryKey: ['admin', 'searches', days], queryFn: () => adminApi.searches(days) });
  const table = (rows: { query: string; count: number; avgResults?: number }[], showAvg: boolean) => (
    <Table size="small">
      <TableHead><TableRow><TableCell>{t('common.search')}</TableCell><TableCell align="right">{t('admin.count')}</TableCell>{showAvg && <TableCell align="right">{t('admin.avgResults')}</TableCell>}</TableRow></TableHead>
      <TableBody>
        {rows.map((r) => <TableRow key={r.query}><TableCell sx={{ fontWeight: 600 }}>{r.query}</TableCell><TableCell align="right">{r.count}</TableCell>{showAvg && <TableCell align="right">{r.avgResults}</TableCell>}</TableRow>)}
        {!rows.length && <TableRow><TableCell colSpan={3} align="center" sx={{ color: 'text.secondary' }}>—</TableCell></TableRow>}
      </TableBody>
    </Table>
  );
  return (
    <Box>
      <PageHeader icon={<ManageSearchRounded />} title={t('nav.insights')} actions={
        <TextField select size="small" value={days} onChange={(e) => setDays(Number(e.target.value))}>{[7, 30, 90, 365].map((d) => <MenuItem key={d} value={d}>{d}d</MenuItem>)}</TextField>
      } />
      <Card sx={{ p: 2.5, mb: 2.5 }}>
        <Typography fontWeight={800} sx={{ mb: 2 }}>{t('admin.searchesPerDay')}</Typography>
        <Box sx={{ height: 240, direction: 'ltr' }}>
          <ResponsiveContainer>
            <AreaChart data={data?.daily || []} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke={theme.custom.border} vertical={false} />
              <XAxis dataKey="day" tickFormatter={(d) => fmtDate(d, 'D/M')} tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, background: theme.palette.background.paper, border: `1px solid ${theme.custom.border}` }} />
              <Area type="monotone" dataKey="count" stroke={theme.palette.primary.main} strokeWidth={2} fill={theme.palette.primary.main} fillOpacity={0.12} />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Card>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}><Card sx={{ p: 2.5 }}><Typography fontWeight={800} sx={{ mb: 1 }}>{t('admin.topSearches')}</Typography>{table(data?.topSearches || [], true)}</Card></Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center"><Typography fontWeight={800}>{t('admin.zeroSearches')}</Typography><Chip size="small" color="warning" label="!" /></Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t('admin.zeroHint')}</Typography>
            {table(data?.zeroResultSearches || [], false)}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export const AdminAudit = () => {
  const { t } = useT();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { data, isFetching } = useQuery({ queryKey: ['admin', 'audit', page, limit], queryFn: () => adminApi.auditLogs({ page, limit }), placeholderData: keepPreviousData });
  return (
    <Box>
      <PageHeader icon={<HistoryRounded />} title={t('nav.audit')} />
      <DataTable
        loading={isFetching} rows={data?.items || []} meta={data?.meta} rowKey={(l) => l.id} onPage={setPage} onLimit={setLimit}
        columns={[
          { key: 'a', label: t('admin.action'), render: (l) => <Chip size="small" label={l.action} /> },
          { key: 'e', label: t('admin.entity'), render: (l) => <Typography variant="body2" dir="ltr">{l.entityType} {l.entityId ? `#${String(l.entityId).slice(0, 8)}` : ''}</Typography> },
          { key: 'u', label: 'User', hideOnMobile: true, render: (l) => <Typography variant="caption" dir="ltr">{l.userId?.slice(0, 8)}</Typography> },
          { key: 'i', label: t('admin.ip'), hideOnMobile: true, render: (l) => l.ipAddress },
          { key: 'd', label: t('common.date'), render: (l) => fmtDate(l.createdAt, 'D MMM YYYY HH:mm') },
        ]}
      />
    </Box>
  );
};
