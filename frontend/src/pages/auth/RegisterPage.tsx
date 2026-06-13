import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, UtensilsCrossed, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { toast } from "sonner";
import { Reveal } from "@/components/motion/Reveal";

export function RegisterPage() {
  const navigate = useNavigate();
  const { user, signUp, isLoading } = useAuth();
  
  // Base & Role-specific form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "customer" as UserRole,
    // Seller specific
    storeName: "",
    businessPermit: "",
    // Rider specific
    vehicleType: "motorcycle",
    licenseNumber: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Verification State
  const [verifyState, setVerifyState] = useState<'idle' | 'verifying' | 'approved'>('idle');
  const [verifyMessage, setVerifyMessage] = useState('');

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const validateField = (field: string, value: string) => {
    if (field === 'name' && !value.trim()) return 'Name is required';
    if (field === 'email' && !value.trim()) return 'Email is required';
    if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
    if (field === 'password' && !value) return 'Password is required';
    if (field === 'password' && value.length < 6) return 'Password must be at least 6 characters';
    if (field === 'phone' && value && !/^\+63\d{10}$/.test(value.replace(/\s/g, ''))) return 'Format: +63 900 000 0000';
    
    // Role-specific validation
    if (form.role === 'seller') {
      if (field === 'storeName' && !value.trim()) return 'Store name is required';
      if (field === 'businessPermit' && !value.trim()) return 'Business permit is required';
    }
    if (form.role === 'rider') {
      if (field === 'licenseNumber' && !value.trim()) return "Driver's license is required";
    }

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

  const executeSignUp = async () => {
    try {
      await signUp(form);
      toast.success("Account created successfully");
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to register");
      setVerifyState('idle'); // Reset if backend fails
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // Validate all fields
    const newErrors = {
      name: validateField('name', form.name),
      email: validateField('email', form.email),
      password: validateField('password', form.password),
      phone: form.phone ? validateField('phone', form.phone) : undefined,
      storeName: form.role === 'seller' ? validateField('storeName', form.storeName) : undefined,
      businessPermit: form.role === 'seller' ? validateField('businessPermit', form.businessPermit) : undefined,
      licenseNumber: form.role === 'rider' ? validateField('licenseNumber', form.licenseNumber) : undefined,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(err => err !== undefined)) {
      return; // Stop if errors exist
    }

    setIsSubmitting(true);

    // Mock AI Verification Flow for Sellers and Riders
    if (form.role === 'seller' || form.role === 'rider') {
      setVerifyState('verifying');
      setVerifyMessage('Initializing system check...');
      
      setTimeout(() => setVerifyMessage('Scanning uploaded credentials...'), 800);
      setTimeout(() => setVerifyMessage(form.role === 'seller' ? 'Verifying business permit with LGU...' : 'Cross-referencing LTO database...'), 1800);
      setTimeout(() => setVerifyMessage('Analyzing fraud vectors...'), 3000);
      setTimeout(() => {
        setVerifyState('approved');
        setVerifyMessage('Verification Approved.');
        
        // Give the user a moment to see the "Approved" state before redirecting
        setTimeout(() => {
          executeSignUp();
        }, 1500);
      }, 4200);
    } else {
      // Customers don't need intense verification
      executeSignUp();
    }
  };

  // Render the Mock AI Verification screen if active
  if (verifyState !== 'idle') {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary flex flex-col md:flex-row">
        {/* Same Left Side */}
        <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-foreground text-background p-8 md:p-12 lg:p-24 relative border-r border-border flex-col justify-between">
          <Link to="/" className="flex items-center gap-2 group w-max">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-foreground transition-transform group-hover:scale-110">
              <UtensilsCrossed className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight">Geobites</span>
          </Link>
          <div>
            <h1 className="text-6xl md:text-7xl lg:text-[8rem] font-medium tracking-tighter leading-[0.9] mb-8">
              Join the<br />network.
            </h1>
            <p className="text-xl md:text-2xl opacity-70 font-medium max-w-md leading-relaxed">
              One platform. Three roles. Zero corporate fat.
            </p>
          </div>
        </div>

        {/* Verification Right Side */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-12 lg:p-24 bg-background relative">
          <div className="w-full max-w-xl mx-auto flex flex-col items-start">
            <Reveal>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                <ShieldCheck className="h-4 w-4" />
                Automated Trust System
              </div>
            </Reveal>
            
            <h2 className="text-5xl md:text-6xl font-medium tracking-tighter mb-8 leading-tight">
              {verifyState === 'verifying' ? 'Verifying identity.' : 'Approved.'}
            </h2>

            <div className="flex items-center gap-4 text-xl md:text-2xl text-muted-foreground font-medium">
              {verifyState === 'verifying' ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              )}
              <span className="animate-pulse">{verifyMessage}</span>
            </div>

            {verifyState === 'verifying' && (
              <div className="mt-12 w-full max-w-sm h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary w-1/2 animate-[pulse_1s_ease-in-out_infinite] rounded-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex flex-col md:flex-row">
      {/* Editorial Left Side - Sticky */}
      <div className="md:w-5/12 lg:w-1/2 bg-foreground text-background p-8 md:p-12 lg:p-24 relative border-r border-border">
        <div className="sticky top-8 lg:top-12 h-max flex flex-col justify-between min-h-[40vh] md:min-h-[80vh]">
          <Link to="/" className="flex items-center gap-2 group w-max">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-foreground transition-transform group-hover:scale-110">
              <UtensilsCrossed className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight">Geobites</span>
          </Link>
          <div className="mt-16 md:mt-0">
            <h1 className="text-6xl md:text-7xl lg:text-[8rem] font-medium tracking-tighter leading-[0.9] mb-8">
              Join the<br />network.
            </h1>
            <p className="text-xl md:text-2xl opacity-70 font-medium max-w-md leading-relaxed">
              One platform. Three roles. Zero corporate fat.
            </p>
          </div>
        </div>
      </div>

      {/* Form Right Side */}
      <div className="md:w-7/12 lg:w-1/2 flex flex-col justify-center p-8 md:p-12 lg:p-24 bg-background relative">
        <div className="absolute top-8 right-8 md:top-12 md:right-12">
          <ThemeToggle />
        </div>
        
        <div className="w-full max-w-xl mx-auto mt-16 md:mt-0">
          <div className="mb-12">
            <h2 className="text-4xl font-medium tracking-tighter mb-4">Create an account</h2>
            <p className="text-muted-foreground text-lg">Enter your details to get started in Santa Maria.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-8">
            <div className="space-y-4">
              <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                I want to...
              </Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: "customer" as const, label: "Eat." },
                  { value: "seller" as const, label: "Cook." },
                  { value: "rider" as const, label: "Ride." },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, role: r.value });
                      setErrors({}); // clear errors on role switch
                    }}
                    className={`group relative flex flex-col items-start rounded-2xl p-5 transition-all duration-300 border-2 ${
                      form.role === r.value
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-secondary/10 hover:border-foreground/30 text-foreground"
                    }`}
                  >
                    <span className="text-2xl font-medium tracking-tighter">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Role Requirements Section */}
            {(form.role === 'seller' || form.role === 'rider') && (
              <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                  <ShieldCheck className="h-4 w-4" />
                  {form.role === 'seller' ? 'Business Verification' : 'Rider Verification'}
                </div>
                
                {form.role === 'seller' && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Label htmlFor="storeName" className="text-xs font-bold uppercase tracking-widest text-foreground/80">Store Name</Label>
                      <Input
                        id="storeName"
                        placeholder="Luring's Eatery"
                        className={`h-12 rounded-xl border-border bg-background shadow-none ${errors.storeName ? 'border-red-500' : ''}`}
                        value={form.storeName}
                        onBlur={() => handleBlur('storeName')}
                        onChange={(e) => { setForm({ ...form, storeName: e.target.value }); clearError('storeName'); }}
                        required
                      />
                      {errors.storeName && <p className="text-xs font-semibold text-red-500">{errors.storeName}</p>}
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="businessPermit" className="text-xs font-bold uppercase tracking-widest text-foreground/80">Business Permit No.</Label>
                      <Input
                        id="businessPermit"
                        placeholder="BP-2023-XXXX"
                        className={`h-12 rounded-xl border-border bg-background shadow-none ${errors.businessPermit ? 'border-red-500' : ''}`}
                        value={form.businessPermit}
                        onBlur={() => handleBlur('businessPermit')}
                        onChange={(e) => { setForm({ ...form, businessPermit: e.target.value }); clearError('businessPermit'); }}
                        required
                      />
                      {errors.businessPermit && <p className="text-xs font-semibold text-red-500">{errors.businessPermit}</p>}
                    </div>
                  </div>
                )}

                {form.role === 'rider' && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-foreground/80">Vehicle Type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, vehicleType: 'motorcycle' })}
                          className={`h-12 rounded-xl border font-semibold text-sm transition-colors ${form.vehicleType === 'motorcycle' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:border-foreground/30'}`}
                        >
                          Motorcycle
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, vehicleType: 'bicycle' })}
                          className={`h-12 rounded-xl border font-semibold text-sm transition-colors ${form.vehicleType === 'bicycle' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:border-foreground/30'}`}
                        >
                          Bicycle
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="licenseNumber" className="text-xs font-bold uppercase tracking-widest text-foreground/80">Driver's License</Label>
                      <Input
                        id="licenseNumber"
                        placeholder="C03-XX-XXXXXX"
                        className={`h-12 rounded-xl border-border bg-background shadow-none ${errors.licenseNumber ? 'border-red-500' : ''}`}
                        value={form.licenseNumber}
                        onBlur={() => handleBlur('licenseNumber')}
                        onChange={(e) => { setForm({ ...form, licenseNumber: e.target.value }); clearError('licenseNumber'); }}
                        required
                      />
                      {errors.licenseNumber && <p className="text-xs font-semibold text-red-500">{errors.licenseNumber}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-8 sm:grid-cols-2 pt-4">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="Jane Doe"
                  className={`h-14 rounded-2xl border-border bg-secondary/20 px-4 text-lg focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-colors shadow-none ${errors.name ? 'border-red-500 bg-red-500/5' : ''}`}
                  value={form.name}
                  onBlur={() => handleBlur('name')}
                  onChange={(event) => { setForm({ ...form, name: event.target.value }); clearError('name'); }}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  required
                />
                {errors.name && <p id="name-error" className="text-sm font-semibold text-red-500 mt-2">{errors.name}</p>}
              </div>
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Phone (Optional)
                </Label>
                <Input
                  id="phone"
                  placeholder="+63 900 000 0000"
                  className={`h-14 rounded-2xl border-border bg-secondary/20 px-4 text-lg focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-colors shadow-none ${errors.phone ? 'border-red-500 bg-red-500/5' : ''}`}
                  value={form.phone}
                  onBlur={() => handleBlur('phone')}
                  onChange={(event) => { setForm({ ...form, phone: event.target.value }); clearError('phone'); }}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && <p id="phone-error" className="text-sm font-semibold text-red-500 mt-2">{errors.phone}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                className={`h-14 rounded-2xl border-border bg-secondary/20 px-4 text-lg focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-colors shadow-none ${errors.email ? 'border-red-500 bg-red-500/5' : ''}`}
                value={form.email}
                onBlur={() => handleBlur('email')}
                onChange={(event) => { setForm({ ...form, email: event.target.value }); clearError('email'); }}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                required
              />
              {errors.email && <p id="email-error" className="text-sm font-semibold text-red-500 mt-2">{errors.email}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Create Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className={`h-14 rounded-2xl border-border bg-secondary/20 px-4 text-lg focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-colors shadow-none ${errors.password ? 'border-red-500 bg-red-500/5' : ''}`}
                value={form.password}
                onBlur={() => handleBlur('password')}
                onChange={(event) => { setForm({ ...form, password: event.target.value }); clearError('password'); }}
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
              {isSubmitting ? "Processing..." : "Start your journey"}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
            </Button>
          </form>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-lg text-muted-foreground">
              Already a member?{" "}
              <Link to="/login" className="font-bold text-foreground hover:text-primary transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
          <div className="mt-8">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
              By creating an account, you agree to our Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
