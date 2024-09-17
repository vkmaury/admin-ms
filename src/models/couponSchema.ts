import { Schema, model, Document } from 'mongoose';

interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue: number;
  usageLimit: number;
  validFrom: Date;
  validUntil: Date;
  usageCount: number;
  isActive: boolean;
}

const couponSchema = new Schema<ICoupon>({
  code: { type: String, unique: true, required: true },
  discountType: { type: String, enum: ['percentage', 'flat'], required: true },
  discountValue: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  usageLimit: { type: Number, default: 1 },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  usageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const Coupon = model<ICoupon>('Coupon', couponSchema);

export default Coupon;