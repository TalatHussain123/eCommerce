import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        image: { type: String, required: true },
        categories: { type: Array },
        size: { type: Array },
        color: { type: Array },
        price: { type: Number, required: true },
        discountPrice: { type: Number, default: null },
        gender: { type: String, required: true, enum: ['Male', 'Female'] },
        inventory: { type: Number, required: true }, //inStock
        rating: { type: String, required: true },
        taxPrice: { type: Number, default: 0 },
        quantity: { type: Number, default: 0, required: true },
        createdBy: { type: String, required: true }
    },
    { timestamps: true }
);

export default mongoose.model("Product", ProductSchema);