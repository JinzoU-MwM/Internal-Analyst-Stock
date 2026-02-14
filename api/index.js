import "dotenv/config";
import app from "../app.js";
import connectDB from "../config/db.js";

// Connect to MongoDB once (cached across warm invocations)
await connectDB();

export default app;
