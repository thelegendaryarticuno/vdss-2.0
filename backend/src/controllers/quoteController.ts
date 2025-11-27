import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import * as quoteService from '../services/quoteService';

export async function getQuotes(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filters = {
      status: req.query.status as any,
      customerId: req.query.customerId as string,
      salesRepId: req.query.salesRepId as string,
    };

    const result = await quoteService.getQuotes(filters, page, limit);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch quotes',
    });
  }
}

export async function getQuoteById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const quote = await quoteService.getQuoteById(id);

    res.json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'Quote not found',
    });
  }
}

export async function createQuote(req: AuthRequest, res: Response) {
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
      validUntil: req.body.validUntil ? new Date(req.body.validUntil) : undefined,
    };

    const quote = await quoteService.createQuote(input);

    res.status(201).json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create quote',
    });
  }
}

export async function updateQuote(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updateData: any = {
      ...req.body,
    };

    if (req.body.items) {
      updateData.items = req.body.items;
    }

    if (req.body.validUntil) {
      updateData.validUntil = new Date(req.body.validUntil);
    }

    const quote = await quoteService.updateQuote(id, updateData);

    res.json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update quote',
    });
  }
}

export async function sendQuote(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const quote = await quoteService.sendQuote(id);

    res.json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send quote',
    });
  }
}

export async function acceptQuote(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const quote = await quoteService.acceptQuote(id);

    res.json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to accept quote',
    });
  }
}
