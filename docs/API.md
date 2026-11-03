# Dalilak API Reference (v2)

> Auto-generated from the backend route registry (`npm run docs`). Interactive docs: `/api/v1/docs` (Swagger) · OpenAPI JSON: `/api/v1/docs.json`

**Base URL:** `{HOST}/api/v1`

**Auth:** `Authorization: Bearer <accessToken>` · access token 15 min · refresh with `POST /auth/refresh` (rotation: always store the NEW refreshToken).

**Response envelope:**

```json
{ "success": true, "message": "…", "data": {}, "meta": { "total": 120, "page": 1, "limit": 20, "totalPages": 6, "hasNext": true } }
```

**Errors:** `{ "success": false, "message": "first error", "errors": [{ "field": "email", "message": "Invalid email address" }] }` — 401 (token missing/expired → refresh), 403 (role), 404, 409 (duplicate), 422 (validation), 429 (rate limit).

**Uploads:** `multipart/form-data`, field `image` (single) or `images` (multiple, max 10), jpg/png/webp ≤ 5MB.

**Days:** `dayOfWeek` 0=Sunday … 6=Saturday, times `HH:MM` (24h, app timezone Asia/Damascus). Overnight hours (18:00→02:00) are supported.

## Endpoints overview

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | 🌐 Public | Create account (role = user) |
| `POST` | `/auth/login` | 🌐 Public | Sign in - returns accessToken, refreshToken, user |
| `POST` | `/auth/refresh` | 🌐 Public | Rotate tokens (old refresh token is revoked) |
| `POST` | `/auth/logout` | 🌐 Public | Revoke a refresh token |
| `POST` | `/auth/logout-all` | 🔐 User | Revoke all sessions of the current user |
| `POST` | `/auth/change-password` | 🔐 User | Change password (revokes other sessions) |
| `POST` | `/auth/forgot-password` | 🌐 Public | Send reset link by email |
| `POST` | `/auth/reset-password` | 🌐 Public | Set a new password using the emailed token |
| `GET` | `/auth/me` | 🔐 User | Current user |
| `GET` | `/users/me` | 🔐 User | My profile + counters |
| `PUT` | `/users/me` | 🔐 User | Update my profile |
| `POST` | `/users/me/avatar` | 🔐 User | Upload avatar |
| `GET` | `/users` | 🛡️ Admin | List users |
| `GET` | `/users/:id` | 🛡️ Admin | User details |
| `PATCH` | `/users/:id/status` | 🛡️ Admin | Activate / suspend user |
| `PATCH` | `/users/:id/role` | 🛡️ Admin | Change user role |
| `GET` | `/businesses` | 🌐 Public (+token) | Browse approved businesses (filters, no text search) |
| `GET` | `/businesses/search` | 🔐 User | Search (text + filters + geo) - logs the query |
| `GET` | `/businesses/suggest` | 🔐 User | Autocomplete (businesses, categories, sub-categories) |
| `GET` | `/businesses/my` | 🔐 User | My businesses (all statuses) |
| `GET` | `/businesses/admin/all` | 🛡️ Admin | All businesses for moderation |
| `GET` | `/businesses/manage/:id` | 🏪 Owner/Admin | Full business record for editing (owner/admin) |
| `GET` | `/businesses/:slug` | 🌐 Public (+token) | Business details by slug or id (+ ratingBreakdown, viewer.isFavorite, viewer.myReview) |
| `GET` | `/businesses/:slug/related` | 🌐 Public | Similar businesses |
| `POST` | `/businesses/:id/track` | 🌐 Public | Track contact click (phone/whatsapp/directions/website) |
| `POST` | `/businesses` | 🔐 User | Submit a business (pending review). Admin → published directly. isOwner=false → suggestion |
| `PUT` | `/businesses/:id` | 🏪 Owner/Admin | Update business (owner/admin) |
| `DELETE` | `/businesses/:id` | 🏪 Owner/Admin | Delete business (owner/admin) |
| `GET` | `/businesses/:id/stats` | 🏪 Owner/Admin | Business analytics (views, clicks, ratings) |
| `PATCH` | `/businesses/:id/status` | 🛡️ Admin | Approve / reject / suspend |
| `PATCH` | `/businesses/:id/approve` | 🛡️ Admin | Alias of /status (backward compatible) |
| `PATCH` | `/businesses/:id/flags` | 🛡️ Admin | Set verified / active / owner |
| `POST` | `/businesses/:id/images` | 🏪 Owner/Admin | Upload gallery images |
| `DELETE` | `/businesses/:id/images/:imageId` | 🏪 Owner/Admin | Delete gallery image |
| `PATCH` | `/businesses/:id/images/:imageId/primary` | 🏪 Owner/Admin | Set primary image |
| `POST` | `/businesses/:id/cover` | 🏪 Owner/Admin | Upload cover image |
| `POST` | `/businesses/:id/logo` | 🏪 Owner/Admin | Upload logo |
| `PUT` | `/businesses/:id/hours` | 🏪 Owner/Admin | Replace working hours (dayOfWeek 0=Sunday) |
| `POST` | `/businesses/:id/hours` | 🏪 Owner/Admin | Alias of PUT /hours |
| `GET` | `/businesses/:businessId/reviews` | 🌐 Public (+token) | Business reviews |
| `POST` | `/businesses/:businessId/reviews` | 🔐 User | Rate & review (one per user, edit via PUT /reviews/:id) |
| `POST` | `/businesses/:businessId/reports` | 🔐 User | Report wrong info / spam / fake review |
| `POST` | `/businesses/:businessId/claim` | 🔐 User | Claim ownership of a listing added by admin |
| `GET` | `/home` | 🌐 Public | Home feed: categories, cities, ads, featured, top rated, newest, stats |
| `GET` | `/categories` | 🌐 Public (+token) | All categories with sub-categories and business counts |
| `GET` | `/categories/:slug` | 🌐 Public | Category by slug or id |
| `POST` | `/categories` | 🛡️ Admin | Create category |
| `PUT` | `/categories/:id` | 🛡️ Admin | Update category |
| `DELETE` | `/categories/:id` | 🛡️ Admin | Delete category (only if empty) |
| `POST` | `/categories/:id/image` | 🛡️ Admin | Upload category image |
| `POST` | `/categories/sub` | 🛡️ Admin | Create sub-category |
| `PUT` | `/categories/sub/:id` | 🛡️ Admin | Update sub-category |
| `DELETE` | `/categories/sub/:id` | 🛡️ Admin | Delete sub-category |
| `GET` | `/cities` | 🌐 Public (+token) | All cities with business counts |
| `GET` | `/cities/:id` | 🌐 Public | City by id or slug |
| `POST` | `/cities` | 🛡️ Admin | Create city |
| `PUT` | `/cities/:id` | 🛡️ Admin | Update city |
| `DELETE` | `/cities/:id` | 🛡️ Admin | Delete city (only if empty) |
| `GET` | `/reviews/my` | 🔐 User | My reviews |
| `GET` | `/reviews/owner` | 🔐 User | Reviews on my businesses (owner inbox) |
| `GET` | `/reviews/admin/all` | 🛡️ Admin | All reviews (moderation) |
| `PUT` | `/reviews/:id` | 🔐 User | Edit my review |
| `DELETE` | `/reviews/:id` | 🔐 User | Delete my review (admin: any) |
| `POST` | `/reviews/:id/reply` | 🏪 Owner/Admin | Owner reply (create/replace) |
| `DELETE` | `/reviews/:id/reply` | 🏪 Owner/Admin | Remove owner reply |
| `POST` | `/reviews/:id/like` | 🔐 User | Toggle "helpful" |
| `PATCH` | `/reviews/:id/visibility` | 🛡️ Admin | Hide / show review |
| `GET` | `/favorites` | 🔐 User | My favorites |
| `POST` | `/favorites/:businessId` | 🔐 User | Toggle favorite |
| `PUT` | `/favorites/:businessId` | 🔐 User | Add favorite (idempotent) |
| `DELETE` | `/favorites/:businessId` | 🔐 User | Remove favorite |
| `GET` | `/favorites/:businessId/check` | 🔐 User | Is favorite? |
| `GET` | `/reports` | 🛡️ Admin | All reports |
| `PATCH` | `/reports/:id/status` | 🛡️ Admin | Update report status |
| `GET` | `/claims/my` | 🔐 User | My ownership claims |
| `GET` | `/claims` | 🛡️ Admin | All claims |
| `PATCH` | `/claims/:id` | 🛡️ Admin | Approve / reject claim (approve → user becomes owner) |
| `GET` | `/notifications` | 🔐 User | My notifications |
| `GET` | `/notifications/unread-count` | 🔐 User | Unread badge count |
| `PATCH` | `/notifications/read-all` | 🔐 User | Mark all as read |
| `PATCH` | `/notifications/:id/read` | 🔐 User | Mark one as read |
| `DELETE` | `/notifications/:id` | 🔐 User | Delete notification |
| `POST` | `/contact` | 🌐 Public (+token) | Send a message to the platform team |
| `GET` | `/contact` | 🛡️ Admin | Inbox |
| `PATCH` | `/contact/:id` | 🛡️ Admin | Mark read/unread |
| `DELETE` | `/contact/:id` | 🛡️ Admin | Delete message |
| `GET` | `/advertisements/active` | 🌐 Public | Active ads |
| `POST` | `/advertisements/:id/click` | 🌐 Public | Track click |
| `POST` | `/advertisements/:id/impression` | 🌐 Public | Track impression |
| `GET` | `/advertisements/my` | 🔐 User | My ad requests |
| `POST` | `/advertisements/request` | 🔐 User | Request an ad (owner) - pending until admin activates |
| `GET` | `/advertisements` | 🛡️ Admin | All ads |
| `POST` | `/advertisements` | 🛡️ Admin | Create ad (JSON or multipart with "image") |
| `PUT` | `/advertisements/:id` | 🛡️ Admin | Update ad / approve request (status=active) |
| `DELETE` | `/advertisements/:id` | 🛡️ Admin | Delete ad |
| `GET` | `/featured/active` | 🌐 Public | Currently featured businesses |
| `GET` | `/featured/my` | 🔐 User | My featured requests |
| `POST` | `/featured/request` | 🔐 User | Request featuring my business |
| `GET` | `/featured` | 🛡️ Admin | All featured entries |
| `POST` | `/featured` | 🛡️ Admin | Feature a business |
| `PUT` | `/featured/:id` | 🛡️ Admin | Update / approve request |
| `DELETE` | `/featured/:id` | 🛡️ Admin | Remove featured entry |
| `GET` | `/admin/dashboard/stats` | 🛡️ Admin | Totals, pending actions, 12-month charts, top/recent businesses |
| `GET` | `/admin/dashboard/searches` | 🛡️ Admin | Top searches & zero-result searches |
| `GET` | `/admin/audit-logs` | 🛡️ Admin | Audit trail of write actions |

