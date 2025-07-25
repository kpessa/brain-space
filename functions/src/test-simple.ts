import { onRequest } from 'firebase-functions/v2/https'

// Simple test endpoint that doesn't use Genkit
export const testSimple = onRequest(
  {
    cors: true,
    timeoutSeconds: 30,
  },
  async (request, response) => {
    console.log('Test simple endpoint called')

    try {
      // Just echo back the request
      const { text } = request.body

      response.json({
        success: true,
        message: 'Simple test endpoint working',
        receivedText: text,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error in testSimple:', error)
      response.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
)
