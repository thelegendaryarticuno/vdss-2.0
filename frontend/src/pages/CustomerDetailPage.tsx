import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerApi, CustomerDetail } from '../api/customerApi';
import { aiApi } from '../api/aiApi';
import { Card } from '../components/ui/Card';
import { SalesForecastChart } from '../components/charts/SalesForecastChart';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCustomerData();
    }
  }, [id]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const customerRes = await customerApi.getCustomerById(id!);
      if (customerRes.success) {
        setCustomer(customerRes.data);

        // Load AI data
        try {
          const [forecastRes, recommendationsRes] = await Promise.all([
            aiApi.getSalesForecast({ customerId: id!, months: 12, forecastMonths: 3 }),
            aiApi.getProductRecommendations({ customerId: id! }),
          ]);

          if (forecastRes.success) {
            setForecastData(forecastRes.data);
          }
          if (recommendationsRes.success) {
            setRecommendations(recommendationsRes.data);
          }
        } catch (err) {
          console.error('Failed to load AI data:', err);
        }
      }
    } catch (error) {
      console.error('Failed to load customer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading customer details...</div>;
  }

  if (!customer) {
    return <div className="p-6">Customer not found</div>;
  }

  const parseNumericValue = (value: unknown): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    if (typeof value === 'object' && typeof (value as any)?.toNumber === 'function') {
      try {
        const converted = (value as any).toNumber();
        return Number.isFinite(converted) ? converted : null;
      } catch {
        return null;
      }
    }
    return null;
  };

  const formatCurrency = (value: unknown): string => {
    const numeric = parseNumericValue(value);
    return numeric !== null ? `$${numeric.toFixed(2)}` : '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/customers')}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">{customer.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Customer Information">
          <div className="space-y-2">
            <p><strong>Code:</strong> {customer.code || '-'}</p>
            <p><strong>Contact Person:</strong> {customer.contactPerson || '-'}</p>
            <p><strong>Email:</strong> {customer.email || '-'}</p>
            <p><strong>Phone:</strong> {customer.phone || '-'}</p>
            <p><strong>Address:</strong> {customer.address || '-'}</p>
            <p><strong>City:</strong> {customer.city || '-'}</p>
            <p><strong>Region:</strong> {customer.region || '-'}</p>
            <p><strong>Segment:</strong> {customer.segment || '-'}</p>
          </div>
        </Card>

        <Card title="Sales Statistics">
          <div className="space-y-2">
            <p><strong>Total Sales:</strong> {formatCurrency(customer.stats.totalSales)}</p>
            <p><strong>Total Orders:</strong> {customer.stats.totalOrders}</p>
            <p><strong>Last Order Date:</strong> {customer.stats.lastOrderDate ? new Date(customer.stats.lastOrderDate).toLocaleDateString() : '-'}</p>
          </div>
        </Card>
      </div>

      {forecastData && (
        <Card title="Sales Forecast">
          <SalesForecastChart history={forecastData.history} forecast={forecastData.forecast} />
        </Card>
      )}

      {recommendations.length > 0 && (
        <Card title="Product Recommendations">
          <Table
            columns={[
              { key: 'sku', header: 'SKU' },
              { key: 'name', header: 'Product Name' },
              { key: 'category', header: 'Category' },
              { key: 'unitPrice', header: 'Price' },
              { key: 'reason', header: 'Reason' },
            ]}
            data={recommendations.map((r) => ({
              ...r,
              unitPrice: formatCurrency(r.unitPrice),
              category: r.category || '-',
            }))}
          />
        </Card>
      )}

      {customer.orders && customer.orders.length > 0 && (
        <Card title="Recent Orders">
          <Table
            columns={[
              { key: 'orderNumber', header: 'Order Number' },
              { key: 'orderDate', header: 'Date' },
              { key: 'status', header: 'Status' },
              { key: 'totalAmount', header: 'Total' },
            ]}
            data={customer.orders.map((o: any) => ({
              ...o,
              orderDate: new Date(o.orderDate).toLocaleDateString(),
              totalAmount: formatCurrency(o.totalAmount),
            }))}
          />
        </Card>
      )}
    </div>
  );
};
