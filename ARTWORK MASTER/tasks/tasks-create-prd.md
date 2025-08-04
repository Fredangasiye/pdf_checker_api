# Task List: Beith Digital Preflight Portal

## Relevant Files

- `package.json` - Project dependencies and scripts configuration
- `README.md` - Project documentation and setup instructions
- `src/app/layout.tsx` - Root layout component with global styles
- `src/app/page.tsx` - Main landing page component
- `src/components/FileUploader.tsx` - Drag-and-drop file upload component
- `src/components/FileUploader.test.tsx` - Unit tests for FileUploader component
- `src/components/PreflightResults.tsx` - Results dashboard component
- `src/components/PreflightResults.test.tsx` - Unit tests for PreflightResults component
- `src/components/VisualPreview.tsx` - Visual print preview component with overlay guides
- `src/components/VisualPreview.test.tsx` - Unit tests for VisualPreview component
- `src/lib/preflight-engine.ts` - Core preflight validation logic
- `src/lib/preflight-engine.test.ts` - Unit tests for preflight engine
- `src/lib/file-processor.ts` - File processing and format handling utilities
- `src/lib/file-processor.test.ts` - Unit tests for file processor
- `src/lib/validation-rules.ts` - Beith Digital's artwork validation rules
- `src/lib/validation-rules.test.ts` - Unit tests for validation rules
- `src/app/api/upload/route.ts` - API route for file upload handling
- `src/app/api/upload/route.test.ts` - Unit tests for upload API route
- `src/app/api/preflight/route.ts` - API route for preflight analysis
- `src/app/api/preflight/route.test.ts` - Unit tests for preflight API route
- `src/app/admin/page.tsx` - Admin dashboard page
- `src/app/admin/page.test.tsx` - Unit tests for admin dashboard
- `src/components/admin/RulesManager.tsx` - Rules engine management component
- `src/components/admin/RulesManager.test.tsx` - Unit tests for RulesManager component
- `src/components/admin/ProjectTracker.tsx` - User/project tracking component
- `src/components/admin/ProjectTracker.test.tsx` - Unit tests for ProjectTracker component
- `src/lib/ai-assistant.ts` - AI help assistant integration with OpenRouter.ai
- `src/lib/ai-assistant.test.ts` - Unit tests for AI assistant
- `src/lib/vector-db.ts` - Vector database setup for RAG system
- `src/lib/vector-db.test.ts` - Unit tests for vector database
- `public/artwork-guidelines.pdf` - Beith Digital's artwork guidelines document (provided by user)
- `src/lib/validation-rules.ts` - Beith Digital's artwork validation rules based on guidelines
- `tailwind.config.js` - Tailwind CSS configuration with brand colors
- `next.config.js` - Next.js configuration
- `jest.config.js` - Jest testing configuration
- `.env.local` - Environment variables for API keys and configuration

## Tasks

- [x] 1.0 Project Setup and Infrastructure
  - [x] 1.1 Initialize Next.js project with TypeScript and Tailwind CSS
  - [x] 1.2 Configure project structure and basic routing
  - [x] 1.3 Set up testing framework (Jest) and testing utilities
  - [x] 1.4 Configure environment variables and API key management
  - [x] 1.5 Set up Git repository and initial commit
  - [x] 1.6 Create basic project documentation (README.md)

- [x] 2.0 Core File Upload and Processing System
  - [x] 2.1 Create secure file upload component with drag-and-drop interface
  - [x] 2.2 Implement file validation for supported formats (PDF, AI, INDD, PSD, TIFF)
- [x] 2.3 Set up file storage and processing pipeline
  - [x] 2.4 Create API routes for file upload handling
- [x] 2.5 Implement file size limits and upload progress feedback
- [x] 2.6 Add error handling for upload failures and invalid files

- [x] 3.0 Artwork Preflight Engine Implementation
  - [x] 3.1 Define Beith Digital's artwork validation rules and specifications
- [x] 3.2 Implement dimension validation (Height x Width checking)
  - [x] 3.3 Implement resolution validation (True DPI based on scale and final size)
- [x] 3.4 Implement bleed validation (correct bleed requirements)
- [x] 3.5 Implement live area/safety margin validation
- [x] 3.6 Implement color space validation (CMYK vs RGB, spot colors)
- [x] 3.7 Implement font validation (embedded fonts or outlines)
- [x] 3.8 Implement overprint settings validation
- [x] 3.9 Create comprehensive preflight engine that orchestrates all validations

- [x] 4.0 User Interface and Results Dashboard
  - [ ] 4.1 Design and implement main landing page with upload interface
  - [x] 4.2 Create results dashboard with "Print Ready" or "Corrections Needed" status
  - [x] 4.3 Implement visual preview/thumbnail of uploaded artwork
  - [x] 4.4 Create pass/fail indicators for each validation check
  - [x] 4.5 Implement correction guidance system with actionable feedback
  - [x] 4.6 Create visual print preview with trim, bleed, and live area overlays
  - [x] 4.7 Implement responsive design for mobile and desktop users
  - [x] 4.8 Add help articles and step-by-step correction instructions

- [ ] 5.0 Admin Dashboard and Management Features
  - [ ] 5.1 Create secure admin authentication system
  - [ ] 5.2 Implement admin dashboard with project overview
  - [ ] 5.3 Create rules engine management interface for DTP Manager
  - [ ] 5.4 Implement user/project tracking and file status monitoring
  - [ ] 5.5 Add analytics and reporting features for system usage
  - [ ] 5.6 Create admin tools for managing help articles and guidelines

- [ ] 6.0 AI Help Assistant Integration (Post-MVP)
  - [ ] 6.1 Set up OpenRouter.ai API integration for Mistral 7B model
  - [ ] 6.2 Implement vector database (Pinecone/ChromaDB) for knowledge base
  - [ ] 6.3 Create RAG system with Beith Digital's artwork guidelines
  - [ ] 6.4 Build AI chatbot interface for natural language queries
  - [ ] 6.5 Train AI on company FAQ and general print knowledge
  - [ ] 6.6 Implement conversation history and context management

### Notes

- This task list is based on the PRD for the Beith Digital Preflight Portal
- The project aims to create a client-facing web platform for automated artwork validation
- Primary goal: Reduce incorrectly submitted artwork files by 70% within 6 months
- Target users: Non-technical clients (marketing managers) and technical designers
- Core functionality: File upload, preflight validation, visual feedback, and correction guidance
- Unit tests should typically be placed alongside the code files they are testing
- Use `npm test` to run tests. Running without a path executes all tests found by the Jest configuration 