## Details

### Auth

#### `POST /auth/register`
Create account (role = user) — 🌐 Public

```json
{
  "firstName": "Fadi",
  "lastName": "Ali",
  "email": "fadi@example.com",
  "password": "Secret123",
  "phone": "+963991234567",
  "cityId": 1
}
```

#### `POST /auth/login`
Sign in - returns accessToken, refreshToken, user — 🌐 Public

```json
{
  "email": "fadi@example.com",
  "password": "Secret123"
}
```

#### `POST /auth/refresh`
Rotate tokens (old refresh token is revoked) — 🌐 Public

```json
{
  "refreshToken": "..."
}
```

#### `POST /auth/logout`
Revoke a refresh token — 🌐 Public

```json
{
  "refreshToken": "..."
}
```

#### `POST /auth/logout-all`
Revoke all sessions of the current user — 🔐 User

#### `POST /auth/change-password`
Change password (revokes other sessions) — 🔐 User

```json
{
  "currentPassword": "Secret123",
  "newPassword": "NewSecret456"
}
```

#### `POST /auth/forgot-password`
Send reset link by email — 🌐 Public

> In development without SMTP the response contains `devResetToken`.

```json
{
  "email": "fadi@example.com"
}
```

#### `POST /auth/reset-password`
Set a new password using the emailed token — 🌐 Public

