import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex flex-col md:flex-row">
      {/* Editorial Left Side */}
      <div className="flex-1 bg-primary text-primary-foreground p-8 md:p-12 lg:p-24 flex flex-col justify-between min-h-[40vh] md:min-h-screen relative overflow-hidden">
        <Link to="/" className="relative z-10 flex items-center gap-2 group w-max">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-primary transition-transform group-hover:scale-110">
            <UtensilsCrossed className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight">Geobites</span>
        </Link>
        <div className="relative z-10 mt-16 md:mt-0">
          <h1 className="text-6xl md:text-7xl lg:text-[8rem] font-medium tracking-tighter leading-[0.9] mb-8">
            Welcome<br />back.
          </h1>
          <p className="text-xl md:text-2xl opacity-90 font-medium max-w-md leading-relaxed">
            Sign in to manage your local orders, deliveries, and business.
          </p>
        </div>
      </div>

      {/* Form Right Side */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-12 lg:p-24 bg-background relative md:border-l border-border">
        <div className="absolute top-8 right-8 md:top-12 md:right-12">
          <ThemeToggle />
        </div>
        
        <div className="w-full max-w-md mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-medium tracking-tighter mb-4">Sign in</h2>
            <p className="text-muted-foreground text-lg">Enter your details below to continue.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className={`h-14 rounded-2xl border-border bg-secondary/20 px-4 text-lg focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-colors shadow-none ${errors.email ? 'border-red-500 bg-red-500/5' : ''}`}
                value={email}
                onBlur={() => handleBlur('email')}
                onChange={(event) => { setEmail(event.target.value); clearError('email'); }}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                required
              />
              {errors.email && <p id="email-error" className="text-sm font-semibold text-red-500 mt-2">{errors.email}</p>}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Password
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className={`h-14 rounded-2xl border-border bg-secondary/20 px-4 text-lg focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-colors shadow-none ${errors.password ? 'border-red-500 bg-red-500/5' : ''}`}
                value={password}
                onBlur={() => handleBlur('password')}
                onChange={(event) => { setPassword(event.target.value); clearError('password'); }}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                required
              />
              {errors.password && <p id="password-error" className="text-sm font-semibold text-red-500 mt-2">{errors.password}</p>}
            </div>

            <Button
              className="group w-full h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-none"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Authenticating..." : "Continue"}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
            </Button>
          </form>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-lg text-muted-foreground">
              New to Geobites?{" "}
              <Link to="/register" className="font-bold text-foreground hover:text-primary transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
