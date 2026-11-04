import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import businessRoutes from './business.routes';
import { homeRouter, categoryRouter, cityRouter } from './catalog.routes';
import { reviewRouter, favoriteRouter, reportRouter, claimRouter, notificationRouter, contactRouter } from './engagement.routes';
import { adRouter, featuredRouter, adminRouter } from './promotion.routes';
import { v21Routers as v } from './v21.routes';

const router = Router();

router.use('/auth/otp', v.otp);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/home', homeRouter);
router.use('/categories', categoryRouter);
router.use('/cities', cityRouter);
router.use('/businesses', v.biz);
router.use('/businesses', businessRoutes);
router.use('/reviews', reviewRouter);
router.use('/favorites', favoriteRouter);
router.use('/reports', reportRouter);
router.use('/claims', claimRouter);
router.use('/notifications', notificationRouter);
router.use('/contact', contactRouter);
router.use('/advertisements', adRouter);
router.use('/featured', featuredRouter);
router.use('/admin', adminRouter);
router.use('/billing', v.billing);
router.use('/offers', v.offers);
router.use('/pharmacies', v.pharm);
router.use('/emergency', v.emerg);
router.use('/listings', v.listings);
router.use('/service-requests', v.requests);
router.use('/appointments', v.appointments);
router.use('/devices', v.devices);

export default router;
