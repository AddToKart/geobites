import { Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function PrivacyPage() {
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
              Privacy Policy.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
          </div>
        </section>

        <section className="px-6 py-16 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-medium tracking-tighter mb-6">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect information you provide when creating an account, placing an order, 
              or contacting support. This includes your name, email address, phone number, 
              delivery address, and payment information.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              We also collect location data when you use our platform to enable delivery 
              tracking and address suggestions.
            </p>

            <h2 className="text-3xl font-medium tracking-tighter mb-6">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Your information is used to:</p>
            <ul className="list-disc pl-6 text-muted-foreground leading-relaxed mb-8 space-y-2">
              <li>Process and deliver your orders</li>
              <li>Communicate order status and updates</li>
              <li>Provide customer support</li>
              <li>Improve our platform and services</li>
              <li>Send occasional service-related communications</li>
            </ul>

            <h2 className="text-3xl font-medium tracking-tighter mb-6">3. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We share necessary information with:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground leading-relaxed mb-8 space-y-2">
              <li><strong>Restaurants:</strong> Your name, order details, and delivery address</li>
              <li><strong>Riders:</strong> Your name, delivery address, and contact number</li>
              <li><strong>Payment processors:</strong> Payment information for transaction processing</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-8">
              We do not sell your personal information to third parties.
            </p>

            <h2 className="text-3xl font-medium tracking-tighter mb-6">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              We implement industry-standard security measures to protect your data. 
              Payment transactions are encrypted and processed through secure payment gateways. 
              We do not store full credit card numbers on our servers.
            </p>

            <h2 className="text-3xl font-medium tracking-tighter mb-6">5. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground leading-relaxed mb-8 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction or deletion of your data</li>
              <li>Withdraw consent for data processing</li>
              <li>Export your data in a portable format</li>
            </ul>

            <h2 className="text-3xl font-medium tracking-tighter mb-6">6. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related inquiries, contact us at{" "}
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
