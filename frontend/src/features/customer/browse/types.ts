import type { DemoVendor } from '@/data/demoVendors';
import type { Vendor } from '@/types';

export type BrowseVendor = Vendor &
  Partial<
    Pick<
      DemoVendor,
      'etaMinutes' | 'neighborhood' | 'specialties' | 'priceBand' | 'spotlight'
    >
  >;

export type BrowseSort = 'rating' | 'distance' | 'name';
export type BrowseViewMode = 'map' | 'list' | 'grid';
