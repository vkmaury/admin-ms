// routes/discountRoutes.ts
import { Router } from 'express';
import {getSalesReportController,
        getTotalUsersController, 
        getTotalSellersController,
        getTotalProductsController,
        getTotalSalesController,
        getTopSellingProductsController   
} from '../controllers/adminDasboard';

import { authenticateToken } from '../middlewares/authMiddleware'; 


const router = Router();

router.get('/salesReport',authenticateToken, getSalesReportController);
router.get('/totalUser',authenticateToken, getTotalUsersController);
router.get('/totalSeller',authenticateToken, getTotalSellersController);
router.get('/totalProduct',authenticateToken, getTotalProductsController);
router.get('/totalSales',authenticateToken, getTotalSalesController);
router.get('/getTopSelling',authenticateToken, getTopSellingProductsController );




export default router;
