import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Store, Truck, UserCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Reveal } from "@/components/motion/Reveal";
import { toast } from "sonner";

export function RegisterPage() {
  const navigate = useNavigate();
  const { user, signUp, isLoading } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "customer" as UserRole,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; phone?: string }>({});

  const validateField = (field: string, value: string) => {
    if (field === 'name' && !value.trim()) return 'Name is required';
    if (field === 'email' && !value.trim()) return 'Email is required';
    if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
    if (field === 'password' && !value) return 'Password is required';
    if (field === 'password' && value.length < 6) return 'Password must be at least 6 characters';
    if (field === 'phone' && value && !/^\+63\d{10}$/.test(value.replace(/\s/g, ''))) return 'Format: +63 900 000 0000';
    return undefined;
  };

  const handleBlur = (field: string) => {
    const value = form[field as keyof typeof form] as string;
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const nameError = validateField('name', form.name);
    const emailError = validateField('email', form.email);
    const passwordError = validateField('password', form.password);
    const phoneError = form.phone ? validateField('phone', form.phone) : undefined;
    setErrors({ name: nameError, email: emailError, password: passwordError, phone: phoneError });

    if (nameError || emailError || passwordError || phoneError) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(form);
      toast.success("Account created successfully");
      navigate("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to register",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    {
      value: "customer" as const,
      icon: <UserCircle2 className="h-5 w-5" />,
      label: "Customer",
      copy: "Order from your local favorites.",
    },
    {
      value: "seller" as const,
      icon: <Store className="h-5 w-5" />,
      label: "Seller",
      copy: "Grow your culinary business.",
    },
    {
      value: "rider" as const,
      icon: <Truck className="h-5 w-5" />,
      label: "Rider",
      copy: "Earn by delivering moments.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-background)] selection:bg-primary/30">
      {/* Signature Background Element */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 overflow-hidden">
        <div className="absolute inset-0 animate-[pulse_8s_ease-in-out_infinite] bg-primary/15 rounded-full blur-[120px] transform-gpu will-change-[transform,opacity]" />
        <div className="absolute inset-20 animate-[pulse_12s_ease-in-out_infinite_1s] bg-primary/10 rounded-full blur-[120px] transform-gpu will-change-[transform,opacity]" />
      </div>

      <header className="fixed top-0 flex w-full items-center justify-between px-6 py-4 backdrop-blur-sm z-50">
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

      <main className="flex min-h-screen items-center justify-center p-4 pt-20">
        <div className="w-full max-w-[540px] space-y-8">
          <div className="text-center">
            <Reveal delay={0.3}>
              <p className="eyebrow inline-block">Join the ecosystem</p>
            </Reveal>
            <Reveal delay={0.4}>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">
                Create account
              </h1>
            </Reveal>
            <Reveal delay={0.5}>
              <p className="mt-4 subtle-copy max-w-sm mx-auto">
                One platform, three tailored experiences. Choose yours to get started.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.6}>
            <div className="glass panel-card p-8 shadow-panel">
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase tracking-widest text-text-soft">
                    Choose your role
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {roles.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setForm({ ...form, role: role.value })}
                        className={`group relative flex flex-col items-center gap-2 rounded-2xl p-4 transition-all duration-300 ${
                          form.role === role.value
                            ? "bg-primary text-primary-foreground shadow-glow ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "bg-surface-2 hover:bg-surface text-text-soft"
                        }`}
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                          form.role === role.value ? "bg-white/20" : "bg-primary-soft text-primary-dark"
                        }`}>
                          {role.icon}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">{role.label}</span>
                      </button>
                    ))}
                  </div>
                  <Reveal delay={0.7} key={form.role}>
                    <p className="text-center text-xs font-medium text-text-soft/70 px-4">
                      {roles.find(r => r.value === form.role)?.copy}
                    </p>
                  </Reveal>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-xs font-bold uppercase tracking-widest text-text-soft"
                    >
                      Full name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Jane Doe"
                      className={`h-12 border-none bg-surface-2 focus-visible:ring-primary ${errors.name ? 'ring-2 ring-danger/40 bg-danger-soft/20' : ''}`}
                      value={form.name}
                      onBlur={() => handleBlur('name')}
                      onChange={(event) => {
                        setForm({ ...form, name: event.target.value });
                        clearError('name');
                      }}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                      required
                    />
                    {errors.name ? <p id="name-error" className="text-xs font-semibold text-danger mt-1.5">{errors.name}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-xs font-bold uppercase tracking-widest text-text-soft"
                    >
                      Phone number
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+63 900 000 0000"
                      className={`h-12 border-none bg-surface-2 focus-visible:ring-primary ${errors.phone ? 'ring-2 ring-danger/40 bg-danger-soft/20' : ''}`}
                      value={form.phone}
                      onBlur={() => handleBlur('phone')}
                      onChange={(event) => {
                        setForm({ ...form, phone: event.target.value });
                        clearError('phone');
                      }}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? 'phone-error' : undefined}
                    />
                    {errors.phone ? <p id="phone-error" className="text-xs font-semibold text-danger mt-1.5">{errors.phone}</p> : null}
                  </div>
                </div>

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
                    placeholder="jane@example.com"
                    className={`h-12 border-none bg-surface-2 focus-visible:ring-primary ${errors.email ? 'ring-2 ring-danger/40 bg-danger-soft/20' : ''}`}
                    value={form.email}
                    onBlur={() => handleBlur('email')}
                    onChange={(event) => {
                      setForm({ ...form, email: event.target.value });
                      clearError('email');
                    }}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    required
                  />
                  {errors.email ? <p id="email-error" className="text-xs font-semibold text-danger mt-1.5">{errors.email}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-xs font-bold uppercase tracking-widest text-text-soft"
                  >
                    Create Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={`h-12 border-none bg-surface-2 focus-visible:ring-primary ${errors.password ? 'ring-2 ring-danger/40 bg-danger-soft/20' : ''}`}
                    value={form.password}
                    onBlur={() => handleBlur('password')}
                    onChange={(event) => {
                      setForm({ ...form, password: event.target.value });
                      clearError('password');
                    }}
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
                    {isSubmitting ? "Creating..." : "Start your journey"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 z-0 bg-gradient-to-r from-primary-light to-primary opacity-0 transition-opacity group-hover:opacity-100" />
                </Button>
              </form>

              <div className="mt-8 flex flex-col items-center gap-4 pt-8 border-t border-white/10">
                <p className="text-sm text-text-soft">
                  Already a member?{" "}
                  <Link
                    to="/login"
                    className="font-bold text-primary-dark hover:text-primary transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.9}>
            <p className="text-center text-[10px] text-text-soft/40 uppercase tracking-widest">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </Reveal>
        </div>
      </main>
    </div>
  );
}
