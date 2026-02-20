import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import Payment from "../models/Payment.js";
import * as pakasir from "../services/pakasirService.js";

// Configuration
const PREMIUM_PRICE = parseInt(process.env.PREMIUM_PRICE) || 30000;
const TRIAL_DAYS = parseInt(process.env.PREMIUM_TRIAL_DAYS) || 7;
const SUBSCRIPTION_DAYS = 30; // Monthly subscription

/**
 * GET /api/subscription/plans
 * List available subscription plans
 */
export const getPlans = async (req, res) => {
    try {
        const plans = [
            {
                id: "free",
                name: "Free",
                price: 0,
                currency: "IDR",
                features: [
                    "Price charts with basic indicators",
                    "Stock search & watchlist",
                    "Fundamental data",
                    "Ownership data",
                    "Foreign flow tracking",
                ],
                limitations: [
                    "No AI Insight",
                    "No MSCI Screener",
                ],
            },
            {
                id: "premium",
                name: "Premium",
                price: PREMIUM_PRICE,
                currency: "IDR",
                trialDays: TRIAL_DAYS,
                features: [
                    "All Free features",
                    "✨ AI Insight (Technical & Fundamental)",
                    "📊 MSCI Screener access",
                    "Priority support",
                ],
                highlighted: true,
            },
        ];

        res.json({
            success: true,
            plans,
        });
    } catch (error) {
        console.error("[Subscription] getPlans error:", error);
        res.status(500).json({ success: false, error: "Failed to get plans" });
    }
};

/**
 * GET /api/subscription/status
 * Get current user's subscription status
 */
export const getStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select("subscription");
        const subscription = await Subscription.findOne({ user: userId });

        // Calculate subscription status
        let isActive = false;
        let isTrial = false;
        let daysRemaining = 0;
        let endDate = null;

        if (subscription) {
            isActive = subscription.isActive();
            isTrial = subscription.isInTrial();
            daysRemaining = subscription.daysRemaining();
            endDate = subscription.endDate || subscription.trialEndsAt;
        }

        res.json({
            success: true,
            subscription: {
                plan: user.subscription?.plan || "free",
                status: user.subscription?.status || "none",
                isActive,
                isTrial,
                daysRemaining,
                endDate,
                trialEndsAt: subscription?.trialEndsAt,
            },
        });
    } catch (error) {
        console.error("[Subscription] getStatus error:", error);
        res.status(500).json({ success: false, error: "Failed to get subscription status" });
    }
};

/**
 * POST /api/subscription/checkout
 * Initiate payment checkout
 */
export const checkout = async (req, res) => {
    try {
        const userId = req.user.id;
        const { method = "qris" } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // Check if user already has active subscription
        const existingSub = await Subscription.findOne({ user: userId });
        if (existingSub && existingSub.isActive()) {
            return res.status(400).json({
                success: false,
                error: "You already have an active subscription",
            });
        }

        // Generate unique order ID
        const orderId = Payment.generateOrderId();

        // Create payment record
        const payment = await Payment.create({
            user: userId,
            orderId,
            amount: PREMIUM_PRICE,
            currency: "IDR",
            status: "pending",
            paymentMethod: method,
        });

        // Create subscription record (pending)
        const subscription = await Subscription.findOneAndUpdate(
            { user: userId },
            {
                user: userId,
                plan: "premium",
                status: "pending",
                amount: PREMIUM_PRICE,
                pakasirOrderId: orderId,
            },
            { upsert: true, new: true }
        );

        // Link payment to subscription
        payment.subscription = subscription._id;
        await payment.save();

        // Create Pakasir transaction
        const pakasirResponse = await pakasir.createTransaction({
            orderId,
            amount: PREMIUM_PRICE,
            customerEmail: user.email,
            customerName: user.displayName || user.username,
            method,
            description: `Internal Analyst Premium - 1 Bulan`,
        });

        // Update payment with Pakasir data
        payment.pakasirTransactionId = pakasirResponse.transaction_id || pakasirResponse.id;
        payment.paymentUrl = pakasirResponse.payment_url || pakasirResponse.invoice_url;
        payment.qrCodeUrl = pakasirResponse.qr_code || pakasirResponse.qr_url;
        payment.vaNumber = pakasirResponse.va_number;
        payment.expiredAt = pakasirResponse.expired_at ? new Date(pakasirResponse.expired_at) : new Date(Date.now() + 24 * 60 * 60 * 1000);
        await payment.save();

        // Update subscription with payment URL
        subscription.paymentUrl = payment.paymentUrl;
        subscription.paymentMethod = method;
        await subscription.save();

        console.log(`[Subscription] Checkout created: ${orderId} for user ${userId}`);

        res.json({
            success: true,
            orderId,
            payment: {
                amount: PREMIUM_PRICE,
                currency: "IDR",
                method,
                paymentUrl: payment.paymentUrl,
                qrCodeUrl: payment.qrCodeUrl,
                vaNumber: payment.vaNumber,
                expiredAt: payment.expiredAt,
            },
        });
    } catch (error) {
        console.error("[Subscription] checkout error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to create checkout" });
    }
};