```json
{
  "token": "...",
  "newPassword": "NewSecret456"
}
```

#### `GET /auth/me`
Current user — 🔐 User

### Users

#### `GET /users/me`
My profile + counters — 🔐 User

#### `PUT /users/me`
Update my profile — 🔐 User

```json
{
  "firstName": "Fadi",
  "lastName": "Ali",
  "phone": "+963...",
  "bio": "...",
  "cityId": 1
}
```

#### `POST /users/me/avatar`
Upload avatar — 🔐 User

multipart: `image` — Image file (jpg/png/webp, max 5MB)

#### `GET /users`
List users — 🛡️ Admin

Query: `search` (name/email/phone), `role` (user|business_owner|admin), `status` (active|inactive|suspended), `page`, `limit`

#### `GET /users/:id`
User details — 🛡️ Admin

#### `PATCH /users/:id/status`
Activate / suspend user — 🛡️ Admin

```json
{
  "status": "suspended"
}
```

#### `PATCH /users/:id/role`
Change user role — 🛡️ Admin

```json
{
  "role": "business_owner"
}
```

### Businesses

#### `GET /businesses`
Browse approved businesses (filters, no text search) — 🌐 Public (+token)

> Paid (featured) businesses are listed first except when sort=distance.

Query: `categoryId` (number), `subCategoryId` (number), `cityId` (number), `district` (text), `minRating` (0-5), `priceRange` (1-4), `openNow` (true), `verified` (true), `featured` (true), `hasPhotos` (true), `lat` (user latitude), `lng` (user longitude), `radius` (km), `sort` (relevance|rating|reviews|newest|distance|name|popular), `page` (1..), `limit` (1..100)

