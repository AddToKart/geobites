import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getVendors } from '@/services/vendorService';
import { getVendorRatings } from '@/services/ratingService';
import { Rating, Vendor } from '@/types';
import { Star, StarHalf, MessageSquare } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

function StarDisplay({ score }: { score: number }) {
  const full = Math.floor(score);
  const half = score % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`full-${i}`} className="h-3.5 w-3.5 text-warning" fill="currentColor" />
      ))}
      {half && <StarHalf className="h-3.5 w-3.5 text-warning" fill="currentColor" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-3.5 w-3.5 text-muted-foreground/30" />
      ))}
    </div>
  );
}

export function SellerRatings() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageScore, setAverageScore] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const vendors = await getVendors({ page: 1, limit: 100 });
      const myVendor = vendors.data.find((v) => v.userId === user.id) ?? null;
      setVendor(myVendor);
      if (myVendor) {
        const response = await getVendorRatings(myVendor.id);
        setRatings(response.ratings);
        setAverageScore(response.averageScore);
        setTotalRatings(response.totalRatings);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load ratings');
    }
  }, [user]);

  useEffect(() => { void loadData(); }, [loadData]);

  const distribution = useMemo(() => {
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((r) => { dist[r.score] = (dist[r.score] ?? 0) + 1; });
    return dist;
  }, [ratings]);

  const recentRatings = useMemo(
    () => ratings.slice(0, 20),
    [ratings],
  );

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background text-foreground p-12 text-center text-muted-foreground">
        <p>Save your shop profile first to view ratings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        {/* Editorial Header */}
        <div className="border-b border-border pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Seller</p>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Customer ratings</h1>
            <p className="text-base text-muted-foreground mt-2 max-w-xl">
              See what customers are saying about your shop. All ratings are from verified orders.
            </p>
          </div>
        </div>

        {error ? (
          <div className="border-l-4 border-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)]/20 px-6 py-4 text-sm text-[color:var(--color-danger)] mb-8">
            {error}
          </div>
        ) : null}

        {/* Rating Overview */}
        <div className="grid gap-6 md:grid-cols-4 mb-12">
          <div className="border border-border p-6 bg-background md:col-span-2">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-6xl font-bold tracking-tight">{averageScore.toFixed(1)}</p>
                <div className="flex justify-center mt-2">
                  <StarDisplay score={averageScore} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{totalRatings} ratings</p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[star] ?? 0;
                  const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs">
                      <span className="w-3 font-bold text-muted-foreground">{star}</span>
                      <div className="flex-1 h-3 bg-secondary/20">
                        <div
                          className="h-full bg-yellow-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-muted-foreground font-mono">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border border-border p-6 bg-background">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total reviews</span>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-semibold tracking-tight">{totalRatings}</p>
          </div>

          <div className="border border-border p-6 bg-background">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Shop rating</span>
              <Star className="h-4 w-4 text-warning" fill="currentColor" />
            </div>
            <p className="text-3xl font-semibold tracking-tight">{vendor.rating.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-1">{vendor.totalRatings} total on profile</p>
          </div>
        </div>

        {/* Recent Ratings */}
        <div className="border border-border">
          <div className="border-b border-border px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Recent feedback {recentRatings.length > 0 && `(${recentRatings.length})`}
            </p>
          </div>

          {recentRatings.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground bg-secondary/5">
              <Star className="h-8 w-8 mx-auto mb-4 text-muted-foreground/50" />
              <p className="font-semibold text-foreground mb-1">No ratings yet</p>
              <p className="text-xs">Customer ratings will appear here once orders are completed and reviewed.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentRatings.map((rating) => (
                <div key={rating.id} className="px-6 py-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StarDisplay score={rating.score} />
                      <span className="text-xs font-bold text-foreground">{rating.score}.0</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatDate(rating.createdAt)}
                    </span>
                  </div>
                  {rating.feedback && (
                    <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
                      "{rating.feedback}"
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">
                    {rating.customerName} • Verified order
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
