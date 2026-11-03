import { get, getPaged, post, put, patch, del, clean } from './client';
import type {
  Advertisement, AuthPayload, Business, BusinessDetails, BusinessFilters, Category, City, Claim, ContactMessage,
  DashboardStats, FeaturedEntry, HomeFeed, Notification, Report, Review, SubCategory, User, WorkingHour,
} from './types';

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };
const form = (files: File[] | File, field: string, extra?: Record<string, unknown>) => {
  const fd = new FormData();
  (Array.isArray(files) ? files : [files]).forEach((f) => fd.append(field, f));
  Object.entries(extra || {}).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && fd.append(k, String(v)));
  return fd;
};

export const authApi = {
  login: (body: { email: string; password: string }) => post<AuthPayload>('/auth/login', body),
  register: (body: { firstName: string; lastName: string; email: string; password: string; phone?: string; cityId?: number }) => post<AuthPayload>('/auth/register', body),
  logout: (refreshToken: string | null) => post('/auth/logout', { refreshToken }),
  logoutAll: () => post('/auth/logout-all'),
  me: () => get<User>('/auth/me'),
  changePassword: (body: { currentPassword: string; newPassword: string }) => post('/auth/change-password', body),
  forgot: (email: string) => post<{ devResetToken?: string }>('/auth/forgot-password', { email }),
  reset: (token: string, newPassword: string) => post('/auth/reset-password', { token, newPassword }),
};