/**
 * GET /api/subscription/verify/:orderId
 * Verify payment status
 */
export const verifyPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const payment = await Payment.findOne({ orderId, user: userId });
        if (!payment) {
            return res.status(404).json({ success: false, error: "Payment not found" });
        }

        // Check status from Pakasir
        let pakasirStatus = payment.status;
        try {
            const pakasirDetail = await pakasir.getTransactionDetail(orderId);
            pakasirStatus = pakasirDetail.status || payment.status;

            // Update if status changed
            if (pakasirStatus !== payment.status) {
                payment.status = pakasirStatus;
                if (pakasirStatus === "paid") {
                    payment.paidAt = new Date();
                }
                await payment.save();

                // Activate subscription if paid
                if (pakasirStatus === "paid") {
                    await activateSubscription(userId, payment);
                }
            }
        } catch (err) {
            console.error("[Subscription] Verify error:", err.message);
        }

        const subscription = await Subscription.findOne({ user: userId });

        res.json({
            success: true,
            payment: {
                orderId: payment.orderId,
                status: payment.status,
                amount: payment.amount,
                paymentUrl: payment.paymentUrl,
                paidAt: payment.paidAt,
            },
            subscription: subscription ? {
                status: subscription.status,
                isActive: subscription.isActive(),
                endDate: subscription.endDate,
                trialEndsAt: subscription.trialEndsAt,
            } : null,
        });
    } catch (error) {
        console.error("[Subscription] verifyPayment error:", error);
        res.status(500).json({ success: false, error: "Failed to verify payment" });
    }
};

/**
 * POST /api/subscription/webhook
 * Handle Pakasir webhook
 */
export const webhook = async (req, res) => {
    try {
        const payload = req.body;

        console.log("[Subscription] Webhook received:", JSON.stringify(payload));

        // Parse webhook data
        const data = pakasir.parseWebhook(payload);
        const { orderId, status, amount, transactionId, paidAt } = data;

        // Find payment
        const payment = await Payment.findOne({ orderId });
        if (!payment) {
            console.error("[Subscription] Webhook: Payment not found:", orderId);
            return res.status(404).json({ success: false, error: "Payment not found" });
        }

        // Update payment status
        payment.status = status;
        payment.pakasirTransactionId = transactionId || payment.pakasirTransactionId;
        payment.webhookData = payload;

        if (status === "paid" && paidAt) {
            payment.paidAt = paidAt;
        }

        await payment.save();

        // Activate subscription if paid
        if (status === "paid") {
            await activateSubscription(payment.user, payment);
        }

        // Always return 200 to acknowledge webhook
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("[Subscription] webhook error:", error);
        res.status(200).json({ success: false }); // Still return 200
    }
};

/**
 * Activate user subscription after successful payment
 */
