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

export const loadProfilePage = memoizeRouteLoader(() =>
  import('@/pages/common/ProfilePage').then((module) => ({ default: module.ProfilePage })),
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

const exactRouteLoaders: Record<string, RouteLoader> = {
  '/browse': loadBrowsePage,
  '/cart': loadCartPage,
  '/login': loadLoginPage,
  '/notifications': loadNotificationsPage,
  '/orders': loadOrderHistoryPage,
  '/profile': loadProfilePage,
  '/register': loadRegisterPage,
  '/rider': loadRiderDashboardPage,
  '/rider/deliveries': loadRiderDashboardPage,
  '/seller': loadSellerDashboardPage,
  '/seller/menu': loadMenuManagementPage,
  '/seller/orders': loadOrderManagementPage,
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
  const commonLoaders = [loadNotificationsPage, loadProfilePage];

  if (!role) {
    return [loadLoginPage, loadRegisterPage];
  }

  switch (role) {
    case 'seller':
      return [
        loadSellerDashboardPage,
        loadMenuManagementPage,
        loadOrderManagementPage,
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
        ...commonLoaders,
      ];
  }
}
