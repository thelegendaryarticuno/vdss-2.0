import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { reportApi } from '../api/reportApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const ReportsPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [groupBy, setGroupBy] = useState<'customer' | 'product' | 'region'>('customer');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [groupBy]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await reportApi.getSalesSummary({ groupBy });
      if (response.success) {
        setData(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = {
    customer: [
      { key: 'customerName', header: 'Customer' },
      { key: 'customerCode', header: 'Code' },
      { key: 'totalSales', header: 'Total Sales' },
      { key: 'totalOrders', header: 'Total Orders' },
    ],
    product: [
      { key: 'productSku', header: 'SKU' },
      { key: 'productName', header: 'Product' },
      { key: 'totalSales', header: 'Total Sales' },
      { key: 'totalQuantity', header: 'Total Quantity' },
    ],
    region: [
      { key: 'region', header: 'Region' },
      { key: 'totalSales', header: 'Total Sales' },
      { key: 'totalOrders', header: 'Total Orders' },
    ],
  };

  const formattedData = data.map((item) => ({
    ...item,
    totalSales: `$${item.totalSales.toFixed(2)}`,
  }));

  const chartData = data.map((item) => ({
    name: item.customerName || item.productName || item.region || 'Unknown',
    sales: typeof item.totalSales === 'number' ? item.totalSales : parseFloat(item.totalSales.replace('$', '')),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        <Select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as any)}
          options={[
            { value: 'customer', label: 'By Customer' },
            { value: 'product', label: 'By Product' },
            { value: 'region', label: 'By Region' },
          ]}
        />
      </div>

      <Card title="Sales Summary">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <Table columns={columns[groupBy]} data={formattedData} />
            {chartData.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Sales Chart</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#3b82f6" name="Sales ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};
