import { Schema, model, Document } from 'mongoose';

interface IAdmin extends Document {
  username: string;
  password: string;
  email: string;
  isActive: boolean;
  role: 'admin' | 'superAdmin';
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  role: { 
    type: String, 
    enum: ['admin', 'superAdmin'], 
    required: true 
  },
}, {
  timestamps: true
});

const Admin = model<IAdmin>('Admin', AdminSchema);

export default Admin;
