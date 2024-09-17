import { Request, Response } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import Seller from '../models/sellerModel'; // Assuming you have a Seller model
import User from '../models/User'
import { sendSaleNotification } from '../core/sendSaleNotification';
import { Types } from 'mongoose';
import Sale from '../models/saleSchema';
import Product from '../models/productSchema';
import Admin from '../models/adminSchema'; // Import the admin 
import Category from '../models/productCategorySchema';
import  Bundle  from '../models/bundleSchema';
import { isValidObjectId } from 'mongoose'
// import moment from 'moment'
import { getAdminIdFromRequest } from '../utils/auth'; // Adjust according to your authentication setup

import moment from 'moment-timezone';
// import ProductCategory from '../models/productCategorySchema';

export const createSaleController = async (req: Request, res: Response) => {
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

    const { name, description, startDate, endDate, categories, saleDiscountApplied } = req.body;

    // Validate required fields
    if (!name || !startDate || !endDate || !categories) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate saleDiscountApplied is between 0 and 100
    if (saleDiscountApplied < 0 || saleDiscountApplied > 100) {
      return res.status(400).json({ message: 'saleDiscountApplied must be a number between 0 and 100' });
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

    // Check if all provided categories are active and fetch their names
    const activeCategoryIds = [];
    const categoryNames = []; // Array to hold category names

    for (const category of categories) {
      const categoryData = await Category.findById(category.categoryId);
      if (!categoryData || !categoryData.isActive) {
        return res.status(400).json({ message: `Category with ID ${category.categoryId} is not active or does not exist` });
      }
      activeCategoryIds.push(category.categoryId);
      categoryNames.push(categoryData.category); // Store the category name
    }

    // Create the sale
    const newSale = new Sale({
      name,
      description,
      startDate: start.utc().toDate(), // Save in UTC format
      endDate: end.utc().toDate(), // Save in UTC format
      categories: activeCategoryIds, // Only include active categories
      saleDiscountApplied,
      isActive: true,
      createdBy: adminId,
      isAppliedSale: false,
    });

    const savedSale = await newSale.save();

    // Fetch all active sellers
    const activeSellers = await User.find({ role: 'seller', isActive: true }).exec();

    if (activeSellers.length > 0) {
      // Send notifications to all active sellers, including category names
      await sendSaleNotification(activeSellers, {
        name,
        description,
        saleDiscountApplied,
        startDate: start,
        endDate: end,
        categoryNames, // Pass the category names to the notification function
      });
    }

    res.status(201).json({ message: 'Sale created successfully and email sent to all active sellers', sale: savedSale });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating sale:', error.message);
      res.status(500).json({ message: 'Failed to create sale', error: error.message });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ message: 'Failed to create sale due to an unexpected error' });
    }
  }
};




export const addProductToSale = async (req: Request, res: Response) => {
  try {
    const { saleId } = req.query;
    const { productIds } = req.body;

    // Validate saleId
    if (!saleId || !isValidObjectId(saleId)) {
      return res.status(400).json({ error: 'Invalid sale ID.' });
    }

    // Validate productIds
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Product IDs are required.' });
    }

    const errors: string[] = [];

    // Validate each productId
    for (const productId of productIds) {
      if (!isValidObjectId(productId)) {
        errors.push(`Invalid product ID: ${productId}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors });
    }

    // Find the sale details
    const sale: any = await Sale.findOne({ _id: saleId, isActive: true });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found or is deleted.' });
    }

    // Validate sale dates
    const endDate = moment(sale.endDate);
    const now = moment().startOf('seconds');
    if (endDate.isBefore(now)) {
      return res.status(400).json({ error: 'Sale is expired or ended.' });
    }

    // Ensure sale.products is an array
    sale.affectedProducts = sale.affectedProducts || [];

    // Check if any of the productIds already exist in the sale's affectedProducts
    const alreadyAffectedProducts = productIds.filter((productId: string) =>
      sale.affectedProducts.some(
        (affectedProduct: { productId: string }) => affectedProduct.productId.toString() === productId.toString()
      )
    );

    if (alreadyAffectedProducts.length > 0) {
      return res.status(400).json({
        error: `The following products are already part of the sale: ${alreadyAffectedProducts.join(', ')}`,
      });
    }

    // Find the products and ensure they match the sale's category
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
      isBlocked: false,
    }).lean(); // use `lean()` to return plain objects instead of Mongoose documents

    if (products.length === 0) {
      return res.status(404).json({
        error: 'No products found with the given IDs.',
      });
    }

    const updatedProducts = await Promise.all(
      products.map(async (product: any) => { // Explicitly typing `product` as `any`
        // Check if the product category matches any of the sale categories
        const isCategoryMatch = sale.categories.some(
          (categoryId: string) => product.categoryId.toString() === categoryId.toString()
        );

        if (!isCategoryMatch) {
          errors.push(`Product ${product.name} does not match the sale's category`);
          return null;
        }

        let discountedPrice = product.finalePrice;

        // Apply the discount if the sale has one
        if (
          sale.isAppliedDiscount &&
          typeof product.MRP === 'number' &&
          product.MRP > 0 &&
          typeof sale.saleDiscount === 'number'
        ) {
          discountedPrice = product.MRP - (product.MRP * sale.saleDiscount) / 100;

          if (isNaN(discountedPrice) || discountedPrice < 0) {
            errors.push(`Invalid price calculation for product ${product.name}`);
            return null;
          }

          product.finalePrice = discountedPrice;
          product.saleApplied = true;
          await Product.updateOne({ _id: product._id }, { finalePrice: discountedPrice, saleApplied: true });
        }

        // Add the product to the sale's affectedProducts array
        sale.affectedProducts.push({
          productId: product._id,
          productName: product.name,
          productMRP: product.MRP,
        });

        return product;
      })
    );

    // Remove any null products from the array
    const validProducts = updatedProducts.filter((product) => product !== null);

    if (validProducts.length === 0) {
      return res.status(400).json({ error: errors.length > 0 ? errors : 'No valid products to add to the sale.' });
    }

    // Save the sale with the updated products
    await sale.save();

    return res.status(200).json({
      success: true,
      errors: errors.length > 0 ? errors : undefined,
      sale: sale,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: (error as Error).message });
  }
};


