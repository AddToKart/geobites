import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Search, SlidersHorizontal, MapPin, CloudMoon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Reveal } from '@/components/motion/Reveal';
import type { Order } from '@/types';
import type { BrowseSort, BrowseVendor } from './types';

export function BrowseOverviewSection({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  onResetArea,
  browseCount,
  topRatedCount,
  featuredCount,
  selectedVendor,
  activeOrder,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: BrowseSort;
  onSortChange: (value: BrowseSort) => void;
  onResetArea: () => void;
  browseCount: number;
  topRatedCount: number;
  featuredCount: number;
  selectedVendor: BrowseVendor | null;
  activeOrder: Order | null;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Reveal>
        <div className="mb-2">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1.5">
            <CloudMoon className="w-4 h-4" />
            <span>Chilly evening in Santa Maria • 64°F</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            What are you craving?
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
            {browseCount} curated spots open right now
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05} className="flex items-center gap-3">
        <div className="relative flex-1 group shadow-sm rounded-[24px]">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search restaurants, groceries, or dishes..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-13 rounded-[24px] bg-white dark:bg-gray-900 border border-slate-200/50 dark:border-gray-800 h-14 text-[15px] font-semibold text-slate-900 dark:text-white shadow-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button size="icon" variant="ghost" className="rounded-[18px] bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 hover:text-slate-900">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1} className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {['Offers', 'Pickup', 'Burgers', 'Asian', 'Healthy', 'Coffee', 'Desserts'].map((category, i) => (
           <Button key={category} variant="outline" className={`rounded-[20px] border border-slate-200/50 dark:border-gray-800 shadow-sm bg-white/80 backdrop-blur-md dark:bg-gray-900/80 font-bold text-[13px] h-10 px-5 transition-all hover:border-primary/30 hover:bg-primary/5 ${i === 0 ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
             {category}
           </Button>
        ))}
      </Reveal>

      {activeOrder ? (
        <Reveal delay={0.15} className="mt-2 bg-gradient-to-r from-primary to-orange-500 text-white rounded-[24px] p-1.5 flex items-center justify-between shadow-lg shadow-primary/20">
          <div className="flex items-center gap-4 pl-4 py-2">
            <div className="w-10 h-10 rounded-[18px] bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/20">
               <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/90">Active Order</p>
              <h2 className="text-base font-bold capitalize text-white mt-0.5 drop-shadow-sm">
                {activeOrder.status.replaceAll('_', ' ')}
              </h2>
            </div>
          </div>
          <Button asChild className="rounded-[18px] bg-white text-primary hover:bg-slate-50 font-bold text-sm h-11 px-6 mr-1 shadow-sm">
            <Link to={`/orders/${activeOrder.id}`}>
              Track
            </Link>
          </Button>
        </Reveal>
      ) : null}
    </div>
  );
}
