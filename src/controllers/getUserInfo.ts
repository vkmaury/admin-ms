import { Request, Response } from 'express';
import User from '../models/User'; // Adjust the path to your User model

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Fetch only users with the role 'user'
    const users = await User.find({ role: 'user' }).select('-password'); // Exclude the password field

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
