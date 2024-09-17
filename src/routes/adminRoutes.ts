import { Router } from 'express';
import { signupController, loginController } from '../controllers/authController';
import { getUserProfile } from '../controllers/getInfoController';
import { authenticateToken } from '../middlewares/authMiddleware'; 
import { getAllUsers } from '../controllers/getUserInfo';
import { getProductInfo } from '../controllers/getProductInfo';
import { getAllActiveProducts } from '../controllers/getAllProduct';
import { getAllSeller } from '../controllers/getSellerInfo';
import { blockSeller } from '../controllers/blockSellerController';
import { unblockSeller } from '../controllers/unblockSellerController';
import { blockProduct} from '../controllers/blockProductController';
import {unblockProduct} from '../controllers/unblockProductController';
import {getSellerLoginStats} from '../controllers/sellerLoginData';
import {getUserLoginStats} from '../controllers/userLoginData';
import {blockUser} from '../controllers/blockUserController';
import {unblockUser} from '../controllers/unblockUserController';


const router = Router();

router.post('/signup', signupController);
router.post('/login', loginController);
router.get('/get-info',authenticateToken, getUserProfile);
router.get('/get-user-info',authenticateToken,getAllUsers);
router.get('/get-product-info',authenticateToken,getProductInfo);
router.get('/get-all-product',authenticateToken,getAllActiveProducts);
router.get('/get-seller-info',authenticateToken,getAllSeller);
router.patch('/block-seller',authenticateToken,blockSeller);
router.patch('/unblock-seller',authenticateToken,unblockSeller);
router.patch('/block-product',authenticateToken, blockProduct);
router.patch('/unblock-product',authenticateToken, unblockProduct);
router.get('/seller-login',authenticateToken,getSellerLoginStats);
router.get('/user-login',authenticateToken,getUserLoginStats);
router.patch('/block-user',authenticateToken,blockUser);
router.patch('/unblock-user',authenticateToken,unblockUser);






export default router;
