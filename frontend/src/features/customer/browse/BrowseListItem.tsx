import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BrowseVendor } from './types';

function formatDistanceLabel(distanceKm: number | null) {
  if (distanceKm === null) {
    return 'Santa Maria area';
  }

  return distanceKm < 1
    ? `${Math.round(distanceKm * 1000)} m away`
    : `${distanceKm.toFixed(1)} km away`;
}

export function BrowseListItem({
  vendor,
  distanceKm,
  isSelected,
  onSelect,
}: {
  vendor: BrowseVendor;
  distanceKm: number | null;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Link to={`/vendor/${vendor.id}`} className="block" onMouseEnter={onSelect} onFocus={onSelect}>
      <article
        className={cn(
          'panel-card grid transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-panel)] xl:grid-cols-[260px_minmax(0,1fr)_220px]',
          isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[var(--shadow-glow)]',
        )}
      >
        <div className="relative min-h-[220px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.38),transparent_36%),linear-gradient(135deg,var(--color-primary-light),var(--color-primary-dark))] p-6 text-white">
          <div className="flex flex-wrap gap-2">
            <Badge variant={vendor.isActive ? 'success' : 'warning'}>
              {vendor.isActive ? 'Open now' : 'Closed'}
            </Badge>
            <Badge>{vendor.spotlight || 'Nearby'}</Badge>
          </div>
          <div className="mt-10 max-w-[14rem]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
              {vendor.neighborhood || 'Santa Maria'}
            </p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight">{vendor.name}</h2>
            <p className="mt-3 text-sm leading-6 text-white/85">
              {vendor.description || 'Local food and reliable delivery around Santa Maria, Bulacan.'}
            </p>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{vendor.name}</p>
              <p className="mt-2 text-sm leading-6 text-text-soft">
                {vendor.description || 'Prepared fast and pinned close to Santa Maria for easier ordering.'}
              </p>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 text-text-muted" />
          </div>

          <div className="flex items-start gap-2 text-sm text-text-soft">
            <MapPin className="mt-0.5 h-4 w-4 text-primary" />
            <span>{vendor.address}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(vendor.specialties || []).slice(0, 3).map((specialty) => (
              <span
                key={specialty}
                className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-text-soft border border-white/30 dark:border-white/5"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-border/5 bg-surface-2/50 p-6 xl:border-l xl:border-t-0">
          <div className="grid gap-3">
            <div className="panel-muted flex items-center justify-between px-4 py-3">
              <span className="text-sm text-text-soft">Rating</span>
              <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                <Star className="h-4 w-4 fill-primary text-primary" />
                {vendor.rating.toFixed(1)}
              </span>
            </div>
            <div className="panel-muted flex items-center justify-between px-4 py-3">
              <span className="text-sm text-text-soft">Distance</span>
              <span className="text-sm font-semibold text-foreground">
                {formatDistanceLabel(distanceKm)}
              </span>
            </div>
            <div className="panel-muted flex items-center justify-between px-4 py-3">
              <span className="text-sm text-text-soft">ETA</span>
              <span className="text-sm font-semibold text-foreground">
                {vendor.etaMinutes || '20-35 min'}
              </span>
            </div>
          </div>

          <Button asChild className="w-full">
            <span>
              Open menu
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
        </div>
      </article>
    </Link>
  );
}
