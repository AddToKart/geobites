import { useAuth } from '@/hooks/useAuth';
import { Mail, Phone, Shield, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ProfilePage() {
  const { user } = useAuth();

  const fields = [
    {
      icon: <User className="h-6 w-6" />,
      label: 'Full name',
      value: user?.name || 'Not set',
    },
    {
      icon: <Mail className="h-6 w-6" />,
      label: 'Email address',
      value: user?.email || 'Not set',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      label: 'Account role',
      value: user?.role ? user.role[0].toUpperCase() + user.role.slice(1) : 'Unknown',
    },
    {
      icon: <Phone className="h-6 w-6" />,
      label: 'Phone number',
      value: user?.phone || 'Not set',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <div className="border-b-2 border-foreground pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Account</p>
            <h1 className="text-6xl font-medium tracking-tighter">Profile.</h1>
            <p className="text-xl text-muted-foreground mt-4 max-w-xl">
              Your name, email, role, and contact info at a glance.
            </p>
          </div>
          <Link to="/" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Back to dashboard
          </Link>
        </div>

        <section className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 mb-16">
          {fields.map((field) => (
            <div key={field.label} className="border border-border p-8 bg-background flex flex-col justify-between min-h-[240px]">
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{field.label}</span>
                <div className="text-muted-foreground">
                  {field.icon}
                </div>
              </div>
              <p className="text-3xl font-medium tracking-tighter line-clamp-2">{field.value}</p>
            </div>
          ))}
        </section>

        <div className="border border-border p-12 bg-secondary/10 max-w-3xl">
          <h2 className="text-3xl font-medium tracking-tighter mb-4">Account info</h2>
          <p className="text-lg text-muted-foreground">
            Profile editing is coming soon. For now, contact support to update your details or change your role.
          </p>
        </div>
      </div>
    </div>
  );
}
