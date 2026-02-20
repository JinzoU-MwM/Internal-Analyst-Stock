import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // One active subscription per user
        },
        plan: {
            type: String,
            enum: ["premium"],
            default: "premium",
        },
        status: {
            type: String,
            enum: ["pending", "trial", "active", "expired", "cancelled"],
            default: "pending",
        },
        amount: {
            type: Number,
            default: 30000, // Rp 30.000
        },
        currency: {
            type: String,
            default: "IDR",
        },
        // Subscription period
        startDate: { type: Date },
        endDate: { type: Date },
        trialEndsAt: { type: Date },
        // Pak Kasir integration
        pakasirOrderId: { type: String, unique: true, sparse: true },
        pakasirTransactionId: { type: String },
        paymentMethod: {
            type: String,
            enum: ["qris", "va_bca", "va_mandiri", "va_bni", "va_bri", "va_permata", "other"],
        },
        paymentUrl: { type: String },
        // Metadata
        cancelledAt: { type: Date },
        cancelReason: { type: String },
    },
    {
        timestamps: true,
    }
);

// Index for quick lookups
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ pakasirOrderId: 1 });
subscriptionSchema.index({ status: 1 });

// Instance method: Check if subscription is active
subscriptionSchema.methods.isActive = function () {
    if (this.status === "active" && this.endDate && new Date() <= this.endDate) {
        return true;
    }
    if (this.status === "trial" && this.trialEndsAt && new Date() <= this.trialEndsAt) {
        return true;
    }
    return false;
};

// Instance method: Check if in trial period
subscriptionSchema.methods.isInTrial = function () {
    return this.status === "trial" && this.trialEndsAt && new Date() <= this.trialEndsAt;
};

// Instance method: Days remaining
subscriptionSchema.methods.daysRemaining = function () {
    const now = new Date();
    const end = this.status === "trial" ? this.trialEndsAt : this.endDate;
    if (!end) return 0;
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