#### `GET /businesses/search`
Search (text + filters + geo) - logs the query — 🔐 User

> Arabic-normalized, matches name, description, tags, category/sub-category synonyms, district, city.

Query: `q` (e.g. "طبيب عيون"), `categoryId` (number), `subCategoryId` (number), `cityId` (number), `district` (text), `minRating` (0-5), `priceRange` (1-4), `openNow` (true), `verified` (true), `featured` (true), `hasPhotos` (true), `lat` (user latitude), `lng` (user longitude), `radius` (km), `sort` (relevance|rating|reviews|newest|distance|name|popular), `page` (1..), `limit` (1..100)

#### `GET /businesses/suggest`
Autocomplete (businesses, categories, sub-categories) — 🔐 User

Query: `q` (text), `cityId` (number)

#### `GET /businesses/my`
My businesses (all statuses) — 🔐 User

Query: `status` (pending|approved|rejected|suspended)

#### `GET /businesses/admin/all`
All businesses for moderation — 🛡️ Admin

Query: `status` (pending|approved|rejected|suspended|all), `q` (text), `ownerId` (uuid), `categoryId` (number), `subCategoryId` (number), `cityId` (number), `district` (text), `minRating` (0-5), `priceRange` (1-4), `openNow` (true), `verified` (true), `featured` (true), `hasPhotos` (true), `lat` (user latitude), `lng` (user longitude), `radius` (km), `sort` (relevance|rating|reviews|newest|distance|name|popular), `page` (1..), `limit` (1..100)

#### `GET /businesses/manage/:id`
Full business record for editing (owner/admin) — 🏪 Owner/Admin

#### `GET /businesses/:slug`
Business details by slug or id (+ ratingBreakdown, viewer.isFavorite, viewer.myReview) — 🌐 Public (+token)

#### `GET /businesses/:slug/related`
Similar businesses — 🌐 Public

#### `POST /businesses/:id/track`
Track contact click (phone/whatsapp/directions/website) — 🌐 Public

```json
{
  "type": "phone"
}
```

#### `POST /businesses`
Submit a business (pending review). Admin → published directly. isOwner=false → suggestion — 🔐 User

```json
{
  "name": "عيادة د. أحمد للعيون",
  "nameEn": "Dr. Ahmad Eye Clinic",
  "categoryId": 1,
  "subCategoryId": 3,
  "cityId": 1,
  "shortDescription": "استشاري طب وجراحة العيون",
  "description": "...",
  "address": "شارع بغداد، بناء 12",
  "district": "الزراعة",
  "latitude": 35.5317,
  "longitude": 35.7915,
  "phone": "041 123 456",
  "whatsapp": "+963991234567",
  "website": "https://example.com",
  "socialLinks": {
    "facebook": "https://facebook.com/..."
  },
  "priceRange": 2,
  "attributes": {
    "specialty": "جراحة الشبكية",
    "experienceYears": 15
  },
  "amenities": [
    "parking",
    "card_payment"
  ],
  "tags": [
    "عيون",
    "ليزر"
  ],
  "isOwner": true,
  "workingHours": [
    {
      "dayOfWeek": 0,
      "openTime": "09:00",
      "closeTime": "17:00"
    },
    {
      "dayOfWeek": 5,
      "isClosed": true
    }
  ]
}
```

