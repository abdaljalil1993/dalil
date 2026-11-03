import { Box, Dialog, IconButton, Stack, Typography } from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { useState } from 'react';
import type { BusinessImage } from '@/api/types';

export const Lightbox = ({ images, index, onClose }: { images: string[]; index: number | null; onClose: () => void }) => {
  const [i, setI] = useState(index ?? 0);
  if (index === null) return null;
  const cur = i % images.length;
  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: '#000', borderRadius: 3 } }} TransitionProps={{ onEnter: () => setI(index) }}>
      <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', zIndex: 2 }}><CloseRounded /></IconButton>
      <Box sx={{ position: 'relative', display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <Box component="img" src={images[cur]} alt="" sx={{ maxHeight: '80vh', maxWidth: '100%', objectFit: 'contain' }} />
        {images.length > 1 && (
          <>
            <IconButton onClick={() => setI((cur - 1 + images.length) % images.length)} sx={{ position: 'absolute', left: 8, color: '#fff', bgcolor: 'rgba(255,255,255,.15)' }}><ChevronLeftRounded /></IconButton>
            <IconButton onClick={() => setI((cur + 1) % images.length)} sx={{ position: 'absolute', right: 8, color: '#fff', bgcolor: 'rgba(255,255,255,.15)' }}><ChevronRightRounded /></IconButton>
          </>
        )}
        <Typography sx={{ position: 'absolute', bottom: 10, color: '#fff', opacity: 0.8 }} variant="caption">{cur + 1} / {images.length}</Typography>
      </Box>
    </Dialog>
  );
};

export const GalleryGrid = ({ images }: { images: BusinessImage[] }) => {
  const [open, setOpen] = useState<number | null>(null);
  if (!images.length) return null;
  const urls = images.map((i) => i.url);
  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.25 }}>
        {images.slice(0, 8).map((img, k) => (
          <Box key={img.id} onClick={() => setOpen(k)} sx={{ position: 'relative', aspectRatio: '1', borderRadius: 3, overflow: 'hidden', cursor: 'zoom-in', '&:hover img': { transform: 'scale(1.06)' } }}>
            <Box component="img" src={img.url} alt={img.caption || ''} loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .35s' }} />
            {k === 7 && images.length > 8 && (
              <Stack sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,.55)', color: '#fff' }} alignItems="center" justifyContent="center"><Typography variant="h5" fontWeight={800}>+{images.length - 8}</Typography></Stack>
            )}
          </Box>
        ))}
      </Box>
      <Lightbox images={urls} index={open} onClose={() => setOpen(null)} />
    </>
  );
};
