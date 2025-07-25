import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import { categorizeThoughtsFlow, healthCheckFlow, enhanceNodeFlow } from './genkit'
import { testGoogleAI } from './test-google-ai'

admin.initializeApp()

// Define secrets for API keys
const googleAiApiKey = defineSecret('GOOGLE_AI_API_KEY')
const openaiApiKey = defineSecret('OPENAI_API_KEY')

// Genkit flow execution endpoint
export const categorizeThoughts = onRequest(
  {
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 300, // 5 minutes
    memory: '1GiB',
    secrets: [googleAiApiKey, openaiApiKey],
  },
  async (request, response) => {
    try {
      // Skip authentication in emulator
      const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true'

      if (!isEmulator) {
        // Verify authentication only in production
        const authHeader = request.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          response.status(401).json({ error: 'Unauthorized' })
          return
        }

        const idToken = authHeader.split('Bearer ')[1]
        try {
          await admin.auth().verifyIdToken(idToken)
        } catch (error) {
          response.status(401).json({ error: 'Invalid token' })
          return
        }
      }

      // Set API keys in environment for Genkit to use
      const googleKey =
        googleAiApiKey.value() || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENAI_API_KEY
      const openaiKey = openaiApiKey.value() || process.env.OPENAI_API_KEY

      if (googleKey) {
        process.env.GOOGLE_GENAI_API_KEY = googleKey
        process.env.GOOGLE_AI_API_KEY = googleKey
      } else {
        console.warn('No Google AI API key found')
      }

      if (openaiKey) {
        process.env.OPENAI_API_KEY = openaiKey
      }

      // Check if we have at least one API key
      if (!googleKey && !openaiKey) {
        response.status(500).json({
          error: 'Configuration error',
          message: 'No AI API keys configured. Please set GOOGLE_AI_API_KEY or OPENAI_API_KEY.',
        })
        return
      }

      const { text, provider = 'gemini', model } = request.body

      if (!text) {
        response.status(400).json({ error: 'Text is required' })
        return
      }

      // Execute the Genkit flow
      console.log('Executing categorizeThoughts flow...')
      const result = await categorizeThoughtsFlow({ text, provider, model })
      console.log('Flow result:', JSON.stringify(result, null, 2))

      response.json(result)
    } catch (error) {
      console.error('Error in categorizeThoughts:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorDetails = {
        error: 'Internal server error',
        message: errorMessage,
        provider: request.body.provider,
        model: request.body.model,
        textLength: request.body.text?.length || 0,
      }

      console.error('Sending error response:', errorDetails)
      response.status(500).json(errorDetails)
    }
  }
)

// Health check endpoint
export const healthCheck = onRequest(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request, response) => {
    try {
      const result = await healthCheckFlow({})
      response.json(result)
    } catch (error) {
      console.error('Error in healthCheck:', error)
      response.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
)

// Test Google AI endpoint
export const testGoogleAIEndpoint = onRequest(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request, response) => {
    try {
      const result = await testGoogleAI()
      response.json(result)
    } catch (error) {
      console.error('Error in testGoogleAI:', error)
      response.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
)

// Enhance node endpoint
export const enhanceNode = onRequest(
  {
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60, // 1 minute
    memory: '512MiB',
    secrets: [googleAiApiKey, openaiApiKey],
  },
  async (request, response) => {
    try {
      // Skip authentication in emulator
      const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true'

      if (!isEmulator) {
        // Verify authentication only in production
        const authHeader = request.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          response.status(401).json({ error: 'Unauthorized' })
          return
        }

        const idToken = authHeader.split('Bearer ')[1]
        try {
          await admin.auth().verifyIdToken(idToken)
        } catch (error) {
          response.status(401).json({ error: 'Invalid token' })
          return
        }
      }

      // Set API keys in environment for Genkit to use
      const googleKey =
        googleAiApiKey.value() || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENAI_API_KEY
      
      if (googleKey) {
        process.env.GOOGLE_GENAI_API_KEY = googleKey
        process.env.GOOGLE_AI_API_KEY = googleKey
      } else {
        console.warn('No Google AI API key found')
      }

      // Check if we have at least one API key
      if (!googleKey) {
        response.status(500).json({
          error: 'Configuration error',
          message: 'No AI API keys configured. Please set GOOGLE_AI_API_KEY.',
        })
        return
      }

      const { text, provider = 'gemini', model } = request.body

      if (!text) {
        response.status(400).json({ error: 'Text is required' })
        return
      }

      // Execute the Genkit flow
      console.log('Executing enhanceNode flow...')
      const result = await enhanceNodeFlow({ text, provider, model })
      console.log('Flow result:', JSON.stringify(result, null, 2))

      response.json(result)
    } catch (error) {
      console.error('Error in enhanceNode:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorDetails = {
        error: 'Internal server error',
        message: errorMessage,
        provider: request.body.provider,
        model: request.body.model,
        textLength: request.body.text?.length || 0,
      }

      console.error('Sending error response:', errorDetails)
      response.status(500).json(errorDetails)
    }
  }
)

// Genkit flow runner endpoint for development
export const genkitFlowRunner = onRequest(
  {
    cors: true,
    maxInstances: 10,
    secrets: [googleAiApiKey, openaiApiKey],
  },
  async (request, response) => {
    // This endpoint is for Genkit's flow runner UI in development
    // It's automatically handled by Genkit
    response.status(200).send('Genkit flow runner endpoint')
  }
)
