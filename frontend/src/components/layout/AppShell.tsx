import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  Bell,
  ChefHat,
  History,
  Home,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  ShoppingBag,
  TrendingUp,
  Truck,
  User,
  UtensilsCrossed,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { preloadRoute } from "@/routes/loaders";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const CUSTOMER_NAV: NavItem[] = [
  { label: "Browse", href: "/browse", icon: <Home className="w-5 h-5" /> },
  { label: "Cart", href: "/cart", icon: <ShoppingBag className="w-5 h-5" /> },
  { label: "History", href: "/orders", icon: <History className="w-5 h-5" /> },
  { label: "Wallet", href: "/wallet", icon: <Wallet className="w-5 h-5" /> },
  { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" /> },
];

const SELLER_NAV: NavItem[] = [
  { label: "Overview", href: "/seller", icon: <Home className="w-5 h-5" /> },
  {
    label: "KDS",
    href: "/seller/kds",
    icon: <ChefHat className="w-5 h-5" />,
  },
  {
    label: "Catalog",
    href: "/seller/menu",
    icon: <UtensilsCrossed className="w-5 h-5" />,
  },
  {
    label: "Orders",
    href: "/seller/orders",
    icon: <ShoppingBag className="w-5 h-5" />,
  },
  {
    label: "Promotions",
    href: "/seller/promotions",
    icon: <Megaphone className="w-5 h-5" />,
  },
  {
    label: "Reviews",
    href: "/seller/ratings",
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    label: "Analytics",
    href: "/seller/analytics",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    label: "Wallet",
    href: "/seller/wallet",
    icon: <Wallet className="w-5 h-5" />,
  },
  { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" /> },
];

const RIDER_NAV: NavItem[] = [
  { label: "Dispatch", href: "/rider", icon: <Home className="w-5 h-5" /> },
  {
    label: "Routes",
    href: "/rider/deliveries",
    icon: <Truck className="w-5 h-5" />,
  },
  { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" /> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    return localStorage.getItem("geobites-sidebar-collapsed") === "true";
  });

  const toggleSidebar = React.useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("geobites-sidebar-collapsed", String(next));
      return next;
    });
  }, []);

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
    <div className="min-h-screen bg-background relative font-sans selection:bg-primary selection:text-primary-foreground">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 hidden p-0 md:block border-r border-border bg-background transition-[width] duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <NavContent
          items={navItems}
          onLogout={handleLogout}
          userName={user.name}
          userRole={user.role}
          isCollapsed={isCollapsed}
        />
        {/* Floating Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute top-24 -right-3.5 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-secondary/80 shadow-[var(--shadow-soft)] transition-colors cursor-pointer"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      <div className={cn(
        "flex min-h-screen flex-col relative z-10 w-full transition-[margin-left,width] duration-300 ease-in-out",
        isCollapsed ? "md:ml-20 md:w-[calc(100%-5rem)]" : "md:ml-72 md:w-[calc(100%-18rem)]"
      )}>
        {/* Stark Mobile Header */}
        <header className="fixed top-0 inset-x-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center bg-foreground text-background">
              <span className="font-bold text-lg">G</span>
            </div>
            <div>
              <p className="text-sm font-bold tracking-tighter text-foreground uppercase">
                Geobites
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle compact className="h-8 w-8 rounded-none border border-border" />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="flex h-8 w-8 items-center justify-center border border-border bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors">
                  <Menu className="w-4 h-4" />
                  <span className="sr-only">Toggle menu</span>
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 border-r border-border bg-background p-0 shadow-none"
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

        <main className="flex w-full flex-1 pt-16 md:pt-0 pb-20 md:pb-0">
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
  isCollapsed = false,
}: {
  items: NavItem[];
  onLogout: () => void;
  onItemClick?: () => void;
  userName: string;
  userRole: string;
  isCollapsed?: boolean;
}) {
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Brand & User Block */}
      <div className={cn(
        "border-b border-border flex flex-col gap-6 transition-[padding] duration-300 ease-in-out",
        isCollapsed ? "p-4" : "p-6"
      )}>
        <div className="flex items-center gap-3 w-full">
          <div className="flex h-12 w-12 items-center justify-center bg-primary text-primary-foreground shrink-0">
            <UtensilsCrossed className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div className={cn(
            "transition-[max-width,opacity] duration-300 ease-in-out overflow-hidden whitespace-nowrap flex flex-col",
            isCollapsed ? "max-w-0 opacity-0 pointer-events-none" : "max-w-[150px] opacity-100"
          )}>
            <span className="block text-2xl font-medium tracking-tighter text-foreground leading-none">
              Geobites
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
              Santa Maria
            </span>
          </div>
        </div>

        <div className={cn(
          "border border-border transition-[width,height,padding,border-radius] duration-300 ease-in-out flex items-center overflow-hidden shrink-0",
          isCollapsed
            ? "rounded-full w-10 h-10 p-0 justify-center bg-primary/10 text-primary font-bold"
            : "w-full p-4 gap-3 rounded-none bg-secondary/20"
        )}
        title={isCollapsed ? `${userName} (${userRole} Account)` : undefined}
        >
          {/* Avatar container */}
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm uppercase transition-[background-color] duration-300 ease-in-out",
            isCollapsed ? "bg-transparent text-primary" : "bg-primary/10 text-primary font-bold"
          )}>
            {userName.charAt(0) || "U"}
          </div>
          {/* Text details */}
          <div className={cn(
            "transition-[max-width,opacity] duration-300 ease-in-out overflow-hidden whitespace-nowrap flex flex-col min-w-0",
            isCollapsed ? "max-w-0 opacity-0 pointer-events-none" : "max-w-[150px] opacity-100"
          )}>
            <p className="text-sm font-medium tracking-tight text-foreground truncate">
              {userName}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1">
              {userRole} Account
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="flex flex-col">
          {items.map((item) => (
            <PrefetchNavLink
              key={item.href}
              to={item.href}
              onClick={onItemClick}
              end={item.href === "/seller" || item.href === "/rider" || item.href === "/browse"}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center transition-[padding,color] duration-300 ease-in-out border-l-4 py-4 text-sm font-bold uppercase tracking-widest",
                  isCollapsed ? "pl-[26px] pr-0 gap-0" : "pl-8 pr-4 gap-4",
                  isActive
                    ? "border-primary bg-secondary/10 text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-secondary/5 hover:text-foreground hover:border-foreground/30",
                )
              }
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={cn(
                "transition-[max-width,opacity] duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                isCollapsed ? "max-w-0 opacity-0 pointer-events-none" : "max-w-[150px] opacity-100"
              )}>
                {item.label}
              </span>
            </PrefetchNavLink>
          ))}
        </nav>
      </div>

      {/* Footer Navigation */}
      <div className={cn(
        "border-t border-border space-y-4 transition-[padding] duration-300 ease-in-out",
        isCollapsed ? "p-4 flex flex-col items-center" : "p-6"
      )}>
        <div className="flex items-center justify-between w-full">
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-[max-width,opacity] duration-300 ease-in-out overflow-hidden whitespace-nowrap pl-2",
            isCollapsed ? "max-w-0 opacity-0 pointer-events-none" : "max-w-[100px] opacity-100"
          )}>
            Theme
          </span>
          <ThemeToggle
            compact={isCollapsed}
            className={cn(
              "h-8 rounded-none border border-border transition-[width] duration-300 ease-in-out",
              isCollapsed ? "w-12" : "w-28"
            )}
          />
        </div>
        
        <PrefetchNavLink
          to="/notifications"
          onClick={onItemClick}
          title={isCollapsed ? "Alerts" : undefined}
          className={({ isActive }) =>
            cn(
              "flex items-center transition-[padding,color] duration-300 ease-in-out w-full py-2 text-sm font-bold uppercase tracking-widest",
              isCollapsed ? "pl-[14px] pr-0 gap-0" : "pl-2 pr-2 gap-3",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )
          }
        >
          <Bell className="w-5 h-5 shrink-0" />
          <span className={cn(
            "transition-[max-width,opacity] duration-300 ease-in-out overflow-hidden whitespace-nowrap",
            isCollapsed ? "max-w-0 opacity-0 pointer-events-none" : "max-w-[150px] opacity-100"
          )}>
            Alerts
          </span>
        </PrefetchNavLink>
        
        <button
          onClick={onLogout}
          title={isCollapsed ? "Sign out" : undefined}
          className={cn(
            "flex items-center text-red-500 hover:text-red-600 transition-[padding,color] duration-300 ease-in-out w-full py-2 text-sm font-bold uppercase tracking-widest",
            isCollapsed ? "pl-[14px] pr-0 gap-0" : "pl-2 pr-2 gap-3"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className={cn(
            "transition-[max-width,opacity] duration-300 ease-in-out overflow-hidden whitespace-nowrap",
            isCollapsed ? "max-w-0 opacity-0 pointer-events-none" : "max-w-[150px] opacity-100"
          )}>
            Sign out
          </span>
        </button>
      </div>
    </div>
  );
}

function MobileBottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-background border-t border-border pb-safe">
      <div className="flex h-16 items-stretch justify-between">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/seller" || item.href === "/rider"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center flex-1 gap-1 border-t-2 transition-[color,background-color,border-color]",
                isActive
                  ? "border-primary text-foreground bg-secondary/10"
                  : "border-transparent text-muted-foreground hover:bg-secondary/5 hover:text-foreground",
              )
            }
          >
            {item.icon}
            <span className="text-[9px] font-bold uppercase tracking-widest mt-1 hidden sm:block">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
