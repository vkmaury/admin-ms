import { Request, Response } from 'express';
import Order from '../models/orderSchema'; // Assuming the Order model is imported from the order-ms
import moment from 'moment-timezone';
import User from '../models/User';
import Product from '../models/productSchema';


// Helper function to get the start and end dates based on the period or custom dates
const getDateRange = (period: 'daily' | 'weekly' | 'monthly' | 'custom', startDate?: string, endDate?: string) => {
  const now = moment.tz('Asia/Kolkata');
  let start: Date;
  let end: Date;

  if (period === 'custom' && startDate && endDate) {
    start = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toDate(); // Parse custom start date
    end = moment.tz(endDate, 'Asia/Kolkata').endOf('day').toDate(); // Parse custom end date
  } else {
    switch (period) {
      case 'daily':
        start = now.startOf('day').toDate();
        end = now.endOf('day').toDate();
        break;
      case 'weekly':
        start = now.startOf('week').toDate();
        end = now.endOf('week').toDate();
        break;
      case 'monthly':
        start = now.startOf('month').toDate();
        end = now.endOf('month').toDate();
        break;
      default:
        throw new Error('Invalid period');
    }
  }

  return { startDate: start, endDate: end };
};

export const getTopSellingProducts = async (startDate: Date, endDate: Date, limit: number) => {
  return Order.aggregate([
    {
      $match: {
        orderStatus: 'Delivered',
        orderDate: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $unwind: '$items',
    },
    {
      $group: {
        _id: '$items.productId',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.total' },
        productName: { $first: '$items.productName' },
      },
    },
    {
      $sort: { totalQuantity: -1 },
    },
    {
      $limit: limit,
    },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        productName: 1,
        totalQuantity: 1,
        totalRevenue: 1,
      },
    },
  ]);
};



// Modify the controller to support custom dates
export const getSalesReportController = async (req: Request, res: Response) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query as { period?: 'daily' | 'weekly' | 'monthly' | 'custom', startDate?: string, endDate?: string };

    if (period === 'custom' && (!startDate || !endDate)) {
      return res.status(400).json({ message: 'Start date and end date are required for custom period' });
    }

    const { startDate: start, endDate: end } = getDateRange(period as 'daily' | 'weekly' | 'monthly' | 'custom', startDate, endDate);

    // Aggregate the total price and product details from delivered orders within the specified date range
    const salesReport = await Order.aggregate([
      {
        $match: {
          orderStatus: 'Delivered',
          orderDate: { $gte: start, $lt: end }, // Filter by date range
        },
      },
      {
        $unwind: '$items', // Unwind the items array to work with each item individually
      },
      {
        $group: {
          _id: '$items.productId', // Group by productId
          totalQuantity: { $sum: '$items.quantity' }, // Sum the quantity of each product
          totalPrice: { $sum: '$items.total' }, // Sum the total price for each product
          pricePerUnit: { $first: '$items.total' }, // Get the price per unit
          productName: { $first: '$items.productName' }, // Get the product name
          bundleName: { $first: '$items.bundleName' }, // Get the bundle name
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id field from the result
          productId: '$_id',
          productName: 1,
          bundleName: 1,
          totalQuantity: 1,
          totalPrice: 1,
          pricePerUnit: 1,
        },
      },
    ]);

    // Calculate the total sales amount across all delivered products
    const totalSales = salesReport.reduce((acc, item) => acc + item.totalPrice, 0);

    // Send the response with the total sales amount and product details
    return res.status(200).json({ totalSales, salesReport });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving sales report', error });
  }
};

export const getTotalUsersController = async (req: Request, res: Response) => {
    try {
      const totalUsers = await User.countDocuments({role: 'user'});
      return res.status(200).json({ totalUsers });
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving total users', error });
    }
  };

export const getTotalSellersController = async (req: Request, res: Response) => {
    try {
      const totalSellers = await User.countDocuments({ role: 'seller' });
      return res.status(200).json({ totalSellers });
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving total sellers', error });
    }
  };

export const getTotalProductsController = async (req: Request, res: Response) => {
    try {
      const totalProducts = await Product.countDocuments({});
      return res.status(200).json({ totalProducts });
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving total products', error });
    }
  };

export const getTotalSalesController = async (req: Request, res: Response) => {
    try {
      const totalSales = await Order.aggregate([
        { $match: { orderStatus: 'Delivered' } },
        { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } },
        { $project: { _id: 0, totalSales: 1 } }
      ]);
      return res.status(200).json({ totalSales: totalSales[0]?.totalSales || 0 });
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving total sales', error });
    }
  };


  export const getTopSellingProductsController = async (req: Request, res: Response) => {
    try {
      const { period = 'daily', limit = 10, startDate: customStartDate, endDate: customEndDate } = req.query;
      
      // Parse and validate limit
      const parsedLimit = parseInt(limit as string, 10) || 10;
      
      let startDate: Date;
      let endDate: Date;
  
      if (customStartDate && customEndDate) {
        // If custom start and end dates are provided, use them
        startDate = moment.tz(customStartDate as string, 'Asia/Kolkata').startOf('day').toDate();
        endDate = moment.tz(customEndDate as string, 'Asia/Kolkata').endOf('day').toDate();
      } else {
        // Otherwise, use the period-based date range
        const dateRange = getDateRange(period as 'daily' | 'weekly' | 'monthly');
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
      }
  
      // Fetch top-selling products within the date range
      const topSellingProducts = await getTopSellingProducts(startDate, endDate, parsedLimit);
  
      // Send the response with the top-selling products
      return res.status(200).json({ topSellingProducts });
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving top-selling products', error });
    }
  };
  
  