import { Request, Response } from 'express';
import Admin from '../models/adminSchema'; // Adjust the path according to your project structure
import Product from '../models/productSchema';
import { getAdminIdFromRequest } from '../utils/auth';  

export const getProductInfo = async (req: Request, res: Response) => {
    const { _id } = req.query;
   

    // console.log('productId:',id );
    console.log('Query parameters:', req.query);

    // Validate productId
    if (!_id || typeof _id !== 'string') {
      return res.status(400).json({ error: 'Valid Product ID is required' });
    }
  
    console.log(_id);
  
    try {

    //   Extract admin ID from the request
      const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
      if (!adminId) {
        return res.status(401).json({ error: 'Admin not authenticated' });
      }
  
    //   // Log admin ID
    //   console.log('Admin ID:', adminId);
  
      // Find the admin by ID
      const admin = await Admin.findById(adminId).exec();
      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }
  
      // Check if the admin is active
      if (!admin.isActive) {
        return res.status(403).json({ error: 'Admin is not active' });
      }
    //   Validate productId
      if (!_id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

     
      // Find the product by ID
      const product = await Product.findById(_id).populate('categoryId').exec();

      
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