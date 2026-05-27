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
      <article className="defer-card flex h-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[var(--shadow-card)] transform-gpu transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-panel)] dark:bg-gray-900 border border-slate-100 dark:border-gray-800">
        <div className="relative h-56 overflow-hidden bg-slate-100 dark:bg-gray-800">
          {vendor.imageUrl ? (
            <img
              src={vendor.imageUrl}
              alt={vendor.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-end bg-gradient-to-tr from-orange-500 to-orange-300 p-6">
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
            {vendor.isActive ? <Badge className="bg-emerald-500 text-white rounded-full px-3 py-1 font-semibold border-none">Open</Badge> : <Badge className="bg-slate-800/80 text-white backdrop-blur-md rounded-full px-3 py-1 font-semibold border-none">Closed</Badge>}
            {isPopular ? <Badge className="bg-orange-500 text-white rounded-full px-3 py-1 font-semibold border-none">Popular</Badge> : null}
          </div>

          <div className="absolute bottom-5 left-5 flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3.5 py-1.5 text-[13px] font-bold text-slate-900 shadow-sm dark:bg-gray-900/95 dark:text-white">
            <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
            <span>{avgRating.toFixed(1)}</span>
            <span className="text-slate-500 font-medium">({vendor.totalRatings})</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5 p-6">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-orange-500 dark:text-white">
                  {vendor.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-500 line-clamp-2">
                  {vendor.description || 'Fresh meals, reliable prep times, and an easy repeat order flow.'}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            <div className="flex items-start gap-2 text-[13px] font-medium text-slate-500 mt-3">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
              <span className="line-clamp-1">{vendor.address}</span>
            </div>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3 rounded-[20px] bg-slate-50 dark:bg-gray-800 p-4 text-[13px] font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-orange-500" />
              <span>20-35 min</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-500" />
              <span>Delivery ready</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
