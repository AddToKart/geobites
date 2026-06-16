import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadUrl } from '@/utils/upload';
import type { BrowseVendor } from './types';

function formatDistanceLabel(distanceKm: number | null) {
  if (distanceKm === null) {
    return 'Santa Maria area';
  }

  return distanceKm < 1
    ? `${Math.round(distanceKm * 1000)} m away`
    : `${distanceKm.toFixed(1)} km away`;
}

export const BrowseListItem = memo(function BrowseListItem({
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
  const isClosed = !vendor.isActive && !vendor.isTemporarilyClosed;
  const [showClosedModal, setShowClosedModal] = useState(false);

  if (isClosed) {
    return (
      <>
        <button className="block w-full text-left" onMouseEnter={onSelect} onFocus={onSelect} onClick={() => setShowClosedModal(true)}>
          <article
            className={cn(
              'group flex flex-col xl:flex-row border-b border-border transition-colors hover:bg-secondary/10',
              isSelected && 'bg-secondary/5',
            )}
            style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 200px', contain: 'layout style paint' }}
          >
            <div
              className="relative min-h-[200px] xl:w-[320px] bg-secondary flex-shrink-0 p-8 border-b xl:border-b-0 xl:border-r border-border opacity-50"
              style={vendor.imageUrl ? { backgroundImage: `url(${uploadUrl(vendor.imageUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            >
              {!vendor.imageUrl && <div className="absolute inset-0 bg-secondary/20" />}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="relative z-10">
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Closed
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    {vendor.neighborhood || 'Santa Maria'}
                  </p>
                  <h2 className="text-3xl font-medium tracking-tighter text-muted-foreground">
                    {vendor.name}
                  </h2>
                </div>
              </div>
            </div>
          </article>
        </button>
        {showClosedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowClosedModal(false)}>
            <div className="w-full max-w-md bg-background border border-border p-8 mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">Shop is closed</h3>
                <button onClick={() => setShowClosedModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                This shop is currently closed and will be back soon.
              </p>
              <button
                onClick={() => setShowClosedModal(false)}
                className="w-full bg-primary text-primary-foreground px-6 py-3.5 text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <Link to={`/vendor/${vendor.id}`} className="block" onMouseEnter={onSelect} onFocus={onSelect}>
      <article
        className={cn(
          'group flex flex-col xl:flex-row border-b border-border transition-colors hover:bg-secondary/10',
          isSelected && 'bg-secondary/5',
        )}
        style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 200px', contain: 'layout style paint' }}
      >
        <div
          className="relative min-h-[200px] xl:w-[320px] bg-secondary flex-shrink-0 p-8 border-b xl:border-b-0 xl:border-r border-border"
          style={vendor.imageUrl ? { backgroundImage: `url(${uploadUrl(vendor.imageUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {!vendor.imageUrl && <div className="absolute inset-0 bg-secondary/20" />}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="relative z-10">
            <div className="flex flex-wrap gap-2 mb-6">
            <span className={cn(
              "text-xs font-bold uppercase tracking-widest",
              vendor.isTemporarilyClosed ? "text-amber-500" : vendor.isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {vendor.isTemporarilyClosed ? 'Temporarily Closed' : vendor.isActive ? 'Open now' : 'Closed'}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-auto">
              {vendor.spotlight || 'Nearby'}
            </span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              {vendor.neighborhood || 'Santa Maria'}
            </p>
            <h2 className="text-3xl font-medium tracking-tighter group-hover:text-primary transition-colors">
              {vendor.name}
            </h2>
          </div>
          </div>
        </div>

        <div className="flex-1 p-8 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-lg leading-relaxed text-muted-foreground">
                {vendor.description || 'Prepared fast and pinned close to Santa Maria for easier ordering.'}
              </p>
              <div className="flex items-start gap-2 text-sm text-muted-foreground mt-4 font-semibold uppercase tracking-widest">
                <MapPin className="h-4 w-4" />
                <span>{vendor.address}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-8">
            {(vendor.specialties || []).slice(0, 3).map((specialty) => (
              <span
                key={specialty}
                className="border border-border px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between border-t border-border p-8 xl:w-[280px] xl:border-l xl:border-t-0 flex-shrink-0">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rating</span>
              <span className="flex items-center gap-1 text-sm font-bold text-foreground">
                <Star className="h-4 w-4 fill-primary text-primary" />
                {vendor.rating.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Distance</span>
              <span className="text-sm font-bold text-foreground">
                {formatDistanceLabel(distanceKm)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Arrives in</span>
              <span className="text-sm font-bold text-foreground">
                {vendor.etaMinutes || '20-35 min'}
              </span>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between group-hover:text-primary transition-colors">
            <span className="text-sm font-bold uppercase tracking-widest">Open menu</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" strokeWidth={2.5} />
          </div>
        </div>
      </article>
    </Link>
  );
});
