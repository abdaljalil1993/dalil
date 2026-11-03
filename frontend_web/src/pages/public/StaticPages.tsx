import { Box, Button, Card, Container, Grid, Stack, TextField, Typography } from '@mui/material';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import FlagRounded from '@mui/icons-material/FlagRounded';
import MailRounded from '@mui/icons-material/MailRounded';
import ExploreOffRounded from '@mui/icons-material/ExploreOffRounded';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { moderationApi } from '@/api/services';
import { useAuthStore } from '@/store/authStore';
import { useNotify } from '@/hooks/useNotify';
import { useT } from '@/i18n';
import { EmptyState, PageHeader } from '@/components/common/Section';

export const About = () => {
  const { t } = useT();
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Card sx={{ p: { xs: 3, md: 6 }, background: (th) => th.custom.gradient, color: '#fff', border: 'none', mb: 3 }}>
        <Typography variant="h3" fontWeight={800} sx={{ fontSize: { xs: '2rem', md: '2.8rem' } }}>{t('about.title')}</Typography>
        <Typography sx={{ mt: 2, maxWidth: 760, opacity: 0.92, fontSize: '1.1rem', lineHeight: 1.9 }}>{t('about.text')}</Typography>
      </Card>
      <Grid container spacing={2.5}>
        {[
          { i: <FlagRounded />, a: t('about.mission'), b: t('about.missionText') },
          { i: <GroupsRounded />, a: t('about.forPeople'), b: t('about.forPeopleText') },
          { i: <StorefrontRounded />, a: t('about.forBusiness'), b: t('about.forBusinessText') },
        ].map((x) => (
          <Grid item xs={12} md={4} key={x.a}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Box sx={{ width: 52, height: 52, borderRadius: '30%', display: 'grid', placeItems: 'center', background: (th) => th.custom.gradientSoft, color: 'primary.main', mb: 2 }}>{x.i}</Box>
              <Typography variant="h6" fontWeight={800}>{x.a}</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>{x.b}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export const Contact = () => {
  const { t } = useT();
  const notify = useNotify();
  const user = useAuthStore((s) => s.user);
  const schema = z.object({
    name: z.string().min(2, t('common.required')),
    email: z.string().email(t('auth.invalidEmail')).or(z.literal('')),
    phone: z.string().optional(),
    subject: z.string().optional(),
    message: z.string().min(10, t('common.required')),
  });
  type F = z.infer<typeof schema>;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema), defaultValues: { name: user?.fullName || '', email: user?.email || '', phone: user?.phone || '', subject: '', message: '' } });
  const m = useMutation({ mutationFn: (v: F) => moderationApi.contact({ ...v, email: v.email || undefined }), onSuccess: () => { notify.success(t('contact.sent')); reset({ message: '', subject: '' }); }, onError: notify.error });
  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <PageHeader icon={<MailRounded />} title={t('contact.title')} subtitle={t('contact.subtitle')} />
      <Card sx={{ p: { xs: 2.5, md: 4 } }}>
        <Box component="form" onSubmit={handleSubmit((v) => m.mutate(v))}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField fullWidth label={t('common.name')} {...register('name')} error={!!errors.name} helperText={errors.name?.message} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label={t('common.email')} {...register('email')} error={!!errors.email} helperText={errors.email?.message} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label={t('common.phone')} {...register('phone')} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label={t('contact.subject')} {...register('subject')} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={5} label={t('common.message')} {...register('message')} error={!!errors.message} helperText={errors.message?.message} /></Grid>
          </Grid>
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}><Button type="submit" variant="contained" size="large" disabled={m.isPending}>{t('common.send')}</Button></Stack>
        </Box>
      </Card>
    </Container>
  );
};

export const NotFound = () => {
  const { t } = useT();
  return <Container sx={{ py: 8 }}><EmptyState icon={<ExploreOffRounded />} title={t('notFound.title')} text={t('notFound.text')} action={<Button component={Link} to="/" variant="contained">{t('notFound.home')}</Button>} /></Container>;
};
