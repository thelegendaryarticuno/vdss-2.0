import prisma from '../db/prismaClient';
import { getPaginationParams, createPaginatedResult } from '../utils/pagination';

export interface CustomerFilters {
  search?: string;
  city?: string;
  region?: string;
  isActive?: boolean;
}

export async function getCustomers(filters: CustomerFilters, page = 1, limit = 10) {
  const { skip, take } = getPaginationParams({ page, limit });

  const where: any = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.city) {
    where.city = { contains: filters.city, mode: 'insensitive' };
  }

  if (filters.region) {
    where.region = { contains: filters.region, mode: 'insensitive' };
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count({ where }),
  ]);

  return createPaginatedResult(data, total, page, limit);
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        take: 5,
        orderBy: { orderDate: 'desc' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    throw new Error('Customer not found');
  }

  // Get aggregate stats
  const stats = await prisma.order.aggregate({
    where: { customerId: id },
    _sum: { totalAmount: true },
    _count: { id: true },
    _max: { orderDate: true },
  });

  return {
    ...customer,
    stats: {
      totalSales: stats._sum.totalAmount || 0,
      totalOrders: stats._count.id,
      lastOrderDate: stats._max.orderDate,
    },
  };
}

export async function createCustomer(data: {
  code?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  region?: string;
  segment?: string;
}) {
  return prisma.customer.create({ data });
}

export async function updateCustomer(id: string, data: {
  code?: string;
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  region?: string;
  segment?: string;
  isActive?: boolean;
}) {
  return prisma.customer.update({
    where: { id },
    data,
  });
}

export async function deleteCustomer(id: string) {
  return prisma.customer.update({
    where: { id },
    data: { isActive: false },
  });
}
