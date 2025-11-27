import prisma from '../db/prismaClient';
import { getPaginationParams, createPaginatedResult } from '../utils/pagination';
import { QuoteStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface QuoteFilters {
  status?: QuoteStatus;
  customerId?: string;
  salesRepId?: string;
}

export interface QuoteItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface CreateQuoteInput {
  customerId: string;
  salesRepId: string;
  items: QuoteItemInput[];
  validUntil?: Date;
}

export async function getQuotes(filters: QuoteFilters, page = 1, limit = 10) {
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

  const [data, total] = await Promise.all([
    prisma.quote.findMany({
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
      orderBy: { createdAt: 'desc' },
    }),
    prisma.quote.count({ where }),
  ]);

  // Calculate totals
  const quotesWithTotals = await Promise.all(
    data.map(async (quote) => {
      const items = await prisma.quoteItem.findMany({
        where: { quoteId: quote.id },
      });
      const total = items.reduce((sum, item) => sum + item.total.toNumber(), 0);
      return { ...quote, total };
    })
  );

  return createPaginatedResult(quotesWithTotals, total, page, limit);
}

export async function getQuoteById(id: string) {
  const quote = await prisma.quote.findUnique({
    where: { id },
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

  if (!quote) {
    throw new Error('Quote not found');
  }

  const total = quote.items.reduce((sum, item) => sum + item.total.toNumber(), 0);

  return { ...quote, total };
}

async function generateQuoteNumber(): Promise<string> {
  const count = await prisma.quote.count();
  const year = new Date().getFullYear();
  const number = String(count + 1).padStart(6, '0');
  return `QUOTE-${year}-${number}`;
}

export async function createQuote(input: CreateQuoteInput) {
  const quoteNumber = await generateQuoteNumber();

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

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      customerId: input.customerId,
      salesRepId: input.salesRepId,
      validUntil: input.validUntil,
      status: QuoteStatus.DRAFT,
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

  const total = items.reduce((sum, item) => sum + item.total, 0);

  return { ...quote, total };
}

export async function updateQuote(id: string, data: {
  items?: QuoteItemInput[];
  status?: QuoteStatus;
  validUntil?: Date;
}) {
  if (data.items) {
    // Delete existing items and create new ones
    await prisma.quoteItem.deleteMany({ where: { quoteId: id } });

    const items = data.items.map((item) => {
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

    await prisma.quoteItem.createMany({
      data: items.map((item) => ({ ...item, quoteId: id })),
    });
  }

  return prisma.quote.update({
    where: { id },
    data: {
      status: data.status,
      validUntil: data.validUntil,
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
}

export async function sendQuote(id: string) {
  return prisma.quote.update({
    where: { id },
    data: { status: QuoteStatus.SENT },
  });
}

export async function acceptQuote(id: string) {
  return prisma.quote.update({
    where: { id },
    data: { status: QuoteStatus.ACCEPTED },
  });
}
