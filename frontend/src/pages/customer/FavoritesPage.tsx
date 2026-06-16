import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Star, Trash2 } from "lucide-react";
import { useFavorites, useRemoveFavorite } from "@/hooks/queries";
import { Skeleton } from "@/components/ui/skeleton";

export function FavoritesPage() {
  const { data: favorites, isLoading, error } = useFavorites();
  const removeFavorite = useRemoveFavorite();

  if (isLoading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <Skeleton className="h-12 w-48 rounded-none border border-border mb-12" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-none border border-border" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <div className="border border-red-500 bg-red-500/10 p-6 text-sm font-bold text-red-500">
          Failed to load favorites
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <div className="border-b border-border pb-6 mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Saved</p>
          <h1 className="text-4xl font-bold tracking-tight">Your favorites.</h1>
          <p className="text-base text-muted-foreground mt-2">Quick access to the spots you love.</p>
        </div>

        {!favorites || favorites.length === 0 ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 bg-secondary/5 border border-border">
            <Heart className="h-12 w-12 text-muted-foreground/50 mb-6" />
            <h2 className="text-4xl font-medium tracking-tighter mb-4">No favorites yet</h2>
            <p className="text-lg text-muted-foreground mb-8">Save your go-to spots for quick ordering.</p>
            <Link
              to="/browse"
              className="bg-foreground text-background px-8 py-4 font-bold uppercase tracking-widest hover:opacity-90 transition-colors flex items-center gap-3"
            >
              <ShoppingBag className="h-5 w-5" />
              Explore restaurants
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="group relative border border-border bg-card backdrop-blur-xl overflow-hidden flex flex-col"
              >
                <Link
                  to={`/vendor/${fav.vendorId}`}
                  className="flex flex-col flex-1"
                >
                  <div className="h-40 bg-secondary/20 flex items-center justify-center overflow-hidden">
                    {fav.vendor.imageUrl ? (
                      <img
                        src={fav.vendor.imageUrl}
                        alt={fav.vendor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold tracking-tight">{fav.vendor.name}</h3>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="font-medium">{fav.vendor.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {fav.vendor.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-auto">{fav.vendor.address}</p>
                  </div>
                </Link>
                <button
                  onClick={() => removeFavorite.mutate(fav.vendorId)}
                  className="absolute top-3 right-3 h-10 w-10 flex items-center justify-center bg-background/80 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white hover:border-red-500"
                  aria-label="Remove from favorites"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
