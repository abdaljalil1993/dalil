export enum UserRole {
  USER = 'user',
  BUSINESS_OWNER = 'business_owner',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum BusinessStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum BusinessSource {
  ADMIN = 'admin',
  OWNER = 'owner',
  SUGGESTION = 'suggestion',
  OSM = 'osm',
}

export enum AdStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum AdPlacement {
  HOME_SLIDER = 'home_slider',
  HOMEPAGE_BANNER = 'homepage_banner',
  SEARCH_RESULTS = 'search_results',
  CATEGORY_PAGE = 'category_page',
  BUSINESS_DETAILS = 'business_details',
  SIDEBAR = 'sidebar',
}

export enum PromotionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum ReportType {
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  WRONG_INFO = 'wrong_info',
  DUPLICATE = 'duplicate',
  CLOSED = 'closed',
  FAKE_REVIEW = 'fake_review',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum ClaimStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum NotificationType {
  BUSINESS_APPROVED = 'business_approved',
  BUSINESS_REJECTED = 'business_rejected',
  NEW_REVIEW = 'new_review',
  REVIEW_REPLY = 'review_reply',
  CLAIM_APPROVED = 'claim_approved',
  CLAIM_REJECTED = 'claim_rejected',
  PROMOTION_APPROVED = 'promotion_approved',
  PROMOTION_REJECTED = 'promotion_rejected',
  SUBSCRIPTION_ACTIVATED = 'subscription_activated',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  PAYMENT_REJECTED = 'payment_rejected',
  LISTING_APPROVED = 'listing_approved',
  LISTING_REJECTED = 'listing_rejected',
  JOB_APPLICATION = 'job_application',
  APPLICATION_UPDATE = 'application_update',
  SERVICE_REQUEST = 'service_request',
  NEW_QUOTE = 'new_quote',
  QUOTE_ACCEPTED = 'quote_accepted',
  NEW_APPOINTMENT = 'new_appointment',
  APPOINTMENT_UPDATE = 'appointment_update',
  SYSTEM = 'system',
}

export enum ContactClickType {
  PHONE = 'phone',
  WHATSAPP = 'whatsapp',
  DIRECTIONS = 'directions',
  WEBSITE = 'website',
}

// ───────────── v2.1 ─────────────
export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
}

export enum PaymentMethod {
  SHAM_CASH = 'sham_cash',
  SYRIATEL_CASH = 'syriatel_cash',
  MTN_CASH = 'mtn_cash',
  BANK = 'bank',
  CASH = 'cash',
  OTHER = 'other',
}

export enum PaymentPurpose {
  SUBSCRIPTION = 'subscription',
  FEATURED = 'featured',
  ADVERTISEMENT = 'advertisement',
  LISTING = 'listing',
  OTHER = 'other',
}

export enum ListingType {
  REAL_ESTATE = 'real_estate',
  CAR = 'car',
  JOB = 'job',
  OTHER = 'other',
}

export enum ListingPurpose {
  SALE = 'sale',
  RENT = 'rent',
  HIRE = 'hire', // job offer
  WANTED = 'wanted', // looking for (job seeker / wanted to buy)
}

export enum ListingStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  CLOSED = 'closed', // sold / rented / filled
  EXPIRED = 'expired',
}

export enum ApplicationStatus {
  NEW = 'new',
  VIEWED = 'viewed',
  SHORTLISTED = 'shortlisted',
  REJECTED = 'rejected',
  HIRED = 'hired',
}

export enum ServiceRequestStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum QuoteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export enum BookingMode {
  SLOT = 'slot', // doctors, salons: time slots
  DAY = 'day', // halls, chalets: whole day
}

export enum EmergencyType {
  AMBULANCE = 'ambulance',
  FIRE = 'fire',
  POLICE = 'police',
  TRAFFIC = 'traffic',
  ELECTRICITY = 'electricity',
  WATER = 'water',
  GAS = 'gas',
  HOSPITAL = 'hospital',
  OTHER = 'other',
}
