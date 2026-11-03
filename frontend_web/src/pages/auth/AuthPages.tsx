import { Alert, Box, Button, Card, Container, Grid, IconButton, InputAdornment, Link as MLink, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import PhoneIphoneRounded from '@mui/icons-material/PhoneIphoneRounded';
import AlternateEmailRounded from '@mui/icons-material/AlternateEmailRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import { ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, otpApi } from '@/api/services';
import { useAuth } from '@/hooks/useAuth';
import { useNotify } from '@/hooks/useNotify';
import { useCities } from '@/hooks/queries';
import { useLocalName, useT } from '@/i18n';
import { LogoMark } from '@/components/common/Logo';

const AuthShell = ({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) => {
  const { t } = useT();
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Card sx={{ overflow: 'hidden' }}>
        <Grid container>
          <Grid item md={5} sx={{ display: { xs: 'none', md: 'block' }, background: (th) => th.custom.gradient, color: '#fff', p: 5, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', bottom: -100, insetInlineEnd: -100, background: 'radial-gradient(circle, rgba(255,106,61,.6), transparent 70%)' }} />
            <Stack spacing={3} sx={{ position: 'relative' }}>
              <LogoMark size={52} />
              <Typography variant="h4" fontWeight={800}>{t('app.tagline')}</Typography>
              <Typography sx={{ opacity: 0.9 }}>{t('app.slogan')}</Typography>
              <Stack spacing={1.5}>
                {(['benefits1', 'benefits2', 'benefits3', 'benefits4'] as const).map((k) => (
                  <Stack key={k} direction="row" spacing={1.25} alignItems="center"><CheckCircleRounded sx={{ color: '#fff' }} /><Typography fontWeight={600}>{t(`auth.${k}`)}</Typography></Stack>
                ))}
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={7} sx={{ p: { xs: 3, sm: 5 } }}>
            <Box sx={{ maxWidth: 440, mx: 'auto' }}>
              <Typography variant="h4" fontWeight={800}>{title}</Typography>
              {subtitle && <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>{subtitle}</Typography>}
              {children}
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Container>
  );
};

const PasswordField = ({ label, error, helperText, reg }: { label: string; error?: boolean; helperText?: string; reg: object }) => {
  const [show, setShow] = useState(false);
  return (
    <TextField fullWidth type={show ? 'text' : 'password'} label={label} error={error} helperText={helperText} {...reg}
      InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShow((s) => !s)} edge="end">{show ? <VisibilityOffRounded /> : <VisibilityRounded />}</IconButton></InputAdornment> }} />
  );
};

const useRedirectAfterAuth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as { from?: string } | null)?.from;
  return () => navigate(from && !from.startsWith('/login') ? from : '/', { replace: true });
};

export const Login = () => {
  const { t } = useT();
  const { onAuthenticated } = useAuth();
  const notify = useNotify();
  const done = useRedirectAfterAuth();
  const schema = z.object({ email: z.string().email(t('auth.invalidEmail')), password: z.string().min(1, t('common.required')) });
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const m = useMutation({ mutationFn: authApi.login, onSuccess: (p) => { onAuthenticated(p); notify.success(t('auth.welcome', { name: p.user.firstName })); done(); }, onError: notify.error });
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const location = useLocation();
  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <Tabs value={mode} onChange={(_, v) => setMode(v)} variant="fullWidth" sx={{ mb: 2.5, bgcolor: 'action.hover', borderRadius: 3, minHeight: 44, '& .MuiTab-root': { minHeight: 44 }, '& .MuiTabs-indicator': { height: '100%', borderRadius: 3, zIndex: 0, opacity: 0.14 } }}>
        <Tab value="email" icon={<AlternateEmailRounded fontSize="small" />} iconPosition="start" label={t('x.emailLogin')} sx={{ zIndex: 1 }} />
        <Tab value="phone" icon={<PhoneIphoneRounded fontSize="small" />} iconPosition="start" label={t('x.phoneLogin')} sx={{ zIndex: 1 }} />
      </Tabs>
      {mode === 'phone' ? <PhoneLogin /> : (
      <Stack component="form" spacing={2} onSubmit={handleSubmit((v) => m.mutate(v))}>
        <TextField fullWidth label={t('common.email')} type="email" autoComplete="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
        <PasswordField label={t('auth.password')} reg={register('password')} error={!!errors.password} helperText={errors.password?.message} />
        <MLink component={Link} to="/forgot-password" variant="body2" sx={{ alignSelf: 'flex-end' }}>{t('auth.forgot')}</MLink>
        <Button type="submit" variant="contained" size="large" disabled={m.isPending}>{t('auth.loginNow')}</Button>
        <Typography variant="body2" align="center">{t('auth.noAccount')} <MLink component={Link} to="/register" state={location.state} fontWeight={700}>{t('auth.registerNow')}</MLink></Typography>
      </Stack>
      )}
    </AuthShell>
  );
};

