# اتفاقية العمل المعمارية — تطبيق «دليلك» Flutter (v2.1)

> وثيقة إلزامية لكل من يعمل على `frontend_mobile_v2`.
> **المرجع المعماري:** `~/Desktop/Clean Architecture.pdf` — وثيقة تصميم أكاديمية (58 صفحة).
> **مرجع السلوك:** `docs/MOBILE_HANDOFF_AR.md` · **مرجع الـ API:** `docs/API.md`.
> **مرجع التصميم:** `frontend_web/src/theme/theme.ts` + `frontend_web/src/i18n`.

---

## 0) الفروع — قاعدة صارمة

| القاعدة | التفصيل |
|---|---|
| الفرع العامل | **`Abo_qasem` حصراً** |
| فرع ممنوع | **`main` — لا تقترب منه، لا تدمج منه، لا تدفع إليه** |
| عمر الفرع | فرع ميزة `feat/<feature>` عمره **يومان كحد أقصى** ثم يُدمج إلى `Abo_qasem` |
| حالة `Abo_qasem` | يجب أن تكون قابلة للتشغيل دائماً |
| شرط الدمج | `flutter analyze` نظيف **و** `flutter test` ناجح **و** مراجعة بالبوابتين (أ/ب) |

---

## 1) قاعدة الاعتماد (القاعدة الجوهرية)

```
Presentation  ──►  UseCase  ──►  Domain  ◄──  Data
     │                                    │
     └──────────► Repository (interface) ─┘
```

- الطبقات الخارجية تعتمد على الداخلية، **والعكس ممنوع**.
- **`domain/` لا يستورد أبداً:** `flutter` · `dio` · `json` · `riverpod` · أي مكتبة خارجية.
- طبقة العرض **لا تعرف** `dio` ولا الـ DTO ولا `BuildContext` داخل منطق العمل.
- **الاتصال بالـ data يتم عبر Composition Root فقط** (`core/di/providers.dart`) — لا `Provider` مبعثر داخل `data/`.

### ممنوعيات Domain (تفحَّصها في كل PR)
```
✗ import 'package:flutter/...'     ✗ import 'package:dio/...'
✗ import 'package:riverpod/...'    ✗ json['...']  داخل domain/
✗ BuildContext                     ✗ SnackBar / Navigation
```

---

## 2) هيكل المجلدات

```
lib/
├── main.dart
├── app.dart
├── core/
│   ├── constants/      api_endpoints.dart · asset_paths.dart
│   ├── error/          result.dart · failures.dart · exceptions.dart
│   ├── network/        dio_client.dart · interceptors/ · network_info.dart
│   ├── storage/        secure_storage_service.dart · local_storage_service.dart
│   ├── theme/          app_colors.dart · app_typography.dart · app_theme.dart
│   ├── router/         app_router.dart · routes.dart
│   ├── di/             providers.dart            ← Composition Root
│   ├── l10n/           app_ar.arb · app_en.arb
│   ├── widgets/        (primitives عامة فقط)
│   └── utils/          extensions.dart · validators.dart · formatters.dart
└── features/<feature>/
    ├── domain/
    │   ├── entities/
    │   ├── repositories/     (abstract)
    │   └── usecases/
    ├── data/
    │   ├── datasources/      (remote/local)
    │   ├── models/           (DTO — json فقط هنا)
    │   ├── mappers/          (DTO → Entity)
    │   └── repositories/     (implements واجهة domain)
    └── presentation/
        ├── pages/
        ├── widgets/
        ├── providers/        (Riverpod)
        └── state/            (نماذج الحالة)
```

### قواعد `core/`
- `core/` مشترك بين الجميع، **يتغير بنادراً** — أي تعديل يحتاج موافقة الطرف الآخر.
- **لا تجعل `core/` سلة مهملات:** أي منطق يخص ميزة بعينها يبقى داخل `features/<feature>/`.
- `core/widgets/` **primitives عامة فقط** (Shimmer, EmptyState, ErrorView, GradientButton, LoginPromptSheet).
- الودجت الذي يحتاج كيان ميزة (مثل `BusinessCard` يحتاج `Business`) يوضع في `features/<feature>/` ويُصدَّر عبر **barrel**:
  `features/businesses/businesses.dart` — وبقية الميزات تستورد من الـ barrel فقط.

### قواعد الميزات
- **عمودي بالميزة، لا أفقي بالطبقات.** شخص واحد يملك الميزة كاملة: `domain → data → presentation`.
- **لا استيراد من `internals` ميزة أخرى** — عبر الـ barrel أو `core` فقط.
- الميزة تُسلَّم **كاملة** (كل الحالات + الاختبارات) — لا نصف ميزة.

---

## 3) عقد البيانات

### غلاف الاستجابة
```jsonc
{ "success": true, "message": "...", "data": {}, "meta": { "total", "page", "limit", "totalPages", "hasNext": true } }
```

