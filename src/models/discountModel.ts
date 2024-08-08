// models/discountModel.ts
import { Schema, model, Document } from 'mongoose';

export interface IDiscount extends Document {
  adminId: Schema.Types.ObjectId;
  adminDiscount: number;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  products?: string[]; // Array of product IDs
  bundles?: string[]; // Array of bundle IDs
  status: 'active' | 'removed'; // or any other suitable value
  hasBeenProcessed: boolean;
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
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  bundles: [{ type: Schema.Types.ObjectId, ref: 'Bundle' }],
  status: { type: String, enum: ['active', 'removed'], default: 'active' },
  hasBeenProcessed: { type: Boolean, default: false },
});

export default model<IDiscount>('Discount', discountSchema);
