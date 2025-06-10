# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Setup and Installation
```bash
# Install all dependencies for the entire project
npm run install-all

# Install dependencies individually
npm install                    # Root dependencies
cd client && npm install       # Frontend dependencies  
cd server && npm install       # Backend dependencies

# Database setup
cd server && npm run db:setup
```

### Development
```bash
# Start both client and server in development mode
npm run dev

# Start individually
npm run client                 # Frontend only (port 3000)
npm run server                 # Backend only (port 5001)
```

### Build and Production
```bash
# Build the entire application
npm run build

# Start production server
npm start
```

### Testing and Linting
```bash
# Run all tests
npm test                       # Run server and client tests
npm run test:coverage         # Generate coverage reports

# Test individually
npm run test:server           # Backend Jest tests
npm run test:client           # Frontend React tests  
npm run test:coverage:server  # Backend coverage
npm run test:coverage:client  # Frontend coverage

# Linting
npm run lint                  # Lint both client and server
npm run lint:fix              # Auto-fix linting issues
npm run lint:server           # Backend ESLint
npm run lint:client           # Frontend ESLint

# CI testing
cd server && npm run test:ci  # Backend CI tests
cd client && npm run test:ci  # Frontend CI tests
```

## Architecture Overview

LaboMachineTable is a laboratory equipment reservation system with a React frontend and Express.js backend.

### Key Architecture Components

**Frontend (React SPA)**
- React Router for client-side routing with protected routes
- Context API (AuthContext) for global authentication state
- Axios with custom instance for API communication (adds `/api` prefix automatically)
- Internationalization via `translate()` function and `translations.js`
- Main pages: Equipment Layout, Reservations, Equipment Management, User Management

**Backend (Express.js API)**
- RESTful API with `/api` prefix for all endpoints
- JWT-based authentication with automatic user registration
- SQLite database with Sequelize ORM
- Routes: `/api/auth`, `/api/users`, `/api/equipment`, `/api/layout`, `/api/reservations`

**Database Schema**
- `users` - User accounts with auto-registration on first login
- `equipment` - Laboratory equipment with active status
- `layout` - Equipment positioning (x, y, width, height) for visual layout
- `layout_pages` - Multi-page layout management with tab interface
- `text_labels` - Text annotations for the equipment layout with positioning
- `reservations` - Time-based equipment reservations (30-minute slots)

**Database Storage**
- SQLite database located in dedicated `database/` directory
- Automatic database initialization via `server/utils/setupDatabase.js`
- Foreign key constraints with CASCADE deletion for data integrity

### Key Features

**Equipment Layout System**
- Multi-page layout management with tab interface for different lab areas
- Drag-and-drop positioning of equipment and text labels
- Visual representation matching physical laboratory layout
- React Grid Layout for interactive positioning
- Persistent layout storage with immediate save functionality

**Reservation System**
- 30-minute time slot intervals
- Conflict prevention for overlapping reservations
- Calendar-based reservation view
- Real-time availability checking

**Authentication**
- Simple username/password login
- Automatic user registration for new usernames
- JWT token-based session management

**Internationalization**
- Dual-language support (English/Japanese)
- `translate()` function wraps all user-facing text
- Translation mappings in `translations.js`

### Development Patterns

**Frontend State Management**
- AuthContext for global authentication state
- Local component state for UI interactions
- SWR for API data fetching and caching
- React Router v7 for client-side routing with protected routes

**API Communication**
- Custom axios instance in `utils/axiosConfig.js` adds `/api` prefix
- Interceptors handle authentication tokens
- Consistent error handling patterns
- Base URL configuration for different environments

**Component Structure**
- Page components in `pages/` directory
- Reusable components in `components/` directory
- Utility functions in `utils/` directory
- Contexts in `contexts/` directory
- Comprehensive test coverage for all components

**Application Structure**
- `server/app.js` - Express application configuration
- `server/server.js` - Server startup and listening
- Separation of concerns for better testability
- Modular middleware organization

### Important Implementation Details

**Time Format**
- 24-hour format display throughout the application
- 30-minute reservation intervals
- Date handling via date-fns library

**User Registration Flow**
- Login attempts with non-existent usernames trigger automatic registration
- New users are created with provided username and password
- No separate registration endpoint needed

**Layout Persistence**
- Equipment positions saved to database via layout API
- Text labels stored separately with positioning data
- Drag-and-drop changes saved immediately

**Translation System**
- All display text wrapped in `translate()` function
- Complete Japanese translation implementation
- Simple key-value mapping in `translations.js`
- Returns original text if translation not found

## Project Management System

**memory-bank/ Directory**
The project includes a comprehensive knowledge management system:
- `activeContext.md` - Current development status, recent changes, next steps
- `productContext.md` - Product requirements, user personas, feature specifications
- `projectbrief.md` - Project overview, goals, and success criteria
- `systemPatterns.md` - System architecture patterns and design decisions
- `techContext.md` - Technical context and implementation details
- `progress.md` - Development progress tracking and milestone records

This system maintains project context and facilitates efficient development handoffs.

## Environment Configuration

**Environment Variables**
```bash
# Client (.env.development, .env.production)
REACT_APP_API_URL=http://localhost:5001/api

# Server (.env)
PORT=5001                        # Default port (changed from 5000 to avoid AirPlay conflict)
JWT_SECRET=your-secret-key
ENABLE_AUTO_REGISTRATION=true
ALLOWED_ORIGINS=http://localhost:3000
NODE_ENV=development
```

**Configuration Files**
- `server/.env.example` - Server environment template
- Separate development and production environment files
- CORS configuration for cross-origin requests

## Testing System

**Test Configuration**
- `server/jest.config.js` - Backend Jest configuration
- `TESTING.md` - Comprehensive testing documentation (Japanese/English)
- Coverage reports generated in `coverage/` directories
- CI-compatible test scripts for automated testing

**Test Structure**
```
server/__tests__/
├── routes/           # API endpoint tests
├── middleware/       # Authentication middleware tests
├── utils/           # Utility function tests
└── setup.js         # Test environment setup

client/src/__tests__/
├── components/      # React component tests
├── contexts/        # Context API tests
└── utils/          # Client utility tests
```

## Security and Production

**Security Middleware**
- Helmet.js for security headers
- Compression for response optimization
- CORS configuration for cross-origin security
- Environment-specific security settings

**Production Deployment**
- Static file serving for React build
- Fallback routing for SPA navigation
- Environment-based configuration management
- Production-optimized security headers