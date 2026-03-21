import { Suspense, lazy } from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { RouteLoadingScreen } from './components/layout/RouteLoadingScreen';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useAuth } from '@/hooks/useAuth';

const LoginPage = lazy(() =>
  import('./pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('./pages/auth/RegisterPage').then((module) => ({ default: module.RegisterPage })),
);
const NotificationsPage = lazy(() =>
  import('./pages/common/NotificationsPage').then((module) => ({
    default: module.NotificationsPage,
  })),
);
const ProfilePage = lazy(() =>
  import('./pages/common/ProfilePage').then((module) => ({ default: module.ProfilePage })),
);
const BrowseVendorsPagePremium = lazy(() =>
  import('./pages/customer/BrowseVendorsPagePremium').then((module) => ({
    default: module.BrowseVendorsPagePremium,
  })),
);
const CartPage = lazy(() =>
  import('./pages/customer/CartPage').then((module) => ({ default: module.CartPage })),
);
const OrderHistoryPage = lazy(() =>
  import('./pages/customer/OrderHistoryPage').then((module) => ({
    default: module.OrderHistoryPage,
  })),
);
const OrderTrackingPage = lazy(() =>
  import('./pages/customer/OrderTrackingPage').then((module) => ({
    default: module.OrderTrackingPage,
  })),
);
const VendorMenuPage = lazy(() =>
  import('./pages/customer/VendorMenuPage').then((module) => ({
    default: module.VendorMenuPage,
  })),
);
const ActiveDeliveryPage = lazy(() =>
  import('./pages/rider/ActiveDeliveryPage').then((module) => ({
    default: module.ActiveDeliveryPage,
  })),
);
const RiderDashboard = lazy(() =>
  import('./pages/rider/RiderDashboard').then((module) => ({
    default: module.RiderDashboard,
  })),
);
const MenuManagementPage = lazy(() =>
  import('./pages/seller/MenuManagementPage').then((module) => ({
    default: module.MenuManagementPage,
  })),
);
const OrderManagementPage = lazy(() =>
  import('./pages/seller/OrderManagementPage').then((module) => ({
    default: module.OrderManagementPage,
  })),
);
const SellerDashboard = lazy(() =>
  import('./pages/seller/SellerDashboard').then((module) => ({
    default: module.SellerDashboard,
  })),
);

function HomeRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground bg-background">
        Preparing app...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'seller') {
    return <Navigate to="/seller" replace />;
  }

  if (user.role === 'rider') {
    return <Navigate to="/rider" replace />;
  }

  return <Navigate to="/browse" replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingScreen />}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
          <Route path="/browse" element={<BrowseVendorsPagePremium />} />
          <Route path="/vendor/:id" element={<VendorMenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/orders/:id" element={<OrderTrackingPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['seller']} />}>
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/seller/menu" element={<MenuManagementPage />} />
          <Route path="/seller/orders" element={<OrderManagementPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['rider']} />}>
          <Route path="/rider" element={<RiderDashboard />} />
          <Route path="/rider/deliveries" element={<RiderDashboard />} />
          <Route path="/rider/delivery/:id" element={<ActiveDeliveryPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </MotionConfig>
    </LazyMotion>
  );
}

export default App;
