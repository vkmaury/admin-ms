// models/discountModel.ts
import { Schema, model, Document } from 'mongoose';

export interface IDiscount extends Document {
  adminId: Schema.Types.ObjectId;
  adminDiscount: number;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isAppliedDiscount:boolean;
  products?: string[]; // Array of product IDs
  bundles: Schema.Types.ObjectId[];  // Array of bundle IDs
  status: 'active' | 'removed'; // or any other suitable value
  type: 'MRP' | 'sellerDiscounted'; // Added field
  
}

const discountSchema = new Schema<IDiscount>({
  adminId: {
    type: Schema.Types.ObjectId, // Define the type as ObjectId
    ref: 'Admin', // Reference the Admin model
    required: true // Make it required
  },
  adminDiscount: { type: Number, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  isAppliedDiscount: { type: Boolean, default: false },
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  bundles: { type: [Schema.Types.ObjectId], default: [] },
  status: { type: String, enum: ['active', 'removed'], default: 'active' },
  type: { type: String, enum: ['MRP', 'sellerDiscounted'], required: true }, // Added field
  
});

export default model<IDiscount>('Discount', discountSchema);
