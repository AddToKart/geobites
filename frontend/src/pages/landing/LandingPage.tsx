import { Link } from "react-router-dom";
import { ArrowRight, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* 
        Header 
        Re-introducing brand color subtlely via text/icon hover.
      */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-8 lg:px-12">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-110">
            <UtensilsCrossed className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight">Geobites</span>
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <Link to="/login" className="text-sm font-semibold tracking-tight hover:text-primary transition-colors">
            Sign in
          </Link>
          <Button asChild className="rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-none font-bold">
            <Link to="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <main>
        {/* 
          Hero
          Massive typography remains, but we add a primary color accent to ground it.
        */}
        <section className="flex min-h-[90vh] flex-col justify-end px-6 pb-24 pt-32 lg:px-12">
          <div className="max-w-[90vw] relative">
            <p className="mb-8 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Santa Maria, Bulacan
            </p>
            <h1 className="text-[12vw] font-medium leading-[0.85] tracking-tighter indent-[-0.5vw]">
              Local food.
              <br />
              <span className="text-primary">Without the</span>
              <br />
              corporate fat.
            </h1>
          </div>
        </section>

        {/* 
          The Manifesto
          Accenting the community aspect with the primary color.
        */}
        <section className="border-t border-border px-6 py-24 lg:px-12 lg:py-48 bg-secondary/10">
          <div className="mx-auto max-w-5xl">
            <p className="text-3xl font-medium leading-tight tracking-tight sm:text-5xl md:text-6xl md:leading-[1.1]">
              Delivery apps extract up to 30% from independent restaurants. We built Geobites to keep that money in <span className="text-primary underline decoration-primary/30 underline-offset-8">our community</span>. What you see on the dine-in menu is exactly what you pay on the app.
            </p>
          </div>
        </section>

        {/* 
          The Roster (Features / Roles)
          Hover states now pull from the primary color for a vibrant pop.
        */}
        <section className="border-t border-border">
          {[
            {
              title: "Eat.",
              label: "For Customers",
              desc: "Dine-in prices, local riders, and real-time tracking to your door.",
              link: "/register",
              action: "Start ordering"
            },
            {
              title: "Cook.",
              label: "For Restaurants",
              desc: "Zero commission fees. Keep your margins and reach the whole town.",
              link: "/seller/register",
              action: "List your business"
            },
            {
              title: "Ride.",
              label: "For Delivery Partners",
              desc: "Set your own hours and keep 100% of the delivery fees and tips.",
              link: "/register",
              action: "Become a rider"
            }
          ].map((row, i) => (
            <Link 
              key={i} 
              to={row.link}
              className="group block border-b border-border px-6 py-16 transition-all duration-500 hover:bg-primary hover:text-primary-foreground lg:px-12 lg:py-24"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex-1">
                  <p className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary-foreground/70 transition-colors">
                    {row.label}
                  </p>
                  <h2 className="text-6xl font-medium tracking-tighter sm:text-8xl lg:text-[8rem]">
                    {row.title}
                  </h2>
                </div>
                <div className="flex-1 md:max-w-sm">
                  <p className="mb-8 text-xl text-muted-foreground group-hover:text-primary-foreground/90 md:text-2xl leading-relaxed transition-colors">
                    {row.desc}
                  </p>
                  <div className="inline-flex items-center gap-2 text-lg font-bold">
                    {row.action}
                    <ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-4" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* 
          The Metrics
          Raw data presentation, numbers highlighted in primary color.
        */}
        <section className="px-6 py-24 lg:px-12 lg:py-48 bg-background">
          <div className="grid gap-12 border-l-4 border-primary pl-6 sm:grid-cols-2 md:grid-cols-4 md:pl-12">
            {[
              { val: "0%", label: "Restaurant Commission" },
              { val: "100%", label: "Tips to Riders" },
              { val: "₱0", label: "Menu Markups" },
              { val: "24/7", label: "Local Support" }
            ].map((stat, i) => (
              <div key={i}>
                <p className="mb-2 text-6xl font-medium tracking-tighter sm:text-7xl text-foreground">{stat.val}</p>
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 
          CTA - Fixed from screenshot.
          Instead of an empty rounded pill floating in space, 
          it's now a full-bleed, edge-to-edge typographic block 
          that commands the bottom of the page seamlessly.
        */}
        <section className="border-t border-border">
          <div className="flex flex-col lg:flex-row items-stretch min-h-[50vh]">
            <div className="flex-1 bg-primary text-primary-foreground p-12 lg:p-24 flex flex-col justify-center">
              <h2 className="text-5xl font-medium tracking-tighter sm:text-7xl lg:text-8xl leading-[0.9] mb-8">
                Ready to<br/>eat local?
              </h2>
              <p className="text-xl md:text-2xl max-w-md opacity-90 font-medium leading-relaxed">
                Join thousands of neighbors already ordering from the best spots in Santa Maria.
              </p>
            </div>
            
            {/* The actual actions take up the other half */}
            <div className="flex-1 flex flex-col border-l-0 lg:border-l border-border bg-background">
              <Link 
                to="/register" 
                className="group flex-1 flex flex-col justify-center p-12 lg:p-24 border-b border-border hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl sm:text-4xl font-medium tracking-tighter">Create an account</span>
                  <ArrowRight className="h-8 w-8 text-primary transition-transform group-hover:translate-x-2" />
                </div>
              </Link>
              <Link 
                to="/login" 
                className="group flex-1 flex flex-col justify-center p-12 lg:p-24 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl sm:text-4xl font-medium tracking-tighter text-muted-foreground">Sign in to existing</span>
                  <ArrowRight className="h-8 w-8 text-muted-foreground transition-transform group-hover:translate-x-2" />
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 
        Footer
        Minimalist, but slightly warmer.
      */}
      <footer className="border-t border-border bg-secondary/10 px-6 py-12 lg:px-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <Link to="/" className="mb-6 flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" strokeWidth={2.5} />
              <span className="text-2xl font-bold tracking-tight">Geobites</span>
            </Link>
            <p className="text-sm font-medium text-muted-foreground">
              A fair food network for Santa Maria, Bulacan.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-8 text-sm font-bold text-muted-foreground sm:gap-12">
            <Link to="/browse" className="hover:text-primary transition-colors">Restaurants</Link>
            <Link to="/about" className="hover:text-primary transition-colors">Our Mission</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
