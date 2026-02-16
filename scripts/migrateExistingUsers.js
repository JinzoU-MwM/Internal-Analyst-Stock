import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Migration Script: Mark all existing users as email-verified
 * Run this once after deploying the email verification feature
 * to ensure existing users can still login.
 */

async function migrateExistingUsers() {
    try {
        // Connect to database
        const DB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/internal-analyst";
        await mongoose.connect(DB_URI);
        console.log("[Migration] Connected to MongoDB");

        // Find users without isEmailVerified field or with false value
        const result = await User.updateMany(
            {
                $or: [
                    { isEmailVerified: { $exists: false } },
                    { isEmailVerified: false, createdAt: { $lt: new Date("2026-02-16") } }
                ]
            },
            {
                $set: {
                    isEmailVerified: true,
                    emailVerificationToken: undefined,
                    emailVerificationExpires: undefined
                }
            }
        );

        console.log(`[Migration] Updated ${result.modifiedCount} existing users`);
        console.log(`[Migration] All existing users are now verified`);

        // Show current verification stats
        const verified = await User.countDocuments({ isEmailVerified: true });
        const unverified = await User.countDocuments({ isEmailVerified: false });
        const total = await User.countDocuments();

        console.log(`\n[Stats] Total users: ${total}`);
        console.log(`[Stats] Verified: ${verified}`);
        console.log(`[Stats] Unverified: ${unverified}`);

        await mongoose.disconnect();
        console.log("\n[Migration] Complete! ✅");
        process.exit(0);
    } catch (error) {
        console.error("[Migration] Error:", error.message);
        process.exit(1);
    }
}

migrateExistingUsers();
