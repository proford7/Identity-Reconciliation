/**
 * Server entry point.
 * Loads environment variables, then starts the Express server.
 */

import dotenv from "dotenv";
dotenv.config();

import app from "./app";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Identity Reconciliation server running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Identify:     POST http://localhost:${PORT}/identify`);
});
