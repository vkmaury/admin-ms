// src/routes/productCategoryRoutes.ts

import { Router } from 'express';
import {
  createProductCategory,
  getAllProductCategories,
  getProductCategoryById,
  updateProductCategory ,
  deleteProductCategory
} from '../controllers/productCategoryController'; // Adjust the import path as necessary
import { authenticateToken } from '../middlewares/authMiddleware'; 

const router = Router();

// Create a new product category
router.post('/categories',authenticateToken, createProductCategory);

// Get all product categories
router.get('/getAllCategories',authenticateToken, getAllProductCategories);

// Get a product category by ID
router.get('/getCategorie',authenticateToken, getProductCategoryById);

// Update a product category by ID
router.put('/updateCategory',authenticateToken, updateProductCategory );

// Delete a product category by ID
router.delete('/deleteCategory',authenticateToken, deleteProductCategory);

export default router;
