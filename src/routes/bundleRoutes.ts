// routes/discountRoutes.ts
import { Router } from 'express';
import {
    createBundle,
    getBundle,
    getAllBundles,
    updateBundle,
    softDeleteBundle,
    blockBundle,
    unblockBundle ,
    removeDiscountFromBundle
} from '../controllers/bundleController';

import { authenticateToken } from '../middlewares/authMiddleware'; 


const router = Router();

router.post('/createBundle',authenticateToken, createBundle);
router.get('/getBundle',authenticateToken, getBundle);
router.get('/getAllBundle',authenticateToken,  getAllBundles);
router.put('/updateBundle',authenticateToken,  updateBundle);
router.delete('/deleteBundle',authenticateToken,  softDeleteBundle);
router.patch('/blockBundle',authenticateToken,  blockBundle);
router.patch('/unblockBundle',authenticateToken,  unblockBundle );
router.delete('/removeDiscountFromBundle',authenticateToken,  removeDiscountFromBundle );




export default router;