export const removeProductFromSale = async (req: Request, res: Response) => {
  try {
      const saleId = req.query.saleId as string;
      const productId = req.query.productId as string;

      if (!saleId || !productId) {
          return res.status(400).json({ message: 'saleId and productId are required' });
      }

      // Fetch the sale from the database using the saleId
      const sale = await Sale.findById(saleId);

      if (!sale) {
          return res.status(404).json({ message: 'Sale not found' });
      }

      if (!sale.isActive) {
        return res.status(404).json({ message: 'Sale is not Active' });
    }

      // Check if the product is part of the sale
      const productIndex = sale.affectedProducts.findIndex(
          (product: any) => product.productId.toString() === productId
      );

      if (productIndex === -1) {
          return res.status(404).json({ message: 'Product not found in this sale' });
      }

      // Remove the product from the sale
      sale.affectedProducts.splice(productIndex, 1);

      // Save the updated sale
      await sale.save();

      res.status(200).json({ message: 'Product removed from sale successfully', sale });
  } catch (error) {
      if (error instanceof Error) {
          res.status(500).json({ message: 'An error occurred', error: error.message });
      } else {
          res.status(500).json({ message: 'An unknown error occurred' });
      }
  }
};

export const softDeleteSale = async (req: Request, res: Response) => {
  try {
      const saleId = req.query.saleId as string;

      if (!saleId) {
          return res.status(400).json({ message: 'saleId is required' });
      }

      // Find the sale by its ID
      const sale = await Sale.findById(saleId);

      if (!sale) {
          return res.status(404).json({ message: 'Sale not found' });
      }

      if(!sale.isActive){
        return res.status(404).json({ message: 'Sale is already soft deleted' });
      }

      // Set the isDeleted flag to true for soft deletion
      sale.isActive= false;

      // Save the updated sale
      await sale.save();

      res.status(200).json({ message: 'Sale soft deleted successfully', sale });
  } catch (error) {
      if (error instanceof Error) {
          res.status(500).json({ message: 'An error occurred', error: error.message });
      } else {
          res.status(500).json({ message: 'An unknown error occurred' });
      }
  }
};

export const removeCategoryFromSaleController = async (req: Request, res: Response) => {
  try {
    const { saleId, categoryId } = req.query;

    if (typeof saleId !== 'string' || typeof categoryId !== 'string') {
      return res.status(400).json({ error: 'Invalid saleId or categoryId' });
    }

    // Find the sale by ID
    const sale = await Sale.findById(saleId).exec();
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    if (!sale.isActive) {
      return res.status(404).json({ message: 'Sale is not active' });
    }

    // Check if the category is part of the sale
    const categoryIndex = sale.categories.findIndex(cat => cat.toString() === categoryId);
    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found in this sale' });
    }

    // Remove the category from the sale
    sale.categories.splice(categoryIndex, 1);

    // Find all products associated with the removed category and sale
    const products = await Product.find({ categoryId, saleId }).exec();

    // Update each product
    for (const product of products) {
      // Remove the sale application from each product
      product.saleId = undefined;
      product.saleApplied = undefined;
      product.saleDiscountApplied = undefined;
      product.finalePrice = undefined; // Corrected field name to 'finalPrice'

      // Save each product individually
      await product.save();
    }

    // Remove affected products from the sale
    sale.affectedProducts = sale.affectedProducts.filter(
      (product: any) => !products.some(p => p.id.toString() === product.productId.toString())
    );

    // Save the updated sale
    await sale.save();

    res.status(200).json({
      message: 'Category and associated products removed from sale successfully',
      saleId: sale._id,
      remainingCategories: sale.categories,
      removedProductsCount: products.length,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error removing category from sale:', error.message);
      res.status(500).json({ message: 'Failed to remove category from sale', error: error.message });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ message: 'Failed to remove category from sale due to an unexpected error' });
    }
  }
};

