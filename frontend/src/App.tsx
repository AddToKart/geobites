import { Suspense, lazy, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LazyMotion, MotionConfig, domAnimation, m, AnimatePresence } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { RouteLoadingScreen } from './components/layout/RouteLoadingScreen';
import { RouteWarmup } from './components/layout/RouteWarmup';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import type { ReactNode } from 'react';
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
  loadSellerVouchersPage,
  loadSellerRatingsPage,
  loadSellerWalletPage,
  loadVendorMenuPage,
  loadMockPaymentPage,
  loadWalletPage,
  loadFavoritesPage,
  loadSearchResultsPage,
  loadPaymentReceiptPage,
  loadPaymentGcashPage,
  loadPaymentMayaPage,
  loadPaymentQrphPage,
  loadPaymentGeoPayPage,
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
const FavoritesPage = lazy(loadFavoritesPage);
const SearchResultsPage = lazy(loadSearchResultsPage);
const PaymentReceiptPage = lazy(loadPaymentReceiptPage);
const PaymentGcashPage = lazy(loadPaymentGcashPage);
const PaymentMayaPage = lazy(loadPaymentMayaPage);
const PaymentQrphPage = lazy(loadPaymentQrphPage);
const PaymentGeoPayPage = lazy(loadPaymentGeoPayPage);
const ActiveDeliveryPage = lazy(loadActiveDeliveryPage);
const RiderDashboard = lazy(loadRiderDashboardPage);
const MenuManagementPage = lazy(loadMenuManagementPage);
const OrderManagementPage = lazy(loadOrderManagementPage);
const SellerDashboard = lazy(loadSellerDashboardPage);
const SellerAnalytics = lazy(loadSellerAnalyticsPage);
const SellerPayouts = lazy(loadSellerPayoutsPage);
const SellerKDS = lazy(loadSellerKDSPage);
const SellerPromotions = lazy(loadSellerPromotionsPage);
const SellerVouchers = lazy(loadSellerVouchersPage);
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.15, ease: "easeOut" as const },
};

function RouteGroup({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="popLayout">
      <m.div key={location.pathname} {...pageTransition}>
        <Suspense fallback={<RouteLoadingScreen />}>
          <Routes location={location}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/landing" element={<RouteGroup><LandingPage /></RouteGroup>} />
            <Route path="/login" element={<RouteGroup><LoginPage /></RouteGroup>} />
            <Route path="/register" element={<RouteGroup><RegisterPage /></RouteGroup>} />
            <Route path="/mock-payment" element={<RouteGroup><MockPaymentPage /></RouteGroup>} />

            <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
              <Route path="/browse" element={<RouteGroup><BrowseVendorsPagePremium /></RouteGroup>} />
              <Route path="/vendor/:id" element={<RouteGroup><VendorMenuPage /></RouteGroup>} />
              <Route path="/cart" element={<RouteGroup><CartPage /></RouteGroup>} />
              <Route path="/orders" element={<RouteGroup><OrderHistoryPage /></RouteGroup>} />
              <Route path="/orders/:id" element={<RouteGroup><OrderTrackingPage /></RouteGroup>} />
              <Route path="/favorites" element={<RouteGroup><FavoritesPage /></RouteGroup>} />
              <Route path="/search" element={<RouteGroup><SearchResultsPage /></RouteGroup>} />
              <Route path="/receipt/:orderId" element={<RouteGroup><PaymentReceiptPage /></RouteGroup>} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['customer', 'rider']} />}>
              <Route path="/wallet" element={<RouteGroup><WalletPage /></RouteGroup>} />
              <Route path="/payment/gcash" element={<RouteGroup><PaymentGcashPage /></RouteGroup>} />
              <Route path="/payment/maya" element={<RouteGroup><PaymentMayaPage /></RouteGroup>} />
              <Route path="/payment/qrph" element={<RouteGroup><PaymentQrphPage /></RouteGroup>} />
              <Route path="/payment/geopay" element={<RouteGroup><PaymentGeoPayPage /></RouteGroup>} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['seller']} />}>
              <Route path="/seller" element={<RouteGroup><SellerDashboard /></RouteGroup>} />
              <Route path="/seller/menu" element={<RouteGroup><MenuManagementPage /></RouteGroup>} />
              <Route path="/seller/orders" element={<RouteGroup><OrderManagementPage /></RouteGroup>} />
              <Route path="/seller/analytics" element={<RouteGroup><SellerAnalytics /></RouteGroup>} />
              <Route path="/seller/payouts" element={<RouteGroup><SellerPayouts /></RouteGroup>} />
              <Route path="/seller/kds" element={<RouteGroup><SellerKDS /></RouteGroup>} />
              <Route path="/seller/promotions" element={<RouteGroup><SellerPromotions /></RouteGroup>} />
              <Route path="/seller/vouchers" element={<RouteGroup><SellerVouchers /></RouteGroup>} />
              <Route path="/seller/ratings" element={<RouteGroup><SellerRatings /></RouteGroup>} />
              <Route path="/seller/wallet" element={<RouteGroup><SellerWallet /></RouteGroup>} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['rider']} />}>
              <Route path="/rider" element={<RouteGroup><RiderDashboard /></RouteGroup>} />
              <Route path="/rider/deliveries" element={<RouteGroup><RiderDashboard /></RouteGroup>} />
              <Route path="/rider/delivery/:id" element={<RouteGroup><ActiveDeliveryPage /></RouteGroup>} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/notifications" element={<RouteGroup><NotificationsPage /></RouteGroup>} />
              <Route path="/settings" element={<RouteGroup><SettingsPage /></RouteGroup>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </m.div>
    </AnimatePresence>
  );
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;
