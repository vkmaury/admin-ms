import mongoose, { Schema, Document } from 'mongoose';

interface IBundle extends Document {
  name: string;
  description?: string; // Add description field
  products: {
    [x: string]: any;
    equals(productObjectId: mongoose.Types.ObjectId): unknown; productId: string; quantity: number 
}[];
  MRP: number;
  adminDiscount?: number; // Add this field
  sellerDiscounted: number; // Add this field for the final price after discount
  sellerDiscount: number; // Add this field
  stock: number;
  AdminId: string;
  isActive: boolean; // Add this field
  isBlocked: boolean; // Add this field
  adminDiscountApplied?: number; // New field for admin discount applied
  adminDiscountedPrice?: number; // New field for admin discounted price
  discountId: Schema.Types.ObjectId;
  status: 'active' | 'removed'; // or any other suitable value
  hasBeenProcessed: boolean;
  saleId?: mongoose.Types.ObjectId; // Define saleId as ObjectId
    saleApplied?: boolean; // Add this line
    saleDiscountApplied?: number;
  finalPrice?: number;
  isUnavailable: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const BundleSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String }, 
    products: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true }
      }
    ],
    MRP: { type: Number},
    stock: { type: Number},
    adminDiscount: { type: Number}, // Add this field with default value
    sellerDiscounted: { type: Number }, // Add this field for final price
    AdminId: { type: Schema.Types.ObjectId, ref: 'Admin'},
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    isUnavailable: { type: Boolean, default: false },
    sellerDiscount: { type: Number},
    saleId: { type: Schema.Types.ObjectId, ref: 'Sale' }, // Add this line
    saleApplied: { type: Boolean, default: false }, // Add this line
    saleDiscountApplied: { type: Number },
    finalPrice: { type: Number },
    adminDiscountApplied: { type: Number }, // New field
    adminDiscountedPrice: { type: Number }, // New field
    discountId: { type: Schema.Types.ObjectId, ref: 'Discount'},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'removed'], default: 'active' },
    hasBeenProcessed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IBundle>('Bundle', BundleSchema);
