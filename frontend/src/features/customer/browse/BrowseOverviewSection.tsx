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
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_330px]">
        <Reveal className="panel-card space-y-5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Santa Maria, Bulacan</Badge>
            <Badge variant="success">{featuredCount} demo shops pinned</Badge>
            <Badge variant="warning">Map-first local radius</Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-light)]" />
              <Input
                placeholder="Search shops, food types, or neighborhoods"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="pl-11"
              />
            </label>

            <select
              value={sortBy}
              onChange={(event) => onSortChange(event.target.value as BrowseSort)}
              className="h-11 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/88 px-4 text-sm text-[color:var(--color-text)] shadow-[var(--shadow-inset-soft)]"
            >
              <option value="distance">Closest to Santa Maria</option>
              <option value="rating">Top rated first</option>
              <option value="name">A to Z</option>
            </select>

            <Button variant="ghost" onClick={onResetArea}>
              <Compass className="h-4 w-4" />
              Reset area
            </Button>
          </div>

          <Stagger className="grid gap-3 md:grid-cols-3" delayChildren={0.08} stagger={0.06}>
            <StaggerItem className="panel-muted px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                Nearby now
              </p>
              <p className="mt-2 text-3xl font-semibold text-[color:var(--color-text)]">
                {browseCount}
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                Visible shops inside the Santa Maria browse radius
              </p>
            </StaggerItem>
            <StaggerItem className="panel-muted px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                Top rated
              </p>
              <p className="mt-2 text-3xl font-semibold text-[color:var(--color-text)]">
                {topRatedCount}
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                Local picks rated 4.7 and above
              </p>
            </StaggerItem>
            <StaggerItem className="panel-muted px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                Browse anchor
              </p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">
                Santa Maria town center
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                Use locate on the map if you want your exact current spot
              </p>
            </StaggerItem>
          </Stagger>
        </Reveal>

        <Reveal className="panel-card flex h-full flex-col gap-4 p-5" delay={0.08}>
          <div>
            <p className="eyebrow">Selected area</p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-text)]">
              Santa Maria, Bulacan
            </h2>
            <p className="mt-2 subtle-copy">
              The browse flow now stays focused on one usable service zone instead of a vague empty map.
            </p>
          </div>
          <div className="panel-muted space-y-3 px-4 py-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
              <p className="text-sm text-[color:var(--color-text)]">
                Demo vendors are mixed in so the page always looks populated while you build real seller data.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
              <p className="text-sm text-[color:var(--color-text)]">
                Distance sorting uses the Santa Maria anchor unless you hit locate from the map view.
              </p>
            </div>
          </div>
          {selectedVendor ? (
            <div className="rounded-[24px] bg-[linear-gradient(135deg,#223547,#314b61)] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Currently highlighted
              </p>
              <h3 className="mt-3 text-xl font-semibold">{selectedVendor.name}</h3>
              <p className="mt-2 text-sm leading-6 text-white/82">
                {selectedVendor.description}
              </p>
            </div>
          ) : null}
        </Reveal>
      </section>

      {activeOrder ? (
        <Reveal className="panel-card flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between" delay={0.1}>
          <div>
            <p className="eyebrow">Current delivery</p>
            <h2 className="mt-2 text-2xl font-semibold capitalize">
              {activeOrder.status.replaceAll('_', ' ')}
            </h2>
            <p className="mt-2 subtle-copy">
              Browse stays clean here. Open the live tracking page when you want the detailed delivery map.
            </p>
          </div>
          <Button asChild>
            <Link to={`/orders/${activeOrder.id}`}>
              Open live tracking
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      ) : null}
    </>
  );
}
