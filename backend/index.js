const { app } = require('@azure/functions');

// Global configuration for Azure Functions
app.setup({
    enableHttpStream: true, // Enable HTTP streaming for large payloads
});

// Optional: Add global middleware (if needed)
app.use(async (context, next) => {
    try {
        console.log(`Incoming request: ${context.req.method} ${context.req.url}`);
        await next(); // Proceed to the next middleware or function
    } catch (error) {
        console.error('Global error handler:', error);
        context.res = {
            status: 500,
            body: { error: 'An unexpected error occurred' },
        };
    }
});

console.log('Azure Functions app initialized.');