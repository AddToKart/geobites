import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, MapPin, Star, Truck, X } from 'lucide-react';
import type { Vendor } from '@/types';
import { uploadUrl } from '@/utils/upload';

interface VendorCardProps {
  vendor: Vendor;
}

export const VendorCardPremium = memo(function VendorCardPremium({ vendor }: VendorCardProps) {
  const avgRating = vendor.rating || 0;
  const isPopular = vendor.totalRatings >= 25;
  const isClosed = !vendor.isActive && !vendor.isTemporarilyClosed;
  const [showClosedModal, setShowClosedModal] = useState(false);

  if (isClosed) {
    return (
      <>
        <button
          onClick={() => setShowClosedModal(true)}
          className="group block h-full w-full text-left"
        >
          <article className="flex h-full flex-col border-b border-border pb-8 transition-colors hover:bg-secondary/10 p-6 md:p-8" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 300px', contain: 'layout style paint' }}>
            {vendor.imageUrl && (
              <div className="h-40 w-full mb-4 border border-border overflow-hidden relative opacity-50" style={{ backgroundImage: `url(${uploadUrl(vendor.imageUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            )}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  Closed
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-bold">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span>{avgRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({vendor.totalRatings})</span>
              </div>
            </div>
            <div>
              <h3 className="text-4xl font-medium tracking-tighter text-muted-foreground">
                {vendor.name}
              </h3>
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
    <Link to={`/vendor/${vendor.id}`} className="group block h-full">
      <article className="flex h-full flex-col border-b border-border pb-8 transition-colors hover:bg-secondary/10 p-6 md:p-8" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 300px', contain: 'layout style paint' }}>
        {vendor.imageUrl && (
          <div className="h-40 w-full mb-4 border border-border overflow-hidden relative" style={{ backgroundImage: `url(${uploadUrl(vendor.imageUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {vendor.isTemporarilyClosed ? (
              <span className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Temporarily Closed
              </span>
            ) : vendor.isActive ? (
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
});
