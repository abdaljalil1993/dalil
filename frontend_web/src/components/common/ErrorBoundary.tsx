import { Component, ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { translate } from '@/i18n';
import { usePrefs } from '@/store/prefsStore';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error(error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    const l = usePrefs.getState().locale;
    return (
      <Box sx={{ textAlign: 'center', py: 10, px: 2 }}>
        <Typography variant="h5" fontWeight={800}>{translate(l, 'errors.boundary')}</Typography>
        <Typography color="text.secondary" sx={{ my: 2 }}>{this.state.error.message}</Typography>
        <Button variant="contained" onClick={() => { this.setState({ error: null }); window.location.assign('/'); }}>{translate(l, 'notFound.home')}</Button>
      </Box>
    );
  }
}
