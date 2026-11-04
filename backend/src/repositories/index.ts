import { AppDataSource } from '../config/database';
import {
  User, Category, SubCategory, City, Business, BusinessImage, BusinessWorkingHours, Review, ReviewLike,
  Favorite, Advertisement, FeaturedBusiness, Report, BusinessClaim, SearchLog, RefreshToken, AuditLog,
  Notification, ContactMessage,
} from '../entities';

/** Typed repository accessors (TypeORM Repository = repository pattern). */
export const repos = {
  users: () => AppDataSource.getRepository(User),
  categories: () => AppDataSource.getRepository(Category),
  subCategories: () => AppDataSource.getRepository(SubCategory),
  cities: () => AppDataSource.getRepository(City),
  businesses: () => AppDataSource.getRepository(Business),
  images: () => AppDataSource.getRepository(BusinessImage),
  hours: () => AppDataSource.getRepository(BusinessWorkingHours),
  reviews: () => AppDataSource.getRepository(Review),
  reviewLikes: () => AppDataSource.getRepository(ReviewLike),
  favorites: () => AppDataSource.getRepository(Favorite),
  ads: () => AppDataSource.getRepository(Advertisement),
  featured: () => AppDataSource.getRepository(FeaturedBusiness),
  reports: () => AppDataSource.getRepository(Report),
  claims: () => AppDataSource.getRepository(BusinessClaim),
  searchLogs: () => AppDataSource.getRepository(SearchLog),
  refreshTokens: () => AppDataSource.getRepository(RefreshToken),
  auditLogs: () => AppDataSource.getRepository(AuditLog),
  notifications: () => AppDataSource.getRepository(Notification),
  contact: () => AppDataSource.getRepository(ContactMessage),
};

import {
  AppSetting, Plan, Subscription, Payment, BusinessItem, Offer, PharmacyDuty, EmergencyContact,
  Listing, JobApplication, ServiceRequest, Quote, Appointment, OtpCode, DeviceToken,
} from '../entities';

export const repos2 = {
  settings: () => AppDataSource.getRepository(AppSetting),
  plans: () => AppDataSource.getRepository(Plan),
  subscriptions: () => AppDataSource.getRepository(Subscription),
  payments: () => AppDataSource.getRepository(Payment),
  items: () => AppDataSource.getRepository(BusinessItem),
  offers: () => AppDataSource.getRepository(Offer),
  duties: () => AppDataSource.getRepository(PharmacyDuty),
  emergency: () => AppDataSource.getRepository(EmergencyContact),
  listings: () => AppDataSource.getRepository(Listing),
  applications: () => AppDataSource.getRepository(JobApplication),
  requests: () => AppDataSource.getRepository(ServiceRequest),
  quotes: () => AppDataSource.getRepository(Quote),
  appointments: () => AppDataSource.getRepository(Appointment),
  otps: () => AppDataSource.getRepository(OtpCode),
  devices: () => AppDataSource.getRepository(DeviceToken),
};
