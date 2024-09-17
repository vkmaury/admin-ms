// routes/discountRoutes.ts
import { Router } from 'express';
import {hideReview} from '../controllers/hideReviewController';

import { authenticateToken } from '../middlewares/authMiddleware'; 


const router = Router();

router.patch('/hideReview',authenticateToken, hideReview);

export default router;
