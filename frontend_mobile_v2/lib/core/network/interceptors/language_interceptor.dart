import 'package:dio/dio.dart';

/// Sends `Accept-Language: ar|en` on every request so the API returns
/// `nameEn` when the locale is English (rule #11 of the handoff doc).
class LanguageInterceptor extends Interceptor {
  LanguageInterceptor(this._locale);

  String _locale;

  /// Called by the locale provider whenever the user switches language.
  void setLocale(String locale) => _locale = locale;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    options.headers['Accept-Language'] = _locale;
    handler.next(options);
  }
}
