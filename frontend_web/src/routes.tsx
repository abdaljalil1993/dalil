import { lazy, Suspense, ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const P = (f: () => Promise<any>, name: string) => lazy(() => f().then((m) => ({ default: m[name] as React.ComponentType })));

// public
const Home = P(() => import('@/pages/public/Home'), 'Home');
const Categories = P(() => import('@/pages/public/Categories'), 'Categories');
const CategoryPage = P(() => import('@/pages/public/CategoryPage'), 'CategoryPage');
const SearchPage = P(() => import('@/pages/public/SearchPage'), 'SearchPage');
const BusinessPage = P(() => import('@/pages/public/BusinessPage'), 'BusinessPage');
const FeaturedPage = P(() => import('@/pages/public/FeaturedPage'), 'FeaturedPage');
const About = P(() => import('@/pages/public/StaticPages'), 'About');
const Contact = P(() => import('@/pages/public/StaticPages'), 'Contact');
const NotFound = P(() => import('@/pages/public/StaticPages'), 'NotFound');
// auth
const Login = P(() => import('@/pages/auth/AuthPages'), 'Login');
const Register = P(() => import('@/pages/auth/AuthPages'), 'Register');
const ForgotPassword = P(() => import('@/pages/auth/AuthPages'), 'ForgotPassword');
const ResetPassword = P(() => import('@/pages/auth/AuthPages'), 'ResetPassword');
// account
const Overview = P(() => import('@/pages/account/AccountPages'), 'Overview');
const Favorites = P(() => import('@/pages/account/AccountPages'), 'Favorites');
const MyReviews = P(() => import('@/pages/account/AccountPages'), 'MyReviews');
const Notifications = P(() => import('@/pages/account/AccountPages'), 'Notifications');
const Profile = P(() => import('@/pages/account/AccountPages'), 'Profile');
const Settings = P(() => import('@/pages/account/AccountPages'), 'Settings');
// owner
const MyBusinesses = P(() => import('@/pages/owner/MyBusinesses'), 'MyBusinesses');
const BusinessEditor = P(() => import('@/pages/owner/BusinessEditor'), 'BusinessEditor');
const OwnerReviews = P(() => import('@/pages/owner/OwnerReviews'), 'OwnerReviews');
const Promote = P(() => import('@/pages/owner/Promote'), 'Promote');
// admin
const AdminDashboard = P(() => import('@/pages/admin/AdminDashboard'), 'AdminDashboard');
const AdminBusinesses = P(() => import('@/pages/admin/AdminBusinesses'), 'AdminBusinesses');
const AdminCategories = P(() => import('@/pages/admin/AdminCatalog'), 'AdminCategories');
const AdminCities = P(() => import('@/pages/admin/AdminCatalog'), 'AdminCities');
const AdminUsers = P(() => import('@/pages/admin/AdminUsers'), 'AdminUsers');
const AdminReviews = P(() => import('@/pages/admin/AdminModeration'), 'AdminReviews');
const AdminReports = P(() => import('@/pages/admin/AdminModeration'), 'AdminReports');
const AdminClaims = P(() => import('@/pages/admin/AdminModeration'), 'AdminClaims');
const AdminMessages = P(() => import('@/pages/admin/AdminModeration'), 'AdminMessages');
const AdminAds = P(() => import('@/pages/admin/AdminPromotions'), 'AdminAds');
const AdminFeatured = P(() => import('@/pages/admin/AdminPromotions'), 'AdminFeatured');
const AdminInsights = P(() => import('@/pages/admin/AdminInsights'), 'AdminInsights');
const AdminAudit = P(() => import('@/pages/admin/AdminInsights'), 'AdminAudit');

const Loader = () => (
  <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
    <CircularProgress />
  </Box>
);

const RequireAuth = ({ children, admin = false }: { children: ReactNode; admin?: boolean }) => {
  const { accessToken, user } = useAuthStore();
  const location = useLocation();
  if (!accessToken || !user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const GuestOnly = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((s) => s.accessToken);
  return token ? <Navigate to="/" replace /> : <>{children}</>;
};

export const AppRoutes = () => (
  <Suspense fallback={<Loader />}>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="categories" element={<Categories />} />
        <Route path="c/:slug" element={<CategoryPage />} />
        <Route path="b/:slug" element={<BusinessPage />} />
        <Route path="featured" element={<FeaturedPage />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="search" element={<RequireAuth><SearchPage /></RequireAuth>} />
        <Route path="login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="register" element={<GuestOnly><Register /></GuestOnly>} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        {/* legacy paths from v1 */}
        <Route path="business/:slug" element={<LegacyBusiness />} />
        <Route path="categories/:slug" element={<LegacyCategory />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        <Route path="account" element={<Overview />} />
        <Route path="account/favorites" element={<Favorites />} />
        <Route path="account/reviews" element={<MyReviews />} />
        <Route path="account/notifications" element={<Notifications />} />
        <Route path="account/profile" element={<Profile />} />
        <Route path="account/settings" element={<Settings />} />
        <Route path="owner/businesses" element={<MyBusinesses />} />
        <Route path="owner/businesses/new" element={<BusinessEditor />} />
        <Route path="owner/businesses/:id" element={<BusinessEditor />} />
        <Route path="owner/reviews" element={<OwnerReviews />} />
        <Route path="owner/promote" element={<Promote />} />
        <Route path="admin" element={<RequireAuth admin><AdminDashboard /></RequireAuth>} />
        <Route path="admin/businesses" element={<RequireAuth admin><AdminBusinesses /></RequireAuth>} />
        <Route path="admin/categories" element={<RequireAuth admin><AdminCategories /></RequireAuth>} />
        <Route path="admin/cities" element={<RequireAuth admin><AdminCities /></RequireAuth>} />
        <Route path="admin/users" element={<RequireAuth admin><AdminUsers /></RequireAuth>} />
        <Route path="admin/reviews" element={<RequireAuth admin><AdminReviews /></RequireAuth>} />
        <Route path="admin/reports" element={<RequireAuth admin><AdminReports /></RequireAuth>} />
        <Route path="admin/claims" element={<RequireAuth admin><AdminClaims /></RequireAuth>} />
        <Route path="admin/messages" element={<RequireAuth admin><AdminMessages /></RequireAuth>} />
        <Route path="admin/ads" element={<RequireAuth admin><AdminAds /></RequireAuth>} />
        <Route path="admin/featured" element={<RequireAuth admin><AdminFeatured /></RequireAuth>} />
        <Route path="admin/insights" element={<RequireAuth admin><AdminInsights /></RequireAuth>} />
        <Route path="admin/audit" element={<RequireAuth admin><AdminAudit /></RequireAuth>} />
      </Route>
    </Routes>
  </Suspense>
);

function LegacyBusiness() {
  const { slug } = useParams();
  return <Navigate to={`/b/${slug}`} replace />;
}
function LegacyCategory() {
  const { slug } = useParams();
  return <Navigate to={`/c/${slug}`} replace />;
}
