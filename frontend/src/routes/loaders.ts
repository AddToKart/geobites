type RouteModule<T = unknown> = Promise<{ default: T }>;
type RouteLoader<T = unknown> = () => RouteModule<T>;
type UserRole = 'customer' | 'seller' | 'rider';

function memoizeRouteLoader<T>(loader: RouteLoader<T>): RouteLoader<T> {
  let cachedPromise: RouteModule<T> | null = null;

  return () => {
    if (!cachedPromise) {
      cachedPromise = loader();
    }

    return cachedPromise;
  };
}

export const loadLoginPage = memoizeRouteLoader(() =>
  import('@/pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })),
);

export const loadRegisterPage = memoizeRouteLoader(() =>
  import('@/pages/auth/RegisterPage').then((module) => ({ default: module.RegisterPage })),
);

export const loadNotificationsPage = memoizeRouteLoader(() =>
  import('@/pages/common/NotificationsPage').then((module) => ({
    default: module.NotificationsPage,
  })),
);

export const loadSettingsPage = memoizeRouteLoader(() =>
  import('@/pages/common/SettingsPage').then((module) => ({ default: module.SettingsPage })),
);

export const loadBrowsePage = memoizeRouteLoader(() =>
  import('@/pages/customer/BrowseVendorsPagePremium').then((module) => ({
    default: module.BrowseVendorsPagePremium,
  })),
);

export const loadCartPage = memoizeRouteLoader(() =>
  import('@/pages/customer/CartPage').then((module) => ({ default: module.CartPage })),
);

export const loadOrderHistoryPage = memoizeRouteLoader(() =>
  import('@/pages/customer/OrderHistoryPage').then((module) => ({
    default: module.OrderHistoryPage,
  })),
);

export const loadOrderTrackingPage = memoizeRouteLoader(() =>
  import('@/pages/customer/OrderTrackingPage').then((module) => ({
    default: module.OrderTrackingPage,
  })),
);

export const loadVendorMenuPage = memoizeRouteLoader(() =>
  import('@/pages/customer/VendorMenuPage').then((module) => ({
    default: module.VendorMenuPage,
  })),
);

export const loadMockPaymentPage = memoizeRouteLoader(() =>
  import('@/pages/customer/MockPaymentPage').then((module) => ({
    default: module.MockPaymentPage,
  })),
);

export const loadLandingPage = memoizeRouteLoader(() =>
  import('@/pages/landing/LandingPage').then((module) => ({
    default: module.LandingPage,
  })),
);

export const loadWalletPage = memoizeRouteLoader(() =>
  import('@/pages/customer/WalletPage').then((module) => ({
    default: module.WalletPage,
  })),
);

export const loadFavoritesPage = memoizeRouteLoader(() =>
  import('@/pages/customer/FavoritesPage').then((module) => ({
    default: module.FavoritesPage,
  })),
);

export const loadSearchResultsPage = memoizeRouteLoader(() =>
  import('@/pages/customer/SearchResultsPage').then((module) => ({
    default: module.SearchResultsPage,
  })),
);

export const loadAboutPage = memoizeRouteLoader(() =>
  import('@/pages/landing/AboutPage').then((module) => ({
    default: module.AboutPage,
  })),
);

export const loadContactPage = memoizeRouteLoader(() =>
  import('@/pages/landing/ContactPage').then((module) => ({
    default: module.ContactPage,
  })),
);

export const loadTermsPage = memoizeRouteLoader(() =>
  import('@/pages/landing/TermsPage').then((module) => ({
    default: module.TermsPage,
  })),
);

export const loadPrivacyPage = memoizeRouteLoader(() =>
  import('@/pages/landing/PrivacyPage').then((module) => ({
    default: module.PrivacyPage,
  })),
);

export const loadPaymentReceiptPage = memoizeRouteLoader(() =>
  import('@/pages/customer/PaymentReceiptPage').then((module) => ({
    default: module.PaymentReceiptPage,
  })),
);

export const loadPaymentGcashPage = memoizeRouteLoader(() =>
  import('@/pages/customer/PaymentGcashPage').then((module) => ({
    default: module.PaymentGcashPage,
  })),
);

export const loadPaymentMayaPage = memoizeRouteLoader(() =>
  import('@/pages/customer/PaymentMayaPage').then((module) => ({
    default: module.PaymentMayaPage,
  })),
);

export const loadPaymentQrphPage = memoizeRouteLoader(() =>
  import('@/pages/customer/PaymentQrphPage').then((module) => ({
    default: module.PaymentQrphPage,
  })),
);

export const loadPaymentGeoPayPage = memoizeRouteLoader(() =>
  import('@/pages/customer/PaymentGeoPayPage').then((module) => ({
    default: module.PaymentGeoPayPage,
  })),
);

export const loadActiveDeliveryPage = memoizeRouteLoader(() =>
  import('@/pages/rider/ActiveDeliveryPage').then((module) => ({
    default: module.ActiveDeliveryPage,
  })),
);

export const loadRiderDashboardPage = memoizeRouteLoader(() =>
  import('@/pages/rider/RiderDashboard').then((module) => ({
    default: module.RiderDashboard,
  })),
);

export const loadMenuManagementPage = memoizeRouteLoader(() =>
  import('@/pages/seller/MenuManagementPage').then((module) => ({
    default: module.MenuManagementPage,
  })),
);

export const loadOrderManagementPage = memoizeRouteLoader(() =>
  import('@/pages/seller/OrderManagementPage').then((module) => ({
    default: module.OrderManagementPage,
  })),
);

export const loadSellerDashboardPage = memoizeRouteLoader(() =>
  import('@/pages/seller/SellerDashboard').then((module) => ({
    default: module.SellerDashboard,
  })),
);

export const loadSellerAnalyticsPage = memoizeRouteLoader(() =>
  import('@/pages/seller/SellerAnalytics').then((module) => ({
    default: module.SellerAnalytics,
  })),
);

export const loadSellerPayoutsPage = memoizeRouteLoader(() =>
  import('@/pages/seller/SellerPayouts').then((module) => ({
    default: module.SellerPayouts,
  })),
);

export const loadSellerKDSPage = memoizeRouteLoader(() =>
  import('@/pages/seller/SellerKDS').then((module) => ({
    default: module.SellerKDS,
  })),
);

export const loadSellerPOSPage = memoizeRouteLoader(() =>
  import('@/pages/seller/SellerPOS').then((module) => ({
    default: module.SellerPOS,
  })),
);

export const loadSellerPromotionsPage = memoizeRouteLoader(() =>
  import('@/pages/seller/SellerPromotions').then((module) => ({
    default: module.SellerPromotions,
  })),
);

export const loadSellerRatingsPage = memoizeRouteLoader(() =>
  import('@/pages/seller/SellerRatings').then((module) => ({
    default: module.SellerRatings,
  })),
);

export const loadSellerVouchersPage = memoizeRouteLoader(() =>
  import('@/pages/seller/SellerVouchersPage').then((module) => ({
    default: module.SellerVouchersPage,
  })),
);

export const loadSellerWalletPage = memoizeRouteLoader(() =>
  import('@/pages/seller/SellerWalletPage').then((module) => ({
    default: module.SellerWalletPage,
  })),
);



const exactRouteLoaders: Record<string, RouteLoader> = {
  '/': loadLandingPage,
  '/browse': loadBrowsePage,
  '/cart': loadCartPage,
  '/login': loadLoginPage,
  '/notifications': loadNotificationsPage,
  '/orders': loadOrderHistoryPage,
  '/settings': loadSettingsPage,
  '/register': loadRegisterPage,
  '/rider': loadRiderDashboardPage,
  '/rider/deliveries': loadRiderDashboardPage,
  '/seller': loadSellerDashboardPage,
  '/seller/menu': loadMenuManagementPage,
  '/seller/orders': loadOrderManagementPage,
  '/seller/analytics': loadSellerAnalyticsPage,
  '/seller/payouts': loadSellerPayoutsPage,
  '/seller/kds': loadSellerKDSPage,
  '/seller/pos': loadSellerPOSPage,
  '/seller/promotions': loadSellerPromotionsPage,
  '/seller/vouchers': loadSellerVouchersPage,
  '/seller/ratings': loadSellerRatingsPage,
  '/seller/wallet': loadSellerWalletPage,
  '/mock-payment': loadMockPaymentPage,
  '/wallet': loadWalletPage,
  '/favorites': loadFavoritesPage,
  '/search': loadSearchResultsPage,
  '/about': loadAboutPage,
  '/contact': loadContactPage,
  '/terms': loadTermsPage,
  '/privacy': loadPrivacyPage,
  '/receipt/:orderId': loadPaymentReceiptPage,
  '/payment/gcash': loadPaymentGcashPage,
  '/payment/maya': loadPaymentMayaPage,
  '/payment/qrph': loadPaymentQrphPage,
  '/payment/geopay': loadPaymentGeoPayPage,
};

const dynamicRouteLoaders: Array<{
  load: RouteLoader;
  matches: (pathname: string) => boolean;
}> = [
  {
    load: loadVendorMenuPage,
    matches: (pathname) => /^\/vendor\/[^/]+$/.test(pathname),
  },
  {
    load: loadOrderTrackingPage,
    matches: (pathname) => /^\/orders\/[^/]+$/.test(pathname),
  },
  {
    load: loadActiveDeliveryPage,
    matches: (pathname) => /^\/rider\/delivery\/[^/]+$/.test(pathname),
  },
  {
    load: loadPaymentReceiptPage,
    matches: (pathname) => /^\/receipt\/[^/]+$/.test(pathname),
  },
  {
    load: loadPaymentGcashPage,
    matches: (pathname) => pathname === '/payment/gcash',
  },
  {
    load: loadPaymentMayaPage,
    matches: (pathname) => pathname === '/payment/maya',
  },
  {
    load: loadPaymentQrphPage,
    matches: (pathname) => pathname === '/payment/qrph',
  },
  {
    load: loadPaymentGeoPayPage,
    matches: (pathname) => pathname === '/payment/geopay',
  },
];

function normalizePathname(pathname: string) {
  const withoutQuery = pathname.replace(/[?#].*$/, '');
  const normalized = withoutQuery.replace(/\/+$/, '');

  return normalized || '/';
}

export function preloadRoute(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);
  const exactLoader = exactRouteLoaders[normalizedPathname];

  if (exactLoader) {
    return exactLoader();
  }

  const dynamicLoader = dynamicRouteLoaders.find(({ matches }) => matches(normalizedPathname));

  return dynamicLoader?.load() ?? null;
}

export function getWarmupLoadersForRole(role: UserRole | null) {
  const commonLoaders = [loadNotificationsPage, loadSettingsPage];

  if (!role) {
    return [loadLandingPage, loadAboutPage, loadContactPage, loadTermsPage, loadPrivacyPage, loadLoginPage, loadRegisterPage];
  }

  switch (role) {
    case 'seller':
      return [
        loadSellerDashboardPage,
        loadMenuManagementPage,
        loadOrderManagementPage,
        loadSellerAnalyticsPage,
        loadSellerPayoutsPage,
        loadSellerWalletPage,
        loadSellerKDSPage,
        loadSellerPOSPage,
        loadSellerPromotionsPage,
        loadSellerVouchersPage,
        loadSellerRatingsPage,
        ...commonLoaders,
      ];
    case 'rider':
      return [loadRiderDashboardPage, loadActiveDeliveryPage, ...commonLoaders];
    default:
      return [
        loadBrowsePage,
        loadVendorMenuPage,
        loadCartPage,
        loadOrderHistoryPage,
        loadOrderTrackingPage,
        loadWalletPage,
        loadMockPaymentPage,
        loadFavoritesPage,
        loadSearchResultsPage,
        loadPaymentReceiptPage,
        loadPaymentGcashPage,
        loadPaymentMayaPage,
        loadPaymentQrphPage,
        loadPaymentGeoPayPage,
        ...commonLoaders,
      ];
  }
}
