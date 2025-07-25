"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genkitFlowRunner = exports.enhanceNode = exports.testGoogleAIEndpoint = exports.healthCheck = exports.categorizeThoughts = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = require("firebase-admin");
const genkit_1 = require("./genkit");
const test_google_ai_1 = require("./test-google-ai");
admin.initializeApp();
// Define secrets for API keys
const googleAiApiKey = (0, params_1.defineSecret)('GOOGLE_AI_API_KEY');
const openaiApiKey = (0, params_1.defineSecret)('OPENAI_API_KEY');
// Genkit flow execution endpoint
exports.categorizeThoughts = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 300,
    memory: '1GiB',
    secrets: [googleAiApiKey, openaiApiKey],
}, async (request, response) => {
    var _a;
    try {
        // Skip authentication in emulator
        const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
        if (!isEmulator) {
            // Verify authentication only in production
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                response.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const idToken = authHeader.split('Bearer ')[1];
            try {
                await admin.auth().verifyIdToken(idToken);
            }
            catch (error) {
                response.status(401).json({ error: 'Invalid token' });
                return;
            }
        }
        // Set API keys in environment for Genkit to use
        const googleKey = googleAiApiKey.value() || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
        const openaiKey = openaiApiKey.value() || process.env.OPENAI_API_KEY;
        if (googleKey) {
            process.env.GOOGLE_GENAI_API_KEY = googleKey;
            process.env.GOOGLE_AI_API_KEY = googleKey;
        }
        else {
            console.warn('No Google AI API key found');
        }
        if (openaiKey) {
            process.env.OPENAI_API_KEY = openaiKey;
        }
        // Check if we have at least one API key
        if (!googleKey && !openaiKey) {
            response.status(500).json({
                error: 'Configuration error',
                message: 'No AI API keys configured. Please set GOOGLE_AI_API_KEY or OPENAI_API_KEY.',
            });
            return;
        }
        const { text, provider = 'gemini', model } = request.body;
        if (!text) {
            response.status(400).json({ error: 'Text is required' });
            return;
        }
        // Execute the Genkit flow
        console.log('Executing categorizeThoughts flow...');
        const result = await (0, genkit_1.categorizeThoughtsFlow)({ text, provider, model });
        console.log('Flow result:', JSON.stringify(result, null, 2));
        response.json(result);
    }
    catch (error) {
        console.error('Error in categorizeThoughts:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorDetails = {
            error: 'Internal server error',
            message: errorMessage,
            provider: request.body.provider,
            model: request.body.model,
            textLength: ((_a = request.body.text) === null || _a === void 0 ? void 0 : _a.length) || 0,
        };
        console.error('Sending error response:', errorDetails);
        response.status(500).json(errorDetails);
    }
});
// Health check endpoint
exports.healthCheck = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
}, async (request, response) => {
    try {
        const result = await (0, genkit_1.healthCheckFlow)({});
        response.json(result);
    }
    catch (error) {
        console.error('Error in healthCheck:', error);
        response.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Test Google AI endpoint
exports.testGoogleAIEndpoint = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
}, async (request, response) => {
    try {
        const result = await (0, test_google_ai_1.testGoogleAI)();
        response.json(result);
    }
    catch (error) {
        console.error('Error in testGoogleAI:', error);
        response.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Enhance node endpoint
exports.enhanceNode = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: '512MiB',
    secrets: [googleAiApiKey, openaiApiKey],
}, async (request, response) => {
    var _a;
    try {
        // Skip authentication in emulator
        const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
        if (!isEmulator) {
            // Verify authentication only in production
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                response.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const idToken = authHeader.split('Bearer ')[1];
            try {
                await admin.auth().verifyIdToken(idToken);
            }
            catch (error) {
                response.status(401).json({ error: 'Invalid token' });
                return;
            }
        }
        // Set API keys in environment for Genkit to use
        const googleKey = googleAiApiKey.value() || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
        if (googleKey) {
            process.env.GOOGLE_GENAI_API_KEY = googleKey;
            process.env.GOOGLE_AI_API_KEY = googleKey;
        }
        else {
            console.warn('No Google AI API key found');
        }
        // Check if we have at least one API key
        if (!googleKey) {
            response.status(500).json({
                error: 'Configuration error',
                message: 'No AI API keys configured. Please set GOOGLE_AI_API_KEY.',
            });
            return;
        }
        const { text, provider = 'gemini', model } = request.body;
        if (!text) {
            response.status(400).json({ error: 'Text is required' });
            return;
        }
        // Execute the Genkit flow
        console.log('Executing enhanceNode flow...');
        const result = await (0, genkit_1.enhanceNodeFlow)({ text, provider, model });
        console.log('Flow result:', JSON.stringify(result, null, 2));
        response.json(result);
    }
    catch (error) {
        console.error('Error in enhanceNode:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorDetails = {
            error: 'Internal server error',
            message: errorMessage,
            provider: request.body.provider,
            model: request.body.model,
            textLength: ((_a = request.body.text) === null || _a === void 0 ? void 0 : _a.length) || 0,
        };
        console.error('Sending error response:', errorDetails);
        response.status(500).json(errorDetails);
    }
});
// Genkit flow runner endpoint for development
exports.genkitFlowRunner = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
    secrets: [googleAiApiKey, openaiApiKey],
}, async (request, response) => {
    // This endpoint is for Genkit's flow runner UI in development
    // It's automatically handled by Genkit
    response.status(200).send('Genkit flow runner endpoint');
});
//# sourceMappingURL=index.js.map