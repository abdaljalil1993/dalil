import { useSnackbar } from 'notistack';
import { useCallback } from 'react';
import { createElement } from 'react';
import { errorCode, errorMessage } from '@/api/client';
import { useT } from '@/i18n';

export const useNotify = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useT();
  const success = useCallback((msg: string) => enqueueSnackbar(msg, { variant: 'success' }), [enqueueSnackbar]);
  const info = useCallback((msg: string) => enqueueSnackbar(msg, { variant: 'info' }), [enqueueSnackbar]);
  const error = useCallback(
    (err: unknown) => {
      const code = errorCode(err);
      if (code === 'PLAN_LIMIT' || code === 'PLAN_FEATURE') {
        enqueueSnackbar(`${t('x.upgradeTitle')} — ${t('x.upgradeText')}`, {
          variant: 'warning',
          autoHideDuration: 8000,
          action: createElement('a', { href: '/owner/subscription', style: { color: '#fff', fontWeight: 700, textDecoration: 'underline', marginInline: 8 } }, t('x.upgrade')),
        });
        return;
      }
      if (code === 'FEATURE_DISABLED') { enqueueSnackbar(t('x.featureOff'), { variant: 'info' }); return; }
      enqueueSnackbar(typeof err === 'string' ? err : errorMessage(err, t('errors.generic')), { variant: 'error' });
    },
    [enqueueSnackbar, t]
  );
  return { success, info, error };
};
