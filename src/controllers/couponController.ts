import { Request, Response } from 'express';
import Coupon from '../models/couponSchema';
import { getAdminIdFromRequest } from '../utils/auth';
import Admin from '../models/adminSchema';  
import mongoose from 'mongoose';

interface CreateCouponBody {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue?: number;
  usageLimit?: number;
  validFrom: string;
  validUntil: string;
}

// interface CustomRequest extends Request {
//   user?: {
//     userId: string;
//     role?: string;
//   };
// }

// Create Coupon API
export const createCoupon = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
     // Extract admin ID from the request
     const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
     if (!adminId) {
       return res.status(401).json({ error: 'Admin not authenticated' });
     }
 
     // Log admin ID
     console.log('Admin ID:', adminId);
 
     // Find the admin by ID
     const admin = await Admin.findById(adminId).exec();
     if (!admin) {
       return res.status(404).json({ error: 'Admin not found' });
     }
 
     // Check if the admin is active
     if (!admin.isActive) {
       return res.status(403).json({ error: 'Admin is not active' });
     }


    const {
      code,
      discountType,
      discountValue,
      minOrderValue = 0,
      usageLimit = 10,
      validFrom,
      validUntil,
    }: CreateCouponBody = req.body;

    // Field-specific validations
    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    if (!discountType) {
      return res.status(400).json({ message: 'Discount type is required' });
    }

    if (discountValue === undefined || discountValue === null) {
      return res.status(400).json({ message: 'Discount value is required' });
    }

    if (!validFrom) {
      return res.status(400).json({ message: 'Valid from date is required' });
    }

    if (!validUntil) {
      return res.status(400).json({ message: 'Valid until date is required' });
    }

    // Check if the coupon code is unique
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    // Validate discount value based on discount type
    if (
      discountType === 'percentage' &&
      (discountValue <= 0 || discountValue > 100)
    ) {
      return res
        .status(400)
        .json({ message: 'Percentage discount must be between 1 and 100' });
    }
    if (discountType === 'flat' && discountValue <= 0) {
      return res
        .status(400)
        .json({ message: 'Flat discount must be greater than 0' });
    }

    // Validate the dates
    const startDate = new Date(validFrom);
    const endDate = new Date(validUntil);
    const currentDate = new Date();

    // Ensure `validFrom` is not in the past
    if (startDate < currentDate) {
      return res
        .status(400)
        .json({ message: 'Valid from date cannot be in the past' });
    }

    // Ensure `validUntil` is after `validFrom`
    if (endDate <= startDate) {
      return res
        .status(400)
        .json({ message: 'End date must be after the start date' });
    }

    // Validate `usageLimit` and `minOrderValue`
    if (usageLimit <= 0) {
      return res
        .status(400)
        .json({ message: 'Usage limit must be greater than 0' });
    }

    if (minOrderValue < 0) {
      return res
        .status(400)
        .json({ message: 'Minimum order value cannot be negative' });
    }

    // Create and save the coupon in the database
    const coupon = new Coupon({
      code,
      discountType,
      discountValue,
      minOrderValue,
      usageLimit,
      validFrom: startDate,
      validUntil: endDate,
    });

    await coupon.save();
    return res
      .status(201)
      .json({ message: 'Coupon created successfully', coupon });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

export const getCouponById = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
        const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
        if (!adminId) {
          return res.status(401).json({ error: 'Admin not authenticated' });
        }
    
        // Log admin ID
        console.log('Admin ID:', adminId);
    
        // Find the admin by ID
        const admin = await Admin.findById(adminId).exec();
        if (!admin) {
          return res.status(404).json({ error: 'Admin not found' });
        }
    
        // Check if the admin is active
        if (!admin.isActive) {
          return res.status(403).json({ error: 'Admin is not active' });
        }
      const id = req.query.id as string;
  
      // Check if the provided ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid coupon ID' });
      }
  
      // Fetch the coupon by ID
      const coupon = await Coupon.findById(id);
  
      // Check if the coupon exists
      if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
      }
  
      // Return full coupon details
      return res.status(200).json({
        message: 'Coupon fetched successfully',
        coupon,
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error });
    }
  };

  export const getAllCoupons = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
        const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
        if (!adminId) {
          return res.status(401).json({ error: 'Admin not authenticated' });
        }
    
        // Log admin ID
        console.log('Admin ID:', adminId);
    
        // Find the admin by ID
        const admin = await Admin.findById(adminId).exec();
        if (!admin) {
          return res.status(404).json({ error: 'Admin not found' });
        }
    
        // Check if the admin is active
        if (!admin.isActive) {
          return res.status(403).json({ error: 'Admin is not active' });
        }
      const {
        page = 1,
        limit = 10,
        sort = 'validUntil',
        order = 'asc',
        search = '',
      } = req.query;
  
      const pageNumber = parseInt(page as string, 10);
      const pageSize = parseInt(limit as string, 10);
      const sortOrder = order === 'desc' ? -1 : 1;
  
      const searchQuery = search
        ? { code: { $regex: search, $options: 'i' } }
        : {};
  
      const totalCoupons = await Coupon.countDocuments(searchQuery);
  
      const coupons = await Coupon.find(searchQuery)
        .select('code discountType discountValue validUntil')
        .sort({ [sort as string]: sortOrder })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize);
  
      // Response with coupons and pagination info
      return res.status(200).json({
        message: 'Coupons fetched successfully',
        coupons,
        totalPages: Math.ceil(totalCoupons / pageSize),
        currentPage: pageNumber,
        totalCoupons,
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error });
    }
  }; 

