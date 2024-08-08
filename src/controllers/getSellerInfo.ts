import { Request, Response } from 'express';
import Seller from '../models/sellerModel'; // Adjust the path as needed

export const getAllSeller = async (req: Request, res: Response) => {
  try {
    // Extract query parameters
    const searchQuery = req.query.search as string || '';
    const sort = req.query.sort === 'desc' ? -1 : 1; // Default to ascending order
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    // Build query for fetching sellers
    const query: any = {};
    if (searchQuery) {
      query.shopName = { $regex: searchQuery, $options: 'i' }; // Case-insensitive search
    }

    // Fetch sellers with search, sorting, and pagination
    const sellers = await Seller.find(query)
      .sort({ shopName: sort })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-__v'); // Exclude version key if not needed

    // Count total matching sellers for pagination
    const totalCount = await Seller.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    if (sellers.length === 0) {
      return res.status(404).json({ message: 'No sellers found' });
    }

    res.status(200).json({
    
      pagination: {
        page,
        limit,
        totalPages,
        totalCount
      }, sellers
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};



