import { Box, CircularProgress, Typography } from '@mui/material';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import { DragEvent, useRef, useState } from 'react';

export const ImageDropzone = ({ onFiles, multiple = true, hint, loading, height = 140 }: { onFiles: (f: File[]) => void; multiple?: boolean; hint?: string; loading?: boolean; height?: number }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const accept = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list).filter((f) => /image\/(jpe?g|png|webp)/.test(f.type) && f.size <= 5 * 1024 * 1024).slice(0, multiple ? 10 : 1);
    if (files.length) onFiles(files);
  };
  return (
    <Box
      onClick={() => !loading && ref.current?.click()}
      onDragOver={(e: DragEvent) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e: DragEvent) => { e.preventDefault(); setOver(false); accept(e.dataTransfer.files); }}
      sx={{ height, borderRadius: 3, border: '2px dashed', borderColor: over ? 'primary.main' : 'divider', bgcolor: over ? 'action.hover' : 'transparent', display: 'grid', placeItems: 'center', textAlign: 'center', cursor: 'pointer', transition: 'all .2s', px: 2, '&:hover': { borderColor: 'primary.main' } }}
    >
      <input ref={ref} type="file" hidden accept="image/jpeg,image/png,image/webp" multiple={multiple} onChange={(e) => { accept(e.target.files); e.target.value = ''; }} />
      {loading ? <CircularProgress /> : (
        <Box>
          <CloudUploadRounded color="primary" sx={{ fontSize: 36 }} />
          {hint && <Typography variant="body2" color="text.secondary">{hint}</Typography>}
        </Box>
      )}
    </Box>
  );
};
