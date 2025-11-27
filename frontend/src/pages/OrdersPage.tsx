import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi, Order } from '../api/orderApi';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getOrders({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });
      if (response.success) {
        setOrders(response.data || []);
        setPagination(response.pagination || { total: 0, totalPages: 1 });
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (order: Order) => {
    navigate(`/orders/${order.id}`);
  };

  const columns = [
    { key: 'orderNumber', header: 'Order Number' },
    { key: 'customerName', header: 'Customer' },
    { key: 'orderDate', header: 'Date' },
    { key: 'status', header: 'Status' },
    { key: 'totalAmount', header: 'Total' },
  ];

  const formattedOrders = orders.map((o) => {
    const numericTotal =
      typeof o.totalAmount === 'string' ? parseFloat(o.totalAmount) : o.totalAmount;
    return {
      ...o,
      customerName: o.customer?.name || '-',
      orderDate: new Date(o.orderDate).toLocaleDateString(),
      totalAmount: Number.isFinite(numericTotal) ? `$${numericTotal.toFixed(2)}` : '-',
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      <Card>
        <div className="mb-4">
          <Select
            label="Filter by Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'SHIPPED', label: 'Shipped' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <Table columns={columns} data={formattedOrders} onRowClick={handleRowClick} />
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Showing {orders.length} of {pagination.total} orders
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
