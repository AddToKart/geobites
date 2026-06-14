import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, CloudMoon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Reveal } from '@/components/motion/Reveal';
import type { Order } from '@/types';

export const BrowseOverviewSection = memo(function BrowseOverviewSection({
  search,
  onSearchChange,
  browseCount,
  activeOrder,
  isMapMode = false,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  browseCount: number;
  activeOrder: Order | null;
  isMapMode?: boolean;
}) {
  return (
    <div className={`flex flex-col ${isMapMode ? 'gap-4' : 'gap-8 pb-12 border-b border-border'}`}>
      {!isMapMode && (
        <Reveal>
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-4">
              <CloudMoon className="w-4 h-4" />
              <span>Evening in Santa Maria • 64°F</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-medium text-foreground tracking-tighter leading-[0.9]">
              What are you<br />
              <span className="text-muted-foreground">craving?</span>
            </h1>
            <p className="text-xl font-medium text-muted-foreground mt-6">
              {browseCount} curated spots open right now
            </p>
          </div>
        </Reveal>
      )}

      <Reveal delay={0.05} className="flex flex-col md:flex-row items-center gap-4 mt-4">
        <div className={`relative flex-1 w-full ${isMapMode ? 'bg-background/90 backdrop-blur-md' : ''}`} style={isMapMode ? { willChange: 'transform' } : undefined}>
          <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search restaurants, groceries, or dishes..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className={`pl-16 rounded-none border-border bg-transparent h-20 text-xl md:text-2xl font-medium text-foreground shadow-none focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground transition-all ${isMapMode ? 'border-2' : 'border-b-2 border-t-0 border-l-0 border-r-0'}`}
          />
        </div>
        {!isMapMode && (
          <Button size="icon" variant="outline" className="shrink-0 h-20 w-20 rounded-none border-2 border-border text-foreground hover:bg-foreground hover:text-background transition-colors hidden md:flex">
            <SlidersHorizontal className="h-6 w-6" />
          </Button>
        )}
      </Reveal>



      {activeOrder ? (
        <Reveal delay={0.15} className={`bg-foreground text-background p-6 flex flex-col md:flex-row items-center justify-between border-l-4 border-primary ${isMapMode ? 'mt-0' : 'mt-8'}`}>
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-background flex items-center justify-center shrink-0 border border-border">
               <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">Active Order</p>
              <h2 className="text-2xl font-medium capitalize mt-1 tracking-tight">
                {activeOrder.status.replaceAll('_', ' ')}
              </h2>
            </div>
          </div>
          <Link to={`/orders/${activeOrder.id}`} className="mt-4 md:mt-0 font-bold uppercase tracking-widest text-primary hover:text-primary-foreground transition-colors flex items-center gap-2">
            Track Delivery
          </Link>
        </Reveal>
      ) : null}
    </div>
  );
});
