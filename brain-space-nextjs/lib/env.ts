/**
 * Environment variable validation and type-safe access
 */

interface EnvConfig {
  // Firebase
  NEXT_PUBLIC_FIREBASE_API_KEY: string
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string
  NEXT_PUBLIC_FIREBASE_APP_ID: string
  
  // Firebase Admin (server-side only)
  FIREBASE_ADMIN_PROJECT_ID?: string
  FIREBASE_ADMIN_CLIENT_EMAIL?: string
  FIREBASE_ADMIN_PRIVATE_KEY?: string
  
  // AI Providers
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  GOOGLE_AI_API_KEY?: string
  
  // App Config
  NODE_ENV: 'development' | 'production' | 'test'
  NEXT_PUBLIC_APP_URL?: string
}

class EnvValidator {
  private static instance: EnvValidator
  private validated = false
  private config: EnvConfig | null = null

  static getInstance(): EnvValidator {
    if (!EnvValidator.instance) {
      EnvValidator.instance = new EnvValidator()
    }
    return EnvValidator.instance
  }

  getConfig(): EnvConfig {
    if (!this.validated) {
      this.validate()
    }
    return this.config!
  }

  validate(): void {
    const errors: string[] = []
    
    // Required environment variables
    const required = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
    ]

    // Check required variables
    for (const key of required) {
      if (!process.env[key]) {
        errors.push(`Missing required environment variable: ${key}`)
      }
    }

    // Validate AI providers (at least one should be configured)
    const aiProviders = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_AI_API_KEY']
    const configuredProviders = aiProviders.filter(key => process.env[key])
    
    if (configuredProviders.length === 0) {
      console.warn('Warning: No AI providers configured. AI features will not work.')
    }

    // Server-side Firebase Admin validation
    if (typeof window === 'undefined') {
      const adminKeys = ['FIREBASE_ADMIN_PROJECT_ID', 'FIREBASE_ADMIN_CLIENT_EMAIL', 'FIREBASE_ADMIN_PRIVATE_KEY']
      const configuredAdminKeys = adminKeys.filter(key => process.env[key])
      
      if (configuredAdminKeys.length > 0 && configuredAdminKeys.length < adminKeys.length) {
        console.warn('Warning: Partial Firebase Admin configuration detected. Some server features may not work.')
      }
    }

    if (errors.length > 0) {
      throw new Error(`Environment validation failed:\n${errors.join('\n')}`)
    }

    // Build validated config
    this.config = {
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      
      FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
      FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
      
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    }

    this.validated = true
  }

  // Utility methods for common checks
  hasAIProvider(provider: 'openai' | 'anthropic' | 'google'): boolean {
    const config = this.getConfig()
    switch (provider) {
      case 'openai':
        return !!config.OPENAI_API_KEY
      case 'anthropic':
        return !!config.ANTHROPIC_API_KEY
      case 'google':
        return !!config.GOOGLE_AI_API_KEY
      default:
        return false
    }
  }

  hasFirebaseAdmin(): boolean {
    const config = this.getConfig()
    return !!(
      config.FIREBASE_ADMIN_PROJECT_ID &&
      config.FIREBASE_ADMIN_CLIENT_EMAIL &&
      config.FIREBASE_ADMIN_PRIVATE_KEY
    )
  }

  getAvailableAIProviders(): string[] {
    const config = this.getConfig()
    const providers: string[] = []
    
    if (config.OPENAI_API_KEY) providers.push('openai')
    if (config.ANTHROPIC_API_KEY) providers.push('anthropic')
    if (config.GOOGLE_AI_API_KEY) providers.push('google')
    
    return providers
  }
}

// Export singleton instance
export const env = EnvValidator.getInstance()

// Export type-safe environment access
export function getEnv(): EnvConfig {
  return env.getConfig()
}

// Utility functions
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development'
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production'
}

export function getAppUrl(): string {
  const config = getEnv()
  if (config.NEXT_PUBLIC_APP_URL) {
    return config.NEXT_PUBLIC_APP_URL
  }
  
  if (isDevelopment()) {
    return 'http://localhost:3000'
  }
  
  return 'https://your-app.vercel.app' // Update with your production URL
}