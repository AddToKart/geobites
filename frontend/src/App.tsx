import { Suspense, lazy } from 'react';
import { LazyMotion, MotionConfig, domAnimation, m, AnimatePresence } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { RouteLoadingScreen } from './components/layout/RouteLoadingScreen';
import { RouteWarmup } from './components/layout/RouteWarmup';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import {
  loadActiveDeliveryPage,
  loadBrowsePage,
  loadCartPage,
  loadLandingPage,
  loadLoginPage,
  loadMenuManagementPage,
  loadNotificationsPage,
  loadOrderHistoryPage,
  loadOrderManagementPage,
  loadOrderTrackingPage,
  loadSettingsPage,
  loadRegisterPage,
  loadRiderDashboardPage,
  loadSellerDashboardPage,
  loadSellerAnalyticsPage,
  loadSellerPayoutsPage,
  loadSellerKDSPage,
  loadSellerPromotionsPage,
  loadSellerRatingsPage,
  loadSellerWalletPage,
  loadVendorMenuPage,
  loadMockPaymentPage,
  loadWalletPage,
} from '@/routes/loaders';

const LandingPage = lazy(loadLandingPage);
const LoginPage = lazy(loadLoginPage);
const RegisterPage = lazy(loadRegisterPage);
const NotificationsPage = lazy(loadNotificationsPage);
const SettingsPage = lazy(loadSettingsPage);
const BrowseVendorsPagePremium = lazy(loadBrowsePage);
const CartPage = lazy(loadCartPage);
const OrderHistoryPage = lazy(loadOrderHistoryPage);
const OrderTrackingPage = lazy(loadOrderTrackingPage);
const VendorMenuPage = lazy(loadVendorMenuPage);
const MockPaymentPage = lazy(loadMockPaymentPage);
const WalletPage = lazy(loadWalletPage);
const ActiveDeliveryPage = lazy(loadActiveDeliveryPage);
const RiderDashboard = lazy(loadRiderDashboardPage);
const MenuManagementPage = lazy(loadMenuManagementPage);
const OrderManagementPage = lazy(loadOrderManagementPage);
const SellerDashboard = lazy(loadSellerDashboardPage);
const SellerAnalytics = lazy(loadSellerAnalyticsPage);
const SellerPayouts = lazy(loadSellerPayoutsPage);
const SellerKDS = lazy(loadSellerKDSPage);
const SellerPromotions = lazy(loadSellerPromotionsPage);
const SellerRatings = lazy(loadSellerRatingsPage);
const SellerWallet = lazy(loadSellerWalletPage);

function HomeRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <RouteLoadingScreen />;
  }

  if (!user) {
    return <LandingPage />;
  }

  if (user.role === 'seller') {
    return <Navigate to="/seller" replace />;
  }

  if (user.role === 'rider') {
    return <Navigate to="/rider" replace />;
  }

  return <Navigate to="/browse" replace />;
}

const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.15, ease: "easeOut" as const },
};

function AppRoutes() {
  const location = useLocation();

  return (
    <ErrorBoundary>
      <AnimatePresence mode="popLayout">
        <m.div key={location.pathname} {...pageTransition}>
          <Suspense fallback={<RouteLoadingScreen />}>
            <Routes location={location}>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
                <Route path="/browse" element={<BrowseVendorsPagePremium />} />
                <Route path="/vendor/:id" element={<VendorMenuPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="/orders/:id" element={<OrderTrackingPage />} />
                <Route path="/mock-payment" element={<MockPaymentPage />} />
                <Route path="/wallet" element={<WalletPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['seller']} />}>
                <Route path="/seller" element={<SellerDashboard />} />
                <Route path="/seller/menu" element={<MenuManagementPage />} />
                <Route path="/seller/orders" element={<OrderManagementPage />} />
                <Route path="/seller/analytics" element={<SellerAnalytics />} />
                <Route path="/seller/payouts" element={<SellerPayouts />} />
                <Route path="/seller/kds" element={<SellerKDS />} />
                <Route path="/seller/promotions" element={<SellerPromotions />} />
                <Route path="/seller/ratings" element={<SellerRatings />} />
                <Route path="/seller/wallet" element={<SellerWallet />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['rider']} />}>
                <Route path="/rider" element={<RiderDashboard />} />
                <Route path="/rider/deliveries" element={<RiderDashboard />} />
                <Route path="/rider/delivery/:id" element={<ActiveDeliveryPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </m.div>
      </AnimatePresence>
    </ErrorBoundary>
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
