import { Request, Response } from 'express';
import User from '../models/User'; // Adjust the path to your User model

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.query.id as string; // Extract userId from query parameters

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId).select('-password'); // Exclude the password field

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
