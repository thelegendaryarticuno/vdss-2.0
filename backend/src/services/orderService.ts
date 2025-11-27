import prisma from '../db/prismaClient';
import { getPaginationParams, createPaginatedResult } from '../utils/pagination';
import { OrderStatus } from '@prisma/client';

export interface OrderFilters {
  status?: OrderStatus;
  customerId?: string;
  salesRepId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface CreateOrderInput {
  customerId: string;
  salesRepId: string;
  quoteId?: string;
  items: OrderItemInput[];
  orderDate?: Date;
}

export async function getOrders(filters: OrderFilters, page = 1, limit = 10) {
  const { skip, take } = getPaginationParams({ page, limit });

  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.customerId) {
    where.customerId = filters.customerId;
  }

  if (filters.salesRepId) {
    where.salesRepId = filters.salesRepId;
  }

  if (filters.fromDate || filters.toDate) {
    where.orderDate = {};
    if (filters.fromDate) {
      where.orderDate.gte = filters.fromDate;
    }
    if (filters.toDate) {
      where.orderDate.lte = filters.toDate;
    }
  }

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
        salesRep: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { orderDate: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  return createPaginatedResult(data, total, page, limit);
}

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      salesRep: {
        select: { id: true, name: true, email: true },
      },
      quote: {
        select: { id: true, quoteNumber: true },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return order;
}

async function generateOrderNumber(): Promise<string> {
  const count = await prisma.order.count();
  const year = new Date().getFullYear();
  const number = String(count + 1).padStart(6, '0');
  return `ORD-${year}-${number}`;
}

export async function createOrder(input: CreateOrderInput) {
  const orderNumber = await generateOrderNumber();

  // Calculate totals for items
  const items = input.items.map((item) => {
    const discountMultiplier = 1 - (item.discountPercent || 0) / 100;
    const total = item.quantity * item.unitPrice * discountMultiplier;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent || 0,
      total,
    };
  });

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: input.customerId,
      salesRepId: input.salesRepId,
      quoteId: input.quoteId,
      orderDate: input.orderDate || new Date(),
      status: OrderStatus.PENDING,
      totalAmount,
      items: {
        create: items,
      },
    },
    include: {
      customer: true,
      salesRep: {
        select: { id: true, name: true, email: true },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return order;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return prisma.order.update({
    where: { id },
    data: { status },
  });
}
