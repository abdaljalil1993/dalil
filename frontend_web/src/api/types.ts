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
  stats: { businesses: number; reviews: number; users: number; cities: number; categories: number };
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  data: { slug?: string; businessId?: string } | null;
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
