import mongoose, { Document, Schema } from 'mongoose';

interface IProduct extends Document {
    name: string;
    description: string;
    MRP: number;

    stock: number;
    categoryId: Schema.Types.ObjectId; 
    discountId: Schema.Types.ObjectId;

    userId: mongoose.Types.ObjectId;
    
    

    createdAt: Date;
    updatedAt: Date;
    sellerDiscountApplied?: number; 
    sellerDiscounted: number; // New field
    isActive: boolean;
    isBlocked: boolean;
    adminDiscountApplied?: number; // New field for admin discount applied
    adminDiscountedPrice?: number; // New field for admin discounted price
    status: 'active' | 'removed'; // or any other suitable value
    hasBeenProcessed: boolean;
    
}

const productSchema: Schema = new Schema<IProduct>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    MRP: { type: Number},

    stock: { type: Number, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ProductCategory'},
    discountId: { type: Schema.Types.ObjectId, ref: 'Discount'},
    userId: { type: Schema.Types.ObjectId, ref: 'Auth-ms'},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    sellerDiscountApplied: { type: Number },
    sellerDiscounted: { type: Number }, // New field

    isActive: { type: Boolean},
    isBlocked: { type: Boolean, default: false },
    adminDiscountApplied: { type: Number }, // New field
    adminDiscountedPrice: { type: Number }, // New field
    status: { type: String, enum: ['active', 'removed'], default: 'active' },
    hasBeenProcessed: { type: Boolean, default: false },
});

export default mongoose.model<IProduct>('product', productSchema);
