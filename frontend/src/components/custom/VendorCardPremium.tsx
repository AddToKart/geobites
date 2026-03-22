import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, MapPin, Star, Truck } from 'lucide-react';
import { Vendor } from '@/types';
import { Badge } from '@/components/ui/badge';

interface VendorCardProps {
  vendor: Vendor;
}

export function VendorCardPremium({ vendor }: VendorCardProps) {
  const avgRating = vendor.rating || 0;
  const isPopular = vendor.totalRatings >= 25;

  return (
    <Link to={`/vendor/${vendor.id}`} className="group block h-full">
      <article className="defer-card flex h-full flex-col overflow-hidden rounded-[26px] border border-[color:var(--color-shell-border)] bg-[color:var(--color-shell-bg)] shadow-[var(--shadow-card)] transform-gpu transition-transform duration-150 hover:-translate-y-0.5">
        <div className="relative h-52 overflow-hidden bg-[linear-gradient(135deg,#ef7c42,#f6b372)]">
          {vendor.imageUrl ? (
            <img
              src={vendor.imageUrl}
              alt={vendor.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-end bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.38),transparent_35%),linear-gradient(135deg,#ef7c42,#f6b372)] p-6">
              <div className="max-w-[14rem] text-white">
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-white/75">
                  Local Favorite
                </p>
                <p className="mt-2 text-2xl font-semibold leading-tight">{vendor.name}</p>
              </div>
            </div>
          )}

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {vendor.isActive ? <Badge variant="success">Open now</Badge> : <Badge variant="warning">Closed</Badge>}
            {isPopular ? <Badge>Popular</Badge> : null}
          </div>

          <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-[color:var(--color-overlay-border)] bg-[color:var(--color-overlay-bg)] px-3 py-2 text-sm font-medium text-[color:var(--color-text)] shadow-[var(--shadow-soft)]">
            <Star className="h-4 w-4 fill-[color:var(--color-primary)] text-[color:var(--color-primary)]" />
            <span>{avgRating.toFixed(1)}</span>
            <span className="text-[color:var(--color-text-soft)]">({vendor.totalRatings})</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-[color:var(--color-text)] transition-colors group-hover:text-[color:var(--color-primary-dark)]">
                  {vendor.name}
                </h3>
                <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                  {vendor.description || 'Fresh meals, reliable prep times, and an easy repeat order flow.'}
                </p>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 text-[color:var(--color-text-light)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[color:var(--color-primary-dark)]" />
            </div>

            <div className="flex items-start gap-2 text-sm text-[color:var(--color-text-soft)]">
              <MapPin className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
              <span className="line-clamp-2">{vendor.address}</span>
            </div>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3 rounded-[20px] bg-[color:var(--color-surface-2)] p-3 text-sm text-[color:var(--color-text-soft)]">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
              <span>20-35 min</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
              <span>Delivery ready</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
