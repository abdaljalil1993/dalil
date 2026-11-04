import { Business, User, Review } from '../entities';
import { computeIsOpenNow } from '../utils/time';

/** Public-safe user (no email/phone/role internals). */
export const publicUser = (u?: User | null) =>
  u ? { id: u.id, firstName: u.firstName, lastName: u.lastName, fullName: `${u.firstName} ${u.lastName}`.trim(), avatar: u.avatar || null } : null;

/** Full user returned to the user himself / admin. */
export const selfUser = (u: User) => ({
  id: u.id,
  firstName: u.firstName,
  lastName: u.lastName,
  fullName: `${u.firstName} ${u.lastName}`.trim(),
  email: u.email,
  phone: u.phone || null,
  avatar: u.avatar || null,
  bio: u.bio || null,
  cityId: u.cityId || null,
  role: u.role,
  status: u.status,
  isEmailVerified: u.isEmailVerified,
  isPhoneVerified: u.isPhoneVerified,
  lastLoginAt: u.lastLoginAt || null,
  createdAt: u.createdAt,
});

type Extra = { distanceKm?: number | null; isFavorite?: boolean };

/**
 * Business shape returned by every endpoint.
 * `privileged` (owner/admin) adds moderation + analytics fields.
 */
export const serializeBusiness = (b: Business, opts: { privileged?: boolean } & Extra = {}) => {
  const hours = (b.workingHours || []).slice().sort((a, z) => a.dayOfWeek - z.dayOfWeek);
  const images = (b.images || []).slice().sort((a, z) => Number(z.isPrimary) - Number(a.isPrimary) || a.sortOrder - z.sortOrder);
  const base = {
    id: b.id,
    name: b.name,
    nameEn: b.nameEn || null,
    slug: b.slug,
    shortDescription: b.shortDescription || null,
    description: b.description || null,
    address: b.address || null,
    district: b.district || null,
    latitude: b.latitude ?? null,
    longitude: b.longitude ?? null,
    phone: b.phone || null,
    phone2: b.phone2 || null,
    whatsapp: b.whatsapp || null,
    website: b.website || null,
    email: b.email || null,
    socialLinks: b.socialLinks || {},
    coverImage: b.coverImage || images[0]?.url || null,
    logoImage: b.logoImage || null,
    priceRange: b.priceRange ?? null,
    attributes: b.attributes || {},
    amenities: b.amenities || [],
    tags: b.tags ? b.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    averageRating: Number(b.averageRating) || 0,
    reviewCount: b.reviewCount,
    favoriteCount: b.favoriteCount,
    viewCount: b.viewCount,
    isFeatured: b.isFeatured,
    isVerified: b.isVerified,
    isClaimed: Boolean(b.ownerId),
    isOpenNow: computeIsOpenNow(hours),
    bookingEnabled: Boolean(b.bookingEnabled),
    bookingMode: b.bookingMode || 'slot',
    bookingNote: b.bookingNote || null,
    acceptsQuotes: Boolean(b.acceptsQuotes),
    categoryId: b.categoryId,
    subCategoryId: b.subCategoryId,
    cityId: b.cityId,
    category: b.category
      ? { id: b.category.id, name: b.category.name, nameEn: b.category.nameEn, slug: b.category.slug, icon: b.category.icon, color: b.category.color }
      : null,
    subCategory: b.subCategory ? { id: b.subCategory.id, name: b.subCategory.name, nameEn: b.subCategory.nameEn, slug: b.subCategory.slug } : null,
    city: b.city ? { id: b.city.id, name: b.city.name, nameEn: b.city.nameEn, slug: b.city.slug } : null,
    images: images.map((i) => ({ id: i.id, url: i.url, caption: i.caption, isPrimary: i.isPrimary, sortOrder: i.sortOrder })),
    workingHours: hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime ? h.openTime.slice(0, 5) : null,
      closeTime: h.closeTime ? h.closeTime.slice(0, 5) : null,
      isClosed: h.isClosed,
      isOpen24Hours: h.isOpen24Hours,
    })),
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    ...(opts.distanceKm !== undefined && { distanceKm: opts.distanceKm }),
    ...(opts.isFavorite !== undefined && { isFavorite: opts.isFavorite }),
  };
  if (!opts.privileged) return base;
  return {
    ...base,
    status: b.status,
    source: b.source,
    isActive: b.isActive,
    adminNote: b.adminNote || null,
    bookingSettings: { bookingEnabled: Boolean(b.bookingEnabled), bookingMode: b.bookingMode || 'slot', slotMinutes: b.slotMinutes, slotCapacity: b.slotCapacity, bookingDaysAhead: b.bookingDaysAhead, bookingAutoConfirm: Boolean(b.bookingAutoConfirm), bookingNote: b.bookingNote || null, acceptsQuotes: Boolean(b.acceptsQuotes) },
    ownerId: b.ownerId,
    owner: b.owner ? { ...publicUser(b.owner), email: b.owner.email, phone: b.owner.phone || null } : null,
    approvedAt: b.approvedAt,
    stats: {
      views: b.viewCount,
      favorites: b.favoriteCount,
      phoneClicks: b.phoneClicks,
      whatsappClicks: b.whatsappClicks,
      directionClicks: b.directionClicks,
      websiteClicks: b.websiteClicks,
    },
  };
};

export const serializeReview = (r: Review, extra: { likedByMe?: boolean } = {}) => ({
  id: r.id,
  rating: r.rating,
  content: r.content,
  ownerReply: r.ownerReply,
  ownerRepliedAt: r.ownerRepliedAt,
  likesCount: r.likesCount,
  isHidden: r.isHidden,
  businessId: r.businessId,
  user: publicUser(r.user),
  business: r.business ? { id: r.business.id, name: r.business.name, slug: r.business.slug, logoImage: r.business.logoImage || null } : undefined,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  ...(extra.likedByMe !== undefined && { likedByMe: extra.likedByMe }),
});
