import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, MenuItem, Switch, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { useT } from '@/i18n';

export interface FieldDef {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'switch' | 'select' | 'color' | 'date' | 'datetime';
  options?: { value: string | number; label: string }[];
  required?: boolean;
  half?: boolean;
  helper?: string;
  dir?: 'ltr' | 'rtl';
}

/** Generic create/edit dialog used across admin screens. */
export const EntityDialog = ({ open, title, fields, initial, onClose, onSubmit, loading, extra }: {
  open: boolean; title: string; fields: FieldDef[]; initial?: Record<string, unknown>; onClose: () => void; onSubmit: (v: Record<string, unknown>) => void; loading?: boolean; extra?: React.ReactNode;
}) => {
  const { t } = useT();
  const [v, setV] = useState<Record<string, unknown>>({});
  useEffect(() => { if (open) setV(initial || {}); }, [open, initial]);
  const missing = fields.some((f) => f.required && (v[f.name] === undefined || v[f.name] === ''));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={800}>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          {fields.map((f) => (
            <Grid item xs={12} sm={f.half ? 6 : 12} key={f.name}>
              {f.type === 'switch' ? (
                <FormControlLabel control={<Switch checked={Boolean(v[f.name] ?? true)} onChange={(e) => setV({ ...v, [f.name]: e.target.checked })} />} label={f.label} />
              ) : (
                <TextField
                  fullWidth
                  select={f.type === 'select'}
                  type={f.type === 'number' ? 'number' : f.type === 'color' ? 'color' : f.type === 'date' ? 'date' : f.type === 'datetime' ? 'datetime-local' : 'text'}
                  multiline={f.type === 'textarea'}
                  minRows={f.type === 'textarea' ? 3 : undefined}
                  label={f.label}
                  required={f.required}
                  helperText={f.helper}
                  value={(v[f.name] as string | number | undefined) ?? ''}
                  InputLabelProps={f.type === 'date' || f.type === 'datetime' || f.type === 'color' ? { shrink: true } : undefined}
                  inputProps={f.dir ? { dir: f.dir } : undefined}
                  onChange={(e) => setV({ ...v, [f.name]: f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value })}
                >
                  {f.options?.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              )}
            </Grid>
          ))}
        </Grid>
        {extra}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" disabled={missing || loading} onClick={() => onSubmit(v)}>{t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
};

/** Turns '' into null and drops undefined - API friendly */
export const nullify = (v: Record<string, unknown>) => Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, x === '' ? null : x]));
