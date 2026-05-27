import { Suspense, lazy } from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { RouteLoadingScreen } from './components/layout/RouteLoadingScreen';
import { RouteWarmup } from './components/layout/RouteWarmup';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import {
  loadActiveDeliveryPage,
  loadBrowsePage,
  loadCartPage,
  loadLoginPage,
  loadMenuManagementPage,
  loadNotificationsPage,
  loadOrderHistoryPage,
  loadOrderManagementPage,
  loadOrderTrackingPage,
  loadProfilePage,
  loadRegisterPage,
  loadRiderDashboardPage,
  loadSellerDashboardPage,
  loadVendorMenuPage,
} from '@/routes/loaders';

const LoginPage = lazy(loadLoginPage);
const RegisterPage = lazy(loadRegisterPage);
const NotificationsPage = lazy(loadNotificationsPage);
const ProfilePage = lazy(loadProfilePage);
const BrowseVendorsPagePremium = lazy(loadBrowsePage);
const CartPage = lazy(loadCartPage);
const OrderHistoryPage = lazy(loadOrderHistoryPage);
const OrderTrackingPage = lazy(loadOrderTrackingPage);
const VendorMenuPage = lazy(loadVendorMenuPage);
const ActiveDeliveryPage = lazy(loadActiveDeliveryPage);
const RiderDashboard = lazy(loadRiderDashboardPage);
const MenuManagementPage = lazy(loadMenuManagementPage);
const OrderManagementPage = lazy(loadOrderManagementPage);
const SellerDashboard = lazy(loadSellerDashboardPage);

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
            <RouteWarmup />
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </MotionConfig>
    </LazyMotion>
  );
}

export default App;
