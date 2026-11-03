import 'dart:io';

import 'package:dio/dio.dart';

import '../config/app_config.dart';
import 'api_client.dart';
import 'api_endpoints.dart';

class FullApiService {
  FullApiService(this._client);

  final ApiClient _client;

  Dio get _dio => _client.dio;

  Future<Response<dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
  }) {
    return _dio.post(ApiEndpoints.authRegister, data: {
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'password': password,
    });
  }

  Future<Response<dynamic>> login({required String email, required String password}) {
    return _dio.post(ApiEndpoints.authLogin, data: {'email': email, 'password': password});
  }

  Future<Response<dynamic>> refresh(String refreshToken) {
    return _dio.post(ApiEndpoints.authRefresh, data: {'refreshToken': refreshToken});
  }

  Future<Response<dynamic>> logout({String? refreshToken}) {
    return _dio.post(ApiEndpoints.authLogout, data: refreshToken == null ? {} : {'refreshToken': refreshToken});
  }

  Future<Response<dynamic>> logoutAll() => _dio.post(ApiEndpoints.authLogoutAll);

  Future<Response<dynamic>> changePassword({required String currentPassword, required String newPassword}) {
    return _dio.post(ApiEndpoints.authChangePassword, data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  Future<Response<dynamic>> me() => _dio.get(ApiEndpoints.usersMe);
  Future<Response<dynamic>> updateMe(Map<String, dynamic> payload) => _dio.put(ApiEndpoints.usersMe, data: payload);

  Future<Response<dynamic>> uploadAvatar(File file) async {
    final form = FormData.fromMap({'file': await MultipartFile.fromFile(file.path)});
    return _dio.post(ApiEndpoints.usersAvatar, data: form);
  }

  Future<Response<dynamic>> usersList() => _dio.get(ApiEndpoints.users);
  Future<Response<dynamic>> userDetails(String id) => _dio.get(ApiEndpoints.userById(id));
  Future<Response<dynamic>> userStatus(String id, String status) => _dio.patch(ApiEndpoints.userStatus(id), data: {'status': status});

  Future<Response<dynamic>> categoriesList() => _dio.get(ApiEndpoints.categories);
  Future<Response<dynamic>> categoryDetails(String slug) => _dio.get(ApiEndpoints.categoryBySlug(slug));
  Future<Response<dynamic>> categoryCreate(Map<String, dynamic> payload) => _dio.post(ApiEndpoints.categories, data: payload);
  Future<Response<dynamic>> categoryUpdate(String id, Map<String, dynamic> payload) => _dio.put(ApiEndpoints.categoryById(id), data: payload);
  Future<Response<dynamic>> categoryDelete(String id) => _dio.delete(ApiEndpoints.categoryById(id));

  Future<Response<dynamic>> subCategoryCreate(Map<String, dynamic> payload) => _dio.post(ApiEndpoints.categorySub, data: payload);
  Future<Response<dynamic>> subCategoryUpdate(String id, Map<String, dynamic> payload) => _dio.put(ApiEndpoints.categorySubById(id), data: payload);
  Future<Response<dynamic>> subCategoryDelete(String id) => _dio.delete(ApiEndpoints.categorySubById(id));

  Future<Response<dynamic>> citiesList() => _dio.get(ApiEndpoints.cities);
  Future<Response<dynamic>> cityDetails(String id) => _dio.get(ApiEndpoints.cityById(id));
  Future<Response<dynamic>> cityCreate(Map<String, dynamic> payload) => _dio.post(ApiEndpoints.cities, data: payload);
  Future<Response<dynamic>> cityUpdate(String id, Map<String, dynamic> payload) => _dio.put(ApiEndpoints.cityById(id), data: payload);
  Future<Response<dynamic>> cityDelete(String id) => _dio.delete(ApiEndpoints.cityById(id));

  Future<Response<dynamic>> businessesList({Map<String, dynamic>? params}) => _dio.get(ApiEndpoints.businesses, queryParameters: params);
  Future<Response<dynamic>> businessesSearch({required String query, int page = 1, int limit = 10}) => _dio.get(ApiEndpoints.businessesSearch, queryParameters: {'query': query, 'page': page, 'limit': limit});
  Future<Response<dynamic>> businessesPending() => _dio.get(ApiEndpoints.businessesPending);
  Future<Response<dynamic>> businessesMy() => _dio.get(ApiEndpoints.businessesMy);
  Future<Response<dynamic>> businessDetails(String slug) => _dio.get(ApiEndpoints.businessBySlug(slug));
  Future<Response<dynamic>> businessCreate(Map<String, dynamic> payload) => _dio.post(ApiEndpoints.businesses, data: payload);
  Future<Response<dynamic>> businessUpdate(String id, Map<String, dynamic> payload) => _dio.put(ApiEndpoints.businessById(id), data: payload);
  Future<Response<dynamic>> businessApprove(String id) => _dio.patch(ApiEndpoints.businessApprove(id));

  Future<Response<dynamic>> businessUploadImages(String id, List<File> files) async {
    final parts = <MultipartFile>[];
    for (final file in files) {
      parts.add(await MultipartFile.fromFile(file.path));
    }
    return _dio.post(
      ApiEndpoints.businessImages(id),
      data: FormData.fromMap({'file': parts}),
    );
  }

  Future<Response<dynamic>> businessSetHours(String id, List<Map<String, String>> hours) {
    return _dio.post(ApiEndpoints.businessHours(id), data: {'hours': hours});
  }

  Future<Response<dynamic>> businessReviews(String businessId) => _dio.get(ApiEndpoints.businessReviews(businessId));
  Future<Response<dynamic>> businessCreateReview(String businessId, {required int rating, required String comment}) {
    return _dio.post(ApiEndpoints.businessReviews(businessId), data: {'rating': rating, 'comment': comment});
  }

  Future<Response<dynamic>> businessReport(String businessId, {required String reason, String? details}) {
    return _dio.post(ApiEndpoints.businessReports(businessId), data: {'reason': reason, 'details': details});
  }

  Future<Response<dynamic>> myReviews() => _dio.get(ApiEndpoints.reviewsMy);
  Future<Response<dynamic>> reviewUpdate(String id, {required int rating, required String comment}) {
    return _dio.put(ApiEndpoints.reviewById(id), data: {'rating': rating, 'comment': comment});
  }

  Future<Response<dynamic>> reviewDelete(String id) => _dio.delete(ApiEndpoints.reviewById(id));
  Future<Response<dynamic>> reviewReply(String id, String reply) => _dio.post(ApiEndpoints.reviewReply(id), data: {'reply': reply});
  Future<Response<dynamic>> reviewLike(String id) => _dio.post(ApiEndpoints.reviewLike(id));

  Future<Response<dynamic>> favoritesList() => _dio.get(ApiEndpoints.favorites);
  Future<Response<dynamic>> favoriteToggle(String businessId) => _dio.post(ApiEndpoints.favoriteToggle(businessId));
  Future<Response<dynamic>> favoriteCheck(String businessId) => _dio.get(ApiEndpoints.favoriteCheck(businessId));

  Future<Response<dynamic>> adsActive() => _dio.get(ApiEndpoints.adsActive);
  Future<Response<dynamic>> adClick(String id, {String? userId}) => _dio.post(ApiEndpoints.adsClick(id), data: userId == null ? {} : {'userId': userId});
  Future<Response<dynamic>> adsAdminList() => _dio.get(ApiEndpoints.adsAdmin);
  Future<Response<dynamic>> adCreate(Map<String, dynamic> payload) => _dio.post(ApiEndpoints.adsAdmin, data: payload);
  Future<Response<dynamic>> adUpdate(String id, Map<String, dynamic> payload) => _dio.put(ApiEndpoints.adsById(id), data: payload);
  Future<Response<dynamic>> adDelete(String id) => _dio.delete(ApiEndpoints.adsById(id));

  Future<Response<dynamic>> featuredActive() => _dio.get(ApiEndpoints.featuredActive);
  Future<Response<dynamic>> featuredList() => _dio.get(ApiEndpoints.featuredAdmin);
  Future<Response<dynamic>> featuredCreate(String businessId) => _dio.post(ApiEndpoints.featuredAdmin, data: {'businessId': businessId});
  Future<Response<dynamic>> featuredDelete(String id) => _dio.delete(ApiEndpoints.featuredById(id));

  Future<Response<dynamic>> reportsList() => _dio.get(ApiEndpoints.reports);
  Future<Response<dynamic>> reportUpdateStatus(String id, String status) => _dio.patch(ApiEndpoints.reportStatus(id), data: {'status': status});

  Future<Response<dynamic>> dashboardStats() => _dio.get(ApiEndpoints.dashboardStats);

  Future<Response<dynamic>> docsUi() => _dio.get(ApiEndpoints.docsUi);
  Future<Response<dynamic>> docsJson() => _dio.get(ApiEndpoints.docsJson);

  Future<Response<dynamic>> health() {
    final healthDio = Dio(BaseOptions(baseUrl: AppConfig.healthBaseUrl));
    return healthDio.get(ApiEndpoints.health);
  }
}
