// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appTitle => 'دليلك';

  @override
  String get tagline => 'كل ما تحتاجه في مدينتك';

  @override
  String get commonLoading => 'جارِ التحميل...';

  @override
  String get commonError => 'حدث خطأ، حاول مجدداً';

  @override
  String get commonRetry => 'إعادة المحاولة';

  @override
  String get commonNoResults => 'لا توجد نتائج';

  @override
  String get commonEmpty => 'لا توجد بيانات بعد';

  @override
  String get commonOffline => 'أنت غير متصل بالإنترنت';

  @override
  String get commonViewAll => 'عرض الكل';

  @override
  String get commonCancel => 'إلغاء';

  @override
  String get commonClose => 'إغلاق';

  @override
  String get commonConfirm => 'تأكيد';

  @override
  String get commonSave => 'حفظ';

  @override
  String get commonApply => 'تطبيق';

  @override
  String get commonClear => 'مسح';

  @override
  String get commonAll => 'الكل';

  @override
  String get commonSearch => 'بحث';

  @override
  String get commonFilters => 'الفلاتر';

  @override
  String get commonSortBy => 'ترتيب حسب';

  @override
  String get commonCity => 'المدينة';

  @override
  String get commonCategory => 'التصنيف';

  @override
  String get commonKm => 'كم';

  @override
  String commonResultsCount(Object n) {
    return '$n نتيجة';
  }

  @override
  String get authLogin => 'تسجيل الدخول';

  @override
  String get authRegister => 'إنشاء حساب';

  @override
  String get authRequiredTitle => 'سجّل دخولك للمتابعة';

  @override
  String get authRequiredText =>
      'البحث والتقييم والمفضلة وإضافة الأنشطة متاحة للمستخدمين المسجلين فقط. التسجيل مجاني ويستغرق أقل من دقيقة.';

  @override
  String get authLoginNow => 'سجّل الدخول';

  @override
  String get authRegisterNow => 'أنشئ حساباً';

  @override
  String get authEmail => 'البريد الإلكتروني';

  @override
  String get authPassword => 'كلمة المرور';

  @override
  String get authFirstName => 'الاسم';

  @override
  String get authLastName => 'الكنية';

  @override
  String get authForgot => 'نسيت كلمة المرور؟';

  @override
  String get authNoAccount => 'ليس لديك حساب؟';

  @override
  String get authHaveAccount => 'لديك حساب بالفعل؟';

  @override
  String get homeTitle => 'الرئيسية';

  @override
  String get homeHeroTitle => 'ابحث عن أي شيء في مدينتك';

  @override
  String get homeSearchPlaceholder =>
      'مثال: طبيب عيون، مطعم شاورما، كهربائي...';

  @override
  String get homeBrowseCategories => 'تصفّح حسب التصنيف';

  @override
  String get homeFeatured => 'أنشطة مميّزة';

  @override
  String get homeTopRated => 'الأعلى تقييماً';

  @override
  String get homeNewest => 'أُضيف حديثاً';

  @override
  String get homeCities => 'استكشف المدن';

  @override
  String get homeOffers => 'عروض';

  @override
  String get homeOnDuty => 'صيدليات مناوبة';

  @override
  String get homeQuickServices => 'خدمات سريعة';

  @override
  String get homeLoadFailed => 'تعذّر تحميل الرئيسية';
}
