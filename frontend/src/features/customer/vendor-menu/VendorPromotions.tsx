import { Gift, Bike, Percent } from "lucide-react";
import { formatCurrency } from "@/utils/helpers";
import type { Promotion } from "@/types";

export function VendorPromotions({ promotions }: { promotions: Promotion[] }) {
  if (promotions.length === 0) return null;

  return (
    <div className="space-y-3">
      {promotions.map((promo) => {
        const Icon = promo.type === "percentage" ? Percent : promo.type === "free_delivery" ? Bike : Gift;
        return (
          <div key={promo.id} className="border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
            <Icon className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">{promo.name}</p>
              {promo.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{promo.description}</p>
              )}
            </div>
            {promo.minOrderAmount && promo.minOrderAmount > 0 && (
              <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 border border-border px-2 py-1">
                Min. {formatCurrency(promo.minOrderAmount)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
