/**
 * FoodRiders Hostinger-Stable Entry Point
 * DO NOT RESTRUCTURE. DO NOT CHANGE FRAMEWORK.
 */
const path = require('path');
const express = require('express');

console.log("Server starting...");

try {
    // We require your existing server logic.
    // This allows us to keep your folder structure exactly as is.
    require('./server/server.js');
} catch (error) {
    console.error("CRITICAL: Failed to load server.js");
    console.error(error);

    // Fail gracefully: Start a minimal server to report the error if the main one fails
    const app = express();
    const port = process.env.PORT || 5000;
    app.get('*', (req, res) => res.status(500).send("Server is starting or encountered a configuration error. Check logs."));
    app.listen(port, () => {
        console.log(`Fallback listening on port ${port}`);
    });
}

// Uncaught Error Logging
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});
