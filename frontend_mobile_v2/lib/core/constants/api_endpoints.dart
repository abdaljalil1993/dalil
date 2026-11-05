class ApiEndpoints {
  ApiEndpoints._();

  // ═══════════════════════════════════════════════════════════════════════════
  // Auth
  // ═══════════════════════════════════════════════════════════════════════════
  static const authRegister = '/auth/register';
  static const authLogin = '/auth/login';
  static const authRefresh = '/auth/refresh';
  static const authLogout = '/auth/logout';
  static const authLogoutAll = '/auth/logout-all';
  static const authChangePassword = '/auth/change-password';
  static const authForgotPassword = '/auth/forgot-password';
  static const authResetPassword = '/auth/reset-password';
  static const authMe = '/auth/me';

  // Shortcuts for data sources
  static const login = authLogin;
  static const register = authRegister;
  static const refresh = authRefresh;
  static const logout = authLogout;
  static const logoutAll = authLogoutAll;
  static const me = authMe;
  static const forgotPassword = authForgotPassword;
  static const resetPassword = authResetPassword;

  // OTP
  static const authOtpRequest = '/auth/otp/request';
  static const authOtpVerify = '/auth/otp/verify';
  static const authOtpVerifyPhone = '/auth/otp/verify-phone';
  
  static const otpRequest = authOtpRequest;
  static const otpVerify = authOtpVerify;
  static const otpVerifyPhone = authOtpVerifyPhone;

  // ═══════════════════════════════════════════════════════════════════════════
  // Users
  // ═══════════════════════════════════════════════════════════════════════════
  static const usersMe = '/users/me';
  static const usersMeAvatar = '/users/me/avatar';
  static const users = '/users';
  static String userById(String id) => '/users/$id';
  static String userStatus(String id) => '/users/$id/status';
  static String userRole(String id) => '/users/$id/role';

  // ═══════════════════════════════════════════════════════════════════════════
  // Home
  // ═══════════════════════════════════════════════════════════════════════════
  static const home = '/home';

  // ═══════════════════════════════════════════════════════════════════════════
  // Categories
  // ═══════════════════════════════════════════════════════════════════════════
  static const categories = '/categories';
  static String categoryBySlug(String slug) => '/categories/$slug';
  static String categoryById(String id) => '/categories/$id';
  static const categoriesSub = '/categories/sub';
  static String categorySubById(String id) => '/categories/sub/$id';
  static String categoryImage(String id) => '/categories/$id/image';

  // ═══════════════════════════════════════════════════════════════════════════
  // Cities
  // ═══════════════════════════════════════════════════════════════════════════
  static const cities = '/cities';
  static String cityById(String id) => '/cities/$id';

  // ═══════════════════════════════════════════════════════════════════════════
  // Businesses
  // ═══════════════════════════════════════════════════════════════════════════
  static const businesses = '/businesses';
  static const businessesSearch = '/businesses/search';
  static const businessesSuggest = '/businesses/suggest';
  static const businessesMy = '/businesses/my';
  static const businessesAdminAll = '/businesses/admin/all';
  static String businessBySlug(String slug) => '/businesses/$slug';
  static String businessManage(String id) => '/businesses/manage/$id';
  static String businessById(String id) => '/businesses/$id';
  static String businessRelated(String slug) => '/businesses/$slug/related';
  static String businessTrack(String id) => '/businesses/$id/track';
  static String businessStatus(String id) => '/businesses/$id/status';
  static String businessFlags(String id) => '/businesses/$id/flags';
  static String businessImages(String id) => '/businesses/$id/images';
  static String businessImageDelete(String id, String imageId) =>
      '/businesses/$id/images/$imageId';
  static String businessImagePrimary(String id, String imageId) =>
      '/businesses/$id/images/$imageId/primary';
  static String businessCover(String id) => '/businesses/$id/cover';
  static String businessLogo(String id) => '/businesses/$id/logo';
  static String businessHours(String id) => '/businesses/$id/hours';
  static String businessStats(String id) => '/businesses/$id/stats';

  // Business Items (Menu)
  static String businessItems(String id) => '/businesses/$id/items';
  static String businessItemById(String id, String itemId) =>
      '/businesses/$id/items/$itemId';

  // Business Offers
  static String businessOffers(String id) => '/businesses/$id/offers';
  static String businessOfferById(String id, String offerId) =>
      '/businesses/$id/offers/$offerId';

  // Booking Settings
  static String businessBookingSettings(String id) =>
      '/businesses/$id/booking-settings';
  static String businessAvailability(String id) =>
      '/businesses/$id/availability';
  static String businessAppointments(String id) =>
      '/businesses/$id/appointments';

  // Duties (Pharmacies)
  static String businessDuties(String id) => '/businesses/$id/duties';

  // ═══════════════════════════════════════════════════════════════════════════
  // Reviews
  // ═══════════════════════════════════════════════════════════════════════════
  static String businessReviews(String businessId) =>
      '/businesses/$businessId/reviews';
  static const reviewsMy = '/reviews/my';
  static const reviewsOwner = '/reviews/owner';
  static const reviewsAdminAll = '/reviews/admin/all';
  static String reviewById(String id) => '/reviews/$id';
  static String reviewReply(String id) => '/reviews/$id/reply';
  static String reviewLike(String id) => '/reviews/$id/like';
  static String reviewVisibility(String id) => '/reviews/$id/visibility';

  // ═══════════════════════════════════════════════════════════════════════════
  // Reports & Claims
  // ═══════════════════════════════════════════════════════════════════════════
  static String businessReports(String businessId) =>
      '/businesses/$businessId/reports';
  static String businessClaim(String businessId) =>
      '/businesses/$businessId/claim';
  static const reports = '/reports';
  static String reportStatus(String id) => '/reports/$id/status';
  static const claimsMy = '/claims/my';
  static const claims = '/claims';
  static String claimById(String id) => '/claims/$id';

  // ═══════════════════════════════════════════════════════════════════════════
  // Favorites
  // ═══════════════════════════════════════════════════════════════════════════
  static const favorites = '/favorites';
  static String favoriteToggle(String businessId) => '/favorites/$businessId';
  static String favoriteCheck(String businessId) =>
      '/favorites/$businessId/check';

  // ═══════════════════════════════════════════════════════════════════════════
  // Notifications
  // ═══════════════════════════════════════════════════════════════════════════
  static const notifications = '/notifications';
  static const notificationsUnreadCount = '/notifications/unread-count';
  static const notificationsReadAll = '/notifications/read-all';
  static String notificationRead(String id) => '/notifications/$id/read';
  static String notificationById(String id) => '/notifications/$id';

  // ═══════════════════════════════════════════════════════════════════════════
  // Devices (FCM)
  // ═══════════════════════════════════════════════════════════════════════════
  static const devices = '/devices';
  static String deviceByToken(String token) => '/devices/$token';

  // ═══════════════════════════════════════════════════════════════════════════
  // Advertisements
  // ═══════════════════════════════════════════════════════════════════════════
  static const advertisementsActive = '/advertisements/active';
  static String advertisementClick(String id) => '/advertisements/$id/click';
  static String advertisementImpression(String id) =>
      '/advertisements/$id/impression';
  static const advertisementsMy = '/advertisements/my';
  static const advertisementsRequest = '/advertisements/request';
  static const advertisements = '/advertisements';
  static String advertisementById(String id) => '/advertisements/$id';

  // ═══════════════════════════════════════════════════════════════════════════
  // Featured
  // ═══════════════════════════════════════════════════════════════════════════
  static const featuredActive = '/featured/active';
  static const featuredMy = '/featured/my';
  static const featuredRequest = '/featured/request';
  static const featured = '/featured';
  static String featuredById(String id) => '/featured/$id';

  // ═══════════════════════════════════════════════════════════════════════════
  // Offers
  // ═══════════════════════════════════════════════════════════════════════════
  static const offers = '/offers';

  // ═══════════════════════════════════════════════════════════════════════════
  // Pharmacies
  // ═══════════════════════════════════════════════════════════════════════════
  static const pharmaciesOnDuty = '/pharmacies/on-duty';

  // ═══════════════════════════════════════════════════════════════════════════
  // Emergency
  // ═══════════════════════════════════════════════════════════════════════════
  static const emergency = '/emergency';

  // ═══════════════════════════════════════════════════════════════════════════
  // Listings (Real Estate, Cars, Jobs)
  // ═══════════════════════════════════════════════════════════════════════════
  static const listingsFields = '/listings/fields';
  static const listings = '/listings';
  static const listingsMy = '/listings/my';
  static String listingBySlug(String slug) => '/listings/$slug';
  static String listingById(String id) => '/listings/$id';
  static String listingImages(String id) => '/listings/$id/images';
  static String listingStatus(String id) => '/listings/$id/status';
  static String listingApply(String id) => '/listings/$id/apply';
  static String listingApplications(String id) => '/listings/$id/applications';
  static const listingsApplicationsMy = '/listings/applications/my';

  // ═══════════════════════════════════════════════════════════════════════════
  // Service Requests
  // ═══════════════════════════════════════════════════════════════════════════
  static const serviceRequests = '/service-requests';
  static const serviceRequestsMy = '/service-requests/my';
  static const serviceRequestsInbox = '/service-requests/inbox';
  static String serviceRequestById(String id) => '/service-requests/$id';
  static String serviceRequestStatus(String id) =>
      '/service-requests/$id/status';
  static String serviceRequestQuotes(String id) =>
      '/service-requests/$id/quotes';
  static String serviceRequestQuoteById(String id, String quoteId) =>
      '/service-requests/quotes/$quoteId';

  // ═══════════════════════════════════════════════════════════════════════════
  // Appointments (Bookings)
  // ═══════════════════════════════════════════════════════════════════════════
  static const appointmentsMy = '/appointments/my';
  static const appointmentsOwner = '/appointments/owner';
  static String appointmentById(String id) => '/appointments/$id';
  static String appointmentStatus(String id) => '/appointments/$id/status';

  // ═══════════════════════════════════════════════════════════════════════════
  // Billing & Subscriptions
  // ═══════════════════════════════════════════════════════════════════════════
  static const billingSettingsPublic = '/billing/settings/public';
  static const billingPlans = '/billing/plans';
  static String businessEntitlements(String id) =>
      '/businesses/$id/entitlements';
  static const billingSubscriptionsRequest = '/billing/subscriptions/request';
  static const billingSubscriptionsMy = '/billing/subscriptions/my';

  // ═══════════════════════════════════════════════════════════════════════════
  // Feature Switches
  // ═══════════════════════════════════════════════════════════════════════════
  static const features = '/features';

  // ═══════════════════════════════════════════════════════════════════════════
  // Contact
  // ═══════════════════════════════════════════════════════════════════════════
  static const contact = '/contact';
  static String contactById(String id) => '/contact/$id';
}
