import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../models/adminSchema';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const signupAdmin = async (username: string, email: string, password: string, role: 'admin' | 'superAdmin') => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = new Admin({
    username,
    email,
    password: hashedPassword,
    role
  });

  return await admin.save();
};

export const loginAdmin = async (email: string, password: string) => {
  const admin = await Admin.findOne({ email });

  if (!admin) {
    throw new Error('Admin not found');
  }

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  if (!admin.isActive) {
    throw new Error('Admin is not active');
  }

  const token = jwt.sign(
    { adminId: admin._id, role: admin.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { token, admin };
};
