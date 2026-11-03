class ApiEndpoints {
  static const authLogin = '/auth/login';
  static const authRegister = '/auth/register';
  static const authRefresh = '/auth/refresh';
  static const authLogout = '/auth/logout';
  static const authLogoutAll = '/auth/logout-all';
  static const authChangePassword = '/auth/change-password';

  static const usersMe = '/users/me';
  static const users = '/users';
  static String userById(String id) => '/users/$id';
  static String userStatus(String id) => '/users/$id/status';
  static const usersAvatar = '/users/me/avatar';

  static const categories = '/categories';
  static String categoryBySlug(String slug) => '/categories/$slug';
  static String categoryById(String id) => '/categories/$id';
  static const categorySub = '/categories/sub';
  static String categorySubById(String id) => '/categories/sub/$id';

  static const cities = '/cities';
  static String cityById(String id) => '/cities/$id';

  static const businesses = '/businesses';
  static const businessesSearch = '/businesses/search';
  static const businessesPending = '/businesses/pending';
  static const businessesMy = '/businesses/my';
  static String businessBySlug(String slug) => '/businesses/$slug';
  static String businessById(String id) => '/businesses/$id';
  static String businessApprove(String id) => '/businesses/$id/approve';
  static String businessImages(String id) => '/businesses/$id/images';
  static String businessHours(String id) => '/businesses/$id/hours';
  static String businessReviews(String businessId) => '/businesses/$businessId/reviews';
  static String businessReports(String businessId) => '/businesses/$businessId/reports';

  static const reviewsMy = '/reviews/my';
  static String reviewById(String id) => '/reviews/$id';
  static String reviewReply(String id) => '/reviews/$id/reply';
  static String reviewLike(String id) => '/reviews/$id/like';

  static const favorites = '/favorites';
  static String favoriteToggle(String businessId) => '/favorites/$businessId';
  static String favoriteCheck(String businessId) => '/favorites/$businessId/check';

  static const adsActive = '/advertisements/active';
  static const adsAdmin = '/advertisements';
  static String adsById(String id) => '/advertisements/$id';
  static String adsClick(String id) => '/advertisements/$id/click';

  static const featuredActive = '/featured/active';
  static const featuredAdmin = '/featured';
  static String featuredById(String id) => '/featured/$id';

  static const reports = '/reports';
  static String reportStatus(String id) => '/reports/$id/status';

  static const dashboardStats = '/admin/dashboard/stats';

  static const docsUi = '/docs';
  static const docsJson = '/docs.json';
  static const health = '/health';
}
