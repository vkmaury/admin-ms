import { Request, Response } from 'express';
import Discount from '../models/discountModel';
import Admin from '../models/adminSchema'; // Import the Admin model
import Product from '../models/productSchema'; // Adjust the path as needed
import Bundle from '../models/bundleSchema';
import cron from 'node-cron';
import { getAdminIdFromRequest } from '../utils/auth';
import { isValidObjectId } from 'mongoose';
import moment from 'moment-timezone';
import _ from 'lodash';



export const createDiscountController = async (req: Request, res: Response) => {
  // Extract admin ID from the request
  const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
  if (!adminId) {
    return res.status(401).json({ error: 'Admin not authenticated' });
  }

  const { type, adminDiscount, description, startDate, endDate } = req.body;

    // Validate adminDiscount value
    if (adminDiscount < 0 || adminDiscount > 100) {
      return res.status(400).json({ message: 'adminDiscount must be a number between 0 and 100' });
    }
 
  // Validate the dates
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Both startDate and endDate are required' });
  }

   // Define the format and parse dates in Asia/Kolkata timezone
   const format = 'YYYY-MM-DD-HH-mm-ss';
   const tz = 'Asia/Kolkata';
   const start = moment.tz(startDate, format, tz);
   const end = moment.tz(endDate, format, tz);
   const now = moment.tz(tz);

   if (!start.isValid() || !end.isValid()) {
     return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD-HH-mm-ss' });
   }

   if (start.isBefore(now)) {
     return res.status(400).json({ message: 'startDate cannot be in the past' });
   }

   if (start.isSameOrAfter(end)) {
     return res.status(400).json({ message: 'startDate must be before endDate' });
   }

  try {
    // Check if the admin exists and is active
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: 'Admin is not active' });
    }

    // Create the discount
    const discount = new Discount({
      adminId,
      type,
      adminDiscount,
      description,
      startDate: start.utc().toDate(), // Save in UTC format
      endDate: end.utc().toDate(),
    });

    await discount.save();

    res.status(201).json({ message: 'Discount created successfully', discount });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};

