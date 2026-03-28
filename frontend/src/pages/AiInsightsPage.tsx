import React, { useState, useEffect } from 'react';
import { customerApi, Customer } from '../api/customerApi';
import { aiApi } from '../api/aiApi';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { SalesForecastChart } from '../components/charts/SalesForecastChart';
import { Table } from '../components/ui/Table';

export const AiInsightsPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [forecastData, setForecastData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerApi.getCustomers({ limit: 100 });
      if (response.success) {
        setCustomers(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadInsights = async () => {
    if (!selectedCustomerId) return;

    try {
      setLoading(true);
      const [forecastRes, recommendationsRes] = await Promise.all([
        aiApi.getSalesForecast({ customerId: selectedCustomerId, months: 12, forecastMonths: 3 }),
        aiApi.getProductRecommendations({ customerId: selectedCustomerId }),
      ]);

      if (forecastRes.success) {
        setForecastData(forecastRes.data);
      }
      if (recommendationsRes.success) {
        setRecommendations(recommendationsRes.data);
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCustomerId) {
      loadInsights();
    }
  }, [selectedCustomerId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">AI Insights</h1>

      <Card title="Select Customer">
        <Select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          options={[
            { value: '', label: 'Select a customer...' },
            ...customers.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      </Card>

      {loading && (
        <div className="text-center py-8">Loading insights...</div>
      )}

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
              unitPrice: `$${r.unitPrice.toFixed(2)}`,
              category: r.category || '-',
            }))}
          />
        </Card>
      )}
    </div>
  );
};