#### `PUT /businesses/:id`
Update business (owner/admin) — 🏪 Owner/Admin

```json
{
  "name": "عيادة د. أحمد للعيون",
  "nameEn": "Dr. Ahmad Eye Clinic",
  "categoryId": 1,
  "subCategoryId": 3,
  "cityId": 1,
  "shortDescription": "استشاري طب وجراحة العيون",
  "description": "...",
  "address": "شارع بغداد، بناء 12",
  "district": "الزراعة",
  "latitude": 35.5317,
  "longitude": 35.7915,
  "phone": "041 123 456",
  "whatsapp": "+963991234567",
  "website": "https://example.com",
  "socialLinks": {
    "facebook": "https://facebook.com/..."
  },
  "priceRange": 2,
  "attributes": {
    "specialty": "جراحة الشبكية",
    "experienceYears": 15
  },
  "amenities": [
    "parking",
    "card_payment"
  ],
  "tags": [
    "عيون",
    "ليزر"
  ],
  "workingHours": [
    {
      "dayOfWeek": 0,
      "openTime": "09:00",
      "closeTime": "17:00"
    },
    {
      "dayOfWeek": 5,
      "isClosed": true
    }
  ]
}
```

#### `DELETE /businesses/:id`
Delete business (owner/admin) — 🏪 Owner/Admin

#### `GET /businesses/:id/stats`
Business analytics (views, clicks, ratings) — 🏪 Owner/Admin

#### `PATCH /businesses/:id/status`
Approve / reject / suspend — 🛡️ Admin

```json
{
  "status": "approved",
  "adminNote": "optional reason"
}
```

#### `PATCH /businesses/:id/approve`
Alias of /status (backward compatible) — 🛡️ Admin

```json
{
  "status": "approved"
}
```

#### `PATCH /businesses/:id/flags`
Set verified / active / owner — 🛡️ Admin

```json
{
  "isVerified": true,
  "isActive": true,
  "ownerId": "uuid"
}
```

#### `POST /businesses/:id/images`
Upload gallery images — 🏪 Owner/Admin

multipart: `images` — Up to 10 image files per request

#### `DELETE /businesses/:id/images/:imageId`
Delete gallery image — 🏪 Owner/Admin

#### `PATCH /businesses/:id/images/:imageId/primary`
Set primary image — 🏪 Owner/Admin

#### `POST /businesses/:id/cover`
Upload cover image — 🏪 Owner/Admin

multipart: `image` — Image file

#### `POST /businesses/:id/logo`
Upload logo — 🏪 Owner/Admin

multipart: `image` — Image file

#### `PUT /businesses/:id/hours`
Replace working hours (dayOfWeek 0=Sunday) — 🏪 Owner/Admin

```json
{
  "hours": [
    {
      "dayOfWeek": 0,
      "openTime": "09:00",
      "closeTime": "17:00"
    },
    {
      "dayOfWeek": 5,
      "isClosed": true
    }
  ]
}
```

#### `POST /businesses/:id/hours`
Alias of PUT /hours — 🏪 Owner/Admin

```json
{
  "hours": [
    {
      "dayOfWeek": 0,
      "openTime": "09:00",
      "closeTime": "17:00"
    },
    {
      "dayOfWeek": 5,
      "isClosed": true
    }
  ]
}
```

#### `GET /businesses/:businessId/reviews`
Business reviews — 🌐 Public (+token)

Query: `sort` (newest|oldest|highest|lowest|helpful), `rating` (1-5), `page`, `limit`

#### `POST /businesses/:businessId/reviews`
Rate & review (one per user, edit via PUT /reviews/:id) — 🔐 User

```json
{
  "rating": 5,
  "content": "خدمة ممتازة"
}
```

