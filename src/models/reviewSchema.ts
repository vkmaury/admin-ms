import { Schema, model, Document } from 'mongoose';

interface IReview extends Document {
  userId: Schema.Types.ObjectId;
  orderId: Schema.Types.ObjectId;
  productId?:Schema.Types.ObjectId;
  bundleId?: Schema.Types.ObjectId;
  rating: number;
  reviewText: string;
  images: string[];
  isActive: boolean; 
  isVisible: boolean; 
}

const ReviewSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId:{ type: Schema.Types.ObjectId, ref: 'Order', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    bundleId: { type: Schema.Types.ObjectId, ref: 'Bundle' },
    rating: { type: Number, required: true },
    reviewText: { type: String, required: false },
    images: [{ type: String }],
    isActive: { type: Boolean, default: true }, 
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);
export default model<IReview>('Review', ReviewSchema);