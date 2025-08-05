export interface AdminUser {
  id: string
  username: string
  role: 'admin' | 'dtp-manager'
  permissions: string[]
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthSession {
  user: AdminUser
  token: string
  expiresAt: Date
}

class AuthService {
  private static instance: AuthService
  private currentSession: AuthSession | null = null

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    // In a real implementation, this would validate against a database
    // For now, we'll use a simple hardcoded admin user
    if (credentials.username === 'admin' && credentials.password === 'beith2024') {
      const user: AdminUser = {
        id: '1',
        username: 'admin',
        role: 'admin',
        permissions: ['manage_users', 'view_analytics', 'manage_rules', 'manage_help']
      }

      const session: AuthSession = {
        user,
        token: this.generateToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }

      this.currentSession = session
      return session
    }

    if (credentials.username === 'dtp' && credentials.password === 'dtp2024') {
      const user: AdminUser = {
        id: '2',
        username: 'dtp',
        role: 'dtp-manager',
        permissions: ['manage_rules', 'view_analytics']
      }

      const session: AuthSession = {
        user,
        token: this.generateToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }

      this.currentSession = session
      return session
    }

    throw new Error('Invalid credentials')
  }

  async logout(): Promise<void> {
    this.currentSession = null
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    if (!this.currentSession) {
      return null
    }

    if (this.currentSession.expiresAt < new Date()) {
      this.currentSession = null
      return null
    }

    return this.currentSession
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession()
    return session !== null
  }

  async hasPermission(permission: string): Promise<boolean> {
    const session = await this.getCurrentSession()
    if (!session) {
      return false
    }

    return session.user.permissions.includes(permission)
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}

export const authService = AuthService.getInstance() 