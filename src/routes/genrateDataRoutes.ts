// routes/discountRoutes.ts
import { Router } from 'express';
import {generateProductData} from '../controllers/genrateProductData';
import {generateUserData} from '../controllers/genrateUserData';

import { authenticateToken } from '../middlewares/authMiddleware'; 


const router = Router();

router.post('/productData',authenticateToken, generateProductData);

router.post('/userData',authenticateToken, generateUserData);




export default router;
