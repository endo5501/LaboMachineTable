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
npm run server                 # Backend only (port 5000)
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
# Frontend
cd client
npm test                       # Run React tests
npm run lint                   # ESLint

# Backend  
cd server
npm test                       # Run Jest tests
npm run lint                   # ESLint
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
- `text_labels` - Text annotations for the equipment layout
- `reservations` - Time-based equipment reservations (30-minute slots)

### Key Features

**Equipment Layout System**
- Drag-and-drop positioning of equipment and text labels
- Visual representation matching physical laboratory layout
- React Grid Layout for interactive positioning

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

**API Communication**
- Custom axios instance in `utils/axiosConfig.js` adds `/api` prefix
- Interceptors handle authentication tokens
- Consistent error handling patterns

**Component Structure**
- Page components in `pages/` directory
- Reusable components in `components/` directory
- Utility functions in `utils/` directory
- Contexts in `contexts/` directory

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
- Simple key-value mapping in `translations.js`
- Returns original text if translation not found