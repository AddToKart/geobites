import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import {
  Bell,
  History,
  Home,
  LogOut,
  Menu,
  ShoppingBag,
  Truck,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { Stagger, StaggerItem } from '@/components/motion/Reveal';
import { preloadRoute } from '@/routes/loaders';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const CUSTOMER_NAV: NavItem[] = [
  { label: 'Browse', href: '/browse', icon: <Home className="w-5 h-5" /> },
  { label: 'Cart', href: '/cart', icon: <ShoppingBag className="w-5 h-5" /> },
  { label: 'Orders', href: '/orders', icon: <History className="w-5 h-5" /> },
  { label: 'Profile', href: '/profile', icon: <User className="w-5 h-5" /> },
];

const SELLER_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/seller', icon: <Home className="w-5 h-5" /> },
  { label: 'Menu', href: '/seller/menu', icon: <UtensilsCrossed className="w-5 h-5" /> },
  { label: 'Orders', href: '/seller/orders', icon: <ShoppingBag className="w-5 h-5" /> },
  { label: 'Profile', href: '/profile', icon: <User className="w-5 h-5" /> },
];

const RIDER_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/rider', icon: <Home className="w-5 h-5" /> },
  { label: 'Deliveries', href: '/rider/deliveries', icon: <Truck className="w-5 h-5" /> },
  { label: 'Profile', href: '/profile', icon: <User className="w-5 h-5" /> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const navItems = React.useMemo(() => {
    if (!user) {
      return [];
    }

    switch (user.role) {
      case 'seller':
        return SELLER_NAV;
      case 'rider':
        return RIDER_NAV;
      default:
        return CUSTOMER_NAV;
    }
  }, [user]);

  const initials = React.useMemo(() => {
    if (!user?.name) {
      return 'G';
    }

    return user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-80 p-5 md:block">
        <NavContent
          items={navItems}
          onLogout={handleLogout}
          userName={user.name}
          userRole={user.role}
          initials={initials}
        />
      </aside>

      <div className="flex min-h-screen flex-col md:ml-80">
        <header className="sticky top-0 z-40 flex h-[74px] items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md px-4 md:hidden dark:border-gray-800 dark:bg-gray-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-orange-500 text-sm font-bold text-white shadow-[0_4px_12px_rgba(249,115,22,0.3)]">
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Geobites</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact className="rounded-[14px]" />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-[14px] border-slate-200 dark:border-gray-700">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 border-none bg-transparent p-4 shadow-none">
                <NavContent
                  items={navItems}
                  onLogout={handleLogout}
                  onItemClick={() => setOpen(false)}
                  userName={user.name}
                  userRole={user.role}
                  initials={initials}
                />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="flex w-full flex-1 p-4 pb-28 md:p-8 md:pb-12">
          <div className="h-full w-full">{children}</div>
        </main>

        <MobileBottomNav items={navItems} />
      </div>
      <Toaster />
    </div>
  );
}

function PrefetchNavLink({
  to,
  onFocus,
  onMouseEnter,
  onTouchStart,
  ...props
}: Omit<React.ComponentProps<typeof NavLink>, 'to'> & { to: string }) {
  const handlePrefetch = React.useCallback(() => {
    void preloadRoute(to);
  }, [to]);

  return (
    <NavLink
      to={to}
      onFocus={(event) => {
        onFocus?.(event);

        if (!event.defaultPrevented) {
          handlePrefetch();
        }
      }}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);

        if (!event.defaultPrevented) {
          handlePrefetch();
        }
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event);

        if (!event.defaultPrevented) {
          handlePrefetch();
        }
      }}
      {...props}
    />
  );
}

function NavContent({
  items,
  onLogout,
  onItemClick,
  userName,
  userRole,
  initials,
}: {
  items: NavItem[];
  onLogout: () => void;
  onItemClick?: () => void;
  userName: string;
  userRole: string;
  initials: string;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[32px] bg-white shadow-[var(--shadow-panel)] dark:bg-gray-900 border border-slate-100 dark:border-gray-800">
      <div className="border-b border-slate-100 dark:border-gray-800 px-6 py-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-orange-100 text-orange-600 text-lg font-bold">
            {initials}
          </div>
          <div className="space-y-1">
            <span className="block text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Geobites
            </span>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{userName}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500">
              {userRole}
            </p>
          </div>
        </div>
      </div>

      <Stagger className="flex-1 space-y-2 overflow-y-auto px-4 py-6" delayChildren={0.02} stagger={0.05}>
        {items.map((item) => (
          <StaggerItem key={item.href} y={10}>
            <PrefetchNavLink
              to={item.href}
              onClick={onItemClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-4 rounded-[20px] px-4 py-3.5 text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-gray-800 dark:hover:text-white',
                )
              }
            >
              {item.icon}
              {item.label}
            </PrefetchNavLink>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="space-y-2 border-t border-slate-100 dark:border-gray-800 p-4">
        <div className="px-1 pb-2">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Appearance
          </p>
          <ThemeToggle className="w-full justify-between" />
        </div>
        <PrefetchNavLink
          to="/notifications"
          onClick={onItemClick}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-4 rounded-[20px] px-4 py-3.5 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-gray-800 dark:hover:text-white',
            )
          }
        >
          <Bell className="w-5 h-5" />
          Notifications
        </PrefetchNavLink>
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 rounded-[20px] px-4 py-3.5 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 h-auto"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}

function MobileBottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed inset-x-4 bottom-6 z-40 md:hidden">
      <div className="mx-auto flex h-[72px] max-w-md items-center justify-around rounded-[28px] bg-white/90 px-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:bg-gray-900/90 border border-slate-100 dark:border-gray-800">
        {items.slice(0, 4).map((item) => (
          <PrefetchNavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1.5 rounded-[22px] w-[72px] h-[56px] text-[11px] font-semibold transition-all duration-300',
                isActive
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 scale-105'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:scale-105',
              )
            }
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </PrefetchNavLink>
        ))}
      </div>
    </nav>
  );
}
