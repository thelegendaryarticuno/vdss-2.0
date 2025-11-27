import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi, Order } from '../api/orderApi';
import { inventoryApi } from '../api/inventoryApi';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [inventory, setInventory] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getOrderById(id!);
      if (response.success) {
        setOrder(response.data);
        // Load inventory for each product
        if (response.data.items) {
          const inventoryPromises = response.data.items.map(async (item: any) => {
            try {
              const res = await inventoryApi.getProductInventory(item.productId);
              return {
                productId: item.productId,
                data: res,
              };
            } catch (err) {
              return {
                productId: item.productId,
                data: { success: false },
              };
            }
          });
          const inventoryResults = await Promise.all(inventoryPromises);
          const inventoryMap: Record<string, any> = {};
          inventoryResults.forEach((result) => {
            if (result.data.success) {
              inventoryMap[result.productId] = result.data.data;
            }
          });
          setInventory(inventoryMap);
        }
      }
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const response = await orderApi.updateOrderStatus(id!, newStatus);
      if (response.success) {
        loadOrder();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update order status');
    }
  };

  if (loading) {
    return <div className="p-6">Loading order details...</div>;
  }

  if (!order) {
    return <div className="p-6">Order not found</div>;
  }

  const itemColumns = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'Product' },
    { key: 'quantity', header: 'Quantity' },
    { key: 'unitPrice', header: 'Unit Price' },
    { key: 'discountPercent', header: 'Discount %' },
    { key: 'total', header: 'Total' },
    { key: 'inventory', header: 'Available' },
  ];

  const formattedItems = (order.items || []).map((item: any) => ({
    ...item,
    sku: item.product?.sku || '-',
    name: item.product?.name || '-',
    unitPrice: `$${item.unitPrice.toFixed(2)}`,
    discountPercent: `${item.discountPercent}%`,
    total: `$${item.total.toFixed(2)}`,
    inventory: inventory[item.productId]?.quantityAvailable ?? 'N/A',
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/orders')}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Order Information">
          <div className="space-y-2">
            <p><strong>Order Number:</strong> {order.orderNumber}</p>
            <p><strong>Customer:</strong> {order.customer?.name || '-'}</p>
            <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {order.status}</p>
            <p><strong>Total Amount:</strong> ${order.totalAmount.toFixed(2)}</p>
            {order.quote && <p><strong>From Quote:</strong> {order.quote.quoteNumber}</p>}
          </div>
        </Card>

        <Card title="Update Status">
          <Select
            value={order.status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            options={[
              { value: 'PENDING', label: 'Pending' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'SHIPPED', label: 'Shipped' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </Card>
      </div>

      <Card title="Order Items">
        <Table columns={itemColumns} data={formattedItems} />
      </Card>
    </div>
  );
};