### الأخطاء
```jsonc
{ "success": false, "message": "أول رسالة", "code": "PLAN_LIMIT",
  "errors": [{ "field": "email", "message": "Invalid email address" }] }
```

| الحالة | المعالجة |
|---|---|
| `401` | refresh **مرة واحدة** (قفل/queue للطلبات المتزامنة) ← تخزين الـ refreshToken **الجديد** دائماً (rotation) |
| `402` + `code: PLAN_LIMIT\|PLAN_FEATURE` | BottomSheet «هذه الميزة تحتاج ترقية باقتك» ← شاشة الباقات |
| `403` + `code: FEATURE_DISABLED` | «هذه الخدمة غير متاحة حالياً في منطقتك» |
| `422` | أخطاء الحقول من `errors[].field / message` |
| `409` | رسالة التعارض من `message` |

### قواعد عامة
1. **التوكنات:** access 15 دقيقة · `flutter_secure_storage` · التفضيلات في `shared_preferences`.
2. **`meta.hasNext`** = مصدر التمرير اللانهائي.
3. **رسالة الخطأ = `message`** من الغلاف، لا رسائل مكتوبة يدوياً.
4. **`isOpenNow` يجي محسوباً من السيرفر** (توقيت سوريا) — لا تحسبه في الموبايل.
5. **`dayOfWeek`:** 0=الأحد … 6=السبت · يُعرض الأسبوع **من السبت** · التواريخ `YYYY-MM-DD` · الأوقات `HH:MM`.
6. **المبالغ** أرقام بالليرة السورية `SYP`.
7. **الصور:** `multipart` · حقل `image` (مفرد) أو `images` (متعدد ≤10، listings ≤15) · ≤5MB · jpg/png/webp · اضغط قبل الرفع (≤1600px).
8. **`Accept-Language: ar|en`** في كل طلب · الأسماء: `nameEn` إذا الإنجليزية وموجودة وإلا `name`.

---

## 4) قواعد v2.1 الإضافية

### ⭐ مفاتيح الخدمات (تُستدعى أولاً)
```dart
GET /features?cityId=  →  { enabled: { offers, pharmacies, emergency, menu, bookings,
                              serviceRequests, realEstate, cars, jobs, search, reviews,
                              favorites, addBusiness, claims, reports, otpLogin, register,
                              ads, featured, promote, subscriptions }, cities: {...} }
```
- **عند إقلاع التطبيق + عند تغيير المدينة** ← نادِ `GET /features?cityId=`.
- أي خدمة `false` ← **أخفِ** زرها وشاشتها وتبويبها (لا تعرضها أصلاً).
- خزّن النتيجة (cache) وحدّثها بالخلفية.
- `GET /home` يرجع `features` جاهزة — استعملها عند التحميل الأول ثم حدّثها.
- الـ guard في الباك يرجع `403 FEATURE_DISABLED` — عالجه في طبقة الأخطاء المركزية.

### الدخول بالموبايل (OTP)
```
POST /auth/otp/request { phone }  → { phone, expiresInSeconds, isNewUser, devCode? }
  └─ isNewUser=true  ← اطلب firstName + lastName
POST /auth/otp/verify { phone, code, firstName?, lastName?, cityId? }  → نفس رد الدخول
POST /auth/otp/verify-phone { phone, code }  (لمسجّل يغيّر رقمه)
```

### Push
- بعد الدخول: `POST /devices { token, platform: android|ios, locale }`
- عند الخروج: `DELETE /devices/{token}`
- الإشعار فيه `data.type` + المعرّفات (`businessId`, `requestId`, `appointmentId`…) ← افتح الشاشة حسب النوع.

### الإعلانات المبوّبة (عقارات/سيارات/وظائف)
- **الحقول تأتي من `GET /listings/fields`** — لا تكتبها يدوياً، ابنِ الفورم/الفلتر ديناميكياً حسب `kind: num|enum|bool|text`.
- الفلاتر: `attr[key]=` · `attrMin[key]=` · `attrMax[key]=`.
- نص البحث `q` **للمسجّلين فقط** (في القوائم والأنشطة).

### الإسناد (OSM)
- إذا `dataSource: "osm"` ← اعرض سطراً «مصدر المعلومات: OpenStreetMap».
- في شاشة «حول التطبيق»: «بيانات الخرائط والأماكن © مساهمو OpenStreetMap» — **شرط الترخيص**.

### الباقات
- الفوترة حالياً **مطفية** في الباك (الكل مجاني) لكن **الـ flow لازم يكون جاهزاً**: عالج `402` واعرض شاشة الباقات.

---

## 5) مصفوفة قرار UseCase

**القاعدة:** اكتب UseCase عندما يوجد **منطق عمل حقيقي** يتجاوز مجرد جلب/حفظ بيانات.

