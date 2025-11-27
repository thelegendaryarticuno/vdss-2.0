import axios from 'axios';
import { OrderStatus } from '@prisma/client';
import prisma from '../db/prismaClient';
import { config } from '../config/env';

type AiForecastResponse = {
  history: Array<{ period: string; amount: number }>;
  forecast: Array<{ period: string; amount: number }>;
  model: string;
  confidence: number;
};

type AiRecommendationResponse = {
  data: Array<{
    productId: string;
    sku: string;
    name: string;
    category: string | null;
    unitPrice: number;
    reason: string;
    score: number;
  }>;
  model: string;
};

type OrderItemPayload = {
  productId: string;
  sku: string | null;
  name: string | null;
  category: string | null;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  total: number;
};

type OrderPayload = {
  id: string;
  status: string;
  salesRepId: string;
  quoteId?: string | null;
  orderDate: Date;
  totalAmount: number;
  items: OrderItemPayload[];
};

type DerivedStatsPayload = {
  months: number;
  totalAmount: number;
  totalOrders: number;
  avgOrderValue: number;
  recencyDays?: number | null;
  frequencyPerMonth?: number | null;
  monetaryValue?: number | null;
};

const aiClient = axios.create({
  baseURL: config.aiService.baseUrl,
  timeout: config.aiService.timeoutMs,
});

const fulfilledStatuses: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

export interface SalesForecastResult {
  history: Array<{ period: string; totalSales: number; amount?: number }>;
  forecast: Array<{ period: string; predictedSales: number; amount?: number }>;
  meta?: {
    model: string;
    confidence: number;
    source: 'ai-service' | 'fallback';
  };
}

export interface ProductRecommendation {
  productId: string;
  sku: string;
  name: string;
  category: string | null;
  unitPrice: number;
  reason: string;
  score?: number;
}

export async function getSalesForecast(
  customerId: string,
  months = 6,
  forecastMonths = 3
): Promise<SalesForecastResult> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new Error('Customer not found');
  }

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

  const orders = await prisma.order.findMany({
    where: {
      customerId,
      orderDate: { gte: startDate },
      status: { in: fulfilledStatuses },
    },
    orderBy: { orderDate: 'asc' },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  const orderPayload = orders.map(mapOrder);
  const summaries = await prisma.salesSummary.findMany({
    where: { customerId },
    orderBy: { period: 'asc' },
  });
  const salesSummaries = summaries.map((summary) => ({
    period: summary.period,
    totalSalesAmount: summary.totalSalesAmount.toNumber(),
    totalOrders: summary.totalOrders,
  }));

  const stats = deriveOrderStats(orderPayload, months);

  try {
    const { data } = await aiClient.post<AiForecastResponse>('/api/forecast', {
      customer: mapCustomer(customer),
      orders: orderPayload,
      salesSummaries,
      stats,
      forecastMonths,
    });

    return {
      history: data.history.map((point) => ({
        period: point.period,
        totalSales: point.amount,
        amount: point.amount,
      })),
      forecast: data.forecast.map((point) => ({
        period: point.period,
        predictedSales: point.amount,
        amount: point.amount,
      })),
      meta: {
        model: data.model,
        confidence: data.confidence,
        source: 'ai-service',
      },
    };
  } catch (error) {
    logAiError(error, 'forecast');
  }

  return buildFallbackForecast(orderPayload, months, forecastMonths);
}

export async function getProductRecommendations(
  customerId: string,
  limit = 10
): Promise<ProductRecommendation[]> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new Error('Customer not found');
  }

  const baseOrderFilter = {
    status: {
      in: fulfilledStatuses,
    },
  };

  const customerOrders = await prisma.order.findMany({
    where: {
      ...baseOrderFilter,
      customerId,
    },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { orderDate: 'desc' },
    take: 50,
  });

  const similarCustomers = await prisma.customer.findMany({
    where: {
      AND: [
        { id: { not: customerId } },
        { isActive: true },
        customer.segment ? { segment: customer.segment } : {},
        customer.region ? { region: customer.region } : {},
      ],
    },
    select: { id: true },
    take: 50,
  });

  const peerCustomerIds = similarCustomers.map((c) => c.id);

  const peerOrders = peerCustomerIds.length
    ? await prisma.order.findMany({
        where: {
          ...baseOrderFilter,
          customerId: { in: peerCustomerIds },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
        orderBy: { orderDate: 'desc' },
        take: 150,
      })
    : [];

  const catalog = await prisma.product.findMany({
    where: { isActive: true },
  });

  const inventorySnapshots = await prisma.inventorySnapshot.findMany({
    orderBy: { snapshotTime: 'desc' },
  });

  const inventoryMap: Record<string, number> = {};
  for (const snapshot of inventorySnapshots) {
    if (inventoryMap[snapshot.productId] === undefined) {
      inventoryMap[snapshot.productId] = snapshot.quantityAvailable;
    }
  }

  const payload = {
    customer: mapCustomer(customer),
    customerOrders: customerOrders.map(mapOrder),
    peerOrders: peerOrders.map(mapOrder),
    catalog: catalog.map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      unitPrice: product.unitPrice.toNumber(),
      description: product.description,
      unit: product.unit,
      isActive: product.isActive,
    })),
    context: {
      inventory: inventoryMap,
      avgSellingPrice: customerOrders.length
        ? customerOrders.reduce((sum, order) => sum + order.totalAmount.toNumber(), 0) /
          customerOrders.length
        : undefined,
    },
    limit,
  };

  try {
    const { data } = await aiClient.post<AiRecommendationResponse>('/api/recommendations', payload);
    return data.data.map((item) => ({
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      category: item.category,
      unitPrice: item.unitPrice,
      reason: item.reason,
      score: item.score,
    }));
  } catch (error) {
    logAiError(error, 'recommendations');
  }

  return fallbackProductRecommendations({
    customer,
    customerOrders,
    peerOrders,
    limit,
  });
}

