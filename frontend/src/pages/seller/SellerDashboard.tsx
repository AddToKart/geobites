import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import { ShoppingBag, Clock, DollarSign } from 'lucide-react';

export function SellerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    void (async () => {
      // Mock data for demo purposes since getOrders might fail without backend
      // In real app: const response = await getOrders({ page: 1, limit: 50 });
      // setOrders(response.data);
      const mockOrders: Order[] = [
        { id: 'ord_12345678', customerId: 'cust_1', vendorId: 'vend_1', riderId: 'rider_1', status: 'pending', totalAmount: 45.50, deliveryAddress: '123 Main St', notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'ord_87654321', customerId: 'cust_2', vendorId: 'vend_1', riderId: 'rider_2', status: 'preparing', totalAmount: 32.00, deliveryAddress: '456 Oak Ave', notes: 'No onions', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'ord_24681357', customerId: 'cust_3', vendorId: 'vend_1', riderId: 'rider_3', status: 'delivered', totalAmount: 68.75, deliveryAddress: '789 Pine Ln', notes: '', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
      ];
      setOrders(mockOrders);
    })();
  }, []);

  const metrics = useMemo(() => {
    const todaysOrders = orders.filter(
      (order) => new Date(order.createdAt).toDateString() === new Date().toDateString(),
    ).length;
    
    const activeOrders = orders.filter((order) =>
      ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up'].includes(order.status),
    ).length;
    
    const revenue = orders
      .filter((order) => order.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    return { todaysOrders, activeOrders, revenue };
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'accepted': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'preparing': return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'ready_for_pickup': return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100';
      case 'picked_up': return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'delivered': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'cancelled': return 'bg-red-100 text-red-800 hover:bg-red-100';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center space-x-2 text-muted-foreground text-sm">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Orders
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.todaysOrders}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Orders
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeOrders}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.revenue)}</div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 10).map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    #{order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)} variant="outline">
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="truncate max-w-[200px]" title={order.deliveryAddress}>
                    {order.deliveryAddress}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
