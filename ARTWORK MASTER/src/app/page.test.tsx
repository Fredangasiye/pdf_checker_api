import { render, screen } from '@/lib/test-utils'
import Home from './page'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    
    expect(screen.getByRole('heading', { 
      name: /welcome to beith digital preflight portal/i 
    })).toBeInTheDocument()
  })

  it('renders the upload section', () => {
    render(<Home />)
    
    expect(screen.getByRole('heading', { 
      name: /upload your artwork/i 
    })).toBeInTheDocument()
    expect(screen.getByText(/drag and drop your files here/i)).toBeInTheDocument()
  })

  it('displays supported file formats', () => {
    render(<Home />)
    
    expect(screen.getByText(/PDF, AI, INDD, PSD, TIFF/i)).toBeInTheDocument()
  })

  it('renders feature highlights', () => {
    render(<Home />)
    
    expect(screen.getByRole('heading', { 
      name: /Instant Validation/i 
    })).toBeInTheDocument()
    expect(screen.getByRole('heading', { 
      name: /Visual Preview/i 
    })).toBeInTheDocument()
    expect(screen.getByRole('heading', { 
      name: /Smart Guidance/i 
    })).toBeInTheDocument()
  })
}) 