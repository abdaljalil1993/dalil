import { Grid } from '@mui/material';
import { motion } from 'framer-motion';
import type { Business } from '@/api/types';
import { BusinessCard, BusinessRow } from './BusinessCard';

export const BusinessGrid = ({ items, view = 'grid', md = 3 }: { items: Business[]; view?: 'grid' | 'list'; md?: number }) => (
  <Grid container spacing={view === 'grid' ? 2.5 : 1.5}>
    {items.map((b, i) => (
      <Grid item key={b.id} xs={12} sm={view === 'grid' ? 6 : 12} md={view === 'grid' ? md : 12}>
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.35, delay: Math.min(i % 8, 6) * 0.04 }} style={{ height: '100%' }}>
          {view === 'grid' ? <BusinessCard business={b} /> : <BusinessRow business={b} />}
        </motion.div>
      </Grid>
    ))}
  </Grid>
);