#### `POST /businesses/:businessId/reports`
Report wrong info / spam / fake review — 🔐 User

```json
{
  "type": "wrong_info",
  "description": "رقم الهاتف خاطئ",
  "reviewId": null
}
```

#### `POST /businesses/:businessId/claim`
Claim ownership of a listing added by admin — 🔐 User

```json
{
  "message": "أنا صاحب العيادة",
  "phone": "+963...",
  "proofUrl": null
}
```

### Home

#### `GET /home`
Home feed: categories, cities, ads, featured, top rated, newest, stats — 🌐 Public

Query: `cityId` (Optional - personalize by city)

### Categories

#### `GET /categories`
All categories with sub-categories and business counts — 🌐 Public (+token)

Query: `includeInactive` (admin only: true)

#### `GET /categories/:slug`
Category by slug or id — 🌐 Public

#### `POST /categories`
Create category — 🛡️ Admin

```json
{
  "name": "أطباء",
  "nameEn": "Doctors",
  "icon": "LocalHospital",
  "color": "#EF4444",
  "keywords": "طبيب,دكتور,عيادة",
  "sortOrder": 1
}
```

#### `PUT /categories/:id`
Update category — 🛡️ Admin

#### `DELETE /categories/:id`
Delete category (only if empty) — 🛡️ Admin

#### `POST /categories/:id/image`
Upload category image — 🛡️ Admin

multipart: `image` — Image file

#### `POST /categories/sub`
Create sub-category — 🛡️ Admin

```json
{
  "categoryId": 1,
  "name": "طب العيون",
  "nameEn": "Ophthalmology",
  "keywords": "عيون,طبيب عيون,نظارات"
}
```

#### `PUT /categories/sub/:id`
Update sub-category — 🛡️ Admin

#### `DELETE /categories/sub/:id`
Delete sub-category — 🛡️ Admin

### Cities

#### `GET /cities`
All cities with business counts — 🌐 Public (+token)

Query: `includeInactive` (admin only: true)

#### `GET /cities/:id`
City by id or slug — 🌐 Public

#### `POST /cities`
Create city — 🛡️ Admin

```json
{
  "name": "اللاذقية",
  "nameEn": "Latakia",
  "state": "اللاذقية",
  "country": "سوريا",
  "latitude": 35.5317,
  "longitude": 35.7915
}
```

#### `PUT /cities/:id`
Update city — 🛡️ Admin

#### `DELETE /cities/:id`
Delete city (only if empty) — 🛡️ Admin

### Reviews

#### `GET /reviews/my`
My reviews — 🔐 User

#### `GET /reviews/owner`
Reviews on my businesses (owner inbox) — 🔐 User

Query: `businessId` (uuid), `unanswered` (true)

#### `GET /reviews/admin/all`
All reviews (moderation) — 🛡️ Admin

Query: `hidden` (true|false), `businessId` (uuid), `rating` (1-5)

#### `PUT /reviews/:id`
Edit my review — 🔐 User

```json
{
  "rating": 4,
  "content": "..."
}
```

#### `DELETE /reviews/:id`
Delete my review (admin: any) — 🔐 User

#### `POST /reviews/:id/reply`
Owner reply (create/replace) — 🏪 Owner/Admin

```json
{
  "reply": "شكراً لك"
}
```

#### `DELETE /reviews/:id/reply`
Remove owner reply — 🏪 Owner/Admin

#### `POST /reviews/:id/like`
Toggle "helpful" — 🔐 User

#### `PATCH /reviews/:id/visibility`
Hide / show review — 🛡️ Admin

```json
{
  "isHidden": true
}
```

### Favorites

#### `GET /favorites`
My favorites — 🔐 User

#### `POST /favorites/:businessId`
Toggle favorite — 🔐 User

#### `PUT /favorites/:businessId`
Add favorite (idempotent) — 🔐 User

#### `DELETE /favorites/:businessId`
Remove favorite — 🔐 User

#### `GET /favorites/:businessId/check`
Is favorite? — 🔐 User

### Reports

#### `GET /reports`
All reports — 🛡️ Admin

Query: `status` (pending|reviewed|resolved|dismissed)

#### `PATCH /reports/:id/status`
Update report status — 🛡️ Admin

