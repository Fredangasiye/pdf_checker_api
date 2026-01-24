# vAIb Preflight Portal

A client-facing web platform for automated artwork validation against Beith Digital's print specifications. This portal helps reduce incorrectly submitted artwork files by providing instant feedback and clear correction guidance.

## 🎯 Project Goals

- **Primary Goal**: Reduce incorrectly submitted artwork files by 70% within 6 months
- **User Goals**: Provide instant, clear feedback on artwork specifications
- **Business Goals**: Streamline pre-production workflow and enhance client satisfaction

## 🚀 Features

### Core Features (MVP)
- **Secure File Upload**: Drag-and-drop interface supporting PDF, AI, INDD, PSD, TIFF
- **Artwork Preflight Engine**: Comprehensive validation against Beith Digital's specifications
- **Results Dashboard**: Clear "Print Ready" or "Corrections Needed" status
- **Visual Print Preview**: High-fidelity preview with trim, bleed, and live area overlays
- **Correction Guidance**: Step-by-step instructions for fixing issues

### Post-MVP Features
- **AI Help Assistant**: Chatbot powered by Mistral 7B for natural language queries
- **Admin Dashboard**: Rules management and project tracking
- **Analytics**: Usage reporting and performance metrics

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Testing**: Jest, React Testing Library
- **AI Integration**: OpenRouter.ai (Mistral 7B)
- **Vector Database**: Pinecone (for RAG system)
- **Styling**: Custom vAIb brand colors and Futura font

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vaib-preflight-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   │   ├── upload/        # File upload endpoints
│   │   └── preflight/     # Preflight analysis endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── FileUploader.tsx  # File upload component
│   ├── PreflightResults.tsx # Results display
│   └── VisualPreview.tsx # Print preview component
└── lib/                  # Utility libraries
    ├── env.ts            # Environment configuration
    ├── preflight-engine.ts # Core validation logic
    ├── file-processor.ts # File processing utilities
    └── test-utils.tsx    # Testing utilities
```

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Application Configuration
NEXT_PUBLIC_APP_NAME="vAIb Preflight Portal"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=104857600
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=pdf,ai,indd,psd,tiff

# AI Assistant Configuration (Post-MVP)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
MISTRAL_MODEL=mistralai/mistral-7b-instruct

# Vector Database Configuration (Post-MVP)
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=vaib-knowledge-base

# Contact Information
CONTACT_EMAIL=contact@vaib.ai
CONTACT_PHONE=011 555 5700
```

## 🧪 Testing

The project uses Jest and React Testing Library for comprehensive testing:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🎨 Design System

The application uses vAIb's brand colors:
- **Primary Blue**: `#2563eb` (vaib-blue-600)
- **Accent Red**: `#dc2626` (vaib-red-600)
- **Neutral Grays**: Various shades for text and backgrounds

## 📊 Validation Rules

The preflight engine validates artwork against vAIb's specifications:

- **Dimensions**: Height x Width format in millimeters
- **Resolution**: True DPI based on scale and final size
- **Bleed**: Correct bleed requirements for each print type
- **Live Area**: Safety margins for critical content
- **Color Space**: CMYK verification and spot color detection
- **Fonts**: Embedded fonts or converted outlines
- **Overprint Settings**: Proper overprint configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For technical support or questions about artwork specifications:
- **Email**: contact@vaib.ai
- **Phone**: 011 555 5700

## 📄 License

This project is proprietary to vAIb. All rights reserved.

## 🗺️ Roadmap

- [x] Project setup and infrastructure
- [ ] Core file upload and processing system
- [ ] Artwork preflight engine implementation
- [ ] User interface and results dashboard
- [ ] Admin dashboard and management features
- [ ] AI help assistant integration
