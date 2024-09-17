import { Schema, model, Document } from 'mongoose';

interface ILogins extends Document {
  userId: Schema.Types.ObjectId;
  userloginDate: Date;
  sellerId: Schema.Types.ObjectId;
  sellerloginDate: Date;

}

const LoginsSchema = new Schema<ILogins>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userloginDate: { type: Date, default: Date.now },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
  sellerloginDate: { type: Date, default: Date.now }
  
});

const Logins = model<ILogins>('Logins', LoginsSchema);
export default Logins;
