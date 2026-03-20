import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { NotificationsPage } from './pages/common/NotificationsPage';
import { ProfilePage } from './pages/common/ProfilePage';
import { BrowseVendorsPage } from './pages/customer/BrowseVendorsPage';
import { CartPage } from './pages/customer/CartPage';
import { OrderHistoryPage } from './pages/customer/OrderHistoryPage';
import { OrderTrackingPage } from './pages/customer/OrderTrackingPage';
import { VendorMenuPage } from './pages/customer/VendorMenuPage';
import { ActiveDeliveryPage } from './pages/rider/ActiveDeliveryPage';
import { RiderDashboard } from './pages/rider/RiderDashboard';
import { MenuManagementPage } from './pages/seller/MenuManagementPage';
import { OrderManagementPage } from './pages/seller/OrderManagementPage';
import { SellerDashboard } from './pages/seller/SellerDashboard';

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
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
        <Route path="/browse" element={<BrowseVendorsPage />} />
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
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
