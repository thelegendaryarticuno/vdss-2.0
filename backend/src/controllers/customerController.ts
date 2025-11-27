import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import * as customerService from '../services/customerService';

export async function getCustomers(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filters = {
      search: req.query.search as string,
      city: req.query.city as string,
      region: req.query.region as string,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    };

    const result = await customerService.getCustomers(filters, page, limit);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch customers',
    });
  }
}

export async function getCustomerById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id);

    res.json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'Customer not found',
    });
  }
}

export async function createCustomer(req: AuthRequest, res: Response) {
  try {
    const customer = await customerService.createCustomer(req.body);

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create customer',
    });
  }
}

export async function updateCustomer(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const customer = await customerService.updateCustomer(id, req.body);

    res.json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update customer',
    });
  }
}

export async function deleteCustomer(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await customerService.deleteCustomer(id);

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete customer',
    });
  }
}
