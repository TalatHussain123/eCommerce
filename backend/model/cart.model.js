import mongoose from 'mongoose';
const { ObjectId } = mongoose;

const CartSchema = new mongoose.Schema(
    {
        roleId: {
            type: ObjectId,
            required: true,
        },
        role: {
            type: String
        },
        products: [
            {
                productId: {
                    type: ObjectId,
                    ref: "Product"
                },
                quantity: {
                    type: Number,
                    default: 1,
                },
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model("Cart", CartSchema)