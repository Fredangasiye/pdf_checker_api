// Environment configuration with type safety
export const env = {
  // Application Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'vAIb Preflight Portal',
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
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'vaib-knowledge-base',

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
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || 'contact@vaib.ai',
  CONTACT_PHONE: process.env.CONTACT_PHONE || '011 555 5700',
} as const

// Validation function to ensure required environment variables are set
export function validateEnv() {
  const requiredVars: string[] = [
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

// AI Assistant Configuration
export const AI_CONFIG = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  MISTRAL_MODEL: process.env.MISTRAL_MODEL || 'mistralai/mistral-7b-instruct',
  MAX_TOKENS: 1200,
  TEMPERATURE: 0.8,
} as const

// Chatbot system prompt for vAIb
export const BEITHA_SYSTEM_PROMPT = `You are vAIb, an AI assistant for the vAIb Preflight Portal. You are friendly, helpful, and knowledgeable about both casual conversation and professional print production.

**Your Primary Expertise:**
1. **Artwork Analysis**: Explain preflight results, font issues, color space problems, spot color detection
2. **File Processing**: Guide users through PDF color changes, bleed addition/removal, file validation
3. **Print Production**: Provide advice on print specifications, resolution, color management
4. **Software Guidance**: Help with Adobe Illustrator, Photoshop, InDesign workflows
5. **Technical Support**: Answer questions about file formats, color spaces, print requirements

**Your Personality:**
- Friendly and approachable, but professional when discussing technical topics
- Happy to engage in casual conversation (greetings, small talk, general questions)
- Always ready to help with artwork and print production questions
- Use technical terms when appropriate but explain them clearly
- If you don't know something, say so rather than guessing

**Response Guidelines:**
- For casual conversation: Be warm, conversational, and natural
- For technical questions: Be precise, helpful, and educational
- Always maintain your helpful and professional demeanor
- Keep responses concise but complete
- Feel free to ask clarifying questions when needed

Current context: User may be working with artwork files and print production tools, or just having a friendly chat.`
