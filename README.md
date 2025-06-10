# LaboMachineTable - Laboratory Equipment Reservation System

LaboMachineTable is a web application designed to manage and streamline the reservation process for laboratory equipment. The system allows users to view equipment availability, make reservations, and manage equipment and user data.

## Features

- User authentication with automatic registration for new users
- Equipment management (add, edit, delete equipment)
- User management (add, edit, delete users)
- Visual equipment layout representation
- Calendar-based reservation system
- Time slot selection (30-minute intervals)
- Conflict prevention for reservations

## Technology Stack

- **Frontend**: JavaScript, React
- **Backend**: Node.js, Express
- **Database**: SQLite

## Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)

Or for Docker deployment:

- Docker
- Docker Compose

## Installation

### Standard Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd LaboMachineTable
   ```

2. Install dependencies:
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

3. Set up the database:
   ```bash
   cd ../server
   npm run db:setup
   ```

### Docker Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd LaboMachineTable
   ```

2. Create database directory:
   ```bash
   mkdir -p ./data
   ```

3. Start with Docker Compose:
   ```bash
   docker-compose up -d
   ```

The application will be available at http://localhost:5001

#### Database Persistence

The database file is mounted to the `./data` directory, ensuring data persistence even when containers are removed.

#### Updating

To update to a new version:

```bash
# Build new image
docker-compose build --no-cache

# Restart container
docker-compose up -d
```

Or when pulling from a registry:

```bash
# Pull new image
docker pull <your-registry>/labomachine:latest

# Restart container
docker-compose up -d
```

## Development

Start the development servers:

```bash
# Start both client and server in development mode
npm run dev
```

- Frontend will be available at: http://localhost:3000
- Backend API will be available at: http://localhost:5000

## Project Structure

```
LaboMachineTable/
├── client/                 # Frontend React application
├── server/                 # Backend Node.js/Express application
├── database/               # Database files and migrations
├── .gitignore              # Git ignore file
├── package.json            # Root package.json for scripts
└── README.md               # Project documentation
```

## License

[MIT](LICENSE)
