import { Schema, model, Document } from 'mongoose';

interface IAdminActivity extends Document {
  adminId: Schema.Types.ObjectId;
  activity: 'blockUser' | 'unblockUser' | 'blockProduct' | 'unblockProduct';
  targetUserId?: Schema.Types.ObjectId;
  targetProductId?: Schema.Types.ObjectId;
  timestamp: Date;
}

const AdminActivitySchema = new Schema<IAdminActivity>({
  adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  activity: { type: String, required: true, enum: ['blockUser', 'unblockUser', 'blockProduct', 'unblockProduct'] },
  targetUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  targetProductId: { type: Schema.Types.ObjectId, ref: 'Product' },
  timestamp: { type: Date, default: Date.now }
});

const AdminActivity = model<IAdminActivity>('AdminActivity', AdminActivitySchema);
export default AdminActivity
