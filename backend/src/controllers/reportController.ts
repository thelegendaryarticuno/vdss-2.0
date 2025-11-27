import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import * as reportService from '../services/reportService';

export async function getSalesSummary(req: AuthRequest, res: Response) {
  try {
    const params = {
      from: req.query.from ? new Date(req.query.from as string) : undefined,
      to: req.query.to ? new Date(req.query.to as string) : undefined,
      groupBy: (req.query.groupBy as reportService.GroupByOption) || 'customer',
    };

    const result = await reportService.getSalesSummary(params);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate sales summary',
    });
  }
}

export async function getCustomerSalesHistory(req: AuthRequest, res: Response) {
  try {
    const { customerId } = req.params;
    const months = parseInt(req.query.months as string) || 12;

    const result = await reportService.getCustomerSalesHistory(customerId, months);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch customer sales history',
    });
  }
}
