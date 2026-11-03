import { Box, Button, Checkbox, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import type { WorkingHour } from '@/api/types';
import { useT } from '@/i18n';

const ORDER = [6, 0, 1, 2, 3, 4, 5];

export const defaultHours = (): WorkingHour[] =>
  Array.from({ length: 7 }, (_, d) => ({ dayOfWeek: d, openTime: '09:00', closeTime: '17:00', isClosed: d === 5, isOpen24Hours: false }));

export const HoursEditor = ({ value, onChange }: { value: WorkingHour[]; onChange: (v: WorkingHour[]) => void }) => {
  const { t, dict } = useT();
  const get = (d: number) => value.find((h) => h.dayOfWeek === d) || { dayOfWeek: d, openTime: '09:00', closeTime: '17:00', isClosed: false, isOpen24Hours: false };
  const set = (d: number, patch: Partial<WorkingHour>) => onChange(ORDER.map((x) => (x === d ? { ...get(x), ...patch } : get(x))));
  const copyAll = (d: number) => { const src = get(d); onChange(ORDER.map((x) => ({ ...src, dayOfWeek: x }))); };
  return (
    <Stack spacing={1.25}>
      {ORDER.map((d) => {
        const h = get(d);
        return (
          <Stack key={d} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ p: 1.5, borderRadius: 3, bgcolor: 'action.hover' }}>
            <Typography fontWeight={700} sx={{ width: 90 }}>{dict.days[d]}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, opacity: h.isClosed || h.isOpen24Hours ? 0.4 : 1 }}>
              <TextField type="time" size="small" label={t('owner.openAt')} value={h.openTime || ''} disabled={h.isClosed || h.isOpen24Hours} onChange={(e) => set(d, { openTime: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ width: 140, bgcolor: 'background.paper' }} />
              <Box>—</Box>
              <TextField type="time" size="small" label={t('owner.closeAt')} value={h.closeTime || ''} disabled={h.isClosed || h.isOpen24Hours} onChange={(e) => set(d, { closeTime: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ width: 140, bgcolor: 'background.paper' }} />
            </Stack>
            <Stack direction="row" alignItems="center">
              <FormControlLabel control={<Checkbox checked={h.isClosed} onChange={(e) => set(d, { isClosed: e.target.checked, isOpen24Hours: false })} />} label={t('owner.closedDay')} />
              <FormControlLabel control={<Checkbox checked={h.isOpen24Hours} onChange={(e) => set(d, { isOpen24Hours: e.target.checked, isClosed: false })} />} label={t('owner.allDay')} />
              <Button size="small" startIcon={<ContentCopyRounded />} onClick={() => copyAll(d)}>{t('owner.copyDay')}</Button>
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
};
