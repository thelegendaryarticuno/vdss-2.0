import prisma from '../db/prismaClient';

export type GroupByOption = 'customer' | 'product' | 'region';

export interface SalesSummaryParams {
  from?: Date;
  to?: Date;
  groupBy?: GroupByOption;
}

export async function getSalesSummary(params: SalesSummaryParams) {
  const { from, to, groupBy = 'customer' } = params;

  const where: any = {
    status: {
      in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'],
    },
  };

  if (from || to) {
    where.orderDate = {};
    if (from) {
      where.orderDate.gte = from;
    }
    if (to) {
      where.orderDate.lte = to;
    }
  }

  if (groupBy === 'customer') {
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: true,
      },
    });

    const grouped = orders.reduce((acc: any, order) => {
      const key = order.customerId;
      if (!acc[key]) {
        acc[key] = {
          customerId: order.customerId,
          customerName: order.customer.name,
          customerCode: order.customer.code,
          totalSales: 0,
          totalOrders: 0,
        };
      }
      acc[key].totalSales += order.totalAmount.toNumber();
      acc[key].totalOrders += 1;
      return acc;
    }, {});

    return Object.values(grouped);
  }

  if (groupBy === 'product') {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: where,
      },
      include: {
        product: true,
      },
    });

    const grouped = orderItems.reduce((acc: any, item) => {
      const key = item.productId;
      if (!acc[key]) {
        acc[key] = {
          productId: item.productId,
          productSku: item.product.sku,
          productName: item.product.name,
          totalSales: 0,
          totalQuantity: 0,
        };
      }
      acc[key].totalSales += item.total.toNumber();
      acc[key].totalQuantity += item.quantity;
      return acc;
    }, {});

    return Object.values(grouped);
  }

  if (groupBy === 'region') {
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: true,
      },
    });

    const grouped = orders.reduce((acc: any, order) => {
      const region = order.customer.region || 'Unknown';
      if (!acc[region]) {
        acc[region] = {
          region,
          totalSales: 0,
          totalOrders: 0,
        };
      }
      acc[region].totalSales += order.totalAmount.toNumber();
      acc[region].totalOrders += 1;
      return acc;
    }, {});

    return Object.values(grouped);
  }

  return [];
}

export async function getCustomerSalesHistory(customerId: string, months = 12) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

  const orders = await prisma.order.findMany({
    where: {
      customerId,
      orderDate: { gte: startDate },
      status: {
        in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'],
      },
    },
    orderBy: { orderDate: 'asc' },
  });

  // Group by month
  const monthlyData: Record<string, number> = {};

  orders.forEach((order) => {
    const period = `${order.orderDate.getFullYear()}-${String(order.orderDate.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[period]) {
      monthlyData[period] = 0;
    }
    monthlyData[period] += order.totalAmount.toNumber();
  });

  // Generate array for all months
  const result: Array<{ period: string; totalSales: number }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    result.push({
      period,
      totalSales: monthlyData[period] || 0,
    });
  }

  return result;
}
