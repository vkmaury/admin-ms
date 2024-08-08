import { Request, Response } from 'express';
import Admin from '../models/adminSchema'; // Adjust the path according to your project structure
import Product from '../models/productSchema';
import { getAdminIdFromRequest } from '../utils/auth';

export const getAllActiveProducts = async (req: Request, res: Response) => {
  try {
    // Extract admin ID from the request
    const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
    if (!adminId) {
      return res.status(401).json({ error: 'Admin not authenticated' });
    }

    // Find the admin by ID
    const admin = await Admin.findById(adminId).exec();
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Check if the admin is active
    if (!admin.isActive) {
      return res.status(403).json({ error: 'Admin is not active' });
    }

    // Extract query parameters for search, sort, and pagination
    const searchQuery = req.query.search as string || '';
    const sort = req.query.sort === 'desc' ? -1 : 1; // Default to ascending order
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    // Build query for fetching active products
    const query: any = { isActive: true };
    if (searchQuery) {
      query.name = { $regex: searchQuery, $options: 'i' }; // Case-insensitive search
    }

    // Fetch products with search, sorting, and pagination
    const products = await Product.find(query)
      .sort({ name: sort })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    // Count total matching products for pagination
    const totalCount = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    if (products.length === 0) {
      return res.status(404).json({ message: 'No active products found' });
    }

    res.status(200).json({
     
      pagination: {
        page,
        limit,
        totalPages,
        totalCount
      }, products
    });
  } catch (error: unknown) {
    console.error('Error fetching products:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
