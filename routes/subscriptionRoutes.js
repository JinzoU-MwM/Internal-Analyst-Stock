import { Router } from "express";
import { protect } from "../middleware/auth.js";
import * as subscriptionController from "../controllers/subscriptionController.js";

const router = Router();

// Public routes (no auth required for webhook)
router.post("/webhook", subscriptionController.webhook);

// Protected routes
router.get("/plans", subscriptionController.getPlans);
router.get("/status", protect, subscriptionController.getStatus);
router.post("/checkout", protect, subscriptionController.checkout);
router.get("/verify/:orderId", protect, subscriptionController.verifyPayment);
router.post("/cancel", protect, subscriptionController.cancelSubscription);
router.post("/start-trial", protect, subscriptionController.startTrial);
router.get("/history", protect, subscriptionController.getHistory);

export default router;
