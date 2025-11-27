import prisma from '../db/prismaClient';
import { getPaginationParams, createPaginatedResult } from '../utils/pagination';
import { Decimal } from '@prisma/client/runtime/library';

export interface ProductFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
}

export async function getProducts(filters: ProductFilters, page = 1, limit = 10) {
  const { skip, take } = getPaginationParams({ page, limit });

  const where: any = {};

  if (filters.category) {
    where.category = { contains: filters.category, mode: 'insensitive' };
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { sku: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return createPaginatedResult(data, total, page, limit);
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  return product;
}

export async function createProduct(data: {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unitPrice: number | Decimal;
  unit?: string;
}) {
  return prisma.product.create({
    data: {
      ...data,
      unitPrice: typeof data.unitPrice === 'number' ? data.unitPrice : data.unitPrice,
    },
  });
}

export async function updateProduct(id: string, data: {
  sku?: string;
  name?: string;
  description?: string;
  category?: string;
  unitPrice?: number | Decimal;
  unit?: string;
  isActive?: boolean;
}) {
  return prisma.product.update({
    where: { id },
    data,
  });
}

export async function deleteProduct(id: string) {
  return prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}
