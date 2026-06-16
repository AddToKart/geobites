import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

function RevealSection({
  children,
  className,
  buttonLabel,
  fromLeft = true,
}: {
  children: ReactNode;
  className?: string;
  buttonLabel: string;
  fromLeft?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const xOffset = fromLeft ? -80 : 80;
  const rotY = fromLeft ? -25 : 25;

  if (!revealed) {
    return (
      <section className={className}>
        <div className="mx-auto max-w-6xl flex items-center justify-center min-h-[40vh]">
          <button
            onClick={() => setRevealed(true)}
            className="group flex flex-col items-center gap-6 transition-colors"
          >
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
              Tap to reveal
            </span>
            <span className="text-5xl sm:text-7xl font-medium tracking-tighter text-foreground group-hover:text-primary transition-colors">
              {buttonLabel}
            </span>
        </button>
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      <m.div
        initial={{ rotateY: rotY, x: xOffset, opacity: 0, transformPerspective: 1200 }}
        animate={{ rotateY: 0, x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </m.div>
    </section>
  );
}

const team = [
  {
    name: "Geobette Almojano",
    role: "Tester / QA",
    photo: "/images/team/geobette-almojano.jpg",
    desc: "Ensures every feature, button, and flow works before it reaches your hands. Geobette runs the tests, reports the bugs, and makes sure Geobites is reliable for every user in Santa Maria.",
  },
  {
    name: "Carl Andrei Espino",
    role: "Project Manager",
    photo: "/images/team/carl-andrei-espino.jpg",
    desc: "Keeps the team on track, the milestones clear, and the vision focused. Carl makes sure everyone knows what to build, when to build it, and why it matters for our community.",
  },
  {
    name: "Ciel Angelo Mendoza",
    role: "Mobile Developer",
    photo: "/images/team/ciel-angelo-mendoza.jpg",
    desc: "Builds the native mobile experience so you can order from anywhere. Ciel brings Geobites to your phone with a smooth, responsive app that riders and customers can rely on.",
  },
  {
    name: "Kurt Rhynnie Borbe",
    role: "Full Stack Developer",
    photo: "/images/team/kurt-rhynnie-borbe.jpg",
    desc: "Works across the entire stack — from the database to the frontend. Kurt connects the backend logic with the user interface so every order flows seamlessly from tap to delivery.",
  },
  {
    name: "Nino Roman Naynes",
    role: "Documentations",
    photo: "/images/team/nino-roman-naynes.jpg",
    desc: "Writes the guides, manuals, and references that make Geobites understandable for everyone. Nino ensures that developers, riders, and restaurant partners can all find the information they need.",
  },
  {
    name: "Anderson Diculen",
    role: "Frontend Developer",
    photo: "/images/team/anderson-diculen.jpg",
    desc: "Crafts the look and feel of every page you see. Anderson designs and builds the Geobites interface — making sure ordering food is intuitive, fast, and beautiful on any screen.",
  },
];

export function AboutPage() {
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
        {/* GEOBITES — Team Hero */}
        <RevealSection buttonLabel="GEOBITES" fromLeft className="px-6 lg:px-12 border-b border-border">
          <div className="max-w-4xl min-h-[70vh] flex flex-col justify-end pb-24 pt-32">
            <p className="mb-8 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Our Team
            </p>
            <h1 className="text-6xl font-medium leading-[0.9] tracking-tighter sm:text-8xl lg:text-9xl">
              GEOBITES
            </h1>
            <p className="mt-8 text-xl text-muted-foreground max-w-2xl leading-relaxed md:text-2xl">
              We are a group of seven developers, testers, and documentors building a fairer food
              delivery platform for Santa Maria, Bulacan. Every line of code, every test case, and
              every page you see is made by us — for our community.
            </p>
          </div>
        </RevealSection>

        {team.map((member, i) => {
          const fromLeft = i % 2 === 0;
          return (
            <RevealSection
              key={i}
              buttonLabel={member.name}
              fromLeft={fromLeft}
              className={`px-6 py-24 lg:px-12 lg:py-48 ${i < team.length - 1 ? 'border-b border-border' : ''} ${fromLeft ? 'bg-secondary/10' : 'bg-background'}`}
            >
              <div className="mx-auto max-w-6xl grid gap-10 md:grid-cols-[280px_1fr] md:gap-16 items-start">
                <div className="w-full aspect-square border border-border overflow-hidden bg-secondary/20">
                  <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">{member.role}</p>
                  <h2 className="text-4xl font-medium tracking-tighter sm:text-6xl lg:text-7xl mb-8">
                    {member.name}
                  </h2>
                  <p className="text-xl text-muted-foreground leading-relaxed md:text-2xl max-w-3xl">
                    {member.desc}
                  </p>
                </div>
              </div>
            </RevealSection>
          );
        })}
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
              <Link to="/about" className="text-primary hover:text-primary/80 transition-colors font-medium">Our Team</Link>
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
