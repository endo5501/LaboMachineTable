# Technical Context: NcReserve

## Technology Stack

NcReserve is built using a modern JavaScript stack with the following core technologies:

### Frontend
- **JavaScript**: Core programming language
- **React**: UI library for building component-based interfaces
- **React Router**: For client-side routing
- **Context API**: For state management
- **CSS Modules**: For component-scoped styling
- **Axios**: For HTTP requests to the backend API

### Backend
- **Node.js**: JavaScript runtime environment
- **Express**: Web application framework
- **SQLite**: Lightweight relational database
- **Sequelize**: ORM for database interactions
- **JSON Web Tokens (JWT)**: For authentication
- **bcrypt**: For password hashing

### Development Tools
- **npm**: Package manager
- **Webpack**: Module bundler
- **Babel**: JavaScript compiler
- **ESLint**: Code linting
- **Jest**: Testing framework
- **Nodemon**: Server auto-restart during development

## Development Environment Setup

### Prerequisites
- Node.js (v14.x or higher)
- npm (v6.x or higher)
- Git

### Project Structure
```
nc-reserve/
├── client/                 # Frontend React application
│   ├── public/             # Static files
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   ├── utils/          # Utility functions
│   │   ├── App.js          # Main App component
│   │   └── index.js        # Entry point
│   ├── package.json        # Frontend dependencies
│   └── webpack.config.js   # Webpack configuration
│
├── server/                 # Backend Node.js/Express application
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   ├── app.js              # Express application setup
│   ├── server.js           # Server entry point
│   └── package.json        # Backend dependencies
│
├── database/               # Database files and migrations
│   ├── migrations/         # Database migrations
│   ├── seeders/            # Seed data
│   └── database.sqlite     # SQLite database file
│
├── .gitignore              # Git ignore file
├── package.json            # Root package.json for scripts
└── README.md               # Project documentation
```

### Installation and Setup

#### Clone Repository
```bash
git clone <repository-url>
cd nc-reserve
```

#### Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

#### Database Setup
```bash
# Create database and run migrations
cd server
npm run db:setup
```

#### Start Development Servers
```bash
# Start both client and server in development mode
cd ..
npm run dev
```

## Build and Deployment Process

### Development
During development, the application runs with:
- Frontend: Webpack dev server with hot reloading
- Backend: Nodemon for automatic server restarts
- Database: Local SQLite file

### Production Build
```bash
# Build frontend
cd client
npm run build

# Prepare server for production
cd ../server
npm run build
```

### Deployment Options
1. **Traditional Hosting**:
   - Deploy built frontend to static hosting
   - Deploy Node.js server to application hosting
   - Configure database connection

2. **Docker Deployment**:
   - Build Docker images for frontend and backend
   - Use Docker Compose for local deployment
   - Deploy to container orchestration platform

3. **Serverless Deployment**:
   - Deploy frontend to CDN
   - Convert backend to serverless functions
   - Use cloud database service

## Dependencies and Libraries

### Frontend Dependencies

#### Core Dependencies
- **react**: UI library
- **react-dom**: React rendering for web
- **react-router-dom**: Routing library
- **prop-types**: Runtime type checking

#### UI and Styling
- **classnames**: Utility for conditional class names
- **react-icons**: Icon library
- **react-datepicker**: Date picker component
- **react-grid-layout**: For equipment layout functionality

#### State Management and Data Fetching
- **axios**: HTTP client
- **swr**: React Hooks for data fetching

#### Utilities
- **date-fns**: Date manipulation library
- **lodash**: Utility library
- **uuid**: For generating unique IDs

### Backend Dependencies

#### Core Dependencies
- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **helmet**: Security headers
- **compression**: Response compression

#### Database
- **sqlite3**: SQLite database driver
- **sequelize**: ORM for database operations
- **sequelize-cli**: CLI for Sequelize

#### Authentication and Security
- **jsonwebtoken**: JWT implementation
- **bcrypt**: Password hashing
- **express-validator**: Request validation
- **cookie-parser**: Cookie parsing middleware

#### Utilities
- **dotenv**: Environment variable management
- **winston**: Logging library
- **morgan**: HTTP request logger

## Technical Constraints

