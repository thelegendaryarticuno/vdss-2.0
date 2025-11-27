import { PrismaClient, Role, QuoteStatus, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (optional, be careful in production)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.inventorySnapshot.deleteMany();
  await prisma.salesSummary.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@vdss.com',
      passwordHash,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@vdss.com',
      passwordHash,
      name: 'Manager User',
      role: Role.MANAGER,
    },
  });

  const salesRep1 = await prisma.user.create({
    data: {
      email: 'salesrep1@vdss.com',
      passwordHash,
      name: 'John Sales',
      role: Role.SALES_REP,
    },
  });

  const salesRep2 = await prisma.user.create({
    data: {
      email: 'salesrep2@vdss.com',
      passwordHash,
      name: 'Jane Sales',
      role: Role.SALES_REP,
    },
  });

  console.log('✅ Created users');

  // Create Customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        code: 'CUST001',
        name: 'Acme Corporation',
        contactPerson: 'John Doe',
        phone: '+1234567890',
        email: 'contact@acme.com',
        address: '123 Main St',
        city: 'New York',
        region: 'East',
        segment: 'Enterprise',
      },
    }),
    prisma.customer.create({
      data: {
        code: 'CUST002',
        name: 'Tech Solutions Inc',
        contactPerson: 'Jane Smith',
        phone: '+1234567891',
        email: 'info@techsol.com',
        address: '456 Oak Ave',
        city: 'San Francisco',
        region: 'West',
        segment: 'SMB',
      },
    }),
    prisma.customer.create({
      data: {
        code: 'CUST003',
        name: 'Global Industries',
        contactPerson: 'Bob Johnson',
        phone: '+1234567892',
        email: 'sales@global.com',
        address: '789 Pine Rd',
        city: 'Chicago',
        region: 'Midwest',
        segment: 'Enterprise',
      },
    }),
    prisma.customer.create({
      data: {
        code: 'CUST004',
        name: 'Local Business Co',
        contactPerson: 'Alice Brown',
        phone: '+1234567893',
        email: 'hello@localbiz.com',
        address: '321 Elm St',
        city: 'Boston',
        region: 'East',
        segment: 'SMB',
      },
    }),
    prisma.customer.create({
      data: {
        code: 'CUST005',
        name: 'Startup Ventures',
        contactPerson: 'Charlie Wilson',
        phone: '+1234567894',
        email: 'founder@startup.com',
        address: '654 Startup Blvd',
        city: 'Austin',
        region: 'South',
        segment: 'Startup',
      },
    }),
  ]);

  console.log('✅ Created customers');

  // Create Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: 'PROD001',
        name: 'Premium Widget',
        description: 'High-quality premium widget',
        category: 'Widgets',
        unitPrice: 99.99,
        unit: 'piece',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'PROD002',
        name: 'Standard Widget',
        description: 'Standard quality widget',
        category: 'Widgets',
        unitPrice: 49.99,
        unit: 'piece',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'PROD003',
        name: 'Basic Widget',
        description: 'Basic widget for everyday use',
        category: 'Widgets',
        unitPrice: 29.99,
        unit: 'piece',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'PROD004',
        name: 'Gadget Pro',
        description: 'Professional grade gadget',
        category: 'Gadgets',
        unitPrice: 199.99,
        unit: 'piece',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'PROD005',
        name: 'Gadget Lite',
        description: 'Lightweight gadget',
        category: 'Gadgets',
        unitPrice: 79.99,
        unit: 'piece',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'PROD006',
        name: 'Tool Set A',
        description: 'Complete tool set A',
        category: 'Tools',
        unitPrice: 149.99,
        unit: 'set',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'PROD007',
        name: 'Tool Set B',
        description: 'Complete tool set B',
        category: 'Tools',
        unitPrice: 249.99,
        unit: 'set',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'PROD008',
        name: 'Accessory Pack',
        description: 'Essential accessories',
        category: 'Accessories',
        unitPrice: 39.99,
        unit: 'pack',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'PROD009',
        name: 'Premium Accessory',
        description: 'Premium accessory set',
        category: 'Accessories',
        unitPrice: 89.99,
        unit: 'set',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'PROD010',
        name: 'Bundle Deal',
        description: 'Special bundle offer',
        category: 'Bundles',
        unitPrice: 299.99,
        unit: 'bundle',
      },
    }),
  ]);

  console.log('✅ Created products');

  // Create Inventory Snapshots
  for (const product of products) {
    await prisma.inventorySnapshot.create({
      data: {
        productId: product.id,
        quantityAvailable: Math.floor(Math.random() * 100) + 10,
        source: 'SEED',
      },
    });
  }

  console.log('✅ Created inventory snapshots');

  // Create Quotes
  const quote1 = await prisma.quote.create({
    data: {
      quoteNumber: 'QUOTE-001',
      customerId: customers[0].id,
      salesRepId: salesRep1.id,
      status: QuoteStatus.SENT,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  await prisma.quoteItem.createMany({
    data: [
      {
        quoteId: quote1.id,
        productId: products[0].id,
        quantity: 10,
        unitPrice: products[0].unitPrice,
        discountPercent: 5,
        total: products[0].unitPrice.toNumber() * 10 * 0.95,
      },
      {
        quoteId: quote1.id,
        productId: products[3].id,
        quantity: 5,
        unitPrice: products[3].unitPrice,
        discountPercent: 0,
        total: products[3].unitPrice.toNumber() * 5,
      },
    ],
  });

  const quote2 = await prisma.quote.create({
    data: {
      quoteNumber: 'QUOTE-002',
      customerId: customers[1].id,
      salesRepId: salesRep1.id,
      status: QuoteStatus.ACCEPTED,
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.quoteItem.createMany({
    data: [
      {
        quoteId: quote2.id,
        productId: products[1].id,
        quantity: 20,
        unitPrice: products[1].unitPrice,
        discountPercent: 10,
        total: products[1].unitPrice.toNumber() * 20 * 0.9,
      },
    ],
  });

  const quote3 = await prisma.quote.create({
    data: {
      quoteNumber: 'QUOTE-003',
      customerId: customers[2].id,
      salesRepId: salesRep2.id,
      status: QuoteStatus.DRAFT,
    },
  });

  await prisma.quoteItem.createMany({
    data: [
      {
        quoteId: quote3.id,
        productId: products[4].id,
        quantity: 15,
        unitPrice: products[4].unitPrice,
        discountPercent: 0,
        total: products[4].unitPrice.toNumber() * 15,
      },
      {
        quoteId: quote3.id,
        productId: products[6].id,
        quantity: 3,
        unitPrice: products[6].unitPrice,
        discountPercent: 15,
        total: products[6].unitPrice.toNumber() * 3 * 0.85,
      },
    ],
  });

  console.log('✅ Created quotes');

  // Create Orders
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-001',
      customerId: customers[0].id,
      salesRepId: salesRep1.id,
      quoteId: quote1.id,
      status: OrderStatus.DELIVERED,
      orderDate: lastMonth,
      totalAmount: 0, // Will update
    },
  });

  const order1Items = [
    {
      orderId: order1.id,
      productId: products[0].id,
      quantity: 10,
      unitPrice: products[0].unitPrice,
      discountPercent: 5,
      total: products[0].unitPrice.toNumber() * 10 * 0.95,
    },
    {
      orderId: order1.id,
      productId: products[3].id,
      quantity: 5,
      unitPrice: products[3].unitPrice,
      discountPercent: 0,
      total: products[3].unitPrice.toNumber() * 5,
    },
  ];

  await prisma.orderItem.createMany({ data: order1Items });
  const order1Total = order1Items.reduce((sum, item) => sum + item.total, 0);
  await prisma.order.update({
    where: { id: order1.id },
    data: { totalAmount: order1Total },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-002',
      customerId: customers[1].id,
      salesRepId: salesRep1.id,
      quoteId: quote2.id,
      status: OrderStatus.DELIVERED,
      orderDate: twoMonthsAgo,
      totalAmount: 0,
    },
  });

  const order2Items = [
    {
      orderId: order2.id,
      productId: products[1].id,
      quantity: 20,
      unitPrice: products[1].unitPrice,
      discountPercent: 10,
      total: products[1].unitPrice.toNumber() * 20 * 0.9,
    },
  ];

  await prisma.orderItem.createMany({ data: order2Items });
  const order2Total = order2Items.reduce((sum, item) => sum + item.total, 0);
  await prisma.order.update({
    where: { id: order2.id },
    data: { totalAmount: order2Total },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-003',
      customerId: customers[2].id,
      salesRepId: salesRep2.id,
      status: OrderStatus.SHIPPED,
      orderDate: new Date(),
      totalAmount: 0,
    },
  });

  const order3Items = [
    {
      orderId: order3.id,
      productId: products[4].id,
      quantity: 15,
      unitPrice: products[4].unitPrice,
      discountPercent: 0,
      total: products[4].unitPrice.toNumber() * 15,
    },
  ];

  await prisma.orderItem.createMany({ data: order3Items });
  const order3Total = order3Items.reduce((sum, item) => sum + item.total, 0);
  await prisma.order.update({
    where: { id: order3.id },
    data: { totalAmount: order3Total },
  });

  const order4 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-004',
      customerId: customers[0].id,
      salesRepId: salesRep1.id,
      status: OrderStatus.DELIVERED,
      orderDate: threeMonthsAgo,
      totalAmount: 0,
    },
  });

  const order4Items = [
    {
      orderId: order4.id,
      productId: products[5].id,
      quantity: 2,
      unitPrice: products[5].unitPrice,
      discountPercent: 0,
      total: products[5].unitPrice.toNumber() * 2,
    },
  ];

  await prisma.orderItem.createMany({ data: order4Items });
  const order4Total = order4Items.reduce((sum, item) => sum + item.total, 0);
  await prisma.order.update({
    where: { id: order4.id },
    data: { totalAmount: order4Total },
  });

  console.log('✅ Created orders');

  // Create Sales Summaries
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastPeriod = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  const twoPeriodsAgo = `${twoMonthsAgo.getFullYear()}-${String(twoMonthsAgo.getMonth() + 1).padStart(2, '0')}`;

  await prisma.salesSummary.createMany({
    data: [
      {
        customerId: customers[0].id,
        period: lastPeriod,
        totalSalesAmount: order1Total,
        totalOrders: 1,
      },
      {
        customerId: customers[0].id,
        period: twoPeriodsAgo,
        totalSalesAmount: order4Total,
        totalOrders: 1,
      },
      {
        customerId: customers[1].id,
        period: twoPeriodsAgo,
        totalSalesAmount: order2Total,
        totalOrders: 1,
      },
    ],
  });

  console.log('✅ Created sales summaries');
  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
