import { Link } from "react-router-dom";
import { UtensilsCrossed, Mail, MessageSquare, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-8 lg:px-12">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-110">
            <UtensilsCrossed className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight">Geobites</span>
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:block"><ThemeToggle /></div>
          <Link to="/login" className="text-sm font-semibold tracking-tight hover:text-primary transition-colors">Sign in</Link>
          <Button asChild className="rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-none font-bold">
            <Link to="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="flex min-h-[50vh] flex-col justify-end px-6 pb-20 pt-32 lg:px-12 border-b border-border">
          <div className="max-w-4xl">
            <p className="mb-8 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Contact
            </p>
            <h1 className="text-6xl font-medium leading-[0.9] tracking-tighter sm:text-8xl lg:text-9xl">
              Get in touch.
            </h1>
            <p className="mt-8 text-xl text-muted-foreground max-w-2xl leading-relaxed md:text-2xl">
              We'd love to hear from you. Whether you're a customer, restaurant owner, 
              or rider — reach out and we'll get back to you within 24 hours.
            </p>
          </div>
        </section>

        <section className="px-6 py-24 lg:px-12 lg:py-48">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-16 md:grid-cols-2">
              <div className="space-y-12">
                <div className="flex items-start gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-primary/10"><Mail className="h-6 w-6 text-primary" /></div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Email</h3>
                    <p className="text-muted-foreground">support@geobites.ph</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-primary/10"><MessageSquare className="h-6 w-6 text-primary" /></div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Social</h3>
                    <p className="text-muted-foreground">@geobites on Facebook and Instagram</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-primary/10"><MapPin className="h-6 w-6 text-primary" /></div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Location</h3>
                    <p className="text-muted-foreground">Santa Maria, Bulacan</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-primary/10"><Clock className="h-6 w-6 text-primary" /></div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Support Hours</h3>
                    <p className="text-muted-foreground">Daily, 8:00 AM — 10:00 PM</p>
                  </div>
                </div>
              </div>
              <div className="border-l-4 border-primary pl-8 py-4">
                <h2 className="text-4xl font-medium tracking-tighter mb-6">Send us a message.</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  For partnership inquiries, technical issues, or general questions — 
                  email us directly and we'll respond within one business day.
                </p>
                <Button asChild className="rounded-full px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-none font-bold text-base">
                  <a href="mailto:support@geobites.ph">Email support@geobites.ph</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background px-6 py-16 lg:px-12 lg:py-24">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" strokeWidth={2.5} />
            <span className="text-lg font-bold tracking-tight">Geobites</span>
          </Link>
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Back to home</Link>
        </div>
      </footer>
    </div>
  );
}
