import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock Next.js Request and Response for API routes
if (typeof global.Request === 'undefined') {
  global.Request = class MockRequest {
    constructor(input, init = {}) {
      const url = typeof input === 'string' ? input : input.href
      Object.defineProperty(this, 'url', {
        value: url,
        writable: false,
        enumerable: true
      })
      this.method = init.method || 'GET'
      this.body = init.body || null
      this.headers = new Map()
      if (init.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value)
        })
      }
    }
    
    async formData() {
      return this.body
    }
  }
}
if (typeof global.Response === 'undefined') {
  global.Response = class MockResponse {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.headers = new Map()
      if (init.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value)
        })
      }
    }
    
    async json() {
      return this.body
    }
  }
}

// Global test utilities (only if window exists)
if (typeof window !== 'undefined') {
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))
}

// Mock window.matchMedia (only if window exists)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
} 