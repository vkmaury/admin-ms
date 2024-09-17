import { Schema, model, Document } from 'mongoose';

// Interface representing an Order Item
interface IOrderItem {
  productId: Schema.Types.ObjectId;
  bundleId: Schema.Types.ObjectId;
  productName: string;
  bundleName: string;
  quantity: number;
  price: number;  // Price per unit at the time of order
  discount: number; // Discount applied per unit
  total: number;   // Total price after discount
}

// Interface representing Shipping Information
interface IShippingInfo {
  houseNumber: string;
  locality: string;
  nearBy: string;
  city: string;
  state: string;
  postalCode : string;
  country: string;
}

// Interface representing Payment Information
interface IPaymentInfo {
    method: string; 
//   method: 'Credit Card' | 'Debit Card' | 'PayPal' | 'Stripe' | 'Cash on Delivery';
  transactionId?: string;  // Transaction ID from the payment gateway
  status: string;
  // status: 'Pending' | 'Completed' | 'Failed';
  amount: number;
}

// Interface representing the Order Document
export interface IOrder extends Document {
  userId: Schema.Types.ObjectId;
  items: IOrderItem[];
  shippingInfo: IShippingInfo;
  paymentInfo: IPaymentInfo;
  totalAmount: number;  // Sum of all item totals
  orderStatus: 'Pending' | 'Paid' | 'Completed' | 'Failed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Confirmed';
  isPaid: boolean;
  paidAt?: Date;
  stripePaymentIntentId:string;
  orderDate?: Date;
  deliveryDate?: Date;
  deliveredAt?: Date;
  refundStatus?: 'not_requested' | 'requested' | 'processing' | 'completed' | 'failed';
  refundAmount?: number;
  refundReason?: string; 
  refundDate?: Date; 
  createdAt: Date;
  updatedAt: Date;
}

// Order Schema
// Order Schema
const orderSchema = new Schema<IOrder>({
    userId: { type: Schema.Types.ObjectId, ref: 'User'},
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        bundleId: { type: Schema.Types.ObjectId, ref: 'Bundle'},
        productName: { type: String },
        bundleName: { type: String },
        quantity: { type: Number},
        price: { type: Number},
        discount: { type: Number},
        total: { type: Number},
      }
    ],
    shippingInfo: {
      houseNumber: { type: String},
      locality: { type: String},
      nearBy: { type: String},
      city: { type: String},
      state: { type: String},
      postalCode: { type: String},
      country: { type: String},
    },
    paymentInfo: {
    //   method: {
    //     type: String,
    //     enum: ['Credit Card', 'Debit Card', 'PayPal', 'Stripe', 'Cash on Delivery'],
       
    //   },
      method: { type: String}, // Ensure this is a string
      transactionId: { type: String },
      // status: {
      //   type: String,
      //   enum: ['Pending', 'Completed', 'Failed'],
      //   default: 'Pending',
        
      // },
      status: { type: String }, 
      amount: { type: Number},
    },
    totalAmount: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum:['Pending','Paid', 'Completed', 'Failed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Confirmed'], // Include 'Confirmed'
      default: 'Pending',
      required: true,
    },
    isPaid: { type: Boolean, default: false },
    stripePaymentIntentId:{ type: String },
    paidAt: { type: Date },
    // deliveredAt: { type: Date },
    orderDate:  { type: Date },
    deliveryDate:  { type: Date },
    refundStatus: {
      type: String,
      enum: ['not_requested', 'requested', 'processing', 'completed', 'failed'],
      default: 'not_requested',
    },
    refundAmount: { type: Number, required: false },
    refundReason: { type: String, required: false },
    refundDate: { type: Date, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  }, { timestamps: true });
  
  export default model<IOrder>('Order', orderSchema);
    
