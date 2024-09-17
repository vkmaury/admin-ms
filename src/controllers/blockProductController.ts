import { Request, Response } from 'express';
import Product from '../models/productSchema'; // Adjust the path as needed
import Admin from '../models/adminSchema'; // Import the admin model
import Bundle from '../models/bundleSchema'; // Import the bundle model
import Wishlist from '../models/wishlistSchema'; // Import Wishlist model
import Cart from '../models/addToCartSchema'; // Import Cart model
import Sale from '../models/saleSchema'; // Import Cart model

import { getAdminIdFromRequest } from '../utils/auth'; // Adjust according to your authentication setup

// Helper function to calculate MRP for the bundle
const calculateBundleValues = async (products: any[]) => {
  let totalMRP = 0;

  // Use Promise.all to fetch MRP for all products concurrently
  await Promise.all(products.map(async (item) => {
    const product = await Product.findById(item.productId).exec();
    if (product && typeof product.MRP === 'number') {
      totalMRP += item.quantity * product.MRP;
    }
  }));

  return { totalMRP };
};

// Block a product (soft delete)
// Block a product (soft delete)
export const blockProduct = async (req: Request, res: Response) => {
  const { productId } = req.query; // Extract the product ID from query parameters

  // Log the incoming request
  console.log('Incoming request:', { productId });

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
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

    // Find the product by ID
    const product = await Product.findById(productId).exec();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.isActive) {
      return res.status(401).json({ error: 'Product is inactive, so you cannot block this product' });
    }

    // Check if the product is already blocked
    if (product.isBlocked) {
      return res.status(400).json({ error: 'Product is already blocked' });
    }

    // Update the product's isBlocked field to true
    product.isBlocked = true;

    product.isUnavailable = true;
    await product.save();

    // Remove the product from any bundles
    const bundles = await Bundle.find({ 'products.productId': productId }).exec();
    if (bundles.length > 0) {
      for (const bundle of bundles) {
        // Remove the product from the bundle's products array
        bundle.products = bundle.products.filter(p => p.productId.toString() !== productId.toString());

        // Calculate updated bundle values
        const { totalMRP } = await calculateBundleValues(bundle.products);
        const sellerDiscount = bundle.sellerDiscount ?? 0;
        if (sellerDiscount > 0 ){                    
        // Apply seller discount
        const totalDiscount = (totalMRP * sellerDiscount) / 100;
        let discountedPrice = totalMRP - totalDiscount;
        bundle.MRP = totalMRP;
        bundle.sellerDiscounted = discountedPrice;
        }
         
        const adminDiscountApplied = bundle.adminDiscountApplied ?? 0;
        if (adminDiscountApplied > 0) {
          const discountAmount = (bundle.sellerDiscounted * adminDiscountApplied) / 100;
          const adminDiscountedPrice = bundle.sellerDiscounted - discountAmount;
          bundle.adminDiscountedPrice = adminDiscountedPrice;
        }
        
        // Apply admin discount if available
        const adminDiscount = bundle.adminDiscount ?? 0;
        if (adminDiscount > 0) {
          const discountAmount = (bundle.MRP * adminDiscount) / 100;
          const adminDiscountedPrice = bundle.MRP - discountAmount;
          bundle.adminDiscountedPrice = adminDiscountedPrice;
        }

        // // Ensure default values are set if calculations fail
        // bundle.MRP = totalMRP;
        // bundle.finalPrice = discountedPrice;
       

        // Set the bundle's AdminId and description if required
        bundle.AdminId = adminId;
        // bundle.description = `Updated after blocking product ${productId}`;

        await bundle.save();
      }
    }

    
    // Remove the product from wishlists
    const wishlists = await Wishlist.find({ 'items.productId': productId }).exec();
    for (const wishlist of wishlists) {
      for (const item of wishlist.items) {
        if (item.productId?.toString() === productId.toString()) {
          item.isUnavailable = true; // Mark the product as unavailable
        }
      }
      await wishlist.save();
    }

   // Mark the product as unavailable in carts
   const carts = await Cart.find({ 'items.productId': productId }).exec();
   for (const cart of carts) {
     for (const item of cart.items) {
       if (item.productId?.toString() === productId.toString()) {
         item.isUnavailable = true; // Mark the product as unavailable
       }
     }
     await cart.save();
   }


     // Remove the product from sale
     const sales = await Sale.find({ 'affectedProducts.productId': productId }).exec();
     for (const sale of sales) {
      for (const affectedProducts of sale.affectedProducts) {
        if (affectedProducts.productId?.toString() === productId.toString()) {
          affectedProducts.isUnavailable = true; // Mark the product as unavailable
        }
      }
      await sale.save();
     }

    res.status(200).json({ message: 'Product has been blocked successfully and removed from bundles', product });
  } catch (error) {
    console.error('Error blocking product:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};
