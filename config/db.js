import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;
    try {
        const conn = await mongoose.connect((process.env.MONGO_URI || "").trim(), {
            serverSelectionTimeoutMS: 5000,
        });
        isConnected = true;
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        throw error; // Don't process.exit in serverless
    }
};

export default connectDB;

