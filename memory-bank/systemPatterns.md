# System Patterns: LaboMachineTable

## System Architecture Overview

LaboMachineTable follows a modern web application architecture with clear separation of concerns:

```mermaid
flowchart TD
    Client[Client Browser] <--> API[API Layer]
    API <--> BL[Business Logic]
    BL <--> DAL[Data Access Layer]
    DAL <--> DB[(SQLite Database)]
```

### Client-Side Architecture
The frontend is built using React with a component-based architecture. The application uses a single-page application (SPA) approach to provide a seamless user experience.

### Server-Side Architecture
The backend is built using Node.js and Express, providing RESTful API endpoints for the frontend to consume. The server handles authentication, data validation, business logic, and database operations.

### Data Storage
SQLite is used as the database for simplicity and portability. The database schema is designed to efficiently store and retrieve user, equipment, and reservation data.

## Component Structure

### Frontend Components

```mermaid
flowchart TD
    App[App] --> Auth[Authentication]
    App --> Nav[Navigation]
    App --> Routes[Routes]
    
    Routes --> Login[Login Screen]
    Routes --> EquipMgmt[Equipment Management]
    Routes --> UserMgmt[User Management]
    Routes --> EquipLayout[Equipment Layout]
    Routes --> ReservStatus[Reservation Status]
    
    EquipLayout --> ReservWindow[Reservation Window]
    ReservStatus --> ReservWindow
    
    EquipLayout --> TextLabels[Text Labels]
    EquipLayout --> DragDrop[Drag & Drop]
    
    ReservStatus --> TimeSlots[Time Slots]
    ReservStatus --> Calendar[Calendar View]
    
    Auth --> AuthContext[Auth Context]
    Auth --> PrivateRoute[Private Route]
```

#### Core Components
1. **App**: The root component that manages application state and routing
2. **Authentication**: Handles user login and session management
3. **Navigation**: Provides navigation between different screens
4. **Routes**: Manages routing to different screens

#### Screen Components
1. **Login Screen**: User authentication interface
2. **Equipment Management**: CRUD interface for equipment
3. **User Management**: CRUD interface for users
4. **Equipment Layout**: Visual representation of equipment placement with drag-and-drop functionality
5. **Reservation Status**: Overview of all equipment reservations with calendar view
6. **Reservation Window**: Detailed reservation interface for specific equipment with time slot selection

#### Feature Components
1. **Text Labels**: Support for adding, editing, and positioning text labels in the equipment layout
2. **Drag & Drop**: Interactive positioning of equipment and text labels in the layout
3. **Time Slots**: 30-minute interval selection for equipment reservations
4. **Calendar View**: Date-based view of equipment reservations

### Backend Components

```mermaid
flowchart TD
    Server[Express Server] --> Routes[API Routes]
    Routes --> AuthC[Auth Controller]
    Routes --> UserC[User Controller]
    Routes --> EquipC[Equipment Controller]
    Routes --> LayoutC[Layout Controller]
    Routes --> ReservC[Reservation Controller]
    
    AuthC --> AuthS[Auth Service]
    UserC --> UserS[User Service]
    EquipC --> EquipS[Equipment Service]
    LayoutC --> LayoutS[Layout Service]
    ReservC --> ReservS[Reservation Service]
    
    AuthS --> Models[Data Models]
    UserS --> Models
    EquipS --> Models
    LayoutS --> Models
    ReservS --> Models
    
    Models --> DB[(SQLite Database)]
```

#### API Routes
1. **/api/auth**: Authentication endpoints
2. **/api/users**: User management endpoints
3. **/api/equipment**: Equipment management endpoints
4. **/api/layout**: Equipment layout and text label endpoints
5. **/api/reservations**: Reservation management endpoints

#### Controllers
Controllers handle HTTP requests and responses, validating input and formatting output.

#### Services
Services contain the business logic, performing operations on the data and enforcing business rules.

#### Models
Models define the data structure and provide an interface to the database.

## Data Flow Diagrams

### Authentication Flow

```mermaid
sequenceDiagram
    Client->>+Server: Login Request (username, password)
    Server->>+Database: Check User Exists
    Database-->>-Server: User Data / Not Found
    alt User Exists
        Server->>Server: Validate Password
        Server-->>Client: Login Success + Session Token
    else User Doesn't Exist
        Server->>Database: Create New User
        Server-->>Client: Registration Success + Session Token
    end
```

### Reservation Flow

```mermaid
sequenceDiagram
    Client->>+Server: Get Equipment Availability
    Server->>+Database: Query Reservations
    Database-->>-Server: Reservation Data
    Server-->>-Client: Equipment Availability
    
    Client->>+Server: Create Reservation Request
    Server->>Server: Validate Time Slots
    Server->>+Database: Check for Conflicts
    Database-->>-Server: Conflict Status
    
    alt No Conflicts
        Server->>Database: Save Reservation
        Server-->>Client: Reservation Confirmed
    else Conflicts Exist
        Server-->>Client: Reservation Conflict Error
    end
```

### Equipment Layout Flow

```mermaid
sequenceDiagram
    Client->>+Server: Get Equipment and Layout Data
    Server->>+Database: Query Equipment
    Database-->>-Server: Equipment Data
    Server->>+Database: Query Layout
    Database-->>-Server: Layout Data
    Server->>+Database: Query Text Labels
    Database-->>-Server: Text Labels Data
    Server-->>-Client: Combined Layout Data
    
    Client->>Client: User Drags Equipment/Label
    Client->>+Server: Update Position
    Server->>Database: Save New Position
    Server-->>-Client: Update Confirmation
```

