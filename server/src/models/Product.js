import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    imageKey: { type: String, required: true }
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);
