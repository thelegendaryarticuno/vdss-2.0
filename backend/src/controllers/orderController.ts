import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import * as orderService from '../services/orderService';
import { OrderStatus } from '@prisma/client';

export async function getOrders(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filters = {
      status: req.query.status as OrderStatus | undefined,
      customerId: req.query.customerId as string,
      salesRepId: req.query.salesRepId as string,
      fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
      toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
    };

    const result = await orderService.getOrders(filters, page, limit);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders',
    });
  }
}

export async function getOrderById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'Order not found',
    });
  }
}

export async function createOrder(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const input = {
      ...req.body,
      salesRepId: req.body.salesRepId || req.user.id,
      orderDate: req.body.orderDate ? new Date(req.body.orderDate) : undefined,
    };

    const order = await orderService.createOrder(input);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create order',
    });
  }
}

export async function updateOrderStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required',
      });
    }

    const order = await orderService.updateOrderStatus(id, status);

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update order status',
    });
  }
}
