# Dalilak Web

React 19 · TypeScript · Vite · MUI 5 (RTL via stylis-plugin-rtl) · TanStack Query · Zustand (persist) · React Hook Form + Zod · React Router 7 · Framer Motion · React-Leaflet (OpenStreetMap) · Recharts · Notistack · Day.js

```
src/
  api/         axios client (single-flight token refresh), services (every endpoint), types
  i18n/        ar.ts (default, RTL) + en.ts — useT(), useLocalName()
  theme/       design tokens + MUI theme (light/dark) + RTL cache
  store/       auth, prefs (locale, theme, city, view), ui (login prompt)
  hooks/       queries, auth guard, url filters, geolocation, notify
  components/  layout (Navbar, Footer, MobileNav, Dashboard), common, business, maps, forms
  pages/       public · auth · account · owner · admin
```
Change brand colors in `src/theme/theme.ts` (`brand`).

`npm run dev` · `npm run build` · `npm run preview`
