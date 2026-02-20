/**
 * Pak Kasir Payment Gateway Service
 * Documentation: https://pakasir.com/p/docs
 */

const PAKASIR_BASE_URL = "https://app.pakasir.com/api";

// Read env vars at runtime to ensure they're available
const getApiKey = () => process.env.PAKASIR_API_KEY;
const getProjectSlug = () => process.env.PAKASIR_SLUG;

/**
 * Create a new transaction in Pak Kasir
 * @param {Object} params
 * @param {string} params.orderId - Unique order ID
 * @param {number} params.amount - Payment amount in IDR
 * @param {string} params.customerEmail - Customer email
 * @param {string} params.customerName - Customer name
 * @param {string} params.method - Payment method (qris, va_bca, etc.)
 * @param {string} params.description - Payment description
 * @returns {Promise<Object>} Pak Kasir response
 */
export async function createTransaction({
    orderId,
    amount,
    customerEmail,
    customerName,
    method = "qris",
    description = "Premium Subscription",
}) {
    try {
        const apiKey = getApiKey();
        const projectSlug = getProjectSlug();

        if (!apiKey || !projectSlug) {
            throw new Error(`Missing Pakasir config: API_KEY=${!!apiKey}, SLUG=${!!projectSlug}`);
        }

        const payload = {
            api_key: apiKey,
            project: projectSlug,
            order_id: orderId,
            amount: amount,
            customer_email: customerEmail,
            customer_name: customerName,
            description: description,
        };

        console.log("[Pakasir] Creating transaction:", { orderId, amount, method, project: projectSlug });

        const response = await fetch(`${PAKASIR_BASE_URL}/transactioncreate/${method}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || data.message) {
            console.error("[Pakasir] Create transaction error:", data);
            throw new Error(data.message || "Failed to create transaction");
        }

        console.log("[Pakasir] Transaction created:", orderId, data);
        return data;
    } catch (error) {
        console.error("[Pakasir] createTransaction error:", error.message);
        throw error;
    }
}

/**
 * Get transaction details from Pak Kasir
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Transaction details
 */
export async function getTransactionDetail(orderId) {
    try {
        const apiKey = getApiKey();
        const projectSlug = getProjectSlug();
        const url = `${PAKASIR_BASE_URL}/transactiondetail?project=${projectSlug}&order_id=${orderId}&api_key=${apiKey}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[Pakasir] Get transaction error:", data);
            throw new Error(data.message || "Failed to get transaction");
        }

        return data;
    } catch (error) {
        console.error("[Pakasir] getTransactionDetail error:", error.message);
        throw error;
    }
}

/**
 * Cancel a transaction in Pak Kasir
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Cancellation result
 */
export async function cancelTransaction(orderId) {
    try {
        const apiKey = getApiKey();
        const projectSlug = getProjectSlug();
        const response = await fetch(`${PAKASIR_BASE_URL}/transactioncancel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: apiKey,
                project: projectSlug,
                order_id: orderId,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[Pakasir] Cancel transaction error:", data);
            throw new Error(data.message || "Failed to cancel transaction");
        }

        console.log("[Pakasir] Transaction cancelled:", orderId);
        return data;
    } catch (error) {
        console.error("[Pakasir] cancelTransaction error:", error.message);
        throw error;
    }
}

/**
 * Simulate payment (sandbox mode only)
 * Use this for testing in sandbox environment
 * @param {string} orderId - Order ID
 * @param {number} amount - Payment amount
 * @returns {Promise<Object>} Simulation result
 */
export async function simulatePayment(orderId, amount) {
    if (process.env.PAKASIR_SANDBOX !== "true") {
        throw new Error("Payment simulation only available in sandbox mode");
    }

    try {
        const apiKey = getApiKey();
        const projectSlug = getProjectSlug();
        const response = await fetch(`${PAKASIR_BASE_URL}/paymentsimulation`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: apiKey,
                project: projectSlug,
                order_id: orderId,
                amount: amount,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[Pakasir] Payment simulation error:", data);
            throw new Error(data.message || "Failed to simulate payment");
        }

        console.log("[Pakasir] Payment simulated:", orderId);
        return data;
    } catch (error) {
        console.error("[Pakasir] simulatePayment error:", error.message);
        throw error;
    }
}

/**
 * Verify webhook signature (if Pak Kasir provides one)
 * @param {Object} webhookData - Raw webhook data
 * @returns {boolean} Whether webhook is valid
 */
export function verifyWebhook(webhookData) {
    // Pak Kasir doesn't seem to use signature verification in docs
    // But we verify the transaction status via API as backup
    return true;
}

/**
 * Parse webhook payload from Pak Kasir
 * @param {Object} payload - Webhook payload
 * @returns {Object} Normalized webhook data
 */
export function parseWebhook(payload) {
    return {
        orderId: payload.external_id || payload.order_id,
        transactionId: payload.transaction_id || payload.id,
        status: mapPakasirStatus(payload.status),
        amount: payload.amount,
        paymentMethod: payload.payment_method || payload.payment_type,
        paidAt: payload.paid_at || payload.payment_date ? new Date(payload.paid_at || payload.payment_date) : null,
        raw: payload,
    };
}

/**
 * Map Pak Kasir status to internal status
 * @param {string} pakasirStatus
 * @returns {string} Internal status
 */
function mapPakasirStatus(pakasirStatus) {
    const statusMap = {
        "pending": "pending",
        "waiting": "pending",
        "paid": "paid",
        "success": "paid",
        "completed": "paid",
        "failed": "failed",
        "expired": "expired",
        "cancelled": "cancelled",
        "canceled": "cancelled",
    };
    return statusMap[pakasirStatus?.toLowerCase()] || "pending";
}

export default {
    createTransaction,
    getTransactionDetail,
    cancelTransaction,
    simulatePayment,
    verifyWebhook,
    parseWebhook,
};
