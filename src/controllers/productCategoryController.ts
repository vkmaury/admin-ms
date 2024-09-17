import { Request, Response } from 'express';
import ProductCategory from '../models/productCategorySchema'; // Adjust the import path as necessary
import Product from '../models/productSchema';

// Create a new product category
export const createProductCategory = async (req: Request, res: Response) => {
  const { productId, name, category, description} = req.body;

  try {
    const newCategory = new ProductCategory({ productId, name, category, description, isActive : true });
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};

export const getAllProductCategories = async (req: Request, res: Response) => {
  try {
    // Extract query parameters with defaults
    const { search = '', sortBy = 'name', page = 1, limit = 10 } = req.query;

    // Convert pagination parameters to appropriate types
    const pageNumber = parseInt(page as string, 10) || 1; // Default to page 1 if conversion fails
    const pageSize = parseInt(limit as string, 10) || 10; // Default to 10 items per page if conversion fails

    // Build the query object for searching
    const query: any = {
      isActive: true,
      name: { $regex: search as string, $options: 'i' } // Example search by category name
    };

    // Ensure sortBy is a string and validate it
    const validSortFields: string[] = ['name', 'dateCreated', 'popularity']; // Adjust according to your schema
    const sortField = (typeof sortBy === 'string' && validSortFields.includes(sortBy)) ? sortBy : 'name';

    // Create sort object with a valid string key
    const sortObject: { [key: string]: 1 } = {
      [sortField]: 1 // Always sort in ascending order
    };

    // Fetch the total count of matching categories
    const totalCategories = await ProductCategory.countDocuments(query);

    // Fetch categories with pagination, sorting, and searching
    const categories = await ProductCategory.find(query)
      .sort(sortObject)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    return res.status(200).json({
      message: 'Categories retrieved successfully',
      totalCategorieData: totalCategories,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalCategories / pageSize),
      categories,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    } else {
      return res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};

export const getProductCategoryById = async (req: Request, res: Response) => {
  const { id } = req.query; // Extracting ID from query parameters

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    // Fetch the category by ID
    const category = await ProductCategory.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Product category not found' });
    }

    // Check if the category is active
    if (!category.isActive) {
      return res.status(403).json({ message: 'This category is soft deleted' });
    }

    // Return the active category
    res.status(200).json(category);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};

export const updateProductCategory = async (req: Request, res: Response) => {
  const { id } = req.query; // Extracting ID from route parameters
  const updateData = req.body;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    // Fetch the category by ID
    const category = await ProductCategory.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Product category not found' });
    }

    // Check if the category is active
    if (!category.isActive) {
      return res.status(403).json({ message: 'This category is soft deleted' });
    }

    // Update the category if it is active
    const updatedCategory = await ProductCategory.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Product category not found' });
    }

    res.status(200).json(updatedCategory);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};

export const deleteProductCategory = async (req: Request, res: Response) => {
  const { id } = req.query; // Extracting ID from route parameters

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    // Fetch the category by ID
    const category = await ProductCategory.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Product category not found' });
    }

    // Check if the category is already inactive (soft deleted)
    if (!category.isActive) {
      return res.status(400).json({ message: 'This category is already soft deleted' });
    }

    // Soft delete the category by setting isActive to false
    category.isActive = false;
   
       // Fetch and update products that use the discount
       const products = await Product.find();
       if (!Array.isArray(products)) {
         return res.status(500).json({ message: 'Failed to fetch products' });
       }
   
       const updateProductPromises = products.map(async (product) => {
         if (product.categoryId && product.categoryId.toString() === id) {
         
           product.categoryId = undefined as unknown as typeof product.categoryId;
         
           
   
           await product.save();
         }
       });
       await Promise.all(updateProductPromises);
       await category.save();
      

    res.status(200).json({ message: 'Product category soft deleted successfully' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};