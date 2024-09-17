// routes/discountRoutes.ts
import { Router } from 'express';
import {createCoupon,getCouponById,getAllCoupons,updateCoupon,deleteCoupon} from '../controllers/couponController';


import { authenticateToken } from '../middlewares/authMiddleware'; 


const router = Router();

router.post('/createCoupon',authenticateToken, createCoupon);
router.get('/getCouponById',authenticateToken, getCouponById);
router.get('/getAllCoupon',authenticateToken, getAllCoupons);
router.put('/updateCoupon',authenticateToken, updateCoupon);
router.delete('/deleteCoupon',authenticateToken, deleteCoupon);





export default router;
