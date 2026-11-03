# تسليم مطوّر الموبايل (Flutter) — دليلك v2.1

الباك إند جاهز ومُختبر. كل الـ endpoints موثّقة بـ `docs/API.md` و Swagger على `/api/v1/docs` (OpenAPI JSON: `/api/v1/docs.json` — ممكن توليد موديلات Dart منه).
التطبيق لازم يطابق الويب بالسلوك والتصميم (ألوان: Primary `#5B3DF5`، Secondary `#FF6A3D`، تدرّج `#5B3DF5 → #8B5CF6 → #EC4899`، خط IBM Plex Sans Arabic، عربي RTL افتراضي).

## قواعد مهمة
1. **الضيف** يشوف: `/home`، `/categories`، `/businesses` (تصفح بالفلاتر بدون نص)، `/businesses/{slug}`، التقييمات، `/featured/active`، `/advertisements/active`.
   أي بحث نصي/تقييم/مفضلة/إبلاغ/إضافة نشاط ← اعرض BottomSheet "سجّل دخولك" ثم ارجع لنفس الإجراء.
2. **التوكنات**: access 15 دقيقة. عند 401 نادِ `POST /auth/refresh` **مرة وحدة** (قفل/queue للطلبات المتزامنة) وخزّن الـ refreshToken **الجديد** دائماً (rotation). خزّنهم بـ `flutter_secure_storage`.
3. الاستجابة دائماً `{ success, message, data, meta? }` — القوائم فيها `meta.hasNext` للـ infinite scroll.
4. رسائل الخطأ: اعرض `message`، وأخطاء الحقول من `errors[].field / message`.
5. `isOpenNow` يجي محسوب من السيرفر (توقيت سوريا) — لا تحسبه بالموبايل.
6. `dayOfWeek`: 0=الأحد … 6=السبت. اعرض الأسبوع من السبت.
7. عند الضغط على اتصال/واتساب/اتجاهات/موقع ← `POST /businesses/{id}/track {type}` (إحصائيات صاحب النشاط).
8. الإعلانات: عند ظهور الإعلان `POST /advertisements/{id}/impression`، عند الضغط `/click`. `targetUrl` إذا بلّش بـ `/b/` أو `/c/` افتحه داخل التطبيق (deep link).
9. رفع الصور `multipart/form-data`: حقل `image` (مفرد) أو `images` (متعدد ≤10)، ≤5MB، jpg/png/webp. اضغط الصورة قبل الرفع.
10. واتساب: حوّل `09xxxxxxxx` إلى `9639xxxxxxxx` ← `https://wa.me/...`. الاتجاهات: `https://www.google.com/maps/dir/?api=1&destination=lat,lng`.
11. `Accept-Language: ar|en` بالهيدر، والأسماء: استخدم `nameEn` إذا اللغة إنجليزي وموجود وإلا `name`.
12. **الباقات (402)**: إذا رجع الخطأ `status 402` مع `code: PLAN_LIMIT` أو `PLAN_FEATURE` ← اعرض BottomSheet «هذه الميزة تحتاج ترقية باقتك» وزر يفتح شاشة الباقات. حالياً الاشتراكات مطفية فما رح يطلع، بس لازم يكون جاهز.
13. **OTP**: `POST /auth/otp/request {phone}` ← `isNewUser` (إذا true اطلب الاسم الأول والأخير) ← `POST /auth/otp/verify {phone, code, firstName?, lastName?}` يرجع نفس رد الدخول. بوضع التطوير بيرجع `devCode`.
14. **Push**: بعد الدخول سجّل توكن FCM: `POST /devices {token, platform: android|ios}` وعند الخروج `DELETE /devices/{token}`. الإشعار فيه `data.type` (نوع الإشعار) مع المعرّفات (مثل `businessId`, `requestId`, `appointmentId`) ← افتح الشاشة المناسبة حسب النوع.
15. **الإعلانات المبوّبة** (عقارات/سيارات/وظائف): الحقول الخاصة بكل نوع من `GET /listings/fields` (لا تكتبها يدوياً) — الفلاتر `attr[key]=` و `attrMin[key]=` و `attrMax[key]=`. البحث النصي `q` للمسجّلين فقط.
16. التواريخ `YYYY-MM-DD` والأوقات `HH:MM` بتوقيت سوريا. المبالغ أرقام بالليرة السورية `SYP`.