export const updateCoupon = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
        const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
        if (!adminId) {
          return res.status(401).json({ error: 'Admin not authenticated' });
        }
    
        // Log admin ID
        console.log('Admin ID:', adminId);
    
        // Find the admin by ID
        const admin = await Admin.findById(adminId).exec();
        if (!admin) {
          return res.status(404).json({ error: 'Admin not found' });
        }
    
        // Check if the admin is active
        if (!admin.isActive) {
          return res.status(403).json({ error: 'Admin is not active' });
        }
      const id = req.query.id as string;
      const {
        code,
        discountType,
        discountValue,
        minOrderValue,
        usageLimit,
        validFrom,
        validUntil,
      }: CreateCouponBody = req.body;
  
      // Validate if the ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid coupon ID' });
      }
  
      // Check if the coupon exists
      const coupon = await Coupon.findOne({ _id: id, isActive: true });
      if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
      }
  
      // Field-specific validations
      if (code && code.trim() === '') {
        return res.status(400).json({ message: 'Coupon code cannot be empty' });
      }
  
      if (discountType && !['percentage', 'flat'].includes(discountType)) {
        return res.status(400).json({ message: 'Invalid discount type' });
      }
  
      if (
        discountValue !== undefined &&
        (discountValue === null || discountValue <= 0)
      ) {
        return res
          .status(400)
          .json({ message: 'Discount value must be greater than 0' });
      }
  
      if (
        discountType === 'percentage' &&
        discountValue !== undefined &&
        (discountValue <= 0 || discountValue > 100)
      ) {
        return res
          .status(400)
          .json({ message: 'Percentage discount must be between 1 and 100' });
      }
  
      if (
        discountType === 'flat' &&
        discountValue !== undefined &&
        discountValue <= 0
      ) {
        return res
          .status(400)
          .json({ message: 'Flat discount must be greater than 0' });
      }
  
      if (minOrderValue !== undefined && minOrderValue < 0) {
        return res
          .status(400)
          .json({ message: 'Minimum order value cannot be negative' });
      }
  
      if (usageLimit !== undefined && usageLimit <= 0) {
        return res
          .status(400)
          .json({ message: 'Usage limit must be greater than 0' });
      }
  
      // Date validation
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      if (validFrom) {
        startDate = new Date(validFrom);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ message: 'Invalid valid from date' });
        }
      }
  
      if (validUntil) {
        endDate = new Date(validUntil);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ message: 'Invalid valid until date' });
        }
      }
  
      if (startDate && startDate < new Date()) {
        return res
          .status(400)
          .json({ message: 'Valid from date cannot be in the past' });
      }
  
      if (startDate && endDate && endDate <= startDate) {
        return res
          .status(400)
          .json({ message: 'End date must be after the start date' });
      }
  
      // Check if the coupon code is unique when updating
      if (code && code !== coupon.code) {
        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
          return res.status(400).json({ message: 'Coupon code already exists' });
        }
      }
  
      // Update fields if provided
      if (code) coupon.code = code;
      if (discountType) coupon.discountType = discountType;
      if (discountValue !== undefined) coupon.discountValue = discountValue;
      if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
      if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
      if (startDate) coupon.validFrom = startDate;
      if (endDate) coupon.validUntil = endDate;
  
      // Save the updated coupon
      await coupon.save();
  
      return res.status(200).json({
        message: 'Coupon updated successfully',
        coupon,
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error });
    }
  };

  export const deleteCoupon = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
        const adminId = getAdminIdFromRequest(req); // Replace with actual method to get admin ID
        if (!adminId) {
          return res.status(401).json({ error: 'Admin not authenticated' });
        }
    
        // Log admin ID
        console.log('Admin ID:', adminId);
    
        // Find the admin by ID
        const admin = await Admin.findById(adminId).exec();
        if (!admin) {
          return res.status(404).json({ error: 'Admin not found' });
        }
    
        // Check if the admin is active
        if (!admin.isActive) {
          return res.status(403).json({ error: 'Admin is not active' });
        }
    
      const id = req.query.id as string;
  
      // Validate if the ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid coupon ID' });
      }
  
      // Find the coupon by ID and check if it exists
      const coupon = await Coupon.findById(id);
      if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
      }
  
      // Check if the coupon is already deleted
      if (!coupon.isActive) {
        return res.status(400).json({ message: 'Coupon is already deleted' });
      }
  
      // Perform soft delete by setting `isDeleted` to true
      coupon.isActive = false;
      await coupon.save();
  
      return res.status(200).json({
        message: 'Coupon deleted successfully',
        coupon,
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error });
    }
  };