function mapCustomer(customer: any) {
  return {
    id: customer.id,
    code: customer.code,
    name: customer.name,
    segment: customer.segment,
    region: customer.region,
    city: customer.city,
    isActive: customer.isActive,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

function mapOrder(order: any): OrderPayload {
  return {
    id: order.id,
    status: order.status,
    salesRepId: order.salesRepId,
    quoteId: order.quoteId,
    orderDate: order.orderDate,
    totalAmount: order.totalAmount.toNumber ? order.totalAmount.toNumber() : order.totalAmount,
    items: (order.items || []).map((item: any) => ({
      productId: item.productId,
      sku: item.product?.sku ?? null,
      name: item.product?.name ?? null,
      category: item.product?.category ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber ? item.unitPrice.toNumber() : item.unitPrice,
      discountPercent: item.discountPercent,
      total: item.total.toNumber ? item.total.toNumber() : item.total,
    })),
  };
}

function deriveOrderStats(orders: OrderPayload[], months: number): DerivedStatsPayload {
  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders ? totalAmount / totalOrders : 0;

  const latestOrder = orders[orders.length - 1];
  const recencyDays = latestOrder
    ? Math.max(1, (Date.now() - latestOrder.orderDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    months,
    totalAmount,
    totalOrders,
    avgOrderValue,
    recencyDays,
    frequencyPerMonth: months ? totalOrders / months : null,
    monetaryValue: totalAmount,
  };
}

function buildFallbackForecast(
  orders: OrderPayload[],
  months: number,
  forecastMonths: number
): SalesForecastResult {
  const now = new Date();
  const monthlyTotals: Record<string, number> = {};

  orders.forEach((order) => {
    const period = `${order.orderDate.getFullYear()}-${String(order.orderDate.getMonth() + 1).padStart(2, '0')}`;
    monthlyTotals[period] = (monthlyTotals[period] || 0) + order.totalAmount;
  });

  const history: Array<{ period: string; totalSales: number; amount?: number }> = [];
  const salesValues: number[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const sales = monthlyTotals[period] || 0;
    history.push({ period, totalSales: sales, amount: sales });
    salesValues.push(sales);
  }

  let forecastValues: number[] = [];
  if (salesValues.length >= 3) {
    forecastValues = linearRegressionForecast(salesValues, forecastMonths);
  } else {
    forecastValues = movingAverageForecast(salesValues, forecastMonths);
  }

  const forecast = forecastValues.map((value, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index + 1, 1);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const amount = Math.round(value * 100) / 100;
    return { period, predictedSales: amount, amount };
  });

  return {
    history,
    forecast,
    meta: {
      model: 'fallback-moving-average',
      confidence: 0.35,
      source: 'fallback',
    },
  };
}

async function fallbackProductRecommendations({
  customer,
  customerOrders,
  peerOrders,
  limit,
}: {
  customer: any;
  customerOrders: any[];
  peerOrders: any[];
  limit: number;
}): Promise<ProductRecommendation[]> {
  const purchasedProductIds = new Set<string>();
  customerOrders.forEach((order) => {
    order.items.forEach((item: any) => purchasedProductIds.add(item.productId));
  });

  const productCounts: Record<string, { count: number; product: any }> = {};

  peerOrders.forEach((order) => {
    order.items.forEach((item: any) => {
      if (purchasedProductIds.has(item.productId)) {
        return;
      }
      if (!productCounts[item.productId]) {
        productCounts[item.productId] = { count: 0, product: item.product };
      }
      productCounts[item.productId].count += 1;
    });
  });

  if (Object.keys(productCounts).length < limit) {
    const allProductOrders = await prisma.orderItem.findMany({
      where: {
        order: {
          status: {
            in: fulfilledStatuses,
          },
        },
        productId: { notIn: Array.from(purchasedProductIds) },
      },
      include: {
        product: true,
      },
    });

    allProductOrders.forEach((item) => {
      if (!productCounts[item.productId]) {
        productCounts[item.productId] = { count: 0, product: item.product };
      }
      productCounts[item.productId].count += 1;
    });
  }

  return Object.values(productCounts)
    .filter((pc) => pc.product?.isActive)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((pc) => ({
      productId: pc.product.id,
      sku: pc.product.sku,
      name: pc.product.name,
      category: pc.product.category,
      unitPrice: pc.product.unitPrice.toNumber(),
      reason:
        customer.segment || customer.region
          ? `Popular in your ${customer.segment ? 'segment' : 'region'} among peers`
          : 'Popular product you have not purchased yet',
    }));
}

function movingAverageForecast(data: number[], periods: number): number[] {
  if (data.length === 0) return Array(periods).fill(0);
  if (data.length === 1) return Array(periods).fill(data[0]);

  const windowSize = Math.min(3, data.length);
  const forecast: number[] = [];
  const recentValues = data.slice(-windowSize);
  const average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;

  let trend = 0;
  if (data.length >= 2) {
    const recentTrend = (data[data.length - 1] - data[data.length - windowSize]) / windowSize;
    trend = recentTrend * 0.5;
  }

  for (let i = 0; i < periods; i++) {
    forecast.push(Math.max(0, average + trend * (i + 1)));
  }

  return forecast;
}

function linearRegressionForecast(data: number[], periods: number): number[] {
  if (data.length === 0) return Array(periods).fill(0);
  if (data.length === 1) return Array(periods).fill(data[0]);

  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumXX += i * i;
  }

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  const forecast: number[] = [];
  for (let i = 0; i < periods; i++) {
    const predicted = intercept + slope * (n + i);
    forecast.push(Math.max(0, predicted));
  }

  return forecast;
}

function logAiError(error: unknown, context: string) {
  const message = (error as Error)?.message ?? 'Unknown AI error';
  console.warn(`[aiService] ${context} fallback engaged: ${message}`);
}
