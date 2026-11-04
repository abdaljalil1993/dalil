/// All API paths, relative to the base URL (`--dart-define=API_URL`).
/// Source of truth: docs/API.md (v2.1 — 183 endpoints).
class ApiEndpoints {
  ApiEndpoints._();

  // ───────────────────────── auth ─────────────────────────
  static const login = '/auth/login';
  static const register = '/auth/register';
  static const refresh = '/auth/refresh';
  static const logout = '/auth/logout';
  static const logoutAll = '/auth/logout-all';
  static const changePassword = '/auth/change-password';
  static const forgotPassword = '/auth/forgot-password';
  static const resetPassword = '/auth/reset-password';
  static const me = '/auth/me';

  // OTP (v2.1)
  static const otpRequest = '/auth/otp/request';
  static const otpVerify = '/auth/otp/verify';
  static const otpVerifyPhone = '/auth/otp/verify-phone';

  // Devices / push (v2.1)
  static const devices = '/devices';
  static String deviceByToken(String token) => '/devices/$token';

  // ───────────────────────── users ─────────────────────────
  static const usersMe = '/users/me';
  static const usersMeAvatar = '/users/me/avatar';

  // ───────────────────────── catalog ─────────────────────────
  static const home = '/home';
  static const categories = '/categories';
  static String categoryBySlug(String slug) => '/categories/$slug';
  static const cities = '/cities';
  static String cityById(String id) => '/cities/$id';

  /// Feature switches (v2.1) — called on launch and on city change.
  static const features = '/features';

  // ───────────────────────── businesses ─────────────────────────
  static const businesses = '/businesses';
  static const businessesSearch = '/businesses/search';
  static const businessesSuggest = '/businesses/suggest';
  static const businessesMy = '/businesses/my';
  static String businessBySlug(String slug) => '/businesses/$slug';
  static String businessById(String id) => '/businesses/$id';
  static String businessRelated(String slug) => '/businesses/$slug/related';
  static String businessManage(String id) => '/businesses/manage/$id';
  static String businessTrack(String id) => '/businesses/$id/track';
  static String businessStats(String id) => '/businesses/$id/stats';
  static String businessHours(String id) => '/businesses/$id/hours';
  static String businessImages(String id) => '/businesses/$id/images';
  static String businessImage(String id, String imageId) => '/businesses/$id/images/$imageId';
  static String businessImagePrimary(String id, String imageId) =>
      '/businesses/$id/images/$imageId/primary';
  static String businessCover(String id) => '/businesses/$id/cover';
  static String businessLogo(String id) => '/businesses/$id/logo';
  static String businessClaim(String id) => '/businesses/$id/claim';
  static String businessReports(String id) => '/businesses/$id/reports';
  static String businessReviews(String id) => '/businesses/$id/reviews';
  static String businessOffers(String id) => '/businesses/$id/offers';
  static String businessItems(String id) => '/businesses/$id/items';
  static String businessItem(String id, String itemId) => '/businesses/$id/items/$itemId';
  static String businessDuties(String id) => '/businesses/$id/duties';
  static String businessBookingSettings(String id) => '/businesses/$id/booking-settings';
  static String businessAvailability(String id) => '/businesses/$id/availability';
  static String businessAppointments(String id) => '/businesses/$id/appointments';
  static String businessEntitlements(String id) => '/businesses/$id/entitlements';

  // ───────────────────────── reviews ─────────────────────────
  static const reviewsMy = '/reviews/my';
  static const reviewsOwner = '/reviews/owner';
  static String reviewById(String id) => '/reviews/$id';
  static String reviewReply(String id) => '/reviews/$id/reply';
  static String reviewLike(String id) => '/reviews/$id/like';

  // ───────────────────────── favorites / notifications ─────────────────────────
  static const favorites = '/favorites';
  static String favoriteToggle(String businessId) => '/favorites/$businessId';
  static String favoriteCheck(String businessId) => '/favorites/$businessId/check';
  static const notifications = '/notifications';
  static const notificationsUnreadCount = '/notifications/unread-count';
  static const notificationsReadAll = '/notifications/read-all';
  static String notificationRead(String id) => '/notifications/$id/read';
  static String notificationById(String id) => '/notifications/$id';

  // ───────────────────────── promotions ─────────────────────────
  static const adsActive = '/advertisements/active';
  static String adClick(int id) => '/advertisements/$id/click';
  static String adImpression(int id) => '/advertisements/$id/impression';
  static const adsMy = '/advertisements/my';
  static const adsRequest = '/advertisements/request';
  static const featuredActive = '/featured/active';
  static const featuredMy = '/featured/my';
  static const featuredRequest = '/featured/request';

  // ───────────────────────── v2.1 services ─────────────────────────
  static const offers = '/offers';
  static const pharmaciesOnDuty = '/pharmacies/on-duty';
  static const emergency = '/emergency';

  // Listings (real estate / cars / jobs)
  static const listingsFields = '/listings/fields';
  static const listings = '/listings';
  static const listingsMy = '/listings/my';
  static const listingsApplicationsMy = '/listings/applications/my';
  static String listingBySlug(String slug) => '/listings/$slug';
  static String listingById(String id) => '/listings/$id';
  static String listingImages(String id) => '/listings/$id/images';
  static String listingImage(String id, int index) => '/listings/$id/images/$index';
  static String listingStatus(String id) => '/listings/$id/status';
  static String listingApply(String id) => '/listings/$id/apply';
  static String listingApplications(String id) => '/listings/$id/applications';
  static String applicationStatus(String id) => '/listings/applications/$id';

  // Service requests & quotes
  static const serviceRequests = '/service-requests';
  static const serviceRequestsMy = '/service-requests/my';
  static const serviceRequestsInbox = '/service-requests/inbox';
  static String serviceRequestById(String id) => '/service-requests/$id';
  static String serviceRequestStatus(String id) => '/service-requests/$id/status';
  static String serviceRequestQuotes(String id) => '/service-requests/$id/quotes';
  static String quoteById(String id) => '/service-requests/quotes/$id';

  // Appointments
  static const appointmentsMy = '/appointments/my';
  static const appointmentsOwner = '/appointments/owner';
  static String appointmentStatus(String id) => '/appointments/$id/status';

  // Billing (v2.1 — currently disabled server-side, flow must exist)
  static const billingPublicSettings = '/billing/settings/public';
  static const billingPlans = '/billing/plans';
  static const billingSubscriptionsMy = '/billing/subscriptions/my';
  static const billingSubscriptionRequest = '/billing/subscriptions/request';

  // ───────────────────────── contact ─────────────────────────
  static const contact = '/contact';

  // ───────────────────────── meta ─────────────────────────
  static const health = '/health';
  static const docs = '/docs';
}
