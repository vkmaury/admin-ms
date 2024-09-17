// routes/discountRoutes.ts
import { Router } from 'express';
import {
  createDiscountController,
  getAllDiscountsController,
  getDiscountByIdController,
  updateDiscountByIdController,
  softDeleteDiscountController,
  applyDiscountToProducts ,
  saveDiscountToBundles ,
  removeDiscountFromProduct
  
} from '../controllers/discountController';

import { authenticateToken } from '../middlewares/authMiddleware'; 


const router = Router();

router.post('/createDiscounts',authenticateToken, createDiscountController);
router.get('/getAllDiscount',authenticateToken, getAllDiscountsController );
router.get('/getDiscount',authenticateToken,  getDiscountByIdController );
router.put('/updateDiscount',authenticateToken, updateDiscountByIdController);
router.delete('/deleteDiscount',authenticateToken, softDeleteDiscountController);
router.post('/applyDiscountOnProduct',authenticateToken, applyDiscountToProducts );
router.post('/applyDiscountOnBundle',authenticateToken, saveDiscountToBundles );
router.delete('/removeDiscountOnProduct',authenticateToken, removeDiscountFromProduct);



export default router;
