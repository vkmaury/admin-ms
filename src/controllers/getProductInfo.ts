import { Request, Response } from 'express';
import Admin from '../models/adminSchema';
import Product from '../models/productSchema';
import Review from '../models/reviewSchema'; // Adjust the path according to your project structure
import { getAdminIdFromRequest } from '../utils/auth';

export const getProductInfo = async (req: Request, res: Response) => {
  const { _id } = req.query;

  console.log('Query parameters:', req.query);

  // Validate productId
  if (!_id || typeof _id !== 'string') {
    return res.status(400).json({ error: 'Valid Product ID is required' });
  }

  try {
    // Extract admin ID from the request
    const adminId = getAdminIdFromRequest(req);
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

    // Find the product by ID and populate category and reviews
    const product = await Product.findById(_id)
      .populate('categoryId') // Populate category
      .exec();
         
    console.log(product);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if the product is soft deleted
    if (!product.isActive) {
      return res.status(410).json({ error: 'Product is soft deleted and no longer available' });
    }

    // Send product info in the response
    res.status(200).json({ product });
  } catch (error) {
    console.error('Error fetching product info:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