export const getSaleByIdController = async (req: Request, res: Response) => {
  try {
    const { saleId } = req.query;

    if (typeof saleId !== 'string') {
      return res.status(400).json({ error: 'Invalid saleId' });
    }

    // Find the sale by ID
    const sale = await Sale.findById(saleId).exec();
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    if (!sale.isActive) {
      return res.status(403).json({ message: 'Sale is not active' });
    }

    res.status(200).json({
      message: 'Sale retrieved successfully',
      sale,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error retrieving sale:', error.message);
      res.status(500).json({ message: 'Failed to retrieve sale', error: error.message });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ message: 'Failed to retrieve sale due to an unexpected error' });
    }
  }
};



export const getAllActiveSalesController = async (req: Request, res: Response) => {
  try {
    // Extract query parameters for pagination, search, and sorting
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    
    // Ensure page and limit are positive numbers
    if (page <= 0 || limit <= 0) {
      return res.status(400).json({ error: 'Page and limit must be positive numbers' });
    }

    // Build query object
    const query: any = { isActive: true };
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    // Find all active sales with search, sort, and pagination
    const activeSales = await Sale.find(query)
      .sort({ name: 1 }) // Sort by name in ascending order
      .skip((page - 1) * limit) // Pagination: skip records
      .limit(limit) // Pagination: limit records
      .exec();

    // Get the total count of matching sales for pagination
    const totalSales = await Sale.countDocuments(query).exec();

    res.status(200).json({
      message: 'Active sales retrieved successfully',
      activeSales,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalSales / limit),
        totalSales,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error retrieving active sales:', error.message);
      res.status(500).json({ message: 'Failed to retrieve active sales', error: error.message });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ message: 'Failed to retrieve active sales due to an unexpected error' });
    }
  }
};

export const updateSaleController = async (req: Request, res: Response) => {
  try {
    const adminId = getAdminIdFromRequest(req);
    if (!adminId) {
      return res.status(401).json({ error: 'Admin not authenticated' });
    }

    const admin = await Admin.findById(new mongoose.Types.ObjectId(adminId)).exec();
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ error: 'Admin is not active' });
    }

    const saleId = req.query.saleId as string;
    if (!saleId) {
      return res.status(400).json({ message: 'Sale ID must be provided in query parameters' });
    }

    const { name, description, startDate, endDate, saleDiscountApplied } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Name, startDate, and endDate are required fields' });
    }

    if (saleDiscountApplied !== undefined && (saleDiscountApplied < 0 || saleDiscountApplied > 100)) {
      return res.status(400).json({ message: 'saleDiscountApplied must be a number between 0 and 100' });
    }

    // Parse and validate dates in Asia/Kolkata timezone
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

    const sale = await Sale.findById(new mongoose.Types.ObjectId(saleId)).exec();
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Update sale details if sale is not applied
    if (!sale.isAppliedSale) {
      sale.name = name;
      sale.description = description;
      sale.startDate = start.utc().toDate();
      sale.endDate = end.utc().toDate();
      sale.saleDiscountApplied = saleDiscountApplied;
    }

    // Update sale details and affected products if sale is applied
    if (saleDiscountApplied !== undefined && sale.isAppliedSale) {
      sale.name = name;
      sale.description = description;
      sale.startDate = start.utc().toDate();
      sale.endDate = end.utc().toDate();
      sale.saleDiscountApplied = saleDiscountApplied;

      const affectedProducts = await Product.find({ saleId: sale._id }).exec();
      const updatedAffectedProducts = affectedProducts.map(product => {
        const originalPrice = product.MRP;
        const discountAmount = (saleDiscountApplied / 100) * originalPrice;
        const finalPrice = originalPrice - discountAmount;

        return {
          productId: product._id,
          categoryId: product.categoryId,
          productName: product.name,
          finalPrice: finalPrice,
          isUnavailable: product.isUnavailable,
          saleDiscountApplied: saleDiscountApplied,
        };
      });

      sale.affectedProducts = updatedAffectedProducts as any;

      await Promise.all(affectedProducts.map(async product => {
        const discountAmount = (saleDiscountApplied / 100) * product.MRP;
        product.finalePrice = product.MRP - discountAmount;
        product.saleDiscountApplied = saleDiscountApplied;
        await product.save();
      }));
    }

    const updatedSale = await sale.save();

    res.status(200).json({ message: 'Sale updated successfully', sale: updatedSale });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error updating sale:', error.message);
      res.status(500).json({ message: 'Failed to update sale', error: error.message });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ message: 'Failed to update sale due to an unexpected error' });
    }
  }
};


