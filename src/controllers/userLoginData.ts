import { Request, Response } from 'express';
import User from '../models/User'; // Adjust the path according to your project structure

const getDateRange = (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);
      console.log(startDate);
      console.log(endDate);
      break;
    case 'weekly':
      const weekStart = now.getDate() - now.getDay(); // Sunday as the start of the week
      startDate = new Date(now.setDate(weekStart));
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 1);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(startDate);
      endDate.setFullYear(startDate.getFullYear() + 1);
      break;
    default:
      throw new Error('Invalid period');
  }


  return { startDate, endDate };
};

// Controller to get all sellers' login stats
export const getUserLoginStats = async (req: Request, res: Response) => {
  const period = req.query.period as 'daily' | 'weekly' | 'monthly' | 'yearly';

  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
    return res.status(400).json({ error: 'Invalid period' });
  }



  try {
    const { startDate, endDate } = getDateRange(period);

    // Aggregate seller logins based on the period
    const loginStats = await User.aggregate([
      { $match: { role: 'user' } }, // Match only sellers
      { $unwind: '$loginHistory' },
      { $match: { loginHistory: { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: {
            userId: '$_id',
            userName: '$name',
          },
          logins: { $push: '$loginHistory' }
        }
      },
      { $sort: { '_id.userName': 1, '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1, '_id.minute': 1 } }
    ]);

    res.status(200).json({
      period,
      loginStats
    });
  } catch (error) {
    console.error('Error fetching seller login stats:', error);
    res.status(500).json({ error: 'An unknown error occurred' });
  }
};
