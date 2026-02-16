import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function clearExpiryForVerifiedUsers() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const result = await mongoose.connection.db.collection("users").updateMany(
        { isEmailVerified: true },
        { $unset: { accountExpiresAt: "" } }
    );

    console.log(`Cleared accountExpiresAt for ${result.modifiedCount} verified users`);

    await mongoose.disconnect();
    process.exit(0);
}

clearExpiryForVerifiedUsers().catch(e => { console.error(e); process.exit(1); });
