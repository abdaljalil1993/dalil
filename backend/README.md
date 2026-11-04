# Dalilak API (backend)

Node.js · Express · TypeScript · TypeORM (**no migrations**) · MySQL2/MariaDB · JWT (access + rotating refresh) · express-validator · Multer · Cloudinary (optional, local fallback) · Redis (optional) · Winston · Helmet · CORS · Rate limiting · Swagger (auto-generated).

## Scripts
| | |
|---|---|
| `npm run dev` | dev server with reload |
| `npm run db:sync` | create/alter tables from entities once |
| `npm run seed [-- --demo]` | cities, categories (+synonyms), admin [+ demo data] — idempotent |
| `npm run docs` | regenerate `docs/API.md` + `api.http` from the route registry |
| `npm run build` / `npm start` | production |

## Structure
```
src/
  config/        env, database, logger, redis, cloudinary, swagger
  entities/      19 TypeORM entities + enums
  repositories/  typed repos + BusinessQuery (search / filters / geo / open-now / paid-first ordering)
  services/      business logic (Auth, Business, Review, Promotion, Moderation, Dashboard, Home, Search index, Storage, Mail, Notifications…)
  controllers/   thin HTTP layer
  dtos/          express-validator rules (only declared fields reach services → mass-assignment safe)
  routes/        documented routes (each route registers its own Swagger doc)
  middleware/    authenticate / optionalAuth, authorize (RBAC), validate, rate limiters, upload, audit, errors
  jobs/          promotions sync (featured flags, ad expiry), token cleanup
  seed/          db:sync + seed data (Syrian cities, 17 categories / 85 sub-categories)
database/schema.sql   production schema
docs/API.md           endpoint reference
```

## Roles
- **Guest**: home, categories, business details, reviews, featured, ads.
- **User**: + search, suggest, review/rate, like, favorites, reports, claim, submit business (→ pending), notifications, promotion requests.
- **Business owner**: automatically granted when a listing is approved / claim accepted. Manages own listings, media, hours, replies, stats.
- **Admin**: everything + moderation, catalog, users, ads, featured, insights, audit log. Admin-created listings are published directly.
