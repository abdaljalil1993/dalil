import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[Locale('ar')];

  /// No description provided for @appTitle.
  ///
  /// In ar, this message translates to:
  /// **'دليلك'**
  String get appTitle;

  /// No description provided for @tagline.
  ///
  /// In ar, this message translates to:
  /// **'كل ما تحتاجه في مدينتك'**
  String get tagline;

  /// No description provided for @commonLoading.
  ///
  /// In ar, this message translates to:
  /// **'جارِ التحميل...'**
  String get commonLoading;

  /// No description provided for @commonError.
  ///
  /// In ar, this message translates to:
  /// **'حدث خطأ، حاول مجدداً'**
  String get commonError;

  /// No description provided for @commonRetry.
  ///
  /// In ar, this message translates to:
  /// **'إعادة المحاولة'**
  String get commonRetry;

  /// No description provided for @commonNoResults.
  ///
  /// In ar, this message translates to:
  /// **'لا توجد نتائج'**
  String get commonNoResults;

  /// No description provided for @commonEmpty.
  ///
  /// In ar, this message translates to:
  /// **'لا توجد بيانات بعد'**
  String get commonEmpty;

  /// No description provided for @commonOffline.
  ///
  /// In ar, this message translates to:
  /// **'أنت غير متصل بالإنترنت'**
  String get commonOffline;

  /// No description provided for @commonViewAll.
  ///
  /// In ar, this message translates to:
  /// **'عرض الكل'**
  String get commonViewAll;

  /// No description provided for @commonCancel.
  ///
  /// In ar, this message translates to:
  /// **'إلغاء'**
  String get commonCancel;

  /// No description provided for @commonClose.
  ///
  /// In ar, this message translates to:
  /// **'إغلاق'**
  String get commonClose;

  /// No description provided for @commonConfirm.
  ///
  /// In ar, this message translates to:
  /// **'تأكيد'**
  String get commonConfirm;

  /// No description provided for @commonSave.
  ///
  /// In ar, this message translates to:
  /// **'حفظ'**
  String get commonSave;

  /// No description provided for @commonApply.
  ///
  /// In ar, this message translates to:
  /// **'تطبيق'**
  String get commonApply;

  /// No description provided for @commonClear.
  ///
  /// In ar, this message translates to:
  /// **'مسح'**
  String get commonClear;

  /// No description provided for @commonAll.
  ///
  /// In ar, this message translates to:
  /// **'الكل'**
  String get commonAll;

  /// No description provided for @commonSearch.
  ///
  /// In ar, this message translates to:
  /// **'بحث'**
  String get commonSearch;

  /// No description provided for @commonFilters.
  ///
  /// In ar, this message translates to:
  /// **'الفلاتر'**
  String get commonFilters;

  /// No description provided for @commonSortBy.
  ///
  /// In ar, this message translates to:
  /// **'ترتيب حسب'**
  String get commonSortBy;

  /// No description provided for @commonCity.
  ///
  /// In ar, this message translates to:
  /// **'المدينة'**
  String get commonCity;

  /// No description provided for @commonCategory.
  ///
  /// In ar, this message translates to:
  /// **'التصنيف'**
  String get commonCategory;

  /// No description provided for @commonKm.
  ///
  /// In ar, this message translates to:
  /// **'كم'**
  String get commonKm;

  /// No description provided for @commonResultsCount.
  ///
  /// In ar, this message translates to:
  /// **'{n} نتيجة'**
  String commonResultsCount(Object n);

  /// No description provided for @authLogin.
  ///
  /// In ar, this message translates to:
  /// **'تسجيل الدخول'**
  String get authLogin;

  /// No description provided for @authRegister.
  ///
  /// In ar, this message translates to:
  /// **'إنشاء حساب'**
  String get authRegister;

  /// No description provided for @authRequiredTitle.
  ///
  /// In ar, this message translates to:
  /// **'سجّل دخولك للمتابعة'**
  String get authRequiredTitle;

  /// No description provided for @authRequiredText.
  ///
  /// In ar, this message translates to:
  /// **'البحث والتقييم والمفضلة وإضافة الأنشطة متاحة للمستخدمين المسجلين فقط. التسجيل مجاني ويستغرق أقل من دقيقة.'**
  String get authRequiredText;

  /// No description provided for @authLoginNow.
  ///
  /// In ar, this message translates to:
  /// **'سجّل الدخول'**
  String get authLoginNow;

  /// No description provided for @authRegisterNow.
  ///
  /// In ar, this message translates to:
  /// **'أنشئ حساباً'**
  String get authRegisterNow;

  /// No description provided for @authEmail.
  ///
  /// In ar, this message translates to:
  /// **'البريد الإلكتروني'**
  String get authEmail;

  /// No description provided for @authPassword.
  ///
  /// In ar, this message translates to:
  /// **'كلمة المرور'**
  String get authPassword;

  /// No description provided for @authFirstName.
  ///
  /// In ar, this message translates to:
  /// **'الاسم'**
  String get authFirstName;

  /// No description provided for @authLastName.
  ///
  /// In ar, this message translates to:
  /// **'الكنية'**
  String get authLastName;

  /// No description provided for @authForgot.
  ///
  /// In ar, this message translates to:
  /// **'نسيت كلمة المرور؟'**
  String get authForgot;

  /// No description provided for @authNoAccount.
  ///
  /// In ar, this message translates to:
  /// **'ليس لديك حساب؟'**
  String get authNoAccount;

  /// No description provided for @authHaveAccount.
  ///
  /// In ar, this message translates to:
  /// **'لديك حساب بالفعل؟'**
  String get authHaveAccount;

  /// No description provided for @homeTitle.
  ///
  /// In ar, this message translates to:
  /// **'الرئيسية'**
  String get homeTitle;

  /// No description provided for @homeHeroTitle.
  ///
  /// In ar, this message translates to:
  /// **'ابحث عن أي شيء في مدينتك'**
  String get homeHeroTitle;

  /// No description provided for @homeSearchPlaceholder.
  ///
  /// In ar, this message translates to:
  /// **'مثال: طبيب عيون، مطعم شاورما، كهربائي...'**
  String get homeSearchPlaceholder;

  /// No description provided for @homeBrowseCategories.
  ///
  /// In ar, this message translates to:
  /// **'تصفّح حسب التصنيف'**
  String get homeBrowseCategories;

  /// No description provided for @homeFeatured.
  ///
  /// In ar, this message translates to:
  /// **'أنشطة مميّزة'**
  String get homeFeatured;

  /// No description provided for @homeTopRated.
  ///
  /// In ar, this message translates to:
  /// **'الأعلى تقييماً'**
  String get homeTopRated;

  /// No description provided for @homeNewest.
  ///
  /// In ar, this message translates to:
  /// **'أُضيف حديثاً'**
  String get homeNewest;

  /// No description provided for @homeCities.
  ///
  /// In ar, this message translates to:
  /// **'استكشف المدن'**
  String get homeCities;

  /// No description provided for @homeOffers.
  ///
  /// In ar, this message translates to:
  /// **'عروض'**
  String get homeOffers;

  /// No description provided for @homeOnDuty.
  ///
  /// In ar, this message translates to:
  /// **'صيدليات مناوبة'**
  String get homeOnDuty;

  /// No description provided for @homeQuickServices.
  ///
  /// In ar, this message translates to:
  /// **'خدمات سريعة'**
  String get homeQuickServices;

  /// No description provided for @homeLoadFailed.
  ///
  /// In ar, this message translates to:
  /// **'تعذّر تحميل الرئيسية'**
  String get homeLoadFailed;

  /// No description provided for @categories.
  ///
  /// In ar, this message translates to:
  /// **'التصنيفات'**
  String get categories;

  /// No description provided for @noCategoriesFound.
  ///
  /// In ar, this message translates to:
  /// **'لا توجد تصنيفات'**
  String get noCategoriesFound;

  /// No description provided for @noBusinessesFound.
  ///
  /// In ar, this message translates to:
  /// **'لا توجد أنشطة تجارية'**
  String get noBusinessesFound;

  /// No description provided for @retry.
  ///
  /// In ar, this message translates to:
  /// **'إعادة المحاولة'**
  String get retry;

  /// No description provided for @all.
  ///
  /// In ar, this message translates to:
  /// **'الكل'**
  String get all;

  /// No description provided for @openNow.
  ///
  /// In ar, this message translates to:
  /// **'مفتوح الآن'**
  String get openNow;

  /// No description provided for @results.
  ///
  /// In ar, this message translates to:
  /// **'نتيجة'**
  String get results;

  /// No description provided for @recommended.
  ///
  /// In ar, this message translates to:
  /// **'مقترح'**
  String get recommended;

  /// No description provided for @highestRated.
  ///
  /// In ar, this message translates to:
  /// **'الأعلى تقييماً'**
  String get highestRated;

  /// No description provided for @newest.
  ///
  /// In ar, this message translates to:
  /// **'الأحدث'**
  String get newest;

  /// No description provided for @name.
  ///
  /// In ar, this message translates to:
  /// **'الاسم'**
  String get name;

  /// No description provided for @sortBy.
  ///
  /// In ar, this message translates to:
  /// **'ترتيب حسب'**
  String get sortBy;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