## الشاشات ← الـ API
| الشاشة | Endpoints |
|---|---|
| Splash / Onboarding / اختيار المدينة | `GET /cities` |
| الرئيسية | `GET /home?cityId=` (طلب واحد: تصنيفات، مدن، سلايدر، بانرات، مميّزين، الأعلى تقييماً، الأحدث، إحصائيات) |
| التصنيفات ← تصنيف | `GET /categories` · `GET /categories/{slug}` · `GET /businesses?categoryId=&subCategoryId=&cityId=&sort=&openNow=` · `GET /advertisements/active?placement=category_page` |
| البحث (مسجّل) | `GET /businesses/suggest?q=` · `GET /businesses/search?q=&...&lat=&lng=&radius=&sort=distance` |
| خريطة النتائج | نفس البحث (كل نشاط فيه latitude/longitude) |
| تفاصيل النشاط | `GET /businesses/{slug}` (فيه ratingBreakdown و viewer.isFavorite و viewer.myReview) · `GET /businesses/{id}/reviews?sort=` · `GET /businesses/{slug}/related` |
| تقييم | `POST /businesses/{id}/reviews` · `PUT /reviews/{id}` · `POST /reviews/{id}/like` |
| إبلاغ / طلب ملكية | `POST /businesses/{id}/reports` · `POST /businesses/{id}/claim` |
| المفضلة | `GET /favorites` · `POST /favorites/{businessId}` (toggle) |
| الإشعارات | `GET /notifications` · `GET /notifications/unread-count` · `PATCH /notifications/read-all` |
| الحساب | `GET/PUT /users/me` · `POST /users/me/avatar` · `POST /auth/change-password` · `POST /auth/logout` |
| الدخول/التسجيل/نسيت كلمة السر | `/auth/login` · `/auth/register` · `/auth/forgot-password` · `/auth/reset-password` |
| نشاطاتي (أي مستخدم) | `GET /businesses/my` · `POST /businesses` · `GET /businesses/manage/{id}` · `PUT /businesses/{id}` · `PUT /businesses/{id}/hours` · `POST /businesses/{id}/images|cover|logo` · `GET /businesses/{id}/stats` |
| تقييمات نشاطاتي | `GET /reviews/owner?unanswered=true` · `POST /reviews/{id}/reply` |
| الترويج | `POST /featured/request` · `POST /advertisements/request` · `GET /featured/my` · `GET /advertisements/my` |
| تواصل معنا | `POST /contact` |
| **— v2.1 —** | |
| الدخول برقم الموبايل | `POST /auth/otp/request` · `POST /auth/otp/verify` · `POST /auth/otp/verify-phone` · `POST /devices` |
| الرئيسية (إضافات) | `GET /home` صار فيه `offers[]` و `onDutyPharmacies` (عدد) ← صف "خدمات سريعة": عروض، صيدليات مناوبة، طوارئ، اطلب خدمة، عقارات، سيارات، وظائف، تنظيف، مناسبات |
| العروض | `GET /offers?cityId=&categoryId=` · `GET /businesses/{id}/offers` |
| الصيدليات المناوبة | `GET /pharmacies/on-duty?cityId=&date=` |
| أرقام الطوارئ | `GET /emergency?cityId=` |
| المنيو / المنتجات | `GET /businesses/{id}/items` (مقسّم `sections[]`) |
| الحجز | `GET /businesses/{id}/availability?date=` ← `POST /businesses/{id}/appointments {date, time?, itemId?, partySize, phone?, note?}` · حجوزاتي `GET /appointments/my` · إلغاء `PATCH /appointments/{id}/status {status:"cancelled"}` |
| اطلب خدمة | `POST /service-requests` (multipart مع `images[]` اختياري) · `GET /service-requests/my` · `GET /service-requests/{id}` (فيه `quotes[]`) · قبول/رفض `PATCH /service-requests/quotes/{id}` · إغلاق `PATCH /service-requests/{id}/status` |
| عقارات / سيارات / وظائف | `GET /listings/fields` · `GET /listings?type=real_estate|car|job&purpose=&cityId=&minPrice=&maxPrice=&attr[..]=` · `GET /listings/{slug}` · نشر `POST /listings` + `POST /listings/{id}/images` · إعلاناتي `GET /listings/my` · `PATCH /listings/{id}/status` · تقديم `POST /listings/{id}/apply` · طلباتي `GET /listings/applications/my` · المتقدمون `GET /listings/{id}/applications` |
| صاحب النشاط (إضافات) | منيو `POST/PUT/DELETE /businesses/{id}/items[/{itemId}]` · عروض `POST/PUT/DELETE /businesses/{id}/offers[/{offerId}]` · إعدادات الحجز `PUT /businesses/{id}/booking-settings` (القيم الحالية بـ `GET /businesses/manage/{id}` ← `bookingSettings`) · حجوزات `GET /appointments/owner` + `PATCH /appointments/{id}/status` · مناوبات `GET/PUT /businesses/{id}/duties` · طلبات العملاء `GET /service-requests/inbox` + `POST /service-requests/{id}/quotes` |
| الباقات | `GET /billing/settings/public` (`billingEnabled`, تعليمات الدفع) · `GET /billing/plans` · `GET /businesses/{id}/entitlements` (الباقة + الاستخدام) · `POST /billing/subscriptions/request` · `GET /billing/subscriptions/my` |

> لوحة الإدارة تبقى على الويب فقط.

---

## البرومبت الجاهز لإنشاء تطبيق Flutter

