import { Link } from 'react-router-dom';
import { Vendor } from '../../types';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Card className="flex h-full flex-col justify-between gap-3">
      <CardHeader className="mb-1">
        <div>
          <CardTitle>{vendor.name}</CardTitle>
          <p className="mt-1 text-sm text-[var(--color-text-soft)]">{vendor.address}</p>
        </div>
        <Badge variant={vendor.isActive ? 'success' : 'warning'}>
          {vendor.isActive ? 'Open' : 'Closed'}
        </Badge>
      </CardHeader>
      <CardContent>
        {vendor.description && (
          <p className="line-clamp-2 text-sm text-[var(--color-text-soft)]">{vendor.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span>Rating: {Number(vendor.rating).toFixed(1)}</span>
          <span>{vendor.totalRatings} reviews</span>
        </div>
        <Link
          to={`/vendor/${vendor.id}`}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)]"
        >
          View Menu
        </Link>
      </CardContent>
    </Card>
  );
}