```json
{
  "status": "resolved",
  "adminNote": "..."
}
```

### Claims

#### `GET /claims/my`
My ownership claims — 🔐 User

#### `GET /claims`
All claims — 🛡️ Admin

Query: `status` (pending|approved|rejected)

#### `PATCH /claims/:id`
Approve / reject claim (approve → user becomes owner) — 🛡️ Admin

```json
{
  "status": "approved",
  "adminNote": ""
}
```

### Notifications

#### `GET /notifications`
My notifications — 🔐 User

Query: `unread` (true)

#### `GET /notifications/unread-count`
Unread badge count — 🔐 User

#### `PATCH /notifications/read-all`
Mark all as read — 🔐 User

#### `PATCH /notifications/:id/read`
Mark one as read — 🔐 User

#### `DELETE /notifications/:id`
Delete notification — 🔐 User

### Contact

#### `POST /contact`
Send a message to the platform team — 🌐 Public (+token)

```json
{
  "name": "Fadi",
  "email": "a@b.com",
  "phone": "",
  "subject": "اقتراح",
  "message": "نص الرسالة..."
}
```

#### `GET /contact`
Inbox — 🛡️ Admin

Query: `unread` (true)

#### `PATCH /contact/:id`
Mark read/unread — 🛡️ Admin

```json
{
  "isRead": true
}
```

#### `DELETE /contact/:id`
Delete message — 🛡️ Admin

### Advertisements

#### `GET /advertisements/active`
Active ads — 🌐 Public

Query: `placement` (home_slider|homepage_banner|search_results|category_page|business_details|sidebar), `cityId`, `categoryId`

#### `POST /advertisements/:id/click`
Track click — 🌐 Public

#### `POST /advertisements/:id/impression`
Track impression — 🌐 Public

#### `GET /advertisements/my`
My ad requests — 🔐 User

#### `POST /advertisements/request`
Request an ad (owner) - pending until admin activates — 🔐 User

multipart: `image` — banner image file, `title` — text, `placement` — home_slider, `startDate` — ISO, `endDate` — ISO, `businessId` — uuid, `contactPhone` — 

#### `GET /advertisements`
All ads — 🛡️ Admin

Query: `status`, `placement`

#### `POST /advertisements`
Create ad (JSON or multipart with "image") — 🛡️ Admin

```json
{
  "title": "عرض خاص",
  "placement": "home_slider",
  "startDate": "2026-11-01",
  "endDate": "2026-12-01",
  "targetUrl": "https://...",
  "imageUrl": "https://...",
  "priority": 10,
  "cityId": null,
  "categoryId": null,
  "businessId": null,
  "status": "active"
}
```

#### `PUT /advertisements/:id`
Update ad / approve request (status=active) — 🛡️ Admin

#### `DELETE /advertisements/:id`
Delete ad — 🛡️ Admin

### Featured (paid placement)

#### `GET /featured/active`
Currently featured businesses — 🌐 Public

Query: `cityId`, `categoryId`

#### `GET /featured/my`
My featured requests — 🔐 User

#### `POST /featured/request`
Request featuring my business — 🔐 User

```json
{
  "businessId": "uuid",
  "startDate": "2026-11-01",
  "endDate": "2026-12-01",
  "note": "أرغب بباقة شهر"
}
```

#### `GET /featured`
All featured entries — 🛡️ Admin

Query: `status` (pending|active|rejected|expired)

#### `POST /featured`
Feature a business — 🛡️ Admin

```json
{
  "businessId": "uuid",
  "startDate": "2026-11-01",
  "endDate": "2026-12-01",
  "priority": 5,
  "price": 50000
}
```

#### `PUT /featured/:id`
Update / approve request — 🛡️ Admin

```json
{
  "status": "active"
}
```

#### `DELETE /featured/:id`
Remove featured entry — 🛡️ Admin

### Admin dashboard

#### `GET /admin/dashboard/stats`
Totals, pending actions, 12-month charts, top/recent businesses — 🛡️ Admin

#### `GET /admin/dashboard/searches`
Top searches & zero-result searches — 🛡️ Admin

Query: `days` (30)

#### `GET /admin/audit-logs`
Audit trail of write actions — 🛡️ Admin

Query: `action`, `userId`
