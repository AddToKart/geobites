import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
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
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { preloadRoute } from "@/routes/loaders";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const CUSTOMER_NAV: NavItem[] = [
  { label: "Browse", href: "/browse", icon: <Home className="w-5 h-5" /> },
  { label: "Cart", href: "/cart", icon: <ShoppingBag className="w-5 h-5" /> },
  { label: "Orders", href: "/orders", icon: <History className="w-5 h-5" /> },
  { label: "GeoPay", href: "/wallet", icon: <Wallet className="w-5 h-5" /> },
  { label: "Profile", href: "/profile", icon: <User className="w-5 h-5" /> },
];

const SELLER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/seller", icon: <Home className="w-5 h-5" /> },
  {
    label: "Menu",
    href: "/seller/menu",
    icon: <UtensilsCrossed className="w-5 h-5" />,
  },
  {
    label: "Orders",
    href: "/seller/orders",
    icon: <ShoppingBag className="w-5 h-5" />,
  },
  { label: "Profile", href: "/profile", icon: <User className="w-5 h-5" /> },
];

const RIDER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/rider", icon: <Home className="w-5 h-5" /> },
  {
    label: "Deliveries",
    href: "/rider/deliveries",
    icon: <Truck className="w-5 h-5" />,
  },
  { label: "Profile", href: "/profile", icon: <User className="w-5 h-5" /> },
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
      case "seller":
        return SELLER_NAV;
      case "rider":
        return RIDER_NAV;
      default:
        return CUSTOMER_NAV;
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login");
    }
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] relative">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-80 p-0 md:block border-r border-border bg-card shadow-[var(--shadow-panel)]">
        <NavContent
          items={navItems}
          onLogout={handleLogout}
          userName={user.name}
          userRole={user.role}
        />
      </aside>

      <div className="flex min-h-screen flex-col md:ml-80 relative z-10 w-full md:w-[calc(100%-20rem)]">
        <header className="fixed top-0 inset-x-0 z-50 flex h-[70px] items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-xl px-4 md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white shadow-glow shadow-primary/30">
              G
            </div>
            <div>
              <p className="text-[15px] font-bold tracking-tight text-foreground">
                Geobites
              </p>
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-primary">
                Santa Maria, Bulacan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle
              compact
              className="rounded-[18px] shadow-sm bg-card"
            />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-[18px] border-border shadow-sm bg-card"
                >
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-80 border-none bg-card p-0 shadow-2xl"
              >
                <NavContent
                  items={navItems}
                  onLogout={handleLogout}
                  onItemClick={() => setOpen(false)}
                  userName={user.name}
                  userRole={user.role}
                />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="flex w-full flex-1 pt-[70px] md:pt-0 px-4 md:px-8 pb-28 md:pb-12">
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
}: Omit<React.ComponentProps<typeof NavLink>, "to"> & { to: string }) {
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
}: {
  items: NavItem[];
  onLogout: () => void;
  onItemClick?: () => void;
  userName: string;
  userRole: string;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      <div className="border-b border-border px-6 py-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-primary to-primary-dark text-white text-lg font-bold shadow-glow shadow-primary/30">
            G
          </div>
          <div className="space-y-1">
            <span className="block text-xl font-bold tracking-tight text-foreground">
              Geobites
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Santa Maria, Bulacan
            </span>
            <p className="text-sm font-medium text-text-muted">
              {userName}
            </p>
            <p className="inline-block px-2.5 py-0.5 rounded-full bg-muted text-[10px] font-bold uppercase tracking-widest text-text-soft">
              {userRole}
            </p>
          </div>
        </div>
      </div>

      <Stagger
        className="flex-1 space-y-1 overflow-y-auto px-4 py-6"
        delayChildren={0.02}
        stagger={0.05}
      >
        {items.map((item) => (
          <StaggerItem key={item.href} y={10}>
            <PrefetchNavLink
              to={item.href}
              onClick={onItemClick}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 rounded-[20px] px-4 py-3.5 text-[15px] font-semibold transition-all duration-200",
                  isActive
                    ? "bg-accent text-primary shadow-sm"
                    : "text-text-muted hover:bg-accent hover:text-foreground",
                )
              }
            >
              {item.icon}
              {item.label}
            </PrefetchNavLink>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="space-y-2 border-t border-border p-4">
        <div className="px-1 pb-2">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Settings
          </p>
          <ThemeToggle className="w-full justify-between" />
        </div>
        <PrefetchNavLink
          to="/notifications"
          onClick={onItemClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-4 rounded-[20px] px-4 py-3.5 text-[15px] font-semibold transition-colors",
              isActive
                ? "bg-accent text-primary shadow-sm"
                : "text-text-muted hover:bg-accent hover:text-foreground",
            )
          }
        >
          <Bell className="w-5 h-5" />
          Notifications
        </PrefetchNavLink>
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 rounded-[20px] px-4 py-3.5 text-[15px] font-semibold text-text-muted hover:bg-danger-soft hover:text-danger h-auto"
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
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-card/90 backdrop-blur-xl border-t border-border/50 pb-safe overflow-x-auto">
      <div className="flex h-[64px] items-center justify-around px-2 min-w-max">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 w-16 h-14 text-[10px] font-bold transition-all duration-200",
                isActive
                  ? "text-foreground"
                  : "text-text-muted",
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "p-1.5 rounded-[16px] transition-colors",
                    isActive && "bg-primary/10 text-primary",
                  )}
                >
                  {item.icon}
                </div>
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