| العملية | القرار |
|---|---|
| `login` · `register` · `otp verify` · `forgot/reset` · `change-password` · `logout-all` | ✅ UseCase |
| إضافة/تعديل نشاط · `claim` · طلب ترويج/إعلان · نشر listing · حجز · طلب خدمة + عروض أسعار | ✅ UseCase |
| إرسال تقييم · إبلاغ · رد المالك · تقديم وظيفة | ✅ UseCase |
| `GET /home` · تصنيفات · مدن · مميّزين · عروض · طوارئ · مناوبة صيدليات · مسح `features` | ❌ Repository مباشرة |
| تفاصيل نشاط/listing · بحث وتصفية · pagination · منيو · جدول مواعيد | ❌ Repository مباشرة |
| مفضلة toggle · إشعارات · قراءة/تحديث profile | ❌ Repository مباشرة |
| حساب `isOpenNow` وعرض الأسبوع | ❌ `presentation/utils` (السيرفر يحسب) |
| تتبع `track` ثم فتح اتصال/واتساب/اتجاهات | ❌ خدمة جانبية (side-effect منصة) |

**إن شكك:** هل أستطيع شرحها بجملة «يجب على النظام أن…» تحتوي شرطاً أو تنسيقاً بين مصادر؟ → UseCase.
إن كانت «يعرض التطبيق…» أو «يجلب من الخادم…» فقط → Repository مباشرة.

---

## 6) إدارة الحالة — Riverpod 2 (بدون codegen)

```
Provider<...>            ← DI: dio · storage · datasources · repositories   (core/di/providers.dart)
Provider<UseCase>        ← فقط للعمليات الحساسة (auth · claim · review · owner)
AsyncNotifier / Notifier ← حالة الشاشة فقط: ينسّق UI ↔ UseCase
```

**ممنوع:**
- ❌ منطق عمل داخل `Notifier` — الـ Notifier **منسّق فقط**.
- ❌ `ref.read` لمستودع مباشرة من الودجت — يمرّ عبر الـ Notifier.
- ❌ حالة مشتركة عامة بلا داعٍ — كل ميزة حالتها.
- ❌ codegen (`riverpod_generator` / `freezed` / `json_serializable`) — **الكود يدوي**.

**قواعد العرض:**
- كل شاشة تعالج **تحميل / فراغ / خطأ / نجاح** + `RefreshIndicator` حيث يناسب.
- الحالة تُمثَّل بنماذج صريحة في `presentation/state/` (مثل `sealed class DetailsState`).

---

## 7) قواعد التسليم (من MOBILE_HANDOFF_AR.md)

1. **الضيف** يرى: `/home` · `/categories` · تصفح بالفلاتر بدون نص · `/businesses/{slug}` · التقييمات · `/featured/active` · `/advertisements/active`.
   أي بحث نصي/تقييم/مفضلة/إبلاغ/إضافة ← **BottomSheet «سجّل دخولك» ثم الرجوع لنفس الإجراء**.
2. عند الضغط اتصال/واتساب/اتجاهات/موقع ← `POST /businesses/{id}/track {type}` **أولاً**.
3. الإعلانات: `impression` عند الظهور · `click` عند الضغط · `targetUrl` يبدأ بـ `/b/` أو `/c/` ← **داخل التطبيق**.
4. واتساب: `09xxxxxxxx` ← `9639xxxxxxxx` ← `https://wa.me/...`
   الاتجاهات: `https://www.google.com/maps/dir/?api=1&destination=lat,lng`
5. لوحة الإدارة **ويب فقط** — الموبايل بلا أدمن إطلاقاً.

---

## 8) بوابة المراجعة

### بوابة أ — قبل إنشاء ميزة
- [ ] حددت الـ entities؟
- [ ] عرّفت واجهة الـ repository؟
- [ ] قررت: هل يحتاج UseCase؟ (حسب المصفوفة أعلاه)
- [ ] أداة إدارة الحالة **للطبقة العرضية فقط**؟
- [ ] DI في Composition Root (`core/di/providers.dart`)؟
- [ ] اختبارات وحدة للـ UseCase/Repository؟
- [ ] **تجنّبت `import flutter` داخل `domain/`؟**
- [ ] **تجنّبت Navigation داخل UseCase؟**
- [ ] الطبقة العرضية تعالج Loading/Error/Success؟
- [ ] المجلدات تتبع `feature/{data,domain,presentation}`؟