export const userApi = {
  profile: () => get<User>('/users/me'),
  update: (body: Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'bio' | 'cityId'>>) => put<User>('/users/me', body),
  avatar: (file: File) => post<User>('/users/me/avatar', form(file, 'image'), multipart),
  list: (params: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => getPaged<User>('/users', clean(params)),
  setStatus: (id: string, status: string) => patch<User>(`/users/${id}/status`, { status }),
  setRole: (id: string, role: string) => patch<User>(`/users/${id}/role`, { role }),
};

export const catalogApi = {
  home: (cityId?: number | null) => get<HomeFeed>('/home', clean({ cityId })),
  categories: (includeInactive = false) => get<Category[]>('/categories', includeInactive ? { includeInactive: true } : undefined),
  category: (slug: string) => get<Category>(`/categories/${slug}`),
  createCategory: (body: Partial<Category>) => post<Category>('/categories', body),
  updateCategory: (id: number, body: Partial<Category>) => put<Category>(`/categories/${id}`, body),
  deleteCategory: (id: number) => del(`/categories/${id}`),
  categoryImage: (id: number, file: File) => post<Category>(`/categories/${id}/image`, form(file, 'image'), multipart),
  createSub: (body: Partial<SubCategory>) => post<SubCategory>('/categories/sub', body),
  updateSub: (id: number, body: Partial<SubCategory>) => put<SubCategory>(`/categories/sub/${id}`, body),
  deleteSub: (id: number) => del(`/categories/sub/${id}`),
  cities: (includeInactive = false) => get<City[]>('/cities', includeInactive ? { includeInactive: true } : undefined),
  createCity: (body: Partial<City>) => post<City>('/cities', body),
  updateCity: (id: number, body: Partial<City>) => put<City>(`/cities/${id}`, body),
  deleteCity: (id: number) => del(`/cities/${id}`),
};

export type BusinessPayload = Partial<Omit<Business, 'tags' | 'workingHours'>> & { tags?: string[] | string; workingHours?: Partial<WorkingHour>[]; isOwner?: boolean };

export const businessApi = {
  browse: (f: BusinessFilters) => getPaged<Business>('/businesses', clean(f)),
  search: (f: BusinessFilters) => getPaged<Business>('/businesses/search', clean(f)),
  suggest: (q: string, cityId?: number | null) =>
    get<{ businesses: { id: string; name: string; slug: string; city?: string; category?: string; logoImage: string | null }[]; categories: Category[]; subCategories: (SubCategory & { categorySlug?: string })[] }>('/businesses/suggest', clean({ q, cityId })),
  details: (slug: string) => get<BusinessDetails>(`/businesses/${encodeURIComponent(slug)}`),
  related: (slug: string) => get<Business[]>(`/businesses/${encodeURIComponent(slug)}/related`),
  track: (id: string, type: 'phone' | 'whatsapp' | 'directions' | 'website') => post(`/businesses/${id}/track`, { type }).catch(() => undefined),
  mine: (params: { page?: number; limit?: number; status?: string } = {}) => getPaged<Business>('/businesses/my', clean(params)),
  managed: (id: string) => get<Business>(`/businesses/manage/${id}`),
  adminList: (f: BusinessFilters & { ownerId?: string }) => getPaged<Business>('/businesses/admin/all', clean(f)),
  create: (body: BusinessPayload) => post<Business>('/businesses', body),
  update: (id: string, body: BusinessPayload) => put<Business>(`/businesses/${id}`, body),
  remove: (id: string) => del(`/businesses/${id}`),
  stats: (id: string) => get<{ views: number; favorites: number; reviews: number; averageRating: number; reviewsLast30Days: number; ratingBreakdown: Record<string, number>; clicks: Record<string, number> }>(`/businesses/${id}/stats`),
  setStatus: (id: string, status: string, adminNote?: string) => patch<Business>(`/businesses/${id}/status`, { status, adminNote }),
  setFlags: (id: string, body: { isVerified?: boolean; isActive?: boolean; ownerId?: string | null }) => patch<Business>(`/businesses/${id}/flags`, body),
  addImages: (id: string, files: File[]) => post<Business>(`/businesses/${id}/images`, form(files, 'images'), multipart),
  removeImage: (id: string, imageId: number) => del<Business>(`/businesses/${id}/images/${imageId}`),
  primaryImage: (id: string, imageId: number) => patch<Business>(`/businesses/${id}/images/${imageId}/primary`),
  cover: (id: string, file: File) => post<Business>(`/businesses/${id}/cover`, form(file, 'image'), multipart),
  logo: (id: string, file: File) => post<Business>(`/businesses/${id}/logo`, form(file, 'image'), multipart),
  hours: (id: string, hours: Partial<WorkingHour>[]) => put<Business>(`/businesses/${id}/hours`, { hours }),
  claim: (id: string, body: { message: string; phone?: string }) => post(`/businesses/${id}/claim`, body),
  report: (id: string, body: { type: string; description?: string; reviewId?: string }) => post(`/businesses/${id}/reports`, body),
};

export const reviewApi = {
  forBusiness: (businessId: string, params: { page?: number; limit?: number; sort?: string; rating?: number }) => getPaged<Review>(`/businesses/${businessId}/reviews`, clean(params)),
  create: (businessId: string, body: { rating: number; content?: string }) => post<Review>(`/businesses/${businessId}/reviews`, body),
  update: (id: string, body: { rating?: number; content?: string }) => put<Review>(`/reviews/${id}`, body),
  remove: (id: string) => del(`/reviews/${id}`),
  like: (id: string) => post<{ liked: boolean; likesCount: number }>(`/reviews/${id}/like`),
  reply: (id: string, reply: string) => post<Review>(`/reviews/${id}/reply`, { reply }),
  removeReply: (id: string) => del<Review>(`/reviews/${id}/reply`),
  mine: (params: { page?: number; limit?: number }) => getPaged<Review>('/reviews/my', clean(params)),
  owner: (params: { page?: number; limit?: number; businessId?: string; unanswered?: boolean }) => getPaged<Review>('/reviews/owner', clean(params)),
  admin: (params: { page?: number; limit?: number; hidden?: boolean; rating?: number }) => getPaged<Review>('/reviews/admin/all', params.hidden === undefined ? clean(params) : { ...clean(params), hidden: params.hidden }),
  visibility: (id: string, isHidden: boolean) => patch<Review>(`/reviews/${id}/visibility`, { isHidden }),
};

export const favoriteApi = {
  list: (params: { page?: number; limit?: number }) => getPaged<{ id: number; createdAt: string; business: Business }>('/favorites', clean(params)),
  toggle: (businessId: string) => post<{ isFavorite: boolean }>(`/favorites/${businessId}`),
};

export const notificationApi = {
  list: (params: { page?: number; limit?: number; unread?: boolean }) => getPaged<Notification>('/notifications', clean(params)),
  unread: () => get<{ count: number }>('/notifications/unread-count'),
  read: (id: number) => patch(`/notifications/${id}/read`),
  readAll: () => patch('/notifications/read-all'),
  remove: (id: number) => del(`/notifications/${id}`),
};

export const promoApi = {
  activeAds: (params: { placement?: string; cityId?: number | null; categoryId?: number }) => get<Advertisement[]>('/advertisements/active', clean(params)),
  adClick: (id: number) => post(`/advertisements/${id}/click`).catch(() => undefined),
  adImpression: (id: number) => post(`/advertisements/${id}/impression`).catch(() => undefined),
  myAds: () => get<Advertisement[]>('/advertisements/my'),
  requestAd: (body: Record<string, unknown>, file?: File | null) => post<Advertisement>('/advertisements/request', file ? form(file, 'image', body) : body, file ? multipart : undefined),
  adminAds: (params: { page?: number; limit?: number; status?: string; placement?: string }) => getPaged<Advertisement>('/advertisements', clean(params)),
  createAd: (body: Record<string, unknown>, file?: File | null) => post<Advertisement>('/advertisements', file ? form(file, 'image', body) : body, file ? multipart : undefined),
  updateAd: (id: number, body: Record<string, unknown>, file?: File | null) => put<Advertisement>(`/advertisements/${id}`, file ? form(file, 'image', body) : body, file ? multipart : undefined),
  deleteAd: (id: number) => del(`/advertisements/${id}`),
  activeFeatured: (params: { cityId?: number | null; categoryId?: number }) => get<Business[]>('/featured/active', clean(params)),
  myFeatured: () => get<FeaturedEntry[]>('/featured/my'),
  requestFeatured: (body: { businessId: string; startDate: string; endDate: string; note?: string }) => post<FeaturedEntry>('/featured/request', body),
  adminFeatured: (params: { page?: number; limit?: number; status?: string }) => getPaged<FeaturedEntry>('/featured', clean(params)),
  addFeatured: (body: Record<string, unknown>) => post<FeaturedEntry>('/featured', body),
  updateFeatured: (id: number, body: Record<string, unknown>) => put<FeaturedEntry>(`/featured/${id}`, body),
  removeFeatured: (id: number) => del(`/featured/${id}`),
};

export const moderationApi = {
  reports: (params: { page?: number; limit?: number; status?: string }) => getPaged<Report>('/reports', clean(params)),
  updateReport: (id: number, status: string, adminNote?: string) => patch(`/reports/${id}/status`, { status, adminNote }),
  claims: (params: { page?: number; limit?: number; status?: string }) => getPaged<Claim>('/claims', clean(params)),
  myClaims: () => get<Claim[]>('/claims/my'),
  decideClaim: (id: number, status: 'approved' | 'rejected', adminNote?: string) => patch(`/claims/${id}`, { status, adminNote }),
  contact: (body: { name: string; email?: string; phone?: string; subject?: string; message: string }) => post('/contact', body),
  messages: (params: { page?: number; limit?: number; unread?: boolean }) => getPaged<ContactMessage>('/contact', clean(params)),
  markMessage: (id: number, isRead: boolean) => patch(`/contact/${id}`, { isRead }),
  deleteMessage: (id: number) => del(`/contact/${id}`),
};

export const adminApi = {
  stats: () => get<DashboardStats>('/admin/dashboard/stats'),
  searches: (days = 30) => get<{ days: number; topSearches: { query: string; count: number; avgResults: number }[]; zeroResultSearches: { query: string; count: number }[]; daily: { day: string; count: number }[] }>('/admin/dashboard/searches', { days }),
  auditLogs: (params: { page?: number; limit?: number; action?: string }) => getPaged<{ id: number; userId: string; action: string; entityType: string; entityId: string; createdAt: string; ipAddress: string }>('/admin/audit-logs', clean(params)),
};
