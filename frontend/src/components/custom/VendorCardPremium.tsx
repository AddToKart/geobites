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
      <article className="panel-card flex h-full flex-col transform-gpu transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-panel)]">
        <div className="relative h-56 overflow-hidden bg-surface-2">
          {vendor.imageUrl ? (
            <img
              src={vendor.imageUrl}
              alt={vendor.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-end bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.38),transparent_36%),linear-gradient(135deg,var(--color-primary-light),var(--color-primary-dark))] p-6">
              <div className="max-w-[14rem] text-white">
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                  Local Favorite
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{vendor.name}</p>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            {vendor.isActive ? <Badge variant="success" className="rounded-full px-3 py-1 font-semibold border-none">Open</Badge> : <Badge variant="default" className="rounded-full px-3 py-1 font-semibold border-none backdrop-blur-md bg-black/50 text-white">Closed</Badge>}
            {isPopular ? <Badge className="bg-primary text-white rounded-full px-3 py-1 font-semibold border-none">Popular</Badge> : null}
          </div>

          <div className="absolute bottom-5 left-5 flex items-center gap-1.5 rounded-full bg-card/95 backdrop-blur-md px-3.5 py-1.5 text-[13px] font-bold text-foreground shadow-[var(--shadow-soft)]">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span>{avgRating.toFixed(1)}</span>
            <span className="text-text-muted font-medium">({vendor.totalRatings})</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5 p-6">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                  {vendor.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-text-soft line-clamp-2">
                  {vendor.description || 'Fresh meals, reliable prep times, and an easy repeat order flow.'}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            <div className="flex items-start gap-2 text-[13px] font-medium text-text-soft mt-3">
              <MapPin className="h-4 w-4 shrink-0 text-text-muted mt-0.5" />
              <span className="line-clamp-1">{vendor.address}</span>
            </div>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3 rounded-[20px] bg-surface-2 p-4 text-[13px] font-semibold text-text-soft">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-primary" />
              <span>20-35 min</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <span>Delivery ready</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
