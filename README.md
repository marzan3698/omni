# Omni CRM - Enterprise Management System

A full-stack ERP/CRM system built with React, Node.js, and TypeScript.

## Project Structure

This is a monorepo containing:

- **client/**: React frontend application (Vite + TypeScript)
- **server/**: Node.js backend API (Express + TypeScript)
- **docs/**: Project documentation and schemas

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Query for server state management
- React Hook Form + Zod for form validation
- Lucide React for icons

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM (to be configured)
- JWT for authentication
- MySQL/PostgreSQL database

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MySQL or PostgreSQL database

### Installation

1. **Install client dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Set up environment variables:**
   - Copy `server/.env.example` to `server/.env` and configure
   - Copy `client/.env.example` to `client/.env` and configure

4. **Run the development servers:**

   **Client (runs on http://localhost:5173):**
   ```bash
   cd client
   npm run dev
   ```

   **Server (runs on http://localhost:5000):**
   ```bash
   cd server
   npm run dev
   ```

## Development Guidelines

- Follow the coding standards in `.cursorrules`
- Check `docs/database_schema.md` before writing backend code
- Keep files under 200 lines - refactor when needed
- Use Controller-Service-Repository pattern for backend
- Use modular, reusable components for frontend

## Project Roadmap

See `docs/project_roadmap.md` for the complete development phases.

## License

ISC

