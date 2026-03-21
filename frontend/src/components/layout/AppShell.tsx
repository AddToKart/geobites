import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
import { AnimatePresence, m } from 'framer-motion';
import { Stagger, StaggerItem } from '@/components/motion/Reveal';

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
  const location = useLocation();
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
        <header className="sticky top-0 z-40 flex h-[74px] items-center justify-between border-b border-[color:var(--color-shell-border)] bg-[color:var(--color-shell-header)] px-4 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[color:var(--color-primary)] text-sm font-semibold text-white">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-[color:var(--color-text)]">Geobites</p>
              <p className="text-xs capitalize text-[color:var(--color-text-soft)]">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 border-none bg-transparent p-3 shadow-none">
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

        <main className="mx-auto flex w-full max-w-[92rem] flex-1 p-4 pb-24 md:p-8 md:pb-8">
          <AnimatePresence initial={false} mode="wait">
            <m.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full"
            >
              {children}
            </m.div>
          </AnimatePresence>
        </main>

        <MobileBottomNav items={navItems} />
      </div>
      <Toaster />
    </div>
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
    <div className="flex h-full flex-col overflow-hidden rounded-[30px] border border-[color:var(--color-shell-border)] bg-[color:var(--color-shell-bg)] shadow-[var(--shadow-panel)] backdrop-blur-md">
      <div className="border-b border-[color:var(--color-border)] px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[color:var(--color-primary)] text-lg font-semibold text-white">
            {initials}
          </div>
          <div className="space-y-1">
            <span className="block text-xl font-semibold text-[color:var(--color-text)]">
              Geobites
            </span>
            <p className="text-sm text-[color:var(--color-text-soft)]">{userName}</p>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--color-primary-dark)]">
              {userRole}
            </p>
          </div>
        </div>
      </div>

      <Stagger className="flex-1 space-y-2 overflow-y-auto px-4 py-6" delayChildren={0.02} stagger={0.05}>
        {items.map((item) => (
          <StaggerItem key={item.href} y={10}>
            <NavLink
              to={item.href}
              onClick={onItemClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)] shadow-[inset_0_0_0_1px_rgba(235,106,45,0.12)]'
                    : 'text-[color:var(--color-text-soft)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text)]',
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="space-y-2 border-t border-[color:var(--color-border)] p-4">
        <div className="px-1 pb-1">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
            Appearance
          </p>
          <ThemeToggle className="w-full justify-between" />
        </div>
        <NavLink
          to="/notifications"
          onClick={onItemClick}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]'
                : 'text-[color:var(--color-text-soft)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text)]',
            )
          }
        >
          <Bell className="w-5 h-5" />
          Notifications
        </NavLink>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-[color:var(--color-text-soft)] hover:bg-[color:var(--color-danger-soft)] hover:text-[color:var(--color-danger)]"
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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--color-shell-border)] bg-[color:var(--color-shell-nav)] px-3 py-3 backdrop-blur-md md:hidden">
      <div
        className={cn(
          'mx-auto grid max-w-xl gap-2',
          items.length <= 3 ? 'grid-cols-3' : 'grid-cols-4',
        )}
      >
        {items.slice(0, 4).map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-all duration-200',
                isActive
                  ? 'bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)] shadow-[inset_0_0_0_1px_rgba(235,106,45,0.12)]'
                  : 'text-[color:var(--color-text-soft)] hover:bg-[color:var(--color-surface)]/72 hover:text-[color:var(--color-text)]',
              )
            }
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
