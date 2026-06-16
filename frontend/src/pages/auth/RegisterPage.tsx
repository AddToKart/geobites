import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, UtensilsCrossed, CheckCircle2, ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { toast } from "sonner";
import { Reveal } from "@/components/motion/Reveal";

const phoneRegex = /^\+63\d{10}$/;

const baseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/(?=.*[A-Za-z])(?=.*\d)/, "Password must contain at least one letter and one number"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
  phone: z.string().refine((v) => !v || phoneRegex.test(v.replace(/\s/g, "")), {
    message: "Format: +63 900 000 0000",
  }),
  role: z.enum(["customer", "seller", "rider"] as const),
  storeName: z.string().optional(),
  businessPermit: z.string().optional(),
  vehicleType: z.enum(["motorcycle", "bicycle"] as const),
  licenseNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "seller") return data.storeName && data.storeName.trim().length > 0;
  return true;
}, { message: "Store name is required", path: ["storeName"] }).refine((data) => {
  if (data.role === "seller") return data.businessPermit && data.businessPermit.trim().length > 0;
  return true;
}, { message: "Business permit is required", path: ["businessPermit"] }).refine((data) => {
  if (data.role === "rider") return data.licenseNumber && data.licenseNumber.trim().length > 0;
  return true;
}, { message: "Driver's license is required", path: ["licenseNumber"] });