const PhoneLogin = () => {
  const { t } = useT();
  const { onAuthenticated } = useAuth();
  const notify = useNotify();
  const done = useRedirectAfterAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [sent, setSent] = useState<{ phone: string; isNewUser: boolean; devCode?: string } | null>(null);
  const req = useMutation({ mutationFn: () => otpApi.request(phone), onSuccess: (r) => setSent(r), onError: notify.error });
  const ver = useMutation({
    mutationFn: () => otpApi.verify({ phone: sent!.phone, code, ...(sent!.isNewUser && { firstName: first, lastName: last }) }),
    onSuccess: (p) => { onAuthenticated(p); notify.success(t('auth.welcome', { name: p.user.firstName })); done(); },
    onError: notify.error,
  });
  if (!sent) {
    return (
      <Stack component="form" spacing={2} onSubmit={(e) => { e.preventDefault(); req.mutate(); }}>
        <TextField fullWidth label={t('x.phone')} placeholder="09xx xxx xxx" value={phone} onChange={(e) => setPhone(e.target.value)} inputProps={{ dir: 'ltr', inputMode: 'tel' }} autoComplete="tel" />
        <Button type="submit" variant="contained" size="large" disabled={phone.replace(/\D/g, '').length < 9 || req.isPending}>{t('x.sendCode')}</Button>
      </Stack>
    );
  }
  const ready = code.length >= 4 && (!sent.isNewUser || (first.trim().length >= 2 && last.trim().length >= 2));
  return (
    <Stack component="form" spacing={2} onSubmit={(e) => { e.preventDefault(); if (ready) ver.mutate(); }}>
      <Alert severity="info">{t('x.codeSentTo', { phone: sent.phone })}</Alert>
      {sent.devCode && <Alert severity="warning">{t('x.devCode', { code: sent.devCode })}</Alert>}
      <TextField fullWidth autoFocus label={t('x.code')} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputProps={{ dir: 'ltr', inputMode: 'numeric', style: { letterSpacing: 8, fontSize: 22, textAlign: 'center', fontWeight: 800 } }} />
      {sent.isNewUser && (
        <>
          <Typography variant="subtitle2" fontWeight={700}>{t('x.newAccountName')}</Typography>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth label={t('auth.firstName')} value={first} onChange={(e) => setFirst(e.target.value)} />
            <TextField fullWidth label={t('auth.lastName')} value={last} onChange={(e) => setLast(e.target.value)} />
          </Stack>
        </>
      )}
      <Button type="submit" variant="contained" size="large" disabled={!ready || ver.isPending}>{t('x.verify')}</Button>
      <Stack direction="row" justifyContent="space-between">
        <Button size="small" onClick={() => { setSent(null); setCode(''); }}>{t('common.back')}</Button>
        <Button size="small" disabled={req.isPending} onClick={() => req.mutate()}>{t('x.resend')}</Button>
      </Stack>
    </Stack>
  );
};