### بوابة ب — مراجعة الكود
- [ ] لا `BuildContext` أو `UseCase` داخل بعضهما
- [ ] لا `JSON parsing` داخل `domain/`
- [ ] لا `Dio/Firebase/Hive` داخل `domain/`
- [ ] لا `Riverpod/GetX/Bloc` داخل `domain/`
- [ ] الـ Notifier لا يحوي منطق عمل معقد
- [ ] الـ UseCase لا يعرض رسائل UI مباشرة (إلا إن كانت جزءاً من عقد `Failure`)
- [ ] الـ repository يعيد **Entities** لا DTOs
- [ ] الـ DTOs موجودة في `data/` فقط
- [ ] الميزة لا تستورد internals ميزة أخرى
- [ ] الاختبارات تغطي الـ UseCases الحساسة
- [ ] المسارات بـ`goAppRoute` · البطاقات بـ`AppCard` · القوائم بـ`RevealList` (§11)
- [ ] `flutter analyze` + `flutter test` نظيفان

---

## 9) الاختبارات

| النوع | الأداة | الهدف |
|---|---|---|
| Unit | `mocktail` + `test` | Domain · UseCases · Repositories · auth interceptor |
| Widget | `flutter_test` | BusinessCard · شاشة التفاصيل · حالات التحميل/الفراغ/الخطأ |
| Provider | `ProviderScope(overrides:)` | اختبارات Riverpod |
| Integration | `integration_test` | تدفقات كاملة (لاحقاً) |

---

## 10) التحقق اليومي

```bash
cd frontend_mobile_v2
flutter analyze          # يجب أن يكون نظيفاً
flutter test             # يجب أن تنجح
```

> **التشغيل:**
> ```bash
> flutter run --dart-define=API_URL=http://10.0.2.2:5003/api/v1   # أندرويد محاكي
> flutter run --dart-define=API_URL=http://localhost:5003/api/v1   # iOS محاكي / جهاز
> ```

---

## 11) قواعد الحركة (لغة الحركة)

الحركة **موحّدة على مستوى التطبيق**: ثلاثة أشياء تلقائية، والبقية تتطلب استخدام المكوّن الصحيح.

### ما هو تلقائي (لا تفعل شيئاً)

| الآلية | التأثير |
|---|---|
| `AppScrollBehavior` (موصول على `MaterialApp`) | ارتداد الحافة + امتداد Material-3 + سحب بالفأرة/اللمسة — **كل** `ListView/GridView/SingleChildScrollView` جديد يرثه |
| `CachedNetworkImage` | تلاشٍ 500ms عند وصول الصورة (خاصية افتراضية — لا تُلغِها) |

### ما يُكتب يدوياً (إلزامي)

| الحالة | استخدم | ممنوع |
|---|---|---|
| **مسار جديد** | `goAppRoute(path:, builder:)` مع `tab: true` للتبويبات | `GoRoute(builder:)` → يسقط على انزلاق المنصة الافتراضي |
| **بطاقة/عنصر قابل للضغط** | `AppCard` (سطح + موجة + تكبير 0.97) | `GestureDetector` + `Container` → بلا أي أثر |
| **قائمة/شبكة جديدة** | `RevealList` / `RevealGrid` (دخول متدرّج لكل عنصر) | `ListView.builder` عادي → كل شيء يظهر دفعة واحدة |
| **قائمة `children:` أو sliver** | لفّ كل قسم بـ`ScrollReveal(index:)` | — |
| **أثر ضغط داخل مكوّن قائم** | `Pressable` | — |
| **مدة/منحنى** | `AppMotion.fast/base/slow` + `easeOut` | `Duration(milliseconds: …)` يدوية |

```dart
// مسار
goAppRoute(path: '/about', builder: (_, __) => const AboutScreen());
goAppRoute(path: '/home', tab: true, builder: (_, __) => const HomeScreen());

// بطاقة
AppCard(onTap: () => context.push('/x'), child: const MyContent());

// قائمة
RevealList(
  itemCount: items.length,
  itemBuilder: (context, index) => MyRow(items[index]),
);
```

**الملفات:** `core/theme/app_motion.dart` · `core/widgets/app_card.dart` · `core/widgets/scroll_reveal.dart` · `core/widgets/reveal_list.dart` · `core/router/app_transitions.dart`

### لماذا في الاتفاقية؟

الثلاثة التلقائية تنقذ نفسها؛ أما اليدوية فتتشتت مع نمو الفريق — مسار بلا `goAppRoute` أو بطاقة بـ`GestureDetector` تكسر الإحساس الموحّد. **بوابة المراجعة (§8) تتضمّن هذه القواعد.**

### حدود معروفة

- `ScrollReveal`/`RevealList` يبني الحركة على **أول بناء للعنصر**: ما هو خارج الـ`cacheExtent` يبدأ حركته قبل ظهوره — مقصود (لا حركة بعد الدخول).
- حركات الظهور `paint-only`: لا تغيّر التخطيط إطلاقاً، لذا لا تتعارض مع إصلاحات التخطيط السابقة.
- كل الحركات تحترم `MediaQuery.disableAnimations` (وضع تقليل الحركة).
