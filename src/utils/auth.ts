import { Request } from 'express';
import jwt from 'jsonwebtoken';

// Define the type for JWT payload
interface JwtPayload {
  adminId: string;
  // Add any other properties you might have in the payload
}



// Function to get Admin ID from JWT token in the request
export const getAdminIdFromRequest = (req: Request): string | null => {
  // Extract the token from the Authorization header
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return null;
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, "your_jwt_secret" ) as JwtPayload;
    return decoded.adminId || null;
  } catch (err) {
    // Token verification failed
    console.error('Failed to verify token:', err);
    return null;
  }
};
