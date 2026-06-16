import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { Vendor } from '../../types';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle>{vendor.name}</CardTitle>
            <div className="flex items-start gap-2 text-sm text-[color:var(--color-text-soft)]">
              <MapPin className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
              <span>{vendor.address}</span>
            </div>
          </div>
          <Badge variant={vendor.isTemporarilyClosed ? 'warning' : vendor.isActive ? 'success' : 'warning'}>
            {vendor.isTemporarilyClosed ? 'Temporarily Closed' : vendor.isActive ? 'Open' : 'Closed'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-4">
        <p className="line-clamp-3 text-sm text-[color:var(--color-text-soft)]">
          {vendor.description || 'Reliable local delivery with a clear menu and quick reorders.'}
        </p>
        <div className="flex items-center justify-between rounded-[18px] bg-[color:var(--color-surface-2)] px-3 py-3 text-sm">
          <span className="flex items-center gap-2 text-[color:var(--color-text-soft)]">
            <Star className="h-4 w-4 fill-[color:var(--color-primary)] text-[color:var(--color-primary)]" />
            {Number(vendor.rating).toFixed(1)}
          </span>
          <span className="text-[color:var(--color-text-soft)]">{vendor.totalRatings} reviews</span>
        </div>
        <Button asChild className="mt-auto">
          <Link to={`/vendor/${vendor.id}`}>View menu</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