## State Management Approach

### Frontend State Management
The application uses React's Context API for global state management, with local component state for UI-specific state. The global state includes:

1. **Authentication State**: Current user and login status
2. **Equipment State**: List of equipment and their details
3. **Layout State**: Equipment placement information and text labels
4. **Reservation State**: Current reservations and availability

### Backend State Management
The server is stateless, with all state stored in the database. Session information is managed through authentication tokens.

## Design Patterns

### Frontend Patterns

#### Component Patterns
- **Container/Presentational Pattern**: Separating logic from presentation (e.g., ReservationWindow component)
- **Compound Components**: Building complex UI elements from simpler components
- **Render Props**: Sharing code between components
- **Drag and Drop Pattern**: Interactive positioning of elements in the equipment layout

#### State Management Patterns
- **Context Provider Pattern**: Providing global state to component tree (e.g., AuthContext)
- **Reducer Pattern**: Managing complex state transitions
- **Custom Hooks**: Encapsulating and reusing stateful logic
- **Controlled Components**: Form inputs with React state management

#### UI Patterns
- **Modal Dialog Pattern**: Reservation window implementation
- **Time Slot Selection**: Visual representation of time intervals
- **Calendar View**: Date-based data visualization
- **Responsive Layout**: Adapting to different screen sizes

### Backend Patterns

#### Architectural Patterns
- **MVC Pattern**: Separating concerns into Model, View, and Controller
- **Repository Pattern**: Abstracting data access logic
- **Service Layer Pattern**: Encapsulating business logic
- **Middleware Pattern**: Processing requests through a chain of handlers

#### API Patterns
- **RESTful API**: Resource-based API design
- **Error Handler Pattern**: Centralizing error handling logic
- **Authentication Middleware**: Protecting routes with JWT verification
- **Validation Middleware**: Ensuring request data integrity

## API Structure

### Authentication API
- `POST /api/auth/login`: Authenticate user
- `POST /api/auth/logout`: End user session
- `GET /api/auth/me`: Get current user information

### User API
- `GET /api/users`: List all users
- `GET /api/users/:id`: Get user details
- `POST /api/users`: Create new user
- `PUT /api/users/:id`: Update user
- `DELETE /api/users/:id`: Delete user

### Equipment API
- `GET /api/equipment`: List all equipment
- `GET /api/equipment/:id`: Get equipment details
- `POST /api/equipment`: Create new equipment
- `PUT /api/equipment/:id`: Update equipment
- `DELETE /api/equipment/:id`: Delete equipment

### Layout API
- `GET /api/layout`: Get equipment layout
- `POST /api/layout`: Save equipment layout
- `PUT /api/layout/equipment/:id`: Update equipment position
- `DELETE /api/layout/equipment/:id`: Remove equipment from layout
- `GET /api/layout/labels`: Get all text labels
- `GET /api/layout/labels/:id`: Get text label by ID
- `POST /api/layout/labels`: Create a new text label
- `PUT /api/layout/labels/:id`: Update a text label
- `DELETE /api/layout/labels/:id`: Delete a text label

### Reservation API
- `GET /api/reservations`: List all reservations
- `GET /api/reservations/equipment/:id`: Get reservations for specific equipment
- `GET /api/reservations/user/:id`: Get reservations for specific user
- `POST /api/reservations`: Create new reservation
- `PUT /api/reservations/:id`: Update reservation
- `DELETE /api/reservations/:id`: Cancel reservation

## Database Schema

```mermaid
erDiagram
    USERS {
        int id PK
        string username
        string password
        string name
        string email
        datetime created_at
        datetime updated_at
    }
    
    EQUIPMENT {
        int id PK
        string name
        string type
        string description
        boolean active
        datetime created_at
        datetime updated_at
    }
    
    LAYOUT {
        int id PK
        int equipment_id FK
        int x_position
        int y_position
        int width
        int height
        datetime created_at
        datetime updated_at
    }
    
    TEXT_LABELS {
        int id PK
        string content
        int x_position
        int y_position
        int font_size
        datetime created_at
        datetime updated_at
    }
    
    RESERVATIONS {
        int id PK
        int equipment_id FK
        int user_id FK
        datetime start_time
        datetime end_time
        string status
        datetime created_at
        datetime updated_at
    }
    
    USERS ||--o{ RESERVATIONS : makes
    EQUIPMENT ||--o{ RESERVATIONS : has
    EQUIPMENT ||--|| LAYOUT : positioned_as
```

## Internationalization Approach

```mermaid
flowchart TD
    Component[React Component] --> TranslateFunc[translate() Function]
    TranslateFunc --> TranslationsObj[translations.js Object]
    TranslationsObj --> EnglishText[English Text]
    TranslationsObj --> JapaneseText[Japanese Text]
    Component --> UI[User Interface]
```

The application implements internationalization using:
1. **translations.js**: A central mapping of English text to Japanese translations
2. **translate.js**: A utility function that looks up translations
3. **Component Integration**: Components use the translate function for all user-facing text
4. **Documentation**: Dual-language documentation with README.md (English) and README.ja.md (Japanese)

## Security Considerations

### Authentication
- Password hashing using bcrypt
- JWT-based authentication
- Session management with secure tokens

### Data Validation
- Input validation on all API endpoints
- Sanitization of user input
- Parameterized queries to prevent SQL injection

### Authorization
- Role-based access control for administrative functions
- Validation of user permissions for each operation
- Protection of sensitive routes

### Frontend Security
- CSRF protection
- Secure handling of authentication tokens
- Input validation before submission
