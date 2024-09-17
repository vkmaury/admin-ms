import { Schema, model, Document } from 'mongoose';

interface IAnalyticsProductReport extends Document {
  timePeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';
  totalSales: number;
  totalRevenue: number;
}

const AnalyticsProductReportSchema = new Schema<IAnalyticsProductReport>({
  timePeriod: { type: String, required: true, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
  totalSales: { type: Number, required: true },
  totalRevenue: { type: Number, required: true }
});

const AnalyticsProductReport = model<IAnalyticsProductReport>('AnalyticsProductReport', AnalyticsProductReportSchema);
export default AnalyticsProductReport;
