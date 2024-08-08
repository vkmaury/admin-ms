import { Schema, model, Document } from 'mongoose';

interface IProductCategory extends Document {
  
  name: string;
  category:string;
  description?: string;
  isActive: boolean;
}

const ProductCategorySchema = new Schema<IProductCategory>({

  name: { type: String, required: true, unique: true },
  category: { type: String, required: true},
  description: { type: String },
  isActive: { type: Boolean, default: true },
});

const ProductCategory = model<IProductCategory>('ProductCategory', ProductCategorySchema);
export default ProductCategory;