export const getAllDiscountsController = async (req: Request, res: Response) => {
  try {
    // Extract query parameters
    const searchQuery = req.query.search as string || '';
    const sort = req.query.sort === 'desc' ? -1 : 1; // Default to ascending order
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    // Build query for fetching active discounts
    const query: any = { isActive: true };
    if (searchQuery) {
      query.description = { $regex: searchQuery, $options: 'i' }; // Case-insensitive search
    }

    // Fetch all active discounts with search and sorting
    const allDiscounts = await Discount.find(query).sort({ adminDiscount: sort });

    // Filter out inactive discounts
    const activeDiscounts = await Promise.all(allDiscounts.map(async (discount) => {
      const admin = await Admin.findById(discount.adminId);
      if (!admin || !admin.isActive) {
        return null;
      }
      return discount;
    }));

    // Remove null values (inactive entries)
    const filteredDiscounts = activeDiscounts.filter(discount => discount !== null);

    // Apply pagination
    const totalCount = filteredDiscounts.length;
    const totalPages = Math.ceil(totalCount / limit);
    const paginatedDiscounts = filteredDiscounts.slice((page - 1) * limit, page * limit);

    if (paginatedDiscounts.length === 0) {
      return res.status(404).json({ message: 'No active discounts found' });
    }

    res.status(200).json({
      
      pagination: {
        page,
        limit,
        totalPages,
        totalCount
      },
      discounts: paginatedDiscounts
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch discounts', error: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};

export const getDiscountByIdController = async (req: Request, res: Response) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid discount ID' });
  }

  try {
    // Fetch the discount by ID
    const discount = await Discount.findById(id);

    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    // Check if the associated admin is active
    const admin = await Admin.findById(discount.adminId);

    if (!admin || !admin.isActive) {
      return res.status(403).json({ message: 'Admin is inactive' });
    }

    // Check if the discount itself is active
    if (!discount.isActive) {
      return res.status(410).json({ message: 'This discount is soft deleted' });
    }

    // Return the active discount
    res.status(200).json({ discount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch discount', error });
  }
};

export const updateDiscountByIdController = async (req: Request, res: Response) => {
  const { id } = req.query;
  const { adminId, adminDiscount, description, startDate, endDate, isActive } = req.body;

    // Validate adminDiscount value
    if (adminDiscount < 0 || adminDiscount > 100) {
      return res.status(400).json({ message: 'adminDiscount must be a number between 0 and 100' });
    }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid discount ID' });
  }

   // Validate the dates
   if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Both startDate and endDate are required' });
  }

   // Define the format and parse dates in Asia/Kolkata timezone
   const format = 'YYYY-MM-DD-HH-mm-ss';
   const tz = 'Asia/Kolkata';
   const start = moment.tz(startDate, format, tz);
   const end = moment.tz(endDate, format, tz);
   const now = moment.tz(tz);

   if (!start.isValid() || !end.isValid()) {
     return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD-HH-mm-ss' });
   }

   if (start.isBefore(now)) {
     return res.status(400).json({ message: 'startDate cannot be in the past' });
   }

   if (start.isSameOrAfter(end)) {
     return res.status(400).json({ message: 'startDate must be before endDate' });
   }

  try {
    // Fetch the discount by ID
    const discount = await Discount.findById(id);

    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    // Check if the associated admin is active
    const admin = await Admin.findById(discount.adminId);

    if (!admin || !admin.isActive) {
      return res.status(403).json({ message: 'Admin is inactive' });
    }

    // Check if the discount itself is active
    if (!discount.isActive) {
      return res.status(410).json({ message: 'This discount is soft deleted' });
    }

    // Fetch and update products that use the discount
    const products = await Product.find({ discountId: id });
    if (!Array.isArray(products)) {
      return res.status(500).json({ message: 'Failed to fetch products' });
    }

    const updateProductPromises = products.map(async (product) => {
      if (product.discountId?.toString() === id) {
        if(discount.type === "sellerDiscounted"){
        const discountAmount = product.sellerDiscounted* (adminDiscount ?? discount.adminDiscount) / 100;
        product.adminDiscountApplied = adminDiscount ?? discount.adminDiscount;
        product.adminDiscountedPrice = product.sellerDiscounted - discountAmount;
        }

        if(discount.type === "MRP"){
          const discountAmount = product.MRP* (adminDiscount ?? discount.adminDiscount) / 100;
        product.adminDiscountApplied = adminDiscount ?? discount.adminDiscount;
        product.adminDiscountedPrice = product.MRP - discountAmount;
        }
    
        await product.save();
      }
    });

    await Promise.all(updateProductPromises);

    // Fetch and update bundles that use the discount
    const bundles = await Bundle.find({ discountId: id });
    if (!Array.isArray(bundles)) {
      return res.status(500).json({ message: 'Failed to fetch bundles' });
    }

    await Promise.all(bundles.map(async (bundle) => {
      if (bundle.discountId?.toString() === id) {
        bundle.products = bundle.products?.map((bundleProduct) => {
          if (bundleProduct.discountId?.toString() === id) {
            if(discount.type === "sellerDiscounted"){
              const discountAmount = bundle.sellerDiscounted* (adminDiscount ?? discount.adminDiscount) / 100;
              bundle.adminDiscountApplied = adminDiscount ?? discount.adminDiscount;
              bundle.adminDiscountedPrice = bundle.sellerDiscounted - discountAmount;
              }
              
          }
          if(discount.type === "MRP"){
            const discountAmount = bundle.MRP* (adminDiscount ?? discount.adminDiscount) / 100;
            bundle.adminDiscountApplied = adminDiscount ?? discount.adminDiscount;
            bundle.adminDiscountedPrice = bundle.MRP - discountAmount;
          }
      
          return bundleProduct;
        });

        await bundle.save();
      }
    }));

    // await Promise.all(updateBundlePromises);

    // Update the discount
    const updatedDiscount = await Discount.findByIdAndUpdate(
      id,
      {
        adminId: adminId || discount.adminId,
        adminDiscount: adminDiscount !== undefined ? adminDiscount : discount.adminDiscount,
        description: description || discount.description,
        startDate: start.utc().toDate(), // Save in UTC format
        endDate: end.utc().toDate(),
        isActive: isActive !== undefined ? isActive : discount.isActive,
      },
      { new: true } // Return the updated document
    );

    res.status(200).json({ discount: updatedDiscount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update discount', error });
  }
};

export const softDeleteDiscountController = async (req: Request, res: Response) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid discount ID' });
  }

  try {
    // Fetch the discount by ID
    const discount = await Discount.findById(id);

    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    // Check if the associated admin is active
    const admin = await Admin.findById(discount.adminId);

    if (!admin || !admin.isActive) {
      return res.status(403).json({ message: 'Admin is inactive' });
    }

    // Check if the discount is already soft deleted
    if (!discount.isActive) {
      return res.status(410).json({ message: 'This discount is already soft deleted' });
    }

    // Soft delete the discount
    const updatedDiscount = await Discount.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true } // Return the updated document
    );

    // Fetch and update products that use the discount
    const products = await Product.find();
    if (!Array.isArray(products)) {
      return res.status(500).json({ message: 'Failed to fetch products' });
    }

    const updateProductPromises = products.map(async (product) => {
      if (product.discountId && product.discountId.toString() === id) {
        // Remove the discount-related fields
        product.discountId = undefined as unknown as typeof product.discountId;
        product.adminDiscountApplied = undefined;
        product.adminDiscountedPrice = undefined;
        

        await product.save();
      }
    });
    await Promise.all(updateProductPromises);

    

    // Fetch and update bundles that use the discount
    const bundles = await Bundle.find();
    if (!Array.isArray(bundles)) {
      return res.status(500).json({ message: 'Failed to fetch bundles' });
    }

    const updateBundlePromises = bundles.map(async (bundle) => {
      const productsInBundle = bundle.products || [];
      const updatedProducts = productsInBundle.map((product) => {
        if (bundle.discountId && bundle.discountId.toString() === id) {
          // Remove the discount-related fields
          bundle.discountId = undefined as unknown as typeof bundle.discountId;
          bundle.adminDiscountApplied = undefined;
          bundle.adminDiscountedPrice = undefined;
          bundle.adminDiscount = undefined;
          
        }
      });
      // bundle.products = updatedProducts;
      await bundle.save();
    });

    await Promise.all(updateBundlePromises);
    

    res.status(200).json({ message: 'Discount soft deleted successfully', discount: updatedDiscount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to soft delete discount', error });
  }
};


export const applyDiscountToProducts = async (req: Request, res: Response) => {
  try {
    const { discountId, productIds } = req.body;

    // Validate discount ID
    if (!isValidObjectId(discountId)) {
      return res.status(400).json({ error: 'Invalid discount ID.' });
    }

    // Validate that productIds is an array of valid ObjectId strings
    if (!Array.isArray(productIds) || productIds.some(id => !isValidObjectId(id))) {
      return res.status(400).json({ error: 'Invalid product IDs.' });
    }

    // Remove duplicate IDs
    const uniqueProductIds = [...new Set(productIds)];

    // Fetch the discount by ID
    const discount = await Discount.findById(discountId);

    if (!discount) {
      return res.status(404).json({ error: 'Discount not found.' });
    }

    // Ensure products is initialized
    discount.products = discount.products || [];

    // Check if the discount is active
    if (discount.isAppliedDiscount) {
      return res.status(400).json({ error: 'This discount has already been activated and cannot add more products.' });
    }

    // const currentDate = moment().startOf('seconds');
    // if (currentDate.isBefore(discount.startDate) || currentDate.isAfter(discount.endDate)) {
    //   return res.status(400).json({ error: 'Discount is expired or not yet active.' });
    // }

    // Filter out product IDs that are already associated with this discount
    const newProductIds = uniqueProductIds.filter(
      id => !discount.products?.some(pId => pId.toString() === id)
    );

    if (newProductIds.length === 0) {
      return res.status(400).json({ error: 'All provided products already have this discount.' });
    }

    // Find products that are active and not blocked or deleted
    const products = await Product.find({
      _id: { $in: newProductIds },
      isBlocked: false,
      isActive: true,
    });

    if (products.length !== newProductIds.length) {
      return res.status(404).json({ error: 'Some products were not found or are not available.' });
    }

    // Update the discount with new product IDs
    discount.products = [...discount.products, ...newProductIds];
    await discount.save();

    return res.status(200).json({ success: true, data: discount });

  } catch (error) {
    // Type guard to handle error as an instance of Error
    if (error instanceof Error) {
      console.error('Error applying discount to products:', error);
      return res.status(500).json({ error: 'Failed to apply discount to products.', details: error.message });
    }

    // Handle unexpected error types
    console.error('Error applying discount to products:', error);
    return res.status(500).json({ error: 'Failed to apply discount to products.', details: 'An unexpected error occurred.' });
  }
};



export const saveDiscountToBundles = async (req: Request, res: Response) => {
  try {
    const { discountId, bundleIds } = req.body;

    // Validate discount ID
    if (!isValidObjectId(discountId)) {
      return res.status(400).json({ error: 'Invalid discount ID.' });
    }

    // Validate that bundleIds is an array of valid ObjectId strings
    if (!Array.isArray(bundleIds) || bundleIds.some(id => !isValidObjectId(id))) {
      return res.status(400).json({ error: 'Invalid bundle IDs.' });
    }

    // Fetch the discount by ID
    const discount = await Discount.findById(discountId);

    if (!discount) {
      return res.status(404).json({ error: 'Discount not found.' });
    }

    // Ensure bundles is initialized
    discount.bundles = discount.bundles || [];

    // Check if the discount is already applied
    if (discount.isAppliedDiscount) {
      return res.status(400).json({ error: 'This discount is already applied, cannot add more bundles.' });
    }

    const currentDate = moment().startOf('seconds');
    if (currentDate.isBefore(discount.startDate) || currentDate.isAfter(discount.endDate)) {
      return res.status(400).json({ error: 'Discount is expired or not yet active.' });
    }

    const uniqueBundleIds = _.uniq(bundleIds);

    // Filter out bundle IDs that are already associated with this discount
    const newBundleIds = uniqueBundleIds.filter(id => !discount.bundles.some(bId => bId.toString() === id));

    if (newBundleIds.length === 0) {
      return res.status(400).json({ error: 'All provided bundles already have this discount.' });
    }

    const bundles = await Bundle.find({
      _id: { $in: newBundleIds },
      isActive: true,
      isBlocked: false,
    });

    if (bundles.length !== newBundleIds.length) {
      return res.status(404).json({ error: 'Some bundles not found or are not available.' });
    }

    // Save new bundles to the discount and mark the discount as applied
    discount.bundles = [...discount.bundles, ...newBundleIds];
    discount.isAppliedDiscount = false; // Set this field to true
    await discount.save();

    return res.status(200).json({ success: true, data: discount });

  } catch (error) {
    console.error(error);

    // Type guard to handle error as an instance of Error
    if (error instanceof Error) {
      return res.status(500).json({ error: 'Failed to save discount to bundles.', details: error.message });
    }

    // Handle unexpected error types
    return res.status(500).json({ error: 'Failed to save discount to bundles.', details: 'An unexpected error occurred.' });
  }
};




export const removeDiscountFromProduct = async (req: Request, res: Response) => {
  const { discountId, productId } = req.query;

  if (!discountId || !productId) {
    return res.status(400).json({ message: 'discountId and productId are required' });
  }

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.discountId.toString() !== discountId.toString()) {
      return res.status(400).json({ message: 'Discount ID does not match the product discount' });
    }

    // Remove the discount ID from the product
    product.discountId = undefined as unknown as typeof product.discountId;
    product.adminDiscountApplied = undefined;
    product.adminDiscountedPrice = undefined;

    await product.save();

    res.status(200).json({ message: 'Discount removed successfully', product });
  } catch (error) {
    console.error('Error removing discount:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


