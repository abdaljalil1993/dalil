# دليلك — Dalilak v2

دليل محلي شامل: أطباء، مطاعم، فنادق، محامون، ترفيه، صيانة وحرفيون، نقل وتحميل، مواد غذائية… بحث + دوام + تواصل + خريطة + تقييمات.

```
dalilak/
├── backend/          Node.js + Express + TypeScript + TypeORM (no migrations) + MySQL2 + JWT
├── frontend_web/     React 19 + TypeScript + Vite + MUI + React Query + Zustand (RTL / AR+EN / Dark)
├── frontend_mobile/  Flutter (يُنفّذ من مطوّر الموبايل — راجع docs/MOBILE_HANDOFF_AR.md)
└── docs/
    ├── REVIEW_AR.md          تقرير الفحص: المنجز + الأخطاء المصلحة + التحسينات المقترحة
    ├── API.md                مرجع كل الـ API (مولّد تلقائياً — 105 endpoint)
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
cp .env.example .env        # عدّل DB_* و JWT_* (إذا عندك .env قديم: غيّر DB_DATABASE=dalilak_v2 وأضف DB_SYNCHRONIZE=true)
npm run db:sync             # إنشاء الجداول (بدون migrations)
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

## الإنتاج
- `NODE_ENV=production` و `DB_SYNCHRONIZE=false`، الجداول من `backend/database/schema.sql` أو `npm run db:sync` مرة واحدة.
- أسرار JWT طويلة وعشوائية (السيرفر يرفض الإقلاع بدونها).
- Cloudinary اختياري — بدونه الصور تنحفظ بـ `backend/uploads` (اعمل لها backup).
- `npm run build && npm start` للباك، و `npm run build` للويب ثم انشر `dist/` (مع rewrite لكل المسارات إلى index.html).
