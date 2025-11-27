import prisma from '../db/prismaClient';

export async function getLatestInventory() {
  // Get latest inventory snapshot for each product
  const products = await prisma.product.findMany({
    where: { isActive: true },
  });

  const inventory = await Promise.all(
    products.map(async (product) => {
      const snapshot = await prisma.inventorySnapshot.findFirst({
        where: { productId: product.id },
        orderBy: { snapshotTime: 'desc' },
      });

      return {
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
        },
        quantityAvailable: snapshot?.quantityAvailable || 0,
        snapshotTime: snapshot?.snapshotTime || null,
        source: snapshot?.source || null,
      };
    })
  );

  return inventory;
}

export async function getProductInventory(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const snapshot = await prisma.inventorySnapshot.findFirst({
    where: { productId },
    orderBy: { snapshotTime: 'desc' },
  });

  return {
    product: {
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
    },
    quantityAvailable: snapshot?.quantityAvailable || 0,
    snapshotTime: snapshot?.snapshotTime || null,
    source: snapshot?.source || null,
  };
}

export async function syncInventory() {
  // This is a stub for ERP sync
  // In production, this would fetch from an external ERP system
  const products = await prisma.product.findMany({
    where: { isActive: true },
  });

  const snapshots = await Promise.all(
    products.map((product) =>
      prisma.inventorySnapshot.create({
        data: {
          productId: product.id,
          quantityAvailable: Math.floor(Math.random() * 100) + 10,
          source: 'ERP_SYNC',
        },
      })
    )
  );

  return {
    synced: snapshots.length,
    timestamp: new Date(),
  };
}
