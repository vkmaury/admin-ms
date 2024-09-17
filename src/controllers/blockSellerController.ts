import { Request, Response } from 'express';
import User from '../models/User'; // Adjust the path as needed
import Product from '../models/productSchema'; // Import the product model
import Admin from '../models/adminSchema'; // Import the admin model
import { getAdminIdFromRequest } from '../utils/auth'; // Adjust according to your authentication setup

export const blockSeller = async (req: Request, res: Response) => {
  const userId = req.query.userId as string; // Get the user ID from the query parameters

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Extract admin ID from the request
    const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
    if (!adminId) {
      return res.status(401).json({ error: 'Admin not authenticated' });
    }
    
    // Log admin ID
    console.log('Admin ID:', adminId);
    
    // Find the admin by ID
    const admin = await Admin.findById(adminId).exec();
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    // Check if the admin is active
    if (!admin.isActive) {
      return res.status(403).json({ error: 'Admin is not active' });
    }

    // Find the user by ID
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user role is 'seller'
    if (user.role !== 'seller') {
      return res.status(403).json({ message: 'User is not a seller' });
    }
    
    // Check if seller is already blocked
    if (user.isBlocked) {
      return res.status(402).json({ message: 'Seller is already blocked' });
    }

    // Block the user by updating the isBlocked field
    user.isBlocked = true;
    await user.save();

    // Find all products associated with this seller
    const products = await Product.find();

    // Check if products is an array
    if (!Array.isArray(products)) {
      return res.status(500).json({ message: 'Failed to fetch products' });
    }

    // Filter products that belong to this seller and block them
    const blockedProducts = products.filter(product => {
      if (product.userId) {
        return product.userId.toString() === userId;
      }
      return false;
    });

    for (const product of blockedProducts) {
      product.isBlocked = true;
      await product.save();
    }

    res.status(200).json({ message: 'Seller blocked successfully', user });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
