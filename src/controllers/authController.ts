import { Request, Response } from 'express';
import { signupAdmin, loginAdmin } from '../services/authService';

export const signupController = async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;

  try {
    const admin = await signupAdmin(username, email, password, role);
    res.status(201).json(admin);
  } catch (error) {
    // Handle error with type assertion
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const { token, admin } = await loginAdmin(email, password);
    res.status(200).json({ token, admin });
  } catch (error) {
    // Handle error with type assertion
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};
