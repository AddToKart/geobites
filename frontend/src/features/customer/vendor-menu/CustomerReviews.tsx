import { Star } from "lucide-react";
import type { Rating } from "@/types";

export function CustomerReviews({
  ratings,
  avgRating,
  totalRatingCount,
}: {
  ratings: Rating[];
  avgRating: number;
  totalRatingCount: number;
}) {
  if (ratings.length === 0) return null;

  return (
    <div className="border-t border-border pt-12 mt-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Reviews</p>
          <h2 className="text-3xl font-medium tracking-tighter">What customers say</h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight">{avgRating.toFixed(1)}</p>
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < Math.round(avgRating) ? "text-warning" : "text-muted-foreground/30"}`}
                fill={i < Math.round(avgRating) ? "currentColor" : "none"}
              />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">({totalRatingCount})</span>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {ratings.slice(0, 5).map((rating) => (
          <div key={rating.id} className="border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < rating.score ? "text-warning" : "text-muted-foreground/30"}`}
                  fill={i < rating.score ? "currentColor" : "none"}
                />
              ))}
            </div>
            {rating.feedback && (
              <p className="text-sm text-muted-foreground leading-relaxed">"{rating.feedback}"</p>
            )}
            <p className="text-[10px] text-muted-foreground/60 mt-2 font-bold uppercase tracking-widest">
              {rating.customerName}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
