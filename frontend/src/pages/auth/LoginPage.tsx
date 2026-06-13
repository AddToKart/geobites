import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Reveal } from "@/components/motion/Reveal";
import { toast } from "sonner";

export function LoginPage() {
  const navigate = useNavigate();
  const { user, signIn, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateField = (field: 'email' | 'password', value: string) => {
    if (field === 'email' && !value.trim()) return 'Email is required';
    if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
    if (field === 'password' && !value) return 'Password is required';
    if (field === 'password' && value.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  const handleBlur = (field: 'email' | 'password') => {
    const value = field === 'email' ? email : password;
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const clearError = (field: 'email' | 'password') => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  if (!isLoading && user) {
    const destination =
      user.role === "seller"
        ? "/seller"
        : user.role === "rider"
          ? "/rider"
          : "/browse";
    return <Navigate to={destination} replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const emailError = validateField('email', email);
    const passwordError = validateField('password', password);
    setErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(email, password);
      toast.success("Welcome back");
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-background)] selection:bg-primary/30">
      {/* Signature Background Element */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 overflow-hidden">
        <div className="absolute inset-0 animate-[pulse_8s_ease-in-out_infinite] bg-primary/20 rounded-full blur-[120px] transform-gpu will-change-[transform,opacity]" />
        <div className="absolute inset-10 animate-[pulse_12s_ease-in-out_infinite_1s] bg-primary/10 rounded-full blur-[120px] transform-gpu will-change-[transform,opacity]" />
      </div>

      <header className="fixed top-0 flex w-full items-center justify-between px-6 py-4 backdrop-blur-sm">
        <Reveal delay={0.1}>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow">
              <span className="text-lg font-bold">G</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Geobites</span>
          </Link>
        </Reveal>
        <Reveal delay={0.2}>
          <ThemeToggle />
        </Reveal>
      </header>

      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-[420px] space-y-8">
          <div className="text-center">
            <Reveal delay={0.3}>
              <p className="eyebrow inline-block">Security First</p>
            </Reveal>
            <Reveal delay={0.4}>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">
                Welcome back
              </h1>
            </Reveal>
            <Reveal delay={0.5}>
              <p className="mt-4 subtle-copy">
                Sign in to manage your orders, deliveries, and business with
                clarity.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.6}>
            <div className="glass panel-card p-8 shadow-panel">
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-bold uppercase tracking-widest text-text-soft"
                  >
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@geobites.com"
                    className={`h-12 border-none bg-surface-2 focus-visible:ring-primary ${errors.email ? 'ring-2 ring-danger/40 bg-danger-soft/20' : ''}`}
                    value={email}
                    onBlur={() => handleBlur('email')}
                    onChange={(event) => { setEmail(event.target.value); clearError('email'); }}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    required
                  />
                  {errors.email ? <p id="email-error" className="text-xs font-semibold text-danger mt-1.5">{errors.email}</p> : null}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-xs font-bold uppercase tracking-widest text-text-soft"
                    >
                      Password
                    </Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={`h-12 border-none bg-surface-2 focus-visible:ring-primary ${errors.password ? 'ring-2 ring-danger/40 bg-danger-soft/20' : ''}`}
                    value={password}
                    onBlur={() => handleBlur('password')}
                    onChange={(event) => { setPassword(event.target.value); clearError('password'); }}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    required
                  />
                  {errors.password ? <p id="password-error" className="text-xs font-semibold text-danger mt-1.5">{errors.password}</p> : null}
                </div>
                <Button
                  className="group relative w-full h-12 overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 font-bold">
                    {isSubmitting ? "Authenticating..." : "Continue to Dashboard"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 z-0 bg-gradient-to-r from-primary-light to-primary opacity-0 transition-opacity group-hover:opacity-100" />
                </Button>
              </form>

              <div className="mt-8 flex flex-col items-center gap-4 pt-8 border-t border-white/10">
                <p className="text-sm text-text-soft">
                  New to Geobites?{" "}
                  <Link
                    to="/register"
                    className="font-bold text-primary-dark hover:text-primary transition-colors"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.8}>
            <div className="flex justify-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-text-soft/50">
              <span className="flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-primary" />
                Secure
              </span>
              <span className="flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-primary" />
                Encrypted
              </span>
              <span className="flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-primary" />
                Private
              </span>
            </div>
          </Reveal>
        </div>
      </main>
    </div>
  );
}
