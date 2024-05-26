import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
    {
        roleId: { type: mongoose.Schema.ObjectId },
        role: { type: String },
        customerName: { type: String },
        companyName: { type: String },
        orderItems: [
            {
                name: {
                    type: String,
                    required: true,
                },
                productId: {
                    type: mongoose.Schema.ObjectId,
                    ref: "Product",
                    required: true,
                },
                image: {
                    type: String,
                    required: true,
                },
                quantity: {
                    type: Number,
                    default: 1,
                },
                discountPrice: {
                    type: Number,
                    ref: "Product",
                    default: null
                },
                price: { type: Number, required: true },
            },
        ],
        paymentInfo: {
            id: {
                type: String,
                required: true,
            },
            status: {
                type: String,
                required: true,
            },
        },
        itemsPrice: {
            type: Number,
            required: true,
            default: 0,
        },
        taxPrice: {
            type: Number,
            required: true,
            default: 0,
        },
        deliveryCharges: {
            type: Number,
            required: true,
            default: 0,
        },
        orderStatus: { type: String, default: "Waiting" },
    },
    { timestamps: true }
);

export default mongoose.model("Order", OrderSchema)