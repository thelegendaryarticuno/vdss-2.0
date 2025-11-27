import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import * as aiService from '../services/aiService';

export async function getSalesForecast(req: AuthRequest, res: Response) {
  try {
    const { customerId } = req.query;

    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'customerId is required',
      });
    }

    const months = parseInt(req.query.months as string) || 6;
    const forecastMonths = parseInt(req.query.forecastMonths as string) || 3;

    const result = await aiService.getSalesForecast(customerId, months, forecastMonths);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate sales forecast',
    });
  }
}

export async function getProductRecommendations(req: AuthRequest, res: Response) {
  try {
    const { customerId } = req.query;

    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'customerId is required',
      });
    }

    const limit = parseInt(req.query.limit as string) || 10;

    const result = await aiService.getProductRecommendations(customerId, limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate product recommendations',
    });
  }
}
