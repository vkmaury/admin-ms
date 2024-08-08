// routes/discountRoutes.ts
import { Router } from 'express';
import {
  createDiscountController,
  getAllDiscountsController,
  getDiscountByIdController,
  updateDiscountByIdController,
  softDeleteDiscountController,
  applyDiscountToEntitiesController,
  removeDiscountFromProduct
  
} from '../controllers/discountController';

import { authenticateToken } from '../middlewares/authMiddleware'; 


const router = Router();

router.post('/createDiscounts',authenticateToken, createDiscountController);
router.get('/getAllDiscount',authenticateToken, getAllDiscountsController );
router.get('/getDiscount',authenticateToken,  getDiscountByIdController );
router.put('/updateDiscount',authenticateToken, updateDiscountByIdController);
router.delete('/deleteDiscount',authenticateToken, softDeleteDiscountController);
router.put('/applyDiscountOnProdcut',authenticateToken, applyDiscountToEntitiesController);
router.delete('/removeDiscountOnProduct',authenticateToken, removeDiscountFromProduct);



export default router;
