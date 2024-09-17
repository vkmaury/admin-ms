// routes/discountRoutes.ts
import { Router } from 'express';
import {
    createSaleController,
    addProductToSale ,
    removeProductFromSale,
    softDeleteSale,
    removeCategoryFromSaleController,
    getSaleByIdController,
    getAllActiveSalesController,
    updateSaleController,
    applySaleToBundleController 
} from '../controllers/saleController';

import { authenticateToken } from '../middlewares/authMiddleware'; 


const router = Router();

router.post('/createSale',authenticateToken, createSaleController);
router.post('/applySaleToProducts',authenticateToken, addProductToSale );
router.delete('/removeProductFromSale',authenticateToken, removeProductFromSale);
router.put('/softDeleteSale',authenticateToken, softDeleteSale);
router.delete('/removeCategoryFromSale',authenticateToken, removeCategoryFromSaleController);
router.get('/getSale',authenticateToken, getSaleByIdController);
router.get('/getAllSale',authenticateToken, getAllActiveSalesController);
router.put('/updateSale',authenticateToken, updateSaleController);
router.post('/applySaleToBundle',authenticateToken, applySaleToBundleController );






export default router;