export const applySaleToBundleController = async (req: Request, res: Response) => {
  try {
    const adminId = getAdminIdFromRequest(req);
    if (!adminId) {
      return res.status(401).json({ error: 'Admin not authenticated' });
    }

    const admin = await Admin.findById(adminId).exec();
    if (!admin || !admin.isActive) {
      return res.status(403).json({ error: 'Admin not authorized or not active' });
    }

    const { saleId, bundleIds } = req.body;

    // Validate required fields
    if (!saleId || !bundleIds || !Array.isArray(bundleIds)) {
      return res.status(400).json({ message: 'Sale ID and Bundle IDs must be provided' });
    }

    // Validate saleId format
    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      return res.status(400).json({ message: 'Invalid Sale ID format' });
    }

    // Validate bundleIds format
    if (!bundleIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: 'Invalid Bundle IDs format' });
    }

    // Find the sale by ID
    const sale = await Sale.findById(saleId).exec();
    if (!sale || !sale.isActive) {
      return res.status(404).json({ message: 'Sale not found or not active' });
    }

    const updatedBundles: any[] = [];
    const failedBundles: any[] = [];

    for (const bundleId of bundleIds) {
      // Find the bundle by ID
      const bundle = await Bundle.findById(bundleId).exec();
      if (!bundle || !bundle.isActive || bundle.isBlocked) {
        failedBundles.push({
          bundleId: bundleId,
          bundleName: bundle ? bundle.name : 'Unknown',
          message: 'Bundle is either inactive, blocked, or not found',
        });
        continue;
      }

      const products = await Product.find({ _id: { $in: bundle.products } }).exec();

      // Check if at least one product in the bundle is on sale and has the same categoryId as the sale
      const productsOnSale = products.filter(product =>
        product.saleApplied &&
        product.saleId &&
        product.saleId.equals(saleId) &&
        product.categoryId.toString() === sale.categories.toString()
      );

      if (productsOnSale.length > 0) {
        // Calculate the final price for the bundle
        const mrp = bundle.MRP || 0;
        const discount = sale.saleDiscountApplied || 0;
        const totalDiscount = mrp * (discount / 100);
        const finalPrice = mrp - totalDiscount;

        // Ensure finalPrice is a valid number
        if (isNaN(finalPrice) || finalPrice < 0) {
          failedBundles.push({
            bundleId: bundle._id as mongoose.Types.ObjectId,
            bundleName: bundle.name,
            message: 'Invalid final price calculation',
          });
          continue;
        }

        // Update bundle with sale details
        bundle.saleApplied = true;
        bundle.saleId = saleId;
        bundle.saleDiscountApplied = discount;
        bundle.finalPrice = finalPrice;

        await bundle.save();

        updatedBundles.push({
          bundleId: bundle._id as mongoose.Types.ObjectId,
          bundleName: bundle.name,
          finalPrice: bundle.finalPrice,
          isUnavailable: false,
        });
      } else {
        failedBundles.push({
          bundleId: bundle._id as mongoose.Types.ObjectId,
          bundleName: bundle.name,
          message: 'No products in the bundle are on sale or category mismatch',
        });
      }
    }

    // Update the sale with the list of affected bundles
    sale.affectedBundles = updatedBundles.map(bundle => ({
      bundleId: bundle.bundleId,
      bundleName: bundle.bundleName,
      finalPrice: bundle.finalPrice,
      isUnavailable: bundle.isUnavailable,
    }));
    await sale.save();

    res.status(200).json({
      message: 'Sale applied to bundles successfully',
      saleDetails: {
        saleId: sale._id,
        saleName: sale.name,
        startDate: sale.startDate,
        endDate: sale.endDate,
      },
      affectedBundlesCount: updatedBundles.length,
      affectedBundles: updatedBundles,
      failedBundles,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error applying sale to bundles:', error.message);
      res.status(500).json({ message: 'Failed to apply sale to bundles', error: error.message });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ message: 'Failed to apply sale to bundles due to an unexpected error' });
    }
  }
};





