import { Request, Response } from 'express';
import Bundle from '../models/bundleSchema'; // Adjust the path as needed
import Admin from '../models/adminSchema'; // Import the admin model
import Wishlist from '../models/wishlistSchema'; // Import Wishlist model
import Cart from '../models/addToCartSchema'; // Import Cart model

import { getAdminIdFromRequest } from '../utils/auth'; // Adjust according to your authentication setup
import Product from '../models/productSchema'; // Import the product model


// Create a new bundle
export const createBundle = async (req: Request, res: Response) => {
  const { name, description, stock, products, adminDiscountApplied } = req.body;

  // Extract admin ID from the request
  const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
  if (!adminId) {
    return res.status(401).json({ error: 'Admin not authenticated' });
  }

  // Validate adminDiscountApplied value
  if (adminDiscountApplied < 0 || adminDiscountApplied > 100) {
    return res.status(400).json({ error: 'adminDiscountApplied must be a number between 0 and 100' });
  }

  try {
    // Find the admin by ID
    const admin = await Admin.findById(adminId).exec();
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    

    // Check if the admin is active
    if (!admin.isActive) {
      return res.status(403).json({ error: 'Admin is not active' });
    }

    // Calculate total price of all products in the bundle
    let totalPrice = 0;

    for (const item of products) {
      const product = await Product.findById(item.productId).exec();
      if (!product) {
        return res.status(404).json({ error: `Product with ID ${item.productId} not found` });
      }
      if (!product.isActive) {
        return res.status(400).json({ error: `Product with ID ${item.productId} is inactive and cannot be added to the bundle` });
      }
      if (product.isBlocked) {
        return res.status(400).json({ error: `Product with ID ${item.productId} is blocked and cannot be added to the bundle` });
      }
      totalPrice += product.MRP * item.quantity;
    }

    // Calculate final price after applying admin discount
    const discountAmount = (totalPrice * adminDiscountApplied) / 100;
    const adminDiscountedPrice = totalPrice - discountAmount;

    // Create a new bundle
    const newBundle = new Bundle({
      name,
      description,
      products,
      stock,
      MRP: totalPrice, // Store the total price before discount
      adminDiscountApplied,
      adminDiscountedPrice,
      AdminId: adminId,
      isActive: true,
      isBlocked: false
    });

    // Save the bundle to the database
    await newBundle.save();

    res.status(201).json({ message: 'Bundle created successfully', bundle: newBundle });
  } catch (error) {
    console.error('Error creating bundle:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};


export const getBundle = async (req: Request, res: Response) => {
    const { bundleId } = req.query; // Extract the bundle ID from route parameters
  
    if (!bundleId) {
      return res.status(400).json({ error: 'Bundle ID is required' });
    }
  
    // Extract admin ID from the request
    const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
    if (!adminId) {
      return res.status(401).json({ error: 'Admin not authenticated' });
    }
  
    try {
      // Find the bundle by ID
      const bundle = await Bundle.findById(bundleId).exec();
  
      if (!bundle) {
        return res.status(404).json({ error: 'Bundle not found' });
      }
  
      // Check if the bundle is active
      if (!bundle.isActive) {
        return res.status(400).json({ error: 'Bundle is soft deleted' });
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
  
      // Return the bundle details if both bundle and admin are active
      res.status(200).json({ bundle });
    } catch (error) {
      console.error('Error retrieving bundle:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  };


  export const getAllBundles = async (req: Request, res: Response) => {
    // Extract admin ID from the request
    const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
    if (!adminId) {
      return res.status(401).json({ error: 'Admin not authenticated' });
    }
  
    try {
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
  
      // Build query for fetching bundles
      const query: any = { isActive: true };
      if (searchQuery) {
        query.name = { $regex: searchQuery, $options: 'i' }; // Case-insensitive search
      }
  
      // Fetch bundles with search, sorting, and pagination
      const bundles = await Bundle.find(query)
        .sort({ name: sort })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
  
      // Count total matching bundles for pagination
      const totalCount = await Bundle.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);
  
      if (bundles.length === 0) {
        return res.status(404).json({ message: 'No bundles found' });
      }
  
      res.status(200).json({
        
        pagination: {
          page,
          limit,
          totalPages,
          totalCount
        },bundles
      });
    } catch (error: unknown) {
      console.error('Error retrieving bundles:', error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  };
  
export const updateBundle = async (req: Request, res: Response) => {
    const { bundleId } = req.query; // Extract the bundle ID from query parameters
    const updateData = req.body; // Extract the update data from the request body
  
    if (!bundleId) {
        return res.status(400).json({ error: 'Bundle ID is required' });
    }
  
    // Extract admin ID from the request
    const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
    if (!adminId) {
        return res.status(401).json({ error: 'Admin not authenticated' });
    }

    
  
    try {
        // Find the bundle by ID
        const bundle = await Bundle.findById(bundleId).exec();
        if (!bundle) {
            return res.status(404).json({ error: 'Bundle not found' });
        }
  
        // Check if the bundle is active
        if (!bundle.isActive) {
            return res.status(400).json({ error: 'Bundle is soft deleted and cannot be updated' });
        }
  
          // Check if the admin ID exists in the bundle
          if (!bundle.AdminId) {
            return res.status(403).json({ error: 'Admin is not authorized to update this bundle' });
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


        // Validate adminDiscountApplied if it's provided in the update data
    if (updateData.adminDiscountApplied !== undefined) {
      if (updateData.adminDiscountApplied < 0 || updateData.adminDiscountApplied > 100) {
        return res.status(400).json({ error: 'adminDiscountApplied must be a number between 0 and 100' });
      }
    }
  
        // If products are provided in the updateData, calculate totalPrice and finalPrice
        if (updateData.products) {
            let totalPrice = 0;
            for (const item of updateData.products) {
                const product = await Product.findById(item.productId).exec();
                if (!product) {
                    return res.status(404).json({ error: `Product with ID ${item.productId} not found` });
                }
                if (!product.isActive) {
                  return res.status(400).json({ error: `Product with ID ${item.productId} is inactive and cannot be added to the bundle` });
                }
                if (product.isBlocked) {
                  return res.status(400).json({ error: `Product with ID ${item.productId} is blocked and cannot be added to the bundle` });
                }
                totalPrice += product.MRP * item.quantity;
            }
  
            // Calculate finalPrice with AdminDiscount
            const adminDiscountApplied = updateData.adminDiscountApplied || 0;
            const adminDiscountedPrice = totalPrice - (totalPrice * adminDiscountApplied / 100);
  
            // Update the bundle with calculated prices
            bundle.MRP = totalPrice; // Assuming MRP should be updated to the total price of products
            bundle.adminDiscountApplied = adminDiscountApplied;
            bundle.adminDiscountedPrice = adminDiscountedPrice;
        }
  
        // Update the bundle with the provided data
        Object.assign(bundle, updateData);
        await bundle.save();
  
        res.status(200).json({ message: 'Bundle updated successfully', bundle });
    } catch (error) {
        console.error('Error updating bundle:', error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
};


export const softDeleteBundle = async (req: Request, res: Response) => {
    const { bundleId } = req.query; // Extract the bundle ID from query parameters
  
    if (!bundleId) {
        return res.status(400).json({ error: 'Bundle ID is required' });
    }
  
    // Extract admin ID from the request
    const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
    if (!adminId) {
        return res.status(401).json({ error: 'Admin not authenticated' });
    }
  
    try {
        // Find the bundle by ID
        const bundle = await Bundle.findById(bundleId).exec();
        if (!bundle) {
            return res.status(404).json({ error: 'Bundle not found' });
        }
  
        // Check if the bundle is already inactive
        if (!bundle.isActive) {
            return res.status(400).json({ error: 'Bundle is already soft deleted' });
        }

           // Check if the admin ID exists in the bundle
           if (!bundle.AdminId) {
            return res.status(403).json({ error: 'Admin is not authorized to delete this bundle' });
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
  
     
        // Mark the bundle as inactive (soft delete)
        bundle.isActive = false;
        await bundle.save();
  
        res.status(200).json({ message: 'Bundle soft deleted successfully', bundle });
    } catch (error) {
        console.error('Error soft deleting bundle:', error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
};

export const blockBundle = async (req: Request, res: Response) => {
    const { bundleId } = req.query; // Extract the bundle ID from query parameters
  
    if (!bundleId) {
        return res.status(400).json({ error: 'Bundle ID is required' });
    }
  
    // Extract admin ID from the request
    const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
    if (!adminId) {
        return res.status(401).json({ error: 'Admin not authenticated' });
    }
  
    try {
        // Find the bundle by ID
        const bundle = await Bundle.findById(bundleId).exec();
        if (!bundle) {
            return res.status(404).json({ error: 'Bundle not found' });
        }
  
        // Check if the bundle is already blocked
        if (bundle.isBlocked) {
            return res.status(400).json({ error: 'Bundle is already blocked' });
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
  
        // Block the bundle (set isBlocked to true)
        bundle.isBlocked = true;
        bundle.isUnavailable = true;
        await bundle.save();

        // Remove the bundle from carts
     const carts = await Cart.find({ 'items.bundleId': bundleId }).exec();
     for (const cart of carts) {
      for (const item of cart.items) {
        if (item.bundleId?.toString() === bundleId.toString()) {
          item.isUnavailable = true; // Mark the product as unavailable
        }
      }
      await cart.save();
     }
 
     // Remove the bundle from wishlists
     const wishlists = await Wishlist.find({ 'items.bundleId': bundleId }).exec();
     for (const wishlist of wishlists) {
      for (const item of wishlist.items) {
        if (item.bundleId?.toString() === bundleId.toString()) {
          item.isUnavailable = true; // Mark the product as unavailable
        }
      }
      await wishlist.save();
     }
 

  
        res.status(200).json({ message: 'Bundle blocked successfully', bundle });
    } catch (error) {
        console.error('Error blocking bundle:', error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
};


export const unblockBundle = async (req: Request, res: Response) => {
    const { bundleId } = req.query; // Extract the bundle ID from query parameters
  
    if (!bundleId) {
        return res.status(400).json({ error: 'Bundle ID is required' });
    }
  
    // Extract admin ID from the request
    const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
    if (!adminId) {
        return res.status(401).json({ error: 'Admin not authenticated' });
    }
  
    try {
        // Find the bundle by ID
        const bundle = await Bundle.findById(bundleId).exec();
        if (!bundle) {
            return res.status(404).json({ error: 'Bundle not found' });
        }
  
        // Check if the bundle is already unblocked
        if (!bundle.isBlocked) {
            return res.status(400).json({ error: 'Bundle is not blocked' });
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
  
        // Unblock the bundle (set isBlocked to false)
        bundle.isBlocked = false;
        bundle.isUnavailable = false;
        await bundle.save();
  
        res.status(200).json({ message: 'Bundle unblocked successfully', bundle });
    } catch (error) {
        console.error('Error unblocking bundle:', error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
};


export const removeDiscountFromBundle = async (req: Request, res: Response) => {
  const { discountId, bundleId } = req.query;

  if (!discountId || !bundleId) {
    return res.status(400).json({ message: 'discountId and bundleId are required' });
  }

  try {
    const bundle = await Bundle.findById(bundleId);

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    if(bundle.discountId === undefined && bundle.adminDiscount ){

       bundle.adminDiscount = undefined;

    }else{

    // Check if the discountId matches the current discount of the bundle
    if (bundle.discountId.toString() !== discountId.toString()) {
      return res.status(400).json({ message: 'Discount ID does not match the bundle discount' });
    }


    // Remove the discount ID from the bundle
    bundle.discountId = undefined as unknown as typeof bundle.discountId;
    bundle.adminDiscountApplied = undefined;
    bundle.adminDiscountedPrice = undefined;
    // bundle.adminDiscount = undefined;

  }

    await bundle.save();

    res.status(200).json({ message: 'Discount removed from bundle successfully', bundle });
  } catch (error) {
    console.error('Error removing discount from bundle:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
