import { Request, Response } from 'express';
import Discount from '../models/discountModel';
import Admin from '../models/adminSchema'; // Import the Admin model
import Product from '../models/productSchema'; // Adjust the path as needed
import Bundle from '../models/bundleSchema';
import cron from 'node-cron';



export const createDiscountController = async (req: Request, res: Response) => {
  const { adminId, adminDiscount, description, startDate, endDate } = req.body;

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
      adminDiscount,
      description,
      startDate,
      endDate,
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

    // Update the discount
    const updatedDiscount = await Discount.findByIdAndUpdate(
      id,
      {
        adminId: adminId || discount.adminId,
        adminDiscount: adminDiscount !== undefined ? adminDiscount : discount.adminDiscount,
        description: description || discount.description,
        startDate: startDate || discount.startDate,
        endDate: endDate || discount.endDate,
        isActive: isActive !== undefined ? isActive : discount.isActive
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



export const applyDiscountToEntitiesController = async (req: Request, res: Response) => {
  const { productIds, bundleIds, discountId } = req.body;

  // Validate input
  if (!discountId || typeof discountId !== 'string') {
    return res.status(400).json({ message: 'Invalid discount ID' });
  }

  if ((!productIds || !Array.isArray(productIds)) && (!bundleIds || !Array.isArray(bundleIds))) {
    return res.status(400).json({ message: 'At least one product ID or bundle ID is required' });
  }

  try {
    // Fetch the discount by ID
    const discount = await Discount.findById(discountId);

    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    // Check if the discount is active
    if (!discount.isActive) {
      return res.status(403).json({ message: 'Discount is inactive' });
    }

    // Fetch the admin associated with the discount
    const admin = await Admin.findById(discount.adminId);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check if the admin is active
    if (!admin.isActive) {
      return res.status(403).json({ message: 'Admin is inactive' });
    }
cron.schedule('* * * * *', async () => { 
    const currentDate = new Date();
    console.log(currentDate);
    let response: any = {};

    // Determine if the discount is within its active period
    // const isDiscountActive = discount.startDate <= currentDate && currentDate <= discount.endDate;

    // Handle applying or removing discount
    if (discount.startDate <= currentDate && currentDate <= discount.endDate) {
      // Apply discount to products
      if (productIds && productIds.length > 0) {
        const products = await Product.find({ _id: { $in: productIds } });
        const foundProductIds = products.map(product => product.id.toString());
        const missingProductIds = productIds.filter((id: any) => !foundProductIds.includes(id));

        if (missingProductIds.length > 0) {
          return res.status(404).json({ message: 'These IDs not found in Product', missingProductIds });
        }

        const updatedProducts = [];

        for (const product of products) {
          if (!product.isActive) {
            continue; // Skip inactive products
          }

          const discountAmount = (product.sellerDiscountApplied ? product.sellerDiscounted : product.MRP) * discount.adminDiscount / 100;
          const adminDiscountedPrice = (product.sellerDiscountApplied ? product.sellerDiscounted : product.MRP) - discountAmount;

          const updatedProduct = await Product.findByIdAndUpdate(
            product._id,
            {
              discount: discountAmount,
              adminDiscountApplied: discount.adminDiscount,
              adminDiscountedPrice: adminDiscountedPrice,
              discountId: discountId, // Store the discount ID
              updatedAt: new Date() // Update the timestamp
            },
            { new: true } // Return the updated document
          );

          updatedProducts.push(updatedProduct);
        }

        response.products = updatedProducts;
      }

      // Apply discount to bundles
      if (bundleIds && bundleIds.length > 0) {
        const bundles = await Bundle.find({ _id: { $in: bundleIds } });
        const foundBundleIds = bundles.map(bundle => bundle.id.toString());
        const missingBundleIds = bundleIds.filter((id: any) => !foundBundleIds.includes(id));

        if (missingBundleIds.length > 0) {
          return res.status(404).json({ message: 'These IDs not found in Bundle', missingBundleIds });
        }

        const updatedBundles = [];

        for (const bundle of bundles) {
          if (!bundle.isActive) {
            continue; // Skip inactive bundles
          }

          const discountAmount = (bundle.finalPrice * discount.adminDiscount) / 100;
          const adminDiscountedPrice = bundle.finalPrice - discountAmount;

          const updatedBundle = await Bundle.findByIdAndUpdate(
            bundle._id,
            {
              discount: discountAmount,
              adminDiscountApplied: discount.adminDiscount,
              adminDiscountedPrice: adminDiscountedPrice,
              discountId: discountId, // Store the discount ID
              updatedAt: new Date() // Update the timestamp
            },
            { new: true } // Return the updated document
          );

          updatedBundles.push(updatedBundle);
        }

        response.bundles = updatedBundles;
      }
      console.log(response.message);
      response.message = 'Discount applied successfully';

    } else if (currentDate > discount.endDate) {
  cron.schedule('* * * * *', async () => {    // Remove discount from products
      if (productIds && productIds.length > 0) {
        const products = await Product.find({ _id: { $in: productIds } });
        const foundProductIds = products.map(product => product.id.toString());
        const missingProductIds = productIds.filter((id: any) => !foundProductIds.includes(id));

        if (missingProductIds.length > 0) {
          return res.status(404).json({ message: 'These IDs not found in Product', missingProductIds });
        }

        const updatedProducts = [];

        for (const product of products) {
          if (!product.isActive) {
            continue; // Skip inactive products
          }

          if (product.discountId?.toString() !== discountId.toString()) {
            continue; // Skip if the discount ID does not match
          }

          product.discountId = undefined as unknown as typeof product.discountId;
          product.adminDiscountApplied = undefined;
          product.adminDiscountedPrice = undefined;

          await product.save();
          updatedProducts.push(product);
        }

        response.products = updatedProducts;
      }

      // Remove discount from bundles
      if (bundleIds && bundleIds.length > 0) {
        const bundles = await Bundle.find({ _id: { $in: bundleIds } });
        const foundBundleIds = bundles.map(bundle => bundle.id.toString());
        const missingBundleIds = bundleIds.filter((id: any) => !foundBundleIds.includes(id));

        if (missingBundleIds.length > 0) {
          return res.status(404).json({ message: 'These IDs not found in Bundle', missingBundleIds });
        }

        const updatedBundles = [];

        for (const bundle of bundles) {
          if (!bundle.isActive) {
            continue; // Skip inactive bundles
          }

          if (bundle.discountId?.toString() !== discountId.toString()) {
            continue; // Skip if the discount ID does not match
          }

          bundle.discountId = undefined as unknown as typeof bundle.discountId;
          bundle.adminDiscountApplied = undefined;
          bundle.adminDiscountedPrice = undefined;

          await bundle.save();
          updatedBundles.push(bundle);
        }

        response.bundles = updatedBundles;
      }
     console.log(response.message);
      response.message = 'Discount removed successfully';
    });
    }
  //  console.log(response);
    return res.status(200).json(response);
  
});
  } catch (error) {
    res.status(500).json({ message: 'Failed to apply or remove discount', error });
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