export const Register = () => {
  const { t } = useT();
  const ln = useLocalName();
  const { onAuthenticated } = useAuth();
  const notify = useNotify();
  const done = useRedirectAfterAuth();
  const { data: cities } = useCities();
  const schema = z
    .object({
      firstName: z.string().min(2, t('common.required')),
      lastName: z.string().min(2, t('common.required')),
      email: z.string().email(t('auth.invalidEmail')),
      phone: z.string().optional(),
      cityId: z.union([z.number(), z.literal('')]).optional(),
      password: z.string().min(8, t('auth.passwordHint')).regex(/^(?=.*[A-Za-z])(?=.*\d)/, t('auth.passwordHint')),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { path: ['confirm'], message: t('auth.passwordsMismatch') });
  type F = z.infer<typeof schema>;
  const { register, handleSubmit, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema), defaultValues: { cityId: '' } });
  const m = useMutation({
    mutationFn: ({ confirm: _c, cityId, phone, ...v }: F) => authApi.register({ ...v, phone: phone || undefined, cityId: cityId ? Number(cityId) : undefined }),
    onSuccess: (p) => { onAuthenticated(p); notify.success(t('auth.welcome', { name: p.user.firstName })); done(); },
    onError: notify.error,
  });
  return (
    <AuthShell title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      <Box component="form" onSubmit={handleSubmit((v) => m.mutate(v))}>
        <Grid container spacing={2}>
          <Grid item xs={6}><TextField fullWidth label={t('auth.firstName')} {...register('firstName')} error={!!errors.firstName} helperText={errors.firstName?.message} /></Grid>
          <Grid item xs={6}><TextField fullWidth label={t('auth.lastName')} {...register('lastName')} error={!!errors.lastName} helperText={errors.lastName?.message} /></Grid>
          <Grid item xs={12}><TextField fullWidth label={t('common.email')} type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} /></Grid>
          <Grid item xs={6}><TextField fullWidth label={`${t('common.phone')} (${t('common.optional')})`} {...register('phone')} inputProps={{ dir: 'ltr' }} /></Grid>
          <Grid item xs={6}>
            <TextField select fullWidth label={t('common.city')} defaultValue="" {...register('cityId', { setValueAs: (v) => (v === '' ? '' : Number(v)) })}>
              <MenuItem value="">—</MenuItem>
              {(cities || []).map((c) => <MenuItem key={c.id} value={c.id}>{ln(c)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}><PasswordField label={t('auth.password')} reg={register('password')} error={!!errors.password} helperText={errors.password?.message || t('auth.passwordHint')} /></Grid>
          <Grid item xs={12}><PasswordField label={t('auth.confirmPassword')} reg={register('confirm')} error={!!errors.confirm} helperText={errors.confirm?.message} /></Grid>
        </Grid>
        <Button fullWidth type="submit" variant="contained" size="large" disabled={m.isPending} sx={{ mt: 2.5 }}>{t('auth.registerNow')}</Button>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>{t('auth.haveAccount')} <MLink component={Link} to="/login" fontWeight={700}>{t('auth.loginNow')}</MLink></Typography>
      </Box>
    </AuthShell>
  );
};

export const ForgotPassword = () => {
  const { t } = useT();
  const notify = useNotify();
  const [email, setEmail] = useState('');
  const m = useMutation({ mutationFn: () => authApi.forgot(email), onError: notify.error });
  return (
    <AuthShell title={t('auth.forgotTitle')} subtitle={t('auth.forgotText')}>
      {m.isSuccess ? (
        <Stack spacing={2}>
          <Alert severity="success">{t('auth.linkSent')}</Alert>
          {m.data?.devResetToken && <Button component={Link} to={`/reset-password?token=${m.data.devResetToken}`} variant="outlined">{t('auth.devToken')}</Button>}
        </Stack>
      ) : (
        <Stack component="form" spacing={2} onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
          <TextField fullWidth type="email" label={t('common.email')} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" variant="contained" size="large" disabled={m.isPending}>{t('auth.sendLink')}</Button>
          <MLink component={Link} to="/login" align="center">{t('auth.loginNow')}</MLink>
        </Stack>
      )}
    </AuthShell>
  );
};

export const ResetPassword = () => {
  const { t } = useT();
  const notify = useNotify();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const m = useMutation({ mutationFn: () => authApi.reset(params.get('token') || '', pw), onSuccess: () => { notify.success(t('auth.resetDone')); navigate('/login'); }, onError: notify.error });
  const invalid = pw.length < 8 || pw !== pw2;
  return (
    <AuthShell title={t('auth.resetTitle')}>
      <Stack component="form" spacing={2} sx={{ mt: 2 }} onSubmit={(e) => { e.preventDefault(); if (!invalid) m.mutate(); }}>
        <TextField fullWidth type="password" label={t('auth.newPassword')} value={pw} onChange={(e) => setPw(e.target.value)} helperText={t('auth.passwordHint')} />
        <TextField fullWidth type="password" label={t('auth.confirmPassword')} value={pw2} onChange={(e) => setPw2(e.target.value)} error={!!pw2 && pw !== pw2} helperText={pw2 && pw !== pw2 ? t('auth.passwordsMismatch') : ''} />
        <Button type="submit" variant="contained" size="large" disabled={invalid || m.isPending}>{t('common.save')}</Button>
      </Stack>
    </AuthShell>
  );
};
