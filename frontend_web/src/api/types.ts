export type Role = 'user' | 'business_owner' | 'admin';
export type BusinessStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Meta;
}

export interface Paged<T> {
  items: T[];
  meta: Meta;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  cityId: number | null;
  role: Role;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLoginAt?: string | null;
  counts?: { reviews: number; favorites: number; businesses: number; unreadNotifications: number };
}

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string | null;
}

export interface SubCategory {
  id: number;
  name: string;
  nameEn: string | null;
  slug: string;
  icon?: string | null;
  keywords?: string | null;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  categoryId: number;
  businessCount?: number;
}

export interface Category {
  id: number;
  name: string;
  nameEn: string | null;
  slug: string;
  description?: string | null;
  icon: string | null;
  color: string | null;
  image?: string | null;
  keywords?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  businessCount?: number;
  subCategories?: SubCategory[];
}

export interface City {
  id: number;
  name: string;
  nameEn: string | null;
  slug: string;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
  sortOrder?: number;
  businessCount?: number;
}

export interface WorkingHour {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  isOpen24Hours: boolean;
}

export interface BusinessImage {
  id: number;
  url: string;
  caption?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Business {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  address: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  phone2: string | null;
  whatsapp: string | null;
  website: string | null;
  email: string | null;
  socialLinks: Record<string, string>;
  coverImage: string | null;
  logoImage: string | null;
  priceRange: number | null;
  attributes: Record<string, unknown>;
  amenities: string[];
  tags: string[];
  averageRating: number;
  reviewCount: number;
  favoriteCount: number;
  viewCount: number;
  isFeatured: boolean;
  isVerified: boolean;
  isClaimed: boolean;
  isOpenNow: boolean | null;
  bookingEnabled?: boolean;
  bookingMode?: 'slot' | 'day';
  bookingNote?: string | null;
  acceptsQuotes?: boolean;
  bookingSettings?: BookingSettings;
  dataSource?: 'osm' | null;
  categoryId: number;
  subCategoryId: number | null;
  cityId: number;
  category: Pick<Category, 'id' | 'name' | 'nameEn' | 'slug' | 'icon' | 'color'> | null;
  subCategory: Pick<SubCategory, 'id' | 'name' | 'nameEn' | 'slug'> | null;
  city: Pick<City, 'id' | 'name' | 'nameEn' | 'slug'> | null;
  images: BusinessImage[];
  workingHours: WorkingHour[];
  distanceKm?: number | null;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  // privileged (owner/admin)
  status?: BusinessStatus;
  source?: 'admin' | 'owner' | 'suggestion';
  isActive?: boolean;
  adminNote?: string | null;
  ownerId?: string | null;
  owner?: (PublicUser & { email: string; phone: string | null }) | null;
  stats?: { views: number; favorites: number; phoneClicks: number; whatsappClicks: number; directionClicks: number; websiteClicks: number };
}

export interface Review {
  id: string;
  rating: number;
  content: string | null;
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  likesCount: number;
  isHidden: boolean;
  businessId: string;
  user: PublicUser | null;
  business?: { id: string; name: string; slug: string; logoImage: string | null };
  likedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessDetails extends Business {
  ratingBreakdown: Record<'1' | '2' | '3' | '4' | '5', number>;
  viewer: { isFavorite: boolean; canManage: boolean; myReview: Review | null; hasPendingClaim: boolean } | null;
}

export type AdPlacement = 'home_slider' | 'homepage_banner' | 'search_results' | 'category_page' | 'business_details' | 'sidebar';

export interface Advertisement {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  targetUrl: string | null;
  placement: AdPlacement;
  status: 'pending' | 'active' | 'paused' | 'rejected' | 'expired';
  startDate: string;
  endDate: string;
  priority: number;
  clickCount?: number;
  impressionCount?: number;
  price?: string | null;
  contactPhone?: string | null;
  adminNote?: string | null;
  cityId: number | null;
  categoryId: number | null;
  businessId: string | null;
  requestedById?: string | null;
  business?: { id: string; name: string; slug: string } | null;
  createdAt?: string;
}

export interface FeaturedEntry {
  id: number;
  businessId: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'rejected' | 'expired';
  priority: number;
  price: string | null;
  note: string | null;
  requestedById: string | null;
  business?: { id: string; name: string; slug: string; city?: string } | null;
  createdAt: string;
}

export interface HomeFeed {
  categories: Category[];
  cities: City[];
  ads: { slider: Advertisement[]; banners: Advertisement[] };
  featured: Business[];
  topRated: Business[];
  newest: Business[];
  offers: Offer[];
  onDutyPharmacies: number;
  stats: { businesses: number; reviews: number; users: number; cities: number; categories: number };
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  data: { slug?: string; businessId?: string; listingSlug?: string; requestId?: number; appointmentId?: number } | null;
  isRead: boolean;
  createdAt: string;
}

export interface Report {
  id: number;
  type: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNote: string | null;
  reporter: PublicUser | null;
  business: { id: string; name: string; slug: string } | null;
  review: { id: string; rating: number; content: string | null; isHidden: boolean } | null;
  createdAt: string;
}

export interface Claim {
  id: number;
  message: string;
  phone: string | null;
  proofUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  adminNote: string | null;
  user?: (PublicUser & { email: string; phone: string | null }) | null;
  business: { id: string; name: string; slug: string } | null;
  createdAt: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totals: Record<string, number>;
  pendingActions: { businesses: number; reports: number; claims: number; ads: number; featured: number; messages: number };
  charts: {
    usersByMonth: { month: string; count: number }[];
    businessesByMonth: { month: string; count: number }[];
    reviewsByMonth: { month: string; count: number }[];
    businessesByCategory: { name: string; color: string; count: number }[];
    businessesByCity: { name: string; count: number }[];
  };
  recentBusinesses: Business[];
  topBusinesses: Business[];
}

export interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface BusinessFilters {
  q?: string;
  categoryId?: number;
  subCategoryId?: number;
  cityId?: number;
  district?: string;
  minRating?: number;
  priceRange?: number;
  openNow?: boolean;
  verified?: boolean;
  featured?: boolean;
  hasPhotos?: boolean;
  lat?: number;
  lng?: number;
  radius?: number;
  sort?: 'relevance' | 'rating' | 'reviews' | 'newest' | 'distance' | 'name' | 'popular';
  page?: number;
  limit?: number;
  status?: string;
}

// ───────────── v2.1 ─────────────
export interface PlanFeatures {
  maxImages: number; maxItems: number; maxActiveOffers: number; maxActiveListings: number;
  bookings: boolean; quotes: boolean; advancedStats: boolean; verifiedBadge: boolean;
  priorityBoost: number; featuredDaysPerMonth: number; socialLinks: boolean; whatsappButton: boolean;
}
export interface Plan {
  id: number; code: string; name: string; nameEn: string | null; description: string | null;
  priceMonthly: string; priceYearly: string; currency: string; features: PlanFeatures; color: string | null;
  isDefault: boolean; isRecommended: boolean; isActive: boolean; sortOrder: number;
}
export interface Entitlements {
  plan: Pick<Plan, 'id' | 'code' | 'name' | 'nameEn' | 'features' | 'color'>;
  subscription: Subscription | null;
  billingEnabled: boolean;
  features: PlanFeatures;
  usage: { images: number; items: number; activeOffers: number; activeListings: number };
}
export interface Subscription {
  id: number; businessId: string; planId: number; status: 'pending' | 'active' | 'expired' | 'cancelled'; period: 'monthly' | 'yearly';
  startDate: string | null; endDate: string | null; note: string | null; createdAt: string;
  plan?: Plan; business?: { id: string; name: string; slug: string } | null;
}
export interface Payment {
  id: number; userId: string | null; businessId: string | null; subscriptionId: number | null; purpose: string; amount: string; currency: string;
  method: string; reference: string | null; status: 'pending' | 'confirmed' | 'rejected'; note: string | null; adminNote: string | null; createdAt: string;
  user?: { id: string; fullName: string; phone: string | null; email: string | null } | null; business?: { id: string; name: string; slug: string } | null;
}
export interface Settings {
  billingEnabled: boolean; renewalReminderDays: number; paymentInstructions: string; listingsRequireApproval: boolean;
  listingDurationDays: number; serviceRequestDurationDays: number; supportPhone: string; supportWhatsapp: string;
}
export interface BusinessItem {
  id: number; businessId: string; section: string; name: string; nameEn: string | null; description: string | null; price: string | null; oldPrice: string | null;
  currency: string; unit: string | null; image: string | null; durationMinutes: number | null; isAvailable: boolean; isPopular: boolean; sortOrder: number;
}
export interface Offer {
  id: number; businessId: string; title: string; description: string | null; image: string | null; discountPercent: number | null; price: string | null; oldPrice: string | null;
  currency: string; couponCode: string | null; terms: string | null; startDate: string; endDate: string; isActive: boolean;
  business?: { id: string; name: string; nameEn: string | null; slug: string; logoImage: string | null; coverImage: string | null; city: { id: number; name: string; nameEn: string | null } | null; category: { id: number; name: string; nameEn: string | null; icon: string | null; color: string | null } | null };
}
export interface EmergencyContact { id: number; cityId: number | null; type: string; name: string; nameEn: string | null; phone: string; phone2: string | null; note: string | null; isActive: boolean; sortOrder: number; city?: City | null }
export interface DutyItem { id: number; date: string; startTime: string | null; endTime: string | null; note: string | null; business: Business }
export type ListingType = 'real_estate' | 'car' | 'job' | 'other';
export type ListingPurpose = 'sale' | 'rent' | 'hire' | 'wanted';
export interface ListingField { key: string; kind: 'num' | 'enum' | 'bool' | 'text'; options?: string[]; filter?: boolean }
export interface Listing {
  id: string; slug: string; type: ListingType; purpose: ListingPurpose; title: string; description: string | null; price: number | null; currency: string;
  priceNegotiable: boolean; pricePeriod: string | null; cityId: number; city: { id: number; name: string; nameEn: string | null } | null; district: string | null; address: string | null;
  latitude: number | null; longitude: number | null; attributes: Record<string, string | number | boolean>; images: { url: string }[]; contactPhone: string | null; whatsapp: string | null;
  status: 'pending' | 'active' | 'rejected' | 'closed' | 'expired'; isFeatured: boolean; viewCount: number; applicationsCount?: number; adminNote?: string | null; expiresAt: string | null;
  user: PublicUser | null; business: { id: string; name: string; slug: string; logoImage: string | null; isVerified: boolean } | null; createdAt: string;
  viewer?: { canManage: boolean; hasApplied: boolean } | null;
}
export interface JobApplication { id: number; listingId: string; message: string | null; phone: string | null; cvUrl: string | null; status: string; createdAt: string; user?: (PublicUser & { email: string | null; phone: string | null }) | null; listing?: { id: string; slug: string; title: string; status: string; city?: string } | null }
export interface Quote { id: number; price: string | null; currency: string; message: string; etaDays: number | null; status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'; createdAt: string; business: { id: string; name: string; slug: string; logoImage: string | null; averageRating: number; reviewCount: number; phone: string | null; whatsapp: string | null; isVerified: boolean } | null }
export interface ServiceRequest {
  id: number; title: string; description: string; images: { url: string }[]; budget: string | null; preferredDate: string | null; district: string | null;
  status: 'open' | 'assigned' | 'closed' | 'cancelled'; quotesCount: number; acceptedQuoteId: number | null; createdAt: string; phone: string | null; sharePhone: boolean;
  category: { id: number; name: string; nameEn: string | null; icon: string | null; color: string | null } | null; subCategory: { id: number; name: string; nameEn: string | null } | null;
  city: { id: number; name: string; nameEn: string | null } | null; categoryId: number; subCategoryId: number | null; cityId: number;
  quotes?: Quote[]; user?: PublicUser | null; myQuote?: Quote | null; matchingBusinesses?: { id: string; name: string }[];
}
export interface Appointment {
  id: number; date: string; time: string | null; endTime: string | null; partySize: number; phone: string | null; note: string | null; ownerNote: string | null;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show'; createdAt: string;
  business: { id: string; name: string; slug: string; logoImage: string | null; phone: string | null; address: string | null } | null;
  item: { id: number; name: string; price: string | null } | null; user?: (PublicUser & { phone: string | null }) | null;
}
export interface Availability { bookingEnabled: boolean; bookingMode: 'slot' | 'day'; slotMinutes: number; slotCapacity: number; bookingDaysAhead: number; bookingNote: string | null; acceptsQuotes: boolean; bookingAutoConfirm: boolean; date: string; slots: { time: string; remaining: number }[]; available: boolean; remaining?: number }
export interface BookingSettings { bookingEnabled: boolean; bookingMode: 'slot' | 'day'; slotMinutes: number; slotCapacity: number; bookingDaysAhead: number; bookingAutoConfirm: boolean; bookingNote: string | null; acceptsQuotes: boolean }
export type FeatureKey =
  | 'search' | 'reviews' | 'favorites' | 'addBusiness' | 'claims' | 'reports' | 'otpLogin' | 'register'
  | 'offers' | 'pharmacies' | 'emergency' | 'menu' | 'bookings' | 'serviceRequests' | 'realEstate' | 'cars' | 'jobs'
  | 'ads' | 'featured' | 'promote' | 'subscriptions';
export interface FeatureRule { enabled: boolean; cityIds: number[] }
export interface FeaturesResolved { cityId: number | null; enabled: Record<FeatureKey, boolean>; cities: Record<FeatureKey, number[] | null> }
export interface FeaturesAdmin { keys: FeatureKey[]; groups: Record<string, FeatureKey[]>; config: Record<FeatureKey, FeatureRule> }
export interface OsmPreset { key: string; name: string; nameEn: string; category: string }
export interface OsmJob {
  id: string; status: 'running' | 'done' | 'failed'; startedAt: string; finishedAt: string | null;
  options: { presets: string[]; scope: 'governorate' | 'radius'; cityId: number; radiusKm?: number; dryRun?: boolean; updateExisting?: boolean };
  found: number; created: number; updated: number; skippedDuplicate: number; skippedNoName: number;
  byPreset: Record<string, { found: number; created: number }>; samples: { name: string; preset: string; city: string; phone: string | null }[]; error: string | null;
}