### Browser Compatibility
- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- IE11 not supported

### Performance Requirements
- Initial load time < 3 seconds on broadband
- API response time < 500ms for most operations
- Support for up to 100 concurrent users

### Security Requirements
- Secure authentication with password hashing
- Protection against common web vulnerabilities (XSS, CSRF)
- Input validation on all API endpoints
- Secure session management

### Scalability Considerations
- SQLite suitable for expected user load (small to medium laboratory)
- Potential migration path to PostgreSQL for larger deployments
- Stateless API design to allow horizontal scaling

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Equipment Table
```sql
CREATE TABLE equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Layout Table
```sql
CREATE TABLE layout (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  x_position INTEGER NOT NULL,
  y_position INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment (id) ON DELETE CASCADE
);
```

### Reservations Table
```sql
CREATE TABLE reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

## API Endpoints

### Authentication
- `POST /api/auth/login`: Authenticate user
  - Request: `{ username, password }`
  - Response: `{ token, user }`

### Users
- `GET /api/users`: Get all users
  - Response: `[{ id, username, name, email }]`
- `GET /api/users/:id`: Get user by ID
  - Response: `{ id, username, name, email }`
- `POST /api/users`: Create new user
  - Request: `{ username, password, name, email }`
  - Response: `{ id, username, name, email }`
- `PUT /api/users/:id`: Update user
  - Request: `{ username, password, name, email }`
  - Response: `{ id, username, name, email }`
- `DELETE /api/users/:id`: Delete user
  - Response: `{ success: true }`

### Equipment
- `GET /api/equipment`: Get all equipment
  - Response: `[{ id, name, type, description, active }]`
- `GET /api/equipment/:id`: Get equipment by ID
  - Response: `{ id, name, type, description, active }`
- `POST /api/equipment`: Create new equipment
  - Request: `{ name, type, description, active }`
  - Response: `{ id, name, type, description, active }`
- `PUT /api/equipment/:id`: Update equipment
  - Request: `{ name, type, description, active }`
  - Response: `{ id, name, type, description, active }`
- `DELETE /api/equipment/:id`: Delete equipment
  - Response: `{ success: true }`

### Layout
- `GET /api/layout`: Get equipment layout
  - Response: `[{ id, equipment_id, x_position, y_position, width, height }]`
- `POST /api/layout`: Save equipment layout
  - Request: `[{ equipment_id, x_position, y_position, width, height }]`
  - Response: `[{ id, equipment_id, x_position, y_position, width, height }]`
- `PUT /api/layout/equipment/:id`: Update equipment position
  - Request: `{ x_position, y_position, width, height }`
  - Response: `{ id, equipment_id, x_position, y_position, width, height }`

### Reservations
- `GET /api/reservations`: Get all reservations
  - Response: `[{ id, equipment_id, user_id, start_time, end_time, status }]`
- `GET /api/reservations/equipment/:id`: Get reservations for equipment
  - Response: `[{ id, equipment_id, user_id, start_time, end_time, status }]`
- `GET /api/reservations/user/:id`: Get reservations for user
  - Response: `[{ id, equipment_id, user_id, start_time, end_time, status }]`
- `POST /api/reservations`: Create new reservation
  - Request: `{ equipment_id, start_time, end_time }`
  - Response: `{ id, equipment_id, user_id, start_time, end_time, status }`
- `PUT /api/reservations/:id`: Update reservation
  - Request: `{ start_time, end_time, status }`
  - Response: `{ id, equipment_id, user_id, start_time, end_time, status }`
- `DELETE /api/reservations/:id`: Cancel reservation
  - Response: `{ success: true }`

## Development Practices

### Code Style
- ESLint configuration for consistent code style
- Prettier for code formatting
- Airbnb JavaScript style guide as a base

### Testing Strategy
- Jest for unit and integration testing
- React Testing Library for component tests
- Supertest for API endpoint testing
- Test coverage targets: 70%+ for critical paths

### Version Control
- Git for version control
- Feature branch workflow
- Pull request reviews before merging
- Semantic versioning for releases

### Documentation
- JSDoc comments for functions and components
- README files for setup and usage instructions
- API documentation using Swagger/OpenAPI
- Inline comments for complex logic
