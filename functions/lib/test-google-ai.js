"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testGoogleAI = void 0;
const generative_ai_1 = require("@google/generative-ai");
async function testGoogleAI() {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
        console.error('No Google AI API key found');
        return { error: 'No API key' };
    }
    try {
        console.log('Testing Google AI with key:', `${apiKey.substring(0, 10)}...`);
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Say hello');
        const response = await result.response;
        const text = response.text();
        console.log('Google AI test successful:', text);
        return { success: true, response: text };
    }
    catch (error) {
        console.error('Google AI test failed:', error);
        return {
            error: 'Test failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
exports.testGoogleAI = testGoogleAI;
//# sourceMappingURL=test-google-ai.js.map