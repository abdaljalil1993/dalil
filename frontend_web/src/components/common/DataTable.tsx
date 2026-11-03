import { Box, Card, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from '@mui/material';
import { ReactNode } from 'react';
import type { Meta } from '@/api/types';
import { useT } from '@/i18n';

export interface Column<T> {
  key: string;
  label: ReactNode;
  render: (row: T) => ReactNode;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  hideOnMobile?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  meta?: Meta;
  onPage?: (page: number) => void;
  onLimit?: (limit: number) => void;
  toolbar?: ReactNode;
  empty?: ReactNode;
}

export function DataTable<T>({ columns, rows, rowKey, loading, meta, onPage, onLimit, toolbar, empty }: Props<T>) {
  const { t } = useT();
  return (
    <Card>
      {toolbar && <Box sx={{ p: 2, borderBottom: (th) => `1px solid ${th.custom.border}` }}>{toolbar}</Box>}
      {loading && <LinearProgress />}
      <TableContainer>
        <Table size="medium">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.key} align={c.align} sx={{ width: c.width, display: c.hideOnMobile ? { xs: 'none', md: 'table-cell' } : undefined }}>{c.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow hover key={rowKey(r)}>
                {columns.map((c) => (
                  <TableCell key={c.key} align={c.align} sx={{ display: c.hideOnMobile ? { xs: 'none', md: 'table-cell' } : undefined }}>{c.render(r)}</TableCell>
                ))}
              </TableRow>
            ))}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  {empty || <Typography color="text.secondary" align="center" sx={{ py: 4 }}>{t('common.noResults')}</Typography>}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {meta && onPage && (
        <TablePagination
          component="div"
          count={meta.total}
          page={meta.page - 1}
          rowsPerPage={meta.limit}
          rowsPerPageOptions={[10, 20, 50, 100]}
          onPageChange={(_, p) => onPage(p + 1)}
          onRowsPerPageChange={(e) => onLimit?.(Number(e.target.value))}
          labelRowsPerPage=""
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
        />
      )}
    </Card>
  );
}
