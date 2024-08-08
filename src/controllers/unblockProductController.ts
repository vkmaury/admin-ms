import { Request, Response } from 'express';
import Product from '../models/productSchema'; // Adjust the path as needed
import Admin from '../models/adminSchema'; // Import the admin model
import { getAdminIdFromRequest } from '../utils/auth'; // Adjust according to your authentication setup

// Unblock (reactivate) a product
export const unblockProduct = async (req: Request, res: Response) => {
  const { productId } = req.query; // Extract the product ID from route parameters

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

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

    // Find the product by ID
    const product = await Product.findById(productId).exec();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if(!product.isActive){
      return res.status(401).json({error:'Product is Inactive so you can not unblock this product'});
    }

    // Check if the product is already active
    if (!product.isBlocked) {
      return res.status(400).json({ error: 'Product is already Blocked' });
    }

    // Update the product's isActive field to true
    product.isBlocked = false;
    await product.save();
    

    res.status(200).json({ message: 'Product has been unblocked successfully', product });
  } catch (error) {
    console.error('Error unblocking product:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