async function activateSubscription(userId, payment) {
    const user = await User.findById(userId);
    if (!user) return;

    const now = new Date();
    const hasHadTrial = user.subscription?.trialEndsAt != null;

    // Calculate dates
    let startDate = now;
    let endDate = new Date(now.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);
    let trialEndsAt = null;
    let status = "active";

    // If first time, give trial
    if (!hasHadTrial) {
        trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
        status = "trial";
        console.log(`[Subscription] Starting ${TRIAL_DAYS}-day trial for user ${userId}`);
    }

    // Update subscription
    const subscription = await Subscription.findOneAndUpdate(
        { user: userId },
        {
            status,
            startDate,
            endDate,
            trialEndsAt,
            pakasirOrderId: payment.orderId,
            pakasirTransactionId: payment.pakasirTransactionId,
            paymentMethod: payment.paymentMethod,
            paymentUrl: payment.paymentUrl,
        },
        { new: true }
    );

    // Update user subscription status
    user.subscription = {
        plan: "premium",
        status,
        startDate,
        endDate,
        trialEndsAt,
    };
    await user.save();

    console.log(`[Subscription] Activated for user ${userId}, status: ${status}`);

    return subscription;
}

/**
 * POST /api/subscription/cancel
 * Cancel subscription
 */
export const cancelSubscription = async (req, res) => {
    try {
        const userId = req.user.id;

        const subscription = await Subscription.findOne({ user: userId });
        if (!subscription) {
            return res.status(404).json({ success: false, error: "No subscription found" });
        }

        // Cancel in Pakasir if pending payment
        if (subscription.pakasirOrderId && subscription.status === "pending") {
            try {
                await pakasir.cancelTransaction(subscription.pakasirOrderId);
            } catch (err) {
                console.error("[Subscription] Cancel Pakasir error:", err.message);
            }
        }

        // Update subscription
        subscription.status = "cancelled";
        subscription.cancelledAt = new Date();
        await subscription.save();

        // Update user
        await User.findByIdAndUpdate(userId, {
            "subscription.status": "cancelled",
            "subscription.plan": "free",
        });

        res.json({
            success: true,
            message: "Subscription cancelled successfully",
        });
    } catch (error) {
        console.error("[Subscription] cancel error:", error);
        res.status(500).json({ success: false, error: "Failed to cancel subscription" });
    }
};

/**
 * POST /api/subscription/start-trial
 * Start free trial (if eligible)
 */
export const startTrial = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // Check if already had trial
        if (user.subscription?.trialEndsAt) {
            return res.status(400).json({
                success: false,
                error: "You have already used your free trial",
            });
        }

        // Check if already has active subscription
        const existingSub = await Subscription.findOne({ user: userId });
        if (existingSub && existingSub.isActive()) {
            return res.status(400).json({
                success: false,
                error: "You already have an active subscription",
            });
        }

        // Start trial
        const now = new Date();
        const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

        const subscription = await Subscription.findOneAndUpdate(
            { user: userId },
            {
                user: userId,
                plan: "premium",
                status: "trial",
                startDate: now,
                endDate: trialEndsAt, // Same as trial end for simplicity
                trialEndsAt,
                amount: 0,
            },
            { upsert: true, new: true }
        );

        // Update user
        user.subscription = {
            plan: "premium",
            status: "trial",
            startDate: now,
            endDate: trialEndsAt,
            trialEndsAt,
        };
        await user.save();

        console.log(`[Subscription] Trial started for user ${userId}, ends at ${trialEndsAt}`);

        res.json({
            success: true,
            message: `${TRIAL_DAYS}-day free trial started!`,
            subscription: {
                status: "trial",
                trialEndsAt,
                daysRemaining: TRIAL_DAYS,
            },
        });
    } catch (error) {
        console.error("[Subscription] startTrial error:", error);
        res.status(500).json({ success: false, error: "Failed to start trial" });
    }
};

/**
 * GET /api/subscription/history
 * Get payment history for user
 */
export const getHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const payments = await Payment.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .select("orderId amount status paymentMethod createdAt paidAt");

        res.json({
            success: true,
            payments,
        });
    } catch (error) {
        console.error("[Subscription] getHistory error:", error);
        res.status(500).json({ success: false, error: "Failed to get payment history" });
    }
};

export default {
    getPlans,
    getStatus,
    checkout,
    verifyPayment,
    webhook,
    cancelSubscription,
    startTrial,
    getHistory,
};
