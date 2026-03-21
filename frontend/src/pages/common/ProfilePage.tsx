import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Phone, Shield, User } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

export function ProfilePage() {
  const { user } = useAuth();

  const fields = [
    {
      icon: <User className="h-5 w-5" />,
      label: 'Full name',
      value: user?.name || 'Not set',
    },
    {
      icon: <Mail className="h-5 w-5" />,
      label: 'Email address',
      value: user?.email || 'Not set',
    },
    {
      icon: <Shield className="h-5 w-5" />,
      label: 'Account role',
      value: user?.role ? user.role[0].toUpperCase() + user.role.slice(1) : 'Unknown',
    },
    {
      icon: <Phone className="h-5 w-5" />,
      label: 'Phone number',
      value: user?.phone || 'Not set',
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Core account details live here. The goal is simple: make the important information easy to scan and nothing else."
      />

      <section className="grid gap-5 md:grid-cols-2">
        {fields.map((field) => (
          <Card key={field.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]">
                {field.icon}
              </div>
              <div>
                <p className="text-sm text-[color:var(--color-text-soft)]">{field.label}</p>
                <p className="mt-1 text-lg font-semibold text-[color:var(--color-text)]">{field.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="max-w-3xl">
        <CardContent className="space-y-3 p-5">
          <h2 className="text-2xl font-semibold">Account notes</h2>
          <p className="text-sm text-[color:var(--color-text-soft)]">
            This screen is intentionally lightweight for now. If you want editable profile fields next, this page is already set up to become the account settings surface.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
