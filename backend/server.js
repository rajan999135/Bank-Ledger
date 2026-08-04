require("dotenv").config();

const app = require("./src/app");
const connectToDB = require("./src/config/db");

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        console.log("1. Starting server...");
        console.log("2. Connecting to MongoDB...");

        await connectToDB();

        console.log("3. MongoDB connected successfully");

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`4. Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();