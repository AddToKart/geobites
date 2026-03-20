import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  User, 
  LogOut, 
  ShoppingBag, 
  UtensilsCrossed, 
  Truck, 
  Bell, 
  Home, 
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);

  const navItems = React.useMemo(() => {
    if (!user) return [];
    switch (user.role) {
      case 'seller': return SELLER_NAV;
      case 'rider': return RIDER_NAV;
      default: return CUSTOMER_NAV;
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card fixed inset-y-0 z-50">
        <NavContent items={navItems} onLogout={handleLogout} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40 px-4 flex items-center justify-between">
          <span className="text-lg font-bold font-fraunces text-primary">Geobites</span>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <NavContent 
                items={navItems} 
                onLogout={handleLogout} 
                onItemClick={() => setOpen(false)} 
              />
            </SheetContent>
          </Sheet>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

function NavContent({ 
  items, 
  onLogout, 
  onItemClick 
}: { 
  items: NavItem[]; 
  onLogout: () => void; 
  onItemClick?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-6 h-16 border-b">
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent font-fraunces">
          Geobites
        </span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onItemClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary shadow-sm" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t space-y-2">
        <NavLink
          to="/notifications"
          onClick={onItemClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-muted text-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <Bell className="w-5 h-5" />
          Notifications
        </NavLink>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
