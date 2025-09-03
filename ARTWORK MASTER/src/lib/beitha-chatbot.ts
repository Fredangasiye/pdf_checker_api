import { AI_CONFIG, BEITHA_SYSTEM_PROMPT } from '@/lib/env'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
}

export class BEITHAChatbot {
  private apiKey: string
  private baseUrl: string
  private model: string

  constructor() {
    this.apiKey = AI_CONFIG.OPENROUTER_API_KEY || ''
    this.baseUrl = AI_CONFIG.OPENROUTER_BASE_URL
    this.model = AI_CONFIG.MISTRAL_MODEL
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured')
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to get response from AI')
      }

      const data = await response.json()
      return data.response || 'Sorry, I couldn\'t generate a response.'
    } catch (error) {
      console.error('BEITHA API error:', error)
      throw error
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }
}

export const beithaChatbot = new BEITHAChatbot() 