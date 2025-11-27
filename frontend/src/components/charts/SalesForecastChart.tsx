import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesForecastChartProps {
  history: Array<{ period: string; totalSales: number }>;
  forecast: Array<{ period: string; predictedSales: number }>;
}

export const SalesForecastChart: React.FC<SalesForecastChartProps> = ({ history, forecast }) => {
  const historyData = history.map((item) => ({
    period: item.period,
    sales: item.totalSales,
    type: 'Actual',
  }));

  const forecastData = forecast.map((item) => ({
    period: item.period,
    sales: item.predictedSales,
    type: 'Forecast',
  }));

  const allData = [...historyData, ...forecastData];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={allData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="sales"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
          name="Sales"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
