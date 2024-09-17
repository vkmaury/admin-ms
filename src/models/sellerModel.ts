import mongoose, { Schema, Document } from 'mongoose';

interface ISeller extends Document {
  name?: string;
  email: string;
  isActive: string;
  phoneNumber:string;
  shopName?: string;
  shopDescription?: string;
  shopContactNumber?: string;
  businessLicense?: string;
  taxId?: string;
  website?: string;
  createdAt?: Date;
  updatedAt?: Date;
  role:string;
 
}

const SellerSchema: Schema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: false, unique: true },
    shopName: { type: String },
    shopDescription: { type: String },
    shopContactNumber: { type: String },
    businessLicense: { type: String },
    taxId: { type: String },
    website: { type: String },
    role: { type: String },
    isActive: { type: Boolean }
    
    
    

  },
  { timestamps: true }
);

const Seller = mongoose.models.Seller || mongoose.model<ISeller>('Seller', SellerSchema);

export default Seller;
