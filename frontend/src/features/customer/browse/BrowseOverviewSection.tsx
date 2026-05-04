import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Search, Sparkles, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal';
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
    <>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_330px]">
        <Reveal className="panel-card space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-white px-3 py-1 text-xs font-semibold text-slate-600 border-slate-200">Santa Maria, Bulacan</Badge>
            <Badge className="bg-orange-100 text-orange-700 px-3 py-1 text-xs font-semibold hover:bg-orange-200 border-transparent">{featuredCount} demo shops</Badge>
            <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">Map-first</Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search shops or food..."
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="pl-12 rounded-[20px] bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white h-14 text-base font-medium shadow-none"
              />
            </label>

            <select
              value={sortBy}
              onChange={(event) => onSortChange(event.target.value as BrowseSort)}
              className="h-14 rounded-[20px] bg-slate-50 border-transparent px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none"
            >
              <option value="distance">Closest to me</option>
              <option value="rating">Top rated</option>
              <option value="name">A to Z</option>
            </select>

            <Button variant="outline" onClick={onResetArea} className="h-14 rounded-[20px] font-semibold text-slate-600 border-slate-200 hover:bg-slate-50">
              <Compass className="h-5 w-5 mr-2 text-slate-400" />
              Reset Area
            </Button>
          </div>

          <Stagger className="grid gap-4 md:grid-cols-3" delayChildren={0.08} stagger={0.06}>
            <StaggerItem className="panel-muted flex flex-col justify-center">
              <p className="text-xs font-semibold text-slate-500">
                Nearby now
              </p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                {browseCount}
              </p>
              <p className="mt-1 text-[13px] font-medium text-slate-500">
                Visible shops
              </p>
            </StaggerItem>
            <StaggerItem className="panel-muted flex flex-col justify-center">
              <p className="text-xs font-semibold text-slate-500">
                Top rated
              </p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                {topRatedCount}
              </p>
              <p className="mt-1 text-[13px] font-medium text-slate-500">
                4.7+ Local picks
              </p>
            </StaggerItem>
            <StaggerItem className="panel-muted flex flex-col justify-center">
              <p className="text-xs font-semibold text-slate-500">
                Browse anchor
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Town center
              </p>
              <p className="mt-1 text-[13px] font-medium text-slate-500">
                Santa Maria
              </p>
            </StaggerItem>
          </Stagger>
        </Reveal>

        <Reveal className="panel-card flex h-full flex-col gap-5 p-6 md:p-8 bg-slate-900 text-white dark:bg-slate-800" delay={0.08}>
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">Selected area</p>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Santa Maria
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-300">
              Focused on one usable service zone.
            </p>
          </div>
          <div className="rounded-[20px] bg-white/10 backdrop-blur-md space-y-4 px-5 py-5 mt-auto">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 mt-0.5 text-orange-400 shrink-0" />
              <p className="text-sm font-medium text-slate-200">
                Demo vendors are mixed in to preview the UI.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 mt-0.5 text-orange-400 shrink-0" />
              <p className="text-sm font-medium text-slate-200">
                Sorting uses the Santa Maria anchor.
              </p>
            </div>
          </div>
          {selectedVendor ? (
            <div className="rounded-[20px] bg-orange-500 p-5 text-white mt-2 shadow-[0_8px_16px_rgba(249,115,22,0.2)]">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                Currently highlighted
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">{selectedVendor.name}</h3>
              <p className="mt-2 text-sm font-medium text-white/90 line-clamp-3">
                {selectedVendor.description}
              </p>
            </div>
          ) : null}
        </Reveal>
      </section>

      {activeOrder ? (
        <Reveal className="panel-card bg-gradient-to-r from-orange-500 to-orange-400 text-white p-6 md:p-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" delay={0.1}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/80 mb-1">Current delivery</p>
            <h2 className="text-3xl font-bold tracking-tight capitalize">
              {activeOrder.status.replaceAll('_', ' ')}
            </h2>
            <p className="mt-2 text-sm font-medium text-white/90">
              Open live tracking to view your delivery map.
            </p>
          </div>
          <Button asChild className="bg-white text-orange-600 hover:bg-orange-50 rounded-[20px] h-14 px-8 font-bold text-base shadow-sm">
            <Link to={`/orders/${activeOrder.id}`}>
              Live tracking
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </Reveal>
      ) : null}
    </>
  );
}
