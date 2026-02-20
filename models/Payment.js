import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        subscription: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subscription",
        },
        // Internal order tracking
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        // Pak Kasir transaction data
        pakasirTransactionId: { type: String },
        pakasirPaymentId: { type: String },
        // Payment details
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "IDR",
        },
        status: {
            type: String,
            enum: ["pending", "paid", "failed", "cancelled", "expired"],
            default: "pending",
        },
        paymentMethod: {
            type: String,
            enum: ["qris", "va_bca", "va_mandiri", "va_bni", "va_bri", "va_permata", "other"],
        },
        paymentUrl: { type: String },
        qrCodeUrl: { type: String },
        vaNumber: { type: String },
        // Timestamps
        paidAt: { type: Date },
        expiredAt: { type: Date },
        cancelledAt: { type: Date },
        // Raw webhook data for debugging
        webhookData: { type: mongoose.Schema.Types.Mixed },
        failureReason: { type: String },
    },
    {
        timestamps: true,
    }
);

// Indexes
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ pakasirTransactionId: 1 });
paymentSchema.index({ status: 1 });

// Static method: Generate unique order ID
paymentSchema.statics.generateOrderId = function () {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `SUB-${timestamp}-${random}`.toUpperCase();
};

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
