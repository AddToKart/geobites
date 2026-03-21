import { type FormEvent, type ReactNode, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && user) {
    const destination =
      user.role === 'seller' ? '/seller' : user.role === 'rider' ? '/rider' : '/browse';
    return <Navigate to={destination} replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      toast.success('Welcome back');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] px-4 py-8 md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex justify-end lg:col-span-2">
          <ThemeToggle />
        </div>
        <section className="page-hero flex flex-col justify-between">
          <div className="space-y-4">
            <p className="eyebrow">Geobites</p>
            <h1>Sign in to a calmer dashboard</h1>
            <p className="max-w-xl subtle-copy">
              Cleaner ordering for customers, clearer operations for sellers, and a rider view that keeps the next action obvious.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon={<ShoppingBag className="h-5 w-5" />}
              title="Cleaner ordering"
              description="Browse, cart, and tracking now follow the same layout language."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Role aware"
              description="The app routes you straight into the right dashboard for your account."
            />
            <FeatureCard
              icon={<Truck className="h-5 w-5" />}
              title="Useful status"
              description="Delivery and order state are visible without hunting through tabs."
            />
          </div>
        </section>

        <Card className="self-center">
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="space-y-2">
              <p className="eyebrow">Welcome back</p>
              <h2 className="text-3xl font-semibold">Sign in</h2>
              <p className="subtle-copy">Use the account you already created for Geobites.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <Button className="w-full" type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="text-sm text-[color:var(--color-text-soft)]">
              Need an account?{' '}
              <Link className="font-medium text-[color:var(--color-primary-dark)]" to="/register">
                Create one here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="panel-card p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">{description}</p>
    </div>
  );
}
