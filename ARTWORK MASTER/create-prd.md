# Product Requirements Document: Beith Digital Preflight Portal

## 1. Introduction

Beith Digital currently faces a common challenge in the print industry: clients frequently submit artwork files that do not meet the required technical specifications for high-quality printing. This leads to production delays, increased manual labor for the DTP (Desktop Publishing) team, and client frustration. This project, the **Beith Digital Preflight Portal**, aims to solve this problem by providing a client-facing, automated web platform that validates artwork against Beith Digital's specific guidelines, provides a clear visual proof, and offers simple, actionable feedback for corrections.

## 2. Goals

*   **Primary Goal:** To drastically reduce the number of incorrectly submitted artwork files, thereby streamlining the pre-production workflow.
*   **User Goals:**
    *   **For Clients:** To get instant, clear feedback on their artwork and understand exactly what to fix without needing technical expertise.
    *   **For Designers:** To have a reliable tool to verify their files against Beith's specs before submission, saving them time and revisions.
*   **Business Goals:**
    *   **Efficiency:** Decrease the time spent by the DTP team on manual file checks and client communication.
    *   **Client Satisfaction:** Enhance the client experience by providing a modern, transparent, and helpful tool.
    *   **Brand Image:** Position Beith Digital as a technologically advanced and client-focused partner.

## 3. User Personas

### Persona 1: The Client (Non-Technical)

*   **Name:** Sarah, Marketing Manager
*   **Background:** Manages marketing for a mid-sized retail company. She is responsible for commissioning and approving branding materials but is not a graphic designer. She is tech-savvy but unfamiliar with print-specific terms like "bleed," "CMYK," or "DPI."
*   **Goals:** "I need to get our new posters printed for a campaign launching next week. I just want to upload the file our freelancer sent me and know if it's going to print correctly. If not, I need to send simple, clear instructions back to the designer."
*   **Frustrations:** Vague feedback like "resolution is too low" is not helpful. Delays in printing can jeopardize campaign timelines.

### Persona 2: The Designer (Technical)

*   **Name:** David, Freelance Graphic Designer
*   **Background:** Works with multiple clients and print shops. Proficient in Adobe Creative Suite (Illustrator, InDesign, Photoshop).
*   **Goals:** "I want to make sure my file is perfect before I send it to Beith Digital. Every print shop has slightly different rules for bleed and color profiles. I want a tool that gives me a quick pass/fail and tells me *exactly* which setting is wrong so I can fix it in 2 minutes and move on."
*   **Frustrations:** Having work rejected for a minor spec issue that could have been caught automatically. Wasting time on back-and-forth emails.

## 4. Features and Functionality

### 4.1. Core Features (MVP)

*   **Secure File Uploader:**
    *   A simple drag-and-drop or file selection interface.
    *   Supports required formats: PDF, AI, INDD (packaged), PSD, TIFF.
    *   Provides clear feedback on upload progress and file size limits.
*   **Artwork Preflight Engine:**
    *   This is the core analysis module. It will check the uploaded file against Beith Digital's rules (as defined in the Artwork Guidelines document).
    *   **Checks to perform:**
        *   **Dimensions:** Verifies final dimensions (Height x Width).
        *   **Resolution:** Checks True DPI based on the scale and final size.
        *   **Bleed:** Confirms the correct bleed has been added.
        *   **Live Area / Safety Margin:** Ensures critical content is within the safe zone.
        *   **Color Space:** Verifies the file is CMYK, not RGB. Detects spot colors.
        *   **Fonts:** Checks if fonts are embedded or converted to outlines.
        *   **Overprint Settings:** Flags potential issues with white overprint.
*   **Results Dashboard:**
    *   Displays a clear "Print Ready" or "Corrections Needed" status.
    *   Shows a visual preview/thumbnail of the artwork.
    *   Lists all checks performed with a simple pass/fail (Green Check / Red X) icon for each.
*   **Correction Guidance:**
    *   For any failed check, the system will provide a comprehensive but easy-to-understand explanation of the problem.
    *   It will link to relevant help articles or generate step-by-step instructions (e.g., "How to export a print-ready PDF from Adobe Illustrator," "How to convert your file to CMYK").
*   **Visual Print Preview:**
    *   Renders a high-fidelity preview of the final artwork.
    *   Visually overlays guides for trim, bleed, and live area so the user can see exactly where the issues are.

### 4.2. "Wow" Feature (Post-MVP or Stretch Goal)

*   **AI Help Assistant:**
    *   An integrated chatbot powered by an AI model (Mistral 7B via OpenRouter.ai).
    *   Functions as a RAG (Retrieval-Augmented Generation) system.
    *   **Knowledge Base:** The AI will be trained on Beith Digital's "Artwork Guidelines" document, company FAQ (turnaround times, contact info, services), and general print knowledge.
    *   **User Interaction:** Clients can ask natural language questions like, "What should the resolution be for a 10-meter banner?", "What are your business hours?", or "Why is my file's bleed wrong?".

### 4.3. Admin & System Features

*   **Admin Dashboard:** A secure area for Beith Digital staff.
*   **Rules Engine Management:** Allows the DTP Manager to update preflight rules (e.g., change bleed requirements for a new product) without needing a developer.
*   **User/Project Tracking:** A simple view to see uploaded files, their status, and which client they belong to.

## 5. Monetization

This platform is not intended for direct monetization. It will be a **value-add service** provided free of charge to Beith Digital clients. The ROI will be measured through internal cost savings (reduced DTP labor) and increased client retention and satisfaction.

## 6. Technical Considerations

*   **Frontend:** A modern JavaScript framework like React or Vue.js for a responsive and interactive user experience. The design will adhere to the Beith Digital brand guide (blue, white, with red accents).
*   **Backend:** A robust backend capable of handling large file uploads and processing. Node.js or Python (with libraries like Pillow, Wand for image processing, and PDF processing libraries) are strong candidates.
*   **File Analysis:** Integration with command-line tools like Ghostscript or dedicated preflighting APIs may be necessary for deep analysis of PDF and other complex formats.
*   **AI Integration:** The backend will need to connect to the OpenRouter.ai API to pass prompts to the Mistral 7B model. A vector database (e.g., Pinecone, ChromaDB) will be required to store embeddings of the knowledge base for the RAG system.
*   **Hosting:** A cloud platform like AWS (using S3 for file storage, EC2/Lambda for compute) or Vercel for the frontend and a scalable backend service.

## 7. Success Metrics

*   **Primary Metric:** Percentage reduction in artwork files rejected for technical errors (Target: 70% reduction within 6 months).
*   **Secondary Metrics:**
    *   Average time spent by DTP staff per project.
    *   Client adoption rate (percentage of projects processed through the portal).
    *   Client satisfaction (measured via a simple survey/NPS score after use).