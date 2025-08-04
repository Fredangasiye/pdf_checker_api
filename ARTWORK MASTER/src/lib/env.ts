// Environment configuration with type safety
export const env = {
  // Application Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Beith Digital Preflight Portal',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10), // 100MB default
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'pdf,ai,indd,psd,tiff').split(','),

  // AI Assistant Configuration (Post-MVP)
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  MISTRAL_MODEL: process.env.MISTRAL_MODEL || 'mistralai/mistral-7b-instruct',

  // Vector Database Configuration (Post-MVP)
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'beith-knowledge-base',

  // Database Configuration (Future)
  DATABASE_URL: process.env.DATABASE_URL,

  // Authentication (Future)
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',

  // Email Configuration (Future)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,

  // Contact Information
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || 'gideon@beith.co.za',
  CONTACT_PHONE: process.env.CONTACT_PHONE || '011 555 5700',
} as const

// Validation function to ensure required environment variables are set
export function validateEnv() {
  const requiredVars = [
    // Add required variables here when implementing features
    // 'OPENROUTER_API_KEY', // Required for AI assistant
    // 'PINECONE_API_KEY', // Required for vector database
  ]

  const missingVars = requiredVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    )
  }
}

// Helper function to check if a feature is enabled
export const features = {
  aiAssistant: !!env.OPENROUTER_API_KEY,
  vectorDatabase: !!env.PINECONE_API_KEY,
  emailNotifications: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
  database: !!env.DATABASE_URL,
} as const

// File size validation helper
export function isValidFileSize(size: number): boolean {
  return size <= env.MAX_FILE_SIZE
}

// File type validation helper
export function isValidFileType(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension ? env.ALLOWED_FILE_TYPES.includes(extension) : false
} 