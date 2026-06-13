import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, MapPin, Star, Truck } from 'lucide-react';
import type { Vendor } from '@/types';
import { Badge } from '@/components/ui/badge';

interface VendorCardProps {
  vendor: Vendor;
}

export function VendorCardPremium({ vendor }: VendorCardProps) {
  const avgRating = vendor.rating || 0;
  const isPopular = vendor.totalRatings >= 25;

  return (
    <Link to={`/vendor/${vendor.id}`} className="group block h-full">
      <article className="flex h-full flex-col border-b border-border pb-8 transition-colors hover:bg-secondary/10 p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {vendor.isActive ? (
              <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Open
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                Closed
              </span>
            )}
            {isPopular && (
              <span className="text-xs font-bold uppercase tracking-widest text-foreground ml-4">
                Popular
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span>{avgRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({vendor.totalRatings})</span>
          </div>
        </div>

        <div>
          <h3 className="text-4xl font-medium tracking-tighter text-foreground group-hover:text-primary transition-colors">
            {vendor.name}
          </h3>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed line-clamp-2">
            {vendor.description || 'Local meals prepared fresh and pinned close to Santa Maria.'}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{vendor.address}</span>
            </div>
            <div className="flex items-center gap-6 text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              <span className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> 20-35m</span>
              <span className="flex items-center gap-2"><Truck className="h-4 w-4" /> Ready</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-full border border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </div>
        </div>
      </article>
    </Link>
  );
}
