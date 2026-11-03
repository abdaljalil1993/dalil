import { IconButton, Tooltip } from '@mui/material';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRounded from '@mui/icons-material/FavoriteBorderRounded';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, MouseEvent } from 'react';
import { favoriteApi } from '@/api/services';
import { useRequireAuth } from '@/hooks/useAuth';
import { useNotify } from '@/hooks/useNotify';
import { useT } from '@/i18n';

export const FavoriteButton = ({ businessId, initial, variant = 'floating' }: { businessId: string; initial?: boolean; variant?: 'floating' | 'plain' }) => {
  const [fav, setFav] = useState(Boolean(initial));
  useEffect(() => { setFav(Boolean(initial)); }, [initial]);
  const requireAuth = useRequireAuth();
  const qc = useQueryClient();
  const notify = useNotify();
  const { t } = useT();
  const m = useMutation({
    mutationFn: () => favoriteApi.toggle(businessId),
    onMutate: () => setFav((v) => !v), // optimistic
    onSuccess: (r) => {
      setFav(r.isFavorite);
      qc.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (e) => {
      setFav((v) => !v);
      notify.error(e);
    },
  });
  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => m.mutate());
  };
  return (
    <Tooltip title={fav ? t('business.removeFavorite') : t('business.addFavorite')}>
      <IconButton
        onClick={onClick}
        aria-label="favorite"
        sx={variant === 'floating' ? { bgcolor: 'rgba(255,255,255,.92)', color: fav ? '#F04438' : '#344054', backdropFilter: 'blur(6px)', '&:hover': { bgcolor: '#fff', transform: 'scale(1.08)' }, transition: 'all .2s', width: 38, height: 38 } : { color: fav ? '#F04438' : 'inherit' }}
      >
        {fav ? <FavoriteRounded fontSize="small" /> : <FavoriteBorderRounded fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};
