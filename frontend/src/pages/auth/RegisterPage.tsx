import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Store, Truck, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export function RegisterPage() {
  const navigate = useNavigate();
  const { user, signUp, isLoading } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer' as UserRole,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await signUp(form);
      toast.success('Account created successfully');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to register');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    {
      value: 'customer' as const,
      icon: <UserCircle2 className="h-5 w-5" />,
      label: 'Customer',
      copy: 'Browse restaurants, place orders, and track delivery cleanly.',
    },
    {
      value: 'seller' as const,
      icon: <Store className="h-5 w-5" />,
      label: 'Seller',
      copy: 'Manage menu items and orders from the dashboard.',
    },
    {
      value: 'rider' as const,
      icon: <Truck className="h-5 w-5" />,
      label: 'Rider',
      copy: 'Accept deliveries and keep status updates moving.',
    },
  ];

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] px-4 py-8 md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex justify-end lg:col-span-2">
          <ThemeToggle />
        </div>
        <Card className="self-center order-2 lg:order-1">
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="space-y-2">
              <p className="eyebrow">Create account</p>
              <h1>Start with the right role</h1>
              <p className="subtle-copy">
                Pick the workflow you need today. You can get into the dashboard right after signup.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+63 900 000 0000"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(value: UserRole) => setForm({ ...form, role: value })}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="rider">Rider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    required
                  />
                </div>
              </div>

              <Button className="w-full" type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create account'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="text-sm text-[color:var(--color-text-soft)]">
              Already have an account?{' '}
              <Link className="font-medium text-[color:var(--color-primary-dark)]" to="/login">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        <section className="page-hero order-1 flex flex-col justify-between lg:order-2">
          <div className="space-y-4">
            <p className="eyebrow">Choose your path</p>
            <h2>One product, three clearer workflows</h2>
            <p className="max-w-xl subtle-copy">
              The redesign is built around role-based dashboards, so every account starts with a more focused home screen.
            </p>
          </div>

          <div className="grid gap-4">
            {roles.map((role) => (
              <div
                key={role.value}
                className={
                  form.role === role.value
                    ? 'panel-card border-[rgba(235,106,45,0.2)] bg-[color:var(--color-primary-soft)]/60 p-4'
                    : 'panel-card p-4'
                }
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]">
                    {role.icon}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[color:var(--color-text)]">{role.label}</p>
                    <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">{role.copy}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
