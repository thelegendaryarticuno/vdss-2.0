import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { orderApi } from '../api/orderApi';
import { aiApi } from '../api/aiApi';
import { SalesForecastChart } from '../components/charts/SalesForecastChart';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayOrders: 0,
    monthSales: 0,
    monthOrders: 0,
    forecast: 0,
  });
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      // Get orders for today and this month
      const todayOrdersRes = await orderApi.getOrders({
        fromDate: today.toISOString(),
        limit: 100,
      });

      const monthOrdersRes = await orderApi.getOrders({
        fromDate: monthStart.toISOString(),
        limit: 100,
      });

      const todayOrders = todayOrdersRes.data?.data || [];
      const monthOrders = monthOrdersRes.data?.data || [];

      const monthSales = monthOrders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);

      setStats({
        todayOrders: todayOrders.length,
        monthSales,
        monthOrders: monthOrders.length,
        forecast: 0,
      });

      // Try to get forecast for a sample customer (if any)
      if (monthOrders.length > 0 && monthOrders[0].customerId) {
        try {
          const forecastRes = await aiApi.getSalesForecast({
            customerId: monthOrders[0].customerId,
            months: 6,
            forecastMonths: 3,
          });
          if (forecastRes.success) {
            setForecastData(forecastRes.data);
            const nextMonthForecast = forecastRes.data.forecast[0]?.predictedSales || 0;
            setStats((prev) => ({ ...prev, forecast: nextMonthForecast }));
          }
        } catch (err) {
          console.error('Failed to load forecast:', err);
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'SALES_REP' && (
          <>
            <Card>
              <h3 className="text-sm font-medium text-gray-500">Today's Orders</h3>
              <p className="text-3xl font-bold mt-2">{stats.todayOrders}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-500">This Month Sales</h3>
              <p className="text-3xl font-bold mt-2">${stats.monthSales.toFixed(2)}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-500">AI Forecast (Next Month)</h3>
              <p className="text-3xl font-bold mt-2">${stats.forecast.toFixed(2)}</p>
            </Card>
          </>
        )}

        {isManager && (
          <>
            <Card>
              <h3 className="text-sm font-medium text-gray-500">Total Sales This Month</h3>
              <p className="text-3xl font-bold mt-2">${stats.monthSales.toFixed(2)}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
              <p className="text-3xl font-bold mt-2">{stats.monthOrders}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-gray-500">AI Forecast (Next Month)</h3>
              <p className="text-3xl font-bold mt-2">${stats.forecast.toFixed(2)}</p>
            </Card>
          </>
        )}
      </div>

      {forecastData && isManager && (
        <Card title="Sales Forecast">
          <SalesForecastChart history={forecastData.history} forecast={forecastData.forecast} />
        </Card>
      )}
    </div>
  );
};
