import { Link } from "react-router-dom";
import { ArrowRight, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
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
        {/* Hero */}
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

        {/* The Manifesto */}
        <section className="border-t border-border px-6 py-24 lg:px-12 lg:py-48 bg-secondary/10">
          <div className="mx-auto max-w-5xl">
            <p className="text-3xl font-medium leading-tight tracking-tight sm:text-5xl md:text-6xl md:leading-[1.1]">
              Delivery apps extract up to 30% from independent restaurants. We built Geobites to keep that money in <span className="text-primary underline decoration-primary/30 underline-offset-8">our community</span>. What you see on the dine-in menu is exactly what you pay on the app.
            </p>
          </div>
        </section>

        {/* The Process (NEW: Added Information) */}
        <section className="border-t border-border px-6 py-24 lg:px-12 lg:py-40">
          <div className="mx-auto max-w-[90vw]">
            <h2 className="mb-16 text-5xl font-medium tracking-tighter sm:text-7xl">
              How it works.
            </h2>
            <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
              {[
                { step: "01", title: "Find your craving.", desc: "Browse menus from Santa Maria's top local spots. Prices are exactly what you'd pay if you walked into their store." },
                { step: "02", title: "Pay your way.", desc: "Cash on delivery, GCash, Maya, or bank transfer. Flexible, secure, and strictly local." },
                { step: "03", title: "Track live.", desc: "Watch your neighborhood rider bring your food in real-time. No batching, just your order straight to your door." }
              ].map((s, i) => (
                <div key={i} className="flex flex-col border-t border-border pt-8">
                  <span className="mb-6 text-sm font-bold text-primary">{s.step}</span>
                  <h3 className="mb-4 text-4xl font-medium tracking-tighter">{s.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed md:text-xl">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Roster */}
        {/*
          PERF: The orange fill uses an opacity-animated overlay div (absolute, inset-0).
          Opacity is the ONLY CSS property that is 100% GPU-composited — zero paint, zero layout.
          background-color transitions always trigger a repaint on every frame no matter what.
          Text colors switch instantly (no transition class) — cascaded color animation through
          all child text nodes is expensive; an instant switch costs one single repaint at start.
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
              className="group relative block overflow-hidden border-b border-border px-6 py-16 lg:px-12 lg:py-24"
            >
              {/* Orange fill: opacity-only transition = GPU compositor, zero paint cost */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{ willChange: 'opacity' }}
              />

              {/* Content sits above the overlay */}
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex-1">
                  {/* Instant color switch (no transition) — one repaint at hover-start, not 12fps worth */}
                  <p className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary-foreground/70">
                    {row.label}
                  </p>
                  <h2 className="text-6xl font-medium tracking-tighter group-hover:text-primary-foreground sm:text-8xl lg:text-[8rem]">
                    {row.title}
                  </h2>
                </div>
                <div className="flex-1 md:max-w-sm">
                  <p className="mb-8 text-xl text-muted-foreground group-hover:text-primary-foreground/90 md:text-2xl leading-relaxed">
                    {row.desc}
                  </p>
                  <div className="inline-flex items-center gap-2 text-lg font-bold group-hover:text-primary-foreground">
                    {row.action}
                    {/* translate is compositor-only — free */}
                    <ArrowRight className="h-6 w-6 transition-transform duration-200 group-hover:translate-x-3 group-hover:text-primary-foreground" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* Editorial Quote (NEW: Social Proof) */}
        <section className="bg-foreground text-background px-6 py-24 lg:px-12 lg:py-48">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-3xl font-medium leading-tight tracking-tight sm:text-5xl md:text-6xl md:leading-[1.1]">
              "Finally, a delivery platform that actually respects Santa Maria. The riders are our neighbors, and the menus aren't inflated."
            </p>
            <div className="mt-16 flex items-center justify-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">M</div>
              <div className="text-left">
                <p className="font-bold text-lg">Maria Santos</p>
                <p className="opacity-70">Poblacion Resident</p>
              </div>
            </div>
          </div>
        </section>

        {/* The Metrics */}
        <section className="px-6 py-24 lg:px-12 lg:py-48 bg-background border-b border-border">
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

        {/* Stark FAQ (NEW: Addressing user concerns) */}
        <section className="px-6 py-24 lg:px-12 lg:py-40 bg-secondary/10">
          <div className="grid gap-16 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-5xl font-medium tracking-tighter sm:text-7xl sticky top-32">
                The details.
              </h2>
            </div>
            <div className="flex flex-col">
              {[
                { q: "Why are your prices lower than other apps?", a: "We don't charge our partner restaurants the standard 20-30% commission. Because they save money, they don't have to mark up their menus on our platform. You pay the dine-in price." },
                { q: "Where exactly do you deliver?", a: "We are hyper-local. We currently serve all barangays within Santa Maria, Bulacan. By focusing on one town, we ensure faster delivery times and better support." },
                { q: "How do riders get paid?", a: "Riders keep 100% of the delivery fee you pay, plus 100% of any tips. We don't take a single cent from their hard work on the road." },
                { q: "What payment methods do you accept?", a: "We accept Cash on Delivery (COD), GCash, and Maya. We want to make ordering as accessible as possible for everyone in town." }
              ].map((faq, i) => (
                <div key={i} className="border-b border-border/50 py-10 first:pt-0">
                  <h3 className="mb-4 text-3xl font-medium tracking-tighter">{faq.q}</h3>
                  <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
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
            
            <div className="flex-1 flex flex-col border-l-0 lg:border-l border-border bg-background">
              <Link 
                to="/register" 
                className="group flex-1 flex flex-col justify-center p-12 lg:p-24 border-b border-border transition-colors duration-150 hover:bg-secondary/30"
                style={{ willChange: 'background-color' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl sm:text-4xl font-medium tracking-tighter">Create an account</span>
                  <ArrowRight className="h-8 w-8 text-primary transition-transform duration-150 group-hover:translate-x-2" />
                </div>
              </Link>
              <Link 
                to="/login" 
                className="group flex-1 flex flex-col justify-center p-12 lg:p-24 transition-colors duration-150 hover:bg-secondary/30"
                style={{ willChange: 'background-color' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl sm:text-4xl font-medium tracking-tighter text-muted-foreground">Sign in to existing</span>
                  <ArrowRight className="h-8 w-8 text-muted-foreground transition-transform duration-150 group-hover:translate-x-2" />
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background px-6 py-16 lg:px-12 lg:py-24">
        <div className="flex flex-col justify-between gap-12 lg:flex-row lg:items-end">
          <div className="max-w-md">
            <Link to="/" className="mb-8 flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6 text-primary" strokeWidth={2.5} />
              <span className="text-3xl font-bold tracking-tight">Geobites</span>
            </Link>
            <p className="text-lg font-medium text-muted-foreground leading-relaxed">
              We are building a fairer, localized food delivery network for the people and businesses of Santa Maria, Bulacan.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
            <div className="flex flex-col gap-4">
              <p className="font-bold text-foreground mb-2">Platform</p>
              <Link to="/browse" className="text-muted-foreground hover:text-primary transition-colors font-medium">Restaurants</Link>
              <Link to="/register" className="text-muted-foreground hover:text-primary transition-colors font-medium">Order Food</Link>
              <Link to="/seller/register" className="text-muted-foreground hover:text-primary transition-colors font-medium">Partner Sign Up</Link>
            </div>
            <div className="flex flex-col gap-4">
              <p className="font-bold text-foreground mb-2">Company</p>
              <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors font-medium">Our Mission</Link>
              <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors font-medium">Contact Us</Link>
            </div>
            <div className="flex flex-col gap-4 col-span-2 sm:col-span-1">
              <p className="font-bold text-foreground mb-2">Legal</p>
              <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors font-medium">Terms of Service</Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors font-medium">Privacy Policy</Link>
            </div>
          </div>
        </div>
        
        <div className="mt-24 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} Geobites.</p>
          <p>Made for Santa Maria.</p>
        </div>
      </footer>
    </div>
  );
}
