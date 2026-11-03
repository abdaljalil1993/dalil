# دليلك — Dalilak v2.1

دليل محلي شامل: أطباء، مطاعم، فنادق، محامون، ترفيه، صيانة وحرفيون، نقل وتحميل، تنظيف… بحث + دوام + تواصل + خريطة + تقييمات
+ منيو ومنتجات، عروض، صيدليات مناوبة، طوارئ، حجز مواعيد، اطلب خدمة (عروض أسعار)، عقارات، سيارات، وظائف، واشتراكات (مطفية حالياً = كله مجاني).

```
dalilak/
├── backend/          Node.js + Express + TypeScript + TypeORM (no migrations) + MySQL2 + JWT
├── frontend_web/     React 19 + TypeScript + Vite + MUI + React Query + Zustand (RTL / AR+EN / Dark)
├── frontend_mobile/  Flutter (يُنفّذ من مطوّر الموبايل — راجع docs/MOBILE_HANDOFF_AR.md)
└── docs/
    ├── REVIEW_AR.md          تقرير الفحص: المنجز + الأخطاء المصلحة + التحسينات المقترحة
    ├── API.md                مرجع كل الـ API (مولّد تلقائياً — 175 endpoint)
    └── MOBILE_HANDOFF_AR.md  دليل وبرومبت مطوّر Flutter
```

## التشغيل السريع

### 1) قاعدة البيانات
أنشئ قاعدة جديدة (يفضّل جديدة لأن البنية تغيّرت):
```sql
CREATE DATABASE dalilak_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2) الباك إند
```bash
cd backend
npm install
cp .env.example .env        # عدّل DB_* و JWT_*  — وخلّي DB_SYNCHRONIZE=false دائماً
npm run db:sync             # إنشاء/تحديث الجداول (بدون migrations) — شغّله بعد كل git pull
npm run seed -- --demo      # مدن + تصنيفات + أدمن + بيانات تجريبية  (بدون --demo للإنتاج)
npm run dev                 # http://localhost:5003  — التوثيق: /api/v1/docs
```
حسابات التجربة: `admin@dalilak.app / Admin@12345` · `owner@dalilak.app / Owner@12345` · `user@dalilak.app / User@12345`

### 3) الويب
```bash
cd frontend_web
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:5003/api/v1
npm run dev                 # http://localhost:4173
```

## بعد كل تحديث (git pull)
```bash
cd backend && npm install && npm run db:sync && npm run seed   # seed آمن يتكرر: يضيف الناقص فقط (باقات، تصنيفات جديدة، أرقام طوارئ)
cd ../frontend_web && npm install
```
> ⚠️ `DB_SYNCHRONIZE=true` مع MariaDB بيمسح أعمدة JSON عند كل إقلاع — لهيك خليه `false` واستعمل `npm run db:sync`.

## الاشتراكات
كلها مجانية حالياً. للتفعيل: لوحة الإدارة ← الاشتراكات والمدفوعات ← تفعيل الاشتراكات المدفوعة.

## الإنتاج
- `NODE_ENV=production` و `DB_SYNCHRONIZE=false`، الجداول من `backend/database/schema.sql` أو `npm run db:sync` مرة واحدة.
- أسرار JWT طويلة وعشوائية (السيرفر يرفض الإقلاع بدونها).
- Cloudinary اختياري — بدونه الصور تنحفظ بـ `backend/uploads` (اعمل لها backup).
- `npm run build && npm start` للباك، و `npm run build` للويب ثم انشر `dist/` (مع rewrite لكل المسارات إلى index.html).
