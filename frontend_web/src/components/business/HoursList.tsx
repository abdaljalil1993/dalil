import { Box, Stack, Typography } from '@mui/material';
import type { WorkingHour } from '@/api/types';
import { useT } from '@/i18n';
import { formatHours, todayIndex } from '@/utils/format';

// Week starts on Saturday in Syria / most Arab countries
const ORDER = [6, 0, 1, 2, 3, 4, 5];

export const HoursList = ({ hours }: { hours: WorkingHour[] }) => {
  const { t, dict, locale } = useT();
  const today = todayIndex();
  if (!hours.length) return <Typography color="text.secondary">{t('business.hoursUnknown')}</Typography>;
  return (
    <Stack spacing={0.5}>
      {ORDER.map((d) => {
        const h = hours.find((x) => x.dayOfWeek === d);
        const isToday = d === today;
        return (
          <Stack key={d} direction="row" justifyContent="space-between" sx={{ px: 1.25, py: 0.9, borderRadius: 2, bgcolor: isToday ? 'action.selected' : 'transparent' }}>
            <Typography fontWeight={isToday ? 800 : 500}>{dict.days[d]}</Typography>
            <Box component="span" sx={{ fontWeight: isToday ? 800 : 500, color: !h || h.isClosed ? 'error.main' : 'text.primary', direction: 'ltr' }}>
              {h ? formatHours(h, locale, { closed: t('business.closed'), open24: t('business.open24') }) : '—'}
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
};
