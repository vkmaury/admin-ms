import mongoose, { Schema, Document } from 'mongoose';

export interface ISale extends Document {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  saleDiscountApplied: number;
  finalPrice:number;
  categories: mongoose.Types.ObjectId[];
  isActive: boolean;
  MRP : number;
  isAppliedSale: boolean;

  affectedProducts: {
    productId: Schema.Types.ObjectId;
    categoryId: Schema.Types.ObjectId; 
    productName: string;
    productMRP : number;
    finalePrice: number;
    isUnavailable: boolean;
  }[];
  affectedBundles: {
    bundleId: Schema.Types.ObjectId;
    bundleName: string;
    finalPrice: number;
   
    isUnavailable: boolean;
  }[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const saleSchema = new Schema<ISale>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  saleDiscountApplied:{type:Number},
  MRP:{type:Number},
  finalPrice:{type:Number},
  affectedProducts: [
    {
      productId: { type: Schema.Types.ObjectId, ref: 'Product' },
      categoryId: { type: Schema.Types.ObjectId, ref: 'ProductCategory'},
      productName: { type: String },
      finalePrice: { type: Number },
      productMRP: {type: Number},
      isUnavailable:{ type: Boolean, default: false },
    }
  ],
  affectedBundles: [{
    bundleId: { type: Schema.Types.ObjectId, ref: 'Bundle'},
    bundleName: { type: String, required: true },
    finalPrice: { type: Number, required: true },
    isUnavailable: { type: Boolean, default: false }
  }],
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory' }],
  isActive: { type: Boolean, default: true },
  isAppliedSale: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin'},
}, { timestamps: true });

const Sale = mongoose.model<ISale>('Sale', saleSchema);

export default Sale;
