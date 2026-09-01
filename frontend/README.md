# AI Commerce Platform - Frontend

Frontend application built with React, TypeScript, Vite, and Tailwind CSS.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client

## Project Structure

```
src/
├── components/      # Reusable React components
├── pages/          # Page components
├── layouts/        # Layout components
├── hooks/          # Custom React hooks
├── services/       # API and external services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── context/        # React Context stores
├── App.tsx         # Root component
└── main.tsx        # Entry point
```

## Prerequisites

- Node.js 16+ and npm

## Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

## Running the Application

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

The development server includes:
- Hot Module Replacement (HMR) for instant updates
- Proxy to backend API at `http://localhost:8000`

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## API Integration

The dev server automatically proxies API calls from `/api/*` to `http://localhost:8000/*`

Update the proxy configuration in `vite.config.ts` if the backend runs on a different port.

## Linting

```bash
npm run lint
```

## Development Guidelines

- Use TypeScript for all components
- Keep components in `src/components/`
- Add type definitions in `src/types/`
- Use custom hooks in `src/hooks/`
- API calls should be in `src/services/`
- Utility functions in `src/utils/`

## Environment Variables

Create a `.env.local` file if needed:

```
VITE_API_URL=http://localhost:8000
```

Access in code with `import.meta.env.VITE_API_URL`
