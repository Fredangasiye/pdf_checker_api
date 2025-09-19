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
  constructor() {}

  async sendMessage(messages: ChatMessage[]): Promise<string> {
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
    return true
  }
}

export const beithaChatbot = new BEITHAChatbot() 