type RegisterForm = z.infer<typeof baseSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { user, signUp, isLoading: authLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifyState, setVerifyState] = useState<'idle' | 'verifying' | 'approved'>('idle');
  const [verifyMessage, setVerifyMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      role: "customer",
      storeName: "",
      businessPermit: "",
      vehicleType: "motorcycle",
      licenseNumber: "",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const role = watch("role");

  if (!authLoading && user) {
    return <Navigate to="/" replace />;
  }

  const executeSignUp = async (data: RegisterForm) => {
    try {
      await signUp(data);
      toast.success("Account created successfully");
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to register");
      setVerifyState('idle');
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    if (data.role === 'seller' || data.role === 'rider') {
      setVerifyState('verifying');
      setVerifyMessage('Initializing system check...');
      setTimeout(() => setVerifyMessage('Scanning uploaded credentials...'), 800);
      setTimeout(() => setVerifyMessage(data.role === 'seller' ? 'Verifying business permit with LGU...' : 'Cross-referencing LTO database...'), 1800);
      setTimeout(() => setVerifyMessage('Analyzing fraud vectors...'), 3000);
      setTimeout(() => {
        setVerifyState('approved');
        setVerifyMessage('Verification Approved.');
        setTimeout(() => executeSignUp(data), 1500);
      }, 4200);
    } else {
      executeSignUp(data);
    }
  };

  if (verifyState !== 'idle') {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary flex flex-col md:flex-row">
        <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-foreground text-background p-8 md:p-12 lg:p-24 relative border-r border-border flex-col justify-between">
          <Link to="/" className="flex items-center gap-2 group w-max">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-foreground transition-transform group-hover:scale-110">
              <UtensilsCrossed className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight">Geobites</span>
          </Link>
          <div>
            <h1 className="text-6xl md:text-7xl lg:text-[8rem] font-medium tracking-tighter leading-[0.9] mb-8">Join the<br />network.</h1>
            <p className="text-xl md:text-2xl opacity-70 font-medium max-w-md leading-relaxed">One platform. Three roles. Zero corporate fat.</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center p-8 md:p-12 lg:p-24 bg-background relative">
          <div className="w-full max-w-xl mx-auto flex flex-col items-start">
            <Reveal>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                <ShieldCheck className="h-4 w-4" />Automated Trust System
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
      <div className="md:w-5/12 lg:w-1/2 bg-foreground text-background p-8 md:p-12 lg:p-24 relative border-r border-border">
        <div className="sticky top-8 lg:top-12 h-max flex flex-col justify-between min-h-[40vh] md:min-h-[80vh]">
          <Link to="/" className="flex items-center gap-2 group w-max">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-foreground transition-transform group-hover:scale-110">
              <UtensilsCrossed className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight">Geobites</span>
          </Link>
          <div className="mt-16 md:mt-0">
            <h1 className="text-6xl md:text-7xl lg:text-[8rem] font-medium tracking-tighter leading-[0.9] mb-8">Join the<br />network.</h1>
            <p className="text-xl md:text-2xl opacity-70 font-medium max-w-md leading-relaxed">One platform. Three roles. Zero corporate fat.</p>
          </div>
        </div>
      </div>
      <div className="md:w-7/12 lg:w-1/2 flex flex-col justify-center p-8 md:p-12 lg:p-24 bg-background relative">
        <div className="absolute top-8 right-8 md:top-12 md:right-12"><ThemeToggle /></div>
        <div className="w-full max-w-xl mx-auto mt-16 md:mt-0">
          <div className="mb-12">
            <h2 className="text-4xl font-medium tracking-tighter mb-4">Create an account</h2>
            <p className="text-muted-foreground text-lg">Enter your details to get started in Santa Maria.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">I want to...</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {([{ value: "customer", label: "Eat." }, { value: "seller", label: "Cook." }, { value: "rider", label: "Ride." }] as const).map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setValue("role", r.value, { shouldValidate: false })}
                    className={`group relative flex flex-col items-start rounded-2xl p-5 transition-all duration-300 border-2 ${
                      role === r.value
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-secondary/10 hover:border-foreground/30 text-foreground"
                    }`}
                  >
                    <span className="text-2xl font-medium tracking-tighter">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {(role === 'seller' || role === 'rider') && (
              <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                  <ShieldCheck className="h-4 w-4" />
                  {role === 'seller' ? 'Business Verification' : 'Rider Verification'}
                </div>
                {role === 'seller' && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Label htmlFor="storeName" className="text-xs font-bold uppercase tracking-widest text-foreground/80">Store Name</Label>
                      <Input id="storeName" placeholder="Luring's Eatery" className={`h-12 rounded-xl border-border bg-background shadow-none ${errors.storeName ? 'border-red-500' : ''}`} {...register('storeName')} />
                      {errors.storeName && <p className="text-xs font-semibold text-red-500">{errors.storeName.message}</p>}
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="businessPermit" className="text-xs font-bold uppercase tracking-widest text-foreground/80">Business Permit No.</Label>
                      <Input id="businessPermit" placeholder="BP-2023-XXXX" className={`h-12 rounded-xl border-border bg-background shadow-none ${errors.businessPermit ? 'border-red-500' : ''}`} {...register('businessPermit')} />
                      {errors.businessPermit && <p className="text-xs font-semibold text-red-500">{errors.businessPermit.message}</p>}
                    </div>
                  </div>
                )}
                {role === 'rider' && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-foreground/80">Vehicle Type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setValue("vehicleType", "motorcycle")} className={`h-12 rounded-xl border font-semibold text-sm transition-colors ${watch("vehicleType") === 'motorcycle' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:border-foreground/30'}`}>Motorcycle</button>
                        <button type="button" onClick={() => setValue("vehicleType", "bicycle")} className={`h-12 rounded-xl border font-semibold text-sm transition-colors ${watch("vehicleType") === 'bicycle' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:border-foreground/30'}`}>Bicycle</button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="licenseNumber" className="text-xs font-bold uppercase tracking-widest text-foreground/80">Driver's License</Label>
                      <Input id="licenseNumber" placeholder="C03-XX-XXXXXX" className={`h-12 rounded-xl border-border bg-background shadow-none ${errors.licenseNumber ? 'border-red-500' : ''}`} {...register('licenseNumber')} />
                      {errors.licenseNumber && <p className="text-xs font-semibold text-red-500">{errors.licenseNumber.message}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-8 sm:grid-cols-2 pt-4">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                <Input id="name" placeholder="Jane Doe" className={`h-14 rounded-2xl border-border bg-secondary/20 px-4 text-lg focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-colors shadow-none ${errors.name ? 'border-red-500 bg-red-500/5' : ''}`} aria-invalid={Boolean(errors.name)} {...register('name')} />
                {errors.name && <p className="text-sm font-semibold text-red-500 mt-2">{errors.name.message}</p>}
              </div>
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Phone (Optional)</Label>
                <Input id="phone" placeholder="+63 900 000 0000" className={`h-14 rounded-2xl border-border bg-secondary/20 px-4 text-lg focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-colors shadow-none ${errors.phone ? 'border-red-500 bg-red-500/5' : ''}`} aria-invalid={Boolean(errors.phone)} {...register('phone')} />
                {errors.phone && <p className="text-sm font-semibold text-red-500 mt-2">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Email address</Label>
              <Input id="email" type="email" placeholder="jane@example.com" className={`h-14 rounded-2xl border-border bg-secondary/20 px-4 text-lg focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-colors shadow-none ${errors.email ? 'border-red-500 bg-red-500/5' : ''}`} aria-invalid={Boolean(errors.email)} {...register('email')} />
              {errors.email && <p className="text-sm font-semibold text-red-500 mt-2">{errors.email.message}</p>}
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Create Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className={`h-14 rounded-2xl border-border bg-secondary/20 pl-4 pr-12 text-lg focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-colors shadow-none ${errors.password ? 'border-red-500 bg-red-500/5' : ''}`} aria-invalid={Boolean(errors.password)} {...register('password')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm font-semibold text-red-500 mt-2">{errors.password.message}</p>}
              </div>
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" className={`h-14 rounded-2xl border-border bg-secondary/20 pl-4 pr-12 text-lg focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-colors shadow-none ${errors.confirmPassword ? 'border-red-500 bg-red-500/5' : ''}`} aria-invalid={Boolean(errors.confirmPassword)} {...register('confirmPassword')} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm font-semibold text-red-500 mt-2">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <Button className="group w-full h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-none" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Start your journey"}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
            </Button>
          </form>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-lg text-muted-foreground">
              Already a member?{" "}
              <Link to="/login" className="font-bold text-foreground hover:text-primary transition-colors">Sign in here</Link>
            </p>
          </div>
          <div className="mt-8">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">By creating an account, you agree to our Terms of Service.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
