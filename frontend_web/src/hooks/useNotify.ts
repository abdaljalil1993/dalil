import { useSnackbar } from 'notistack';
import { useCallback } from 'react';
import { errorMessage } from '@/api/client';
import { useT } from '@/i18n';

export const useNotify = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useT();
  const success = useCallback((msg: string) => enqueueSnackbar(msg, { variant: 'success' }), [enqueueSnackbar]);
  const info = useCallback((msg: string) => enqueueSnackbar(msg, { variant: 'info' }), [enqueueSnackbar]);
  const error = useCallback((err: unknown) => enqueueSnackbar(typeof err === 'string' ? err : errorMessage(err, t('errors.generic')), { variant: 'error' }), [enqueueSnackbar, t]);
  return { success, info, error };
};
