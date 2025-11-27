import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import * as inventoryService from '../services/inventoryService';

export async function getInventory(req: AuthRequest, res: Response) {
  try {
    const inventory = await inventoryService.getLatestInventory();

    res.json({
      success: true,
      data: inventory,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch inventory',
    });
  }
}

export async function getProductInventory(req: AuthRequest, res: Response) {
  try {
    const { productId } = req.params;
    const inventory = await inventoryService.getProductInventory(productId);

    res.json({
      success: true,
      data: inventory,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'Product inventory not found',
    });
  }
}

export async function syncInventory(req: AuthRequest, res: Response) {
  try {
    const result = await inventoryService.syncInventory();

    res.json({
      success: true,
      data: result,
      message: `Synced ${result.synced} products`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync inventory',
    });
  }
}
