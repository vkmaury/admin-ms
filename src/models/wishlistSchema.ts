// models/wishlistSchema.ts
import { Schema, model, Document } from 'mongoose';

interface IWishlistItem {
    productId?: Schema.Types.ObjectId;
    bundleId?: Schema.Types.ObjectId;
    name?: string;
    price?: number;
    isUnavailable: boolean;
}

export interface IWishlist extends Document {
    userId: Schema.Types.ObjectId;
    items: IWishlistItem[];
}

const wishlistSchema = new Schema<IWishlist>({
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        bundleId: { type: Schema.Types.ObjectId, ref: 'Bundle' },
        name: { type: String },
        price: { type: Number },
        isUnavailable: { type: Boolean, default: false }, // Add this field
    }]
});

export default model<IWishlist>('Wishlist', wishlistSchema);