```text
You are a senior Flutter architect. Build a production-ready Flutter app (Android + iOS) named "Dalilak / دليلك":
a local business directory (doctors, restaurants, hotels, lawyers, entertainment, maintenance workers, movers, groceries…).
The backend already exists — consume it exactly as documented in docs/API.md (base URL from --dart-define API_URL,
e.g. http://10.0.2.2:5003/api/v1). Do not invent endpoints or fields.

Stack: Flutter 3.24+, Dart 3, Riverpod 2 (riverpod_generator), go_router (deep links /b/:slug, /c/:slug), dio
(+ interceptor: Bearer token, Accept-Language, single-flight refresh on 401 with token rotation), freezed + json_serializable
models, flutter_secure_storage (tokens), shared_preferences (locale, theme, default city), cached_network_image,
flutter_map + latlong2 (OpenStreetMap tiles) for maps, geolocator, image_picker + flutter_image_compress, url_launcher
(tel:, wa.me, Google Maps directions), share_plus, intl + flutter_localizations (ARB files ar/en, Arabic RTL default),
shimmer skeletons, infinite_scroll_pagination.

Architecture (feature-first, clean): lib/core (env, dio client, api envelope {success,message,data,meta}, failures,
theme, router, l10n, widgets) and lib/features/<feature>/{data (dto, remote source, repository), domain (models),
presentation (providers, screens, widgets)}. Features: auth, home, categories, businesses (browse, search, details, map),
reviews, favorites, notifications, account, owner (my businesses, editor, hours, media, stats, review replies, promote),
contact, offers, pharmacies_on_duty, emergency, listings (real estate / cars / jobs), service_requests (request a quote),
bookings, menu (business items), subscription (plans & entitlements), otp_auth, push (firebase_messaging).

Design: Material 3, primary #5B3DF5, secondary #FF6A3D, gradient #5B3DF5→#8B5CF6→#EC4899, radius 14–18, soft shadows,
font "IBM Plex Sans Arabic" (Inter for English), light + dark themes, RTL first. Bottom navigation: Home, Categories,
Search, Favorites, Account. Business card: cover (fallback = category color gradient + category icon), logo, rating pill,
"Featured" badge, verified tick, sub-category, district/city, open-now dot or distance.

Business rules:
- Guests can browse home, categories, business details and reviews. Search, review, like, favorite, report, claim and
  adding a business require login → show a "Sign in to continue" bottom sheet, then resume the action.
- Any signed-in user can add a business (isOwner=true) or suggest one (isOwner=false); it is "pending" until admin
  approval; show status chips (pending/approved/rejected + adminNote).
- isOpenNow comes from the server. dayOfWeek 0=Sunday..6=Saturday, display week starting Saturday. Times "HH:MM".
- Call POST /businesses/{id}/track {type: phone|whatsapp|directions|website} before launching those intents.
- Track ad impressions/clicks. Internal targetUrl (/b/..., /c/...) opens in-app.
- Images: multipart field "image" (single) or "images" (≤10), compress to ≤1600px / ≤5MB.
- HTTP 402 with code PLAN_LIMIT / PLAN_FEATURE → show an "Upgrade your plan" bottom sheet linking to the plans screen.
  Billing is currently disabled server-side (everything free) but the flow must exist.
- Phone login: POST /auth/otp/request → if isNewUser ask first/last name → POST /auth/otp/verify. Register the FCM
  token with POST /devices after login; route notification taps by data.type and the ids it carries.
- Listings attribute fields come from GET /listings/fields (render inputs/filters dynamically by kind num|enum|bool|text).
  Text search (q) on listings and businesses requires login.
- Booking: GET availability for a date → show slot chips (slot mode) or a single "book the day" button (day mode).

Screens: splash, onboarding (pick language + city), login, register, forgot/reset password, home (hero search,
category grid, ad slider, featured, top rated, newest, cities), categories, category (sub-category chips, filters sheet,
list/grid/map toggle, infinite scroll), search (suggestions, filters: category, sub-category, city, district,
min rating, price, open now, verified, has photos, near me + radius, sort), business details (gallery + full-screen
viewer, actions call/WhatsApp/directions/website/share/save/report, info, hours with today highlighted, map, attributes,
amenities, rating summary with star bars, reviews with sort/like/owner reply, write/edit review, claim, related),
offers feed, on-duty pharmacies (7-day date chips), emergency numbers (tap to call), real estate / cars / jobs lists with
dynamic filter sheets + details + post/edit listing + apply to job, request a service form + my requests with quotes
(accept/reject), booking sheet + my bookings, business menu tab and offers on details, owner: menu manager, offers manager,
booking settings, owner bookings, service-request inbox with send-quote, plans & usage screen,
favorites, notifications (badge from unread-count), account (profile, avatar, settings: language, theme, default city,
change password, logout, logout all), owner area (my businesses, multi-step editor with map location picker and
weekly hours editor, media manager with cover/logo/gallery/primary, stats, reviews inbox with reply, promote requests),
contact, about.

Quality: handle loading/empty/error states everywhere, pull-to-refresh, offline banner + cached last home feed,
form validation mirroring the API messages, accessibility labels, no hardcoded strings (ARB), unit tests for
repositories and the auth interceptor, widget tests for business card and details screen. Output the complete
folder structure and all code files.
```
