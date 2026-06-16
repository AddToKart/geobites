import { Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function TermsPage() {
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
        </div>
      </header>

      <main>
        <section className="flex min-h-[40vh] flex-col justify-end px-6 pb-16 pt-32 lg:px-12 border-b border-border">
          <div className="max-w-4xl">
            <p className="mb-8 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Legal
            </p>
            <h1 className="text-6xl font-medium leading-[0.9] tracking-tighter sm:text-8xl">
              Terms of Service.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
          </div>
        </section>

        <section className="px-6 py-16 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-4xl prose prose-lg dark:prose-invert">
            <h2 className="text-3xl font-medium tracking-tighter mb-6">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              By accessing or using Geobites, you agree to be bound by these Terms of Service. 
              If you do not agree, please do not use our platform.
            </p>

            <h2 className="text-3xl font-medium tracking-tighter mb-6">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Geobites is a food delivery platform that connects customers with local restaurants 
              in Santa Maria, Bulacan. We facilitate orders, payments, and delivery logistics 
              between customers, restaurants, and riders.
            </p>

            <h2 className="text-3xl font-medium tracking-tighter mb-6">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You are responsible for maintaining the confidentiality of your account credentials 
              and for all activities that occur under your account. You must provide accurate 
              and complete information when creating an account.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Geobites reserves the right to suspend or terminate accounts that violate these 
              terms or engage in fraudulent activity.
            </p>

            <h2 className="text-3xl font-medium tracking-tighter mb-6">4. Orders and Payments</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              All menu prices displayed on Geobites reflect the dine-in prices set by our 
              restaurant partners. No markups are added by Geobites. Payment methods include 
              cash on delivery, GCash, Maya, and other available options.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Orders may be cancelled before the restaurant begins preparation. Refunds for 
              cancelled orders are processed within 3-5 business days.
            </p>

            <h2 className="text-3xl font-medium tracking-tighter mb-6">5. Restaurant Partners</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Geobites charges zero commission to our restaurant partners. Restaurants are 
              responsible for the accuracy of their menu listings, pricing, and food quality. 
              Any disputes regarding order accuracy or food quality should be directed to 
              the restaurant through our support team.
            </p>

            <h2 className="text-3xl font-medium tracking-tighter mb-6">6. Delivery Partners</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Riders on Geobites are independent delivery partners. They keep 100% of delivery 
              fees and tips. Geobites is not liable for any incidents that occur during delivery.
            </p>

            <h2 className="text-3xl font-medium tracking-tighter mb-6">7. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Geobites shall not be liable for any indirect, incidental, or consequential 
              damages arising from the use of our platform. Our total liability is limited 
              to the amount paid for the specific order in question.
            </p>

            <h2 className="text-3xl font-medium tracking-tighter mb-6">8. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              We reserve the right to modify these terms at any time. Users will be notified 
              of material changes via email or platform notification. Continued use after 
              changes constitutes acceptance of the new terms.
            </p>

            <h2 className="text-3xl font-medium tracking-tighter mb-6">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these terms, contact us at{" "}
              <a href="mailto:support@geobites.ph" className="text-primary hover:text-primary/80 transition-colors">support@geobites.ph</a>.
            </p>
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
