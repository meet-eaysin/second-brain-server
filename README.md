# Second Brain Server

<div align="center">

**A Comprehensive Personal Intelligence Platform Backend**

A robust Node.js/Express API server that powers a complete personal knowledge management and productivity system. Built with TypeScript, MongoDB, and modern development practices for scalable, secure, and maintainable personal intelligence applications.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.15.1-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.15.0-green)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-5.1.0-lightgrey)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

[![GitHub stars](https://img.shields.io/github/stars/meet-eaysin/second-brain-server?style=social)](https://github.com/meet-eaysin/second-brain-server/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/meet-eaysin/second-brain-server?style=social)](https://github.com/meet-eaysin/second-brain-server/network/members)
[![GitHub issues](https://img.shields.io/github/issues/meet-eaysin/second-brain-server)](https://github.com/meet-eaysin/second-brain-server/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/meet-eaysin/second-brain-server)](https://github.com/meet-eaysin/second-brain-server/pulls)

</div>

## Overview

The Second Brain Server is a comprehensive backend API that powers a personal knowledge management and productivity platform. It provides a flexible database system, task management, note-taking, project tracking, calendar integration, and various other modules to help users organize their digital lives effectively.

### Key Features

- **Flexible Database System**: Notion-like databases with custom properties and views
- **Task Management**: Complete task tracking with priorities, assignees, and time tracking
- **Rich Note-Taking**: Full-featured notes with rich text editing and collaboration
- **Project & Goal Management**: Organize work and track achievements
- **Calendar Integration**: Sync with external calendar services (Google, Outlook)
- **Advanced Search**: Global search across all content with semantic capabilities
- **Real-time Notifications**: WebSocket-based notifications and updates
- **User Authentication**: JWT-based auth with Google OAuth support
- **Permission System**: Granular access control for workspaces and content
- **Analytics & Insights**: Comprehensive analytics and reporting
- **File Management**: AWS S3 integration for secure file storage
- **Email & SMS**: Integrated communication services

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v22.15.1 or higher)
- [Yarn](https://yarnpkg.com/) (v4.9.2 or higher) - Package manager
- [Docker](https://www.docker.com/) (for containerized development)
- [Docker Compose](https://docs.docker.com/compose/) (for multi-container setup)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB instance)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/meet-eaysin/second-brain-server.git
cd second-brain-server
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Environment Setup

Create a `.env` file in the root directory and configure the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# Database
MONGO_URI=<your-mongodb-connection-string>

# Authentication
JWT_SECRET=<your-jwt-secret-key>
ACCESS_TOKEN_SECRET=<your-access-token-secret>
REFRESH_TOKEN_SECRET=<your-refresh-token-secret>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/auth/google/callback

# Email Configuration (Optional)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your-email@gmail.com>
EMAIL_PASS=<your-app-password>
EMAIL_FROM=<your-email@gmail.com>

# AWS S3 (Optional - for file storage)
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_BUCKET_NAME=<your-bucket-name>
AWS_REGION=us-east-1

# SMS Configuration (Optional - Twilio)
TWILIO_ACCOUNT_SID=<your-account-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>
TWILIO_PHONE_NUMBER=<your-twilio-phone-number>

# Calendar Integration (Optional)
GOOGLE_CALENDAR_CLIENT_ID=<your-calendar-client-id>
GOOGLE_CALENDAR_CLIENT_SECRET=<your-calendar-client-secret>
CALENDAR_SYNC_ENABLED=true
CALENDAR_SYNC_INTERVAL=15

# Push Notifications (Optional)
VAPID_PUBLIC_KEY=<your-vapid-public-key>
VAPID_PRIVATE_KEY=<your-vapid-private-key>
VAPID_EMAIL=mailto:<your-email@example.com>

# Firebase (Optional - for mobile push notifications)
FIREBASE_PROJECT_ID=<your-firebase-project-id>
FIREBASE_PRIVATE_KEY="<your-firebase-private-key>"
FIREBASE_CLIENT_EMAIL=<your-firebase-client-email>
```

## Getting Started

### Local Development

1. **Start the development server:**
```bash
yarn dev
```

The server will start on `http://localhost:5000` with hot reloading enabled.

2. **Access the API documentation:**
   - Swagger UI: `http://localhost:5000/docs`
   - Health check: `http://localhost:5000/health`
   - API Base URL: `http://localhost:5000/api/v1`

## Development Commands

### Core Development Commands

```bash
# Development Server
yarn dev                  # Start development server with hot reload
yarn dev:debug           # Start with debugger attached (port 9229)

# Building & Compilation
yarn build               # Build for production using tsconfig.build.json
yarn build:watch         # Build in watch mode
yarn build:resolve-paths # Resolve TypeScript path aliases in build
yarn clean               # Clean build artifacts and cache

# Type Checking
yarn typecheck           # Run TypeScript compiler check
yarn typecheck:watch     # Run type checking in watch mode
```

### Testing Commands

```bash
# Test Execution
yarn test                # Run all tests with Jest
yarn test:watch          # Run tests in watch mode
yarn test:coverage       # Run tests with coverage report
yarn test:ci             # Run tests for CI/CD (no watch, coverage)

# Test Types
yarn test:unit           # Run unit tests only
yarn test:integration    # Run integration tests only
yarn test:e2e            # Run end-to-end tests only
```

### Code Quality & Formatting

```bash
# Linting
yarn lint                # Run ESLint on all TypeScript files
yarn lint:fix            # Fix auto-fixable ESLint issues
yarn lint:staged         # Run lint-staged (used by git hooks)

# Code Formatting
yarn format              # Format all files with Prettier
yarn format:check        # Check if files are properly formatted

# Comprehensive Validation
yarn validate            # Run typecheck + lint + test (full validation)
```

### Production & Deployment

```bash
# Production Server
yarn start               # Start production server
yarn start:prod          # Start with NODE_ENV=production

# Deployment Scripts
yarn deploy:staging      # Deploy to staging environment
yarn deploy:production   # Deploy to production environment

# Process Management (PM2)
yarn logs                # View PM2 logs
yarn monitor             # Open PM2 monitoring dashboard
yarn health              # Check server health endpoint
```

## Project Architecture

### Core Technologies

- **Runtime**: Node.js 22.15.1+
- **Framework**: Express.js 5.1.0
- **Language**: TypeScript 5.8.3
- **Database**: MongoDB 8.15.0 with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod schemas
- **Logging**: Winston with daily rotation
- **Testing**: Jest with Supertest
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Process Management**: PM2 (production)
- **Real-time**: Socket.IO for WebSocket communication

### Directory Structure

```
src/
├── app.ts                    # Express application setup
├── index.ts                  # Server entry point
├── config/                   # Configuration modules
│   ├── default-config/       # Application configuration
│   ├── db/                   # Database connection
│   ├── email-templates.ts    # Email templates
│   ├── index.ts              # Config exports
│   ├── jwt/                  # JWT configuration
│   ├── logger/               # Logging configuration
│   ├── mailer/               # Email service configuration
│   ├── rate-limiter/         # Rate limiting configuration
│   ├── sms/                  # SMS service configuration
│   └── storage/              # File storage configuration
├── middlewares/              # Express middlewares
│   ├── auth.ts               # Authentication middleware
│   ├── error-handler.ts      # Error handling middleware
│   ├── index.ts              # Middleware exports
│   ├── not-found.ts          # 404 handler
│   └── permission.middleware.ts # Permission middleware
├── modules/                  # Feature modules
│   ├── auth/                 # Authentication & authorization
│   ├── calendar/             # Calendar integration
│   ├── core/                 # Core types and services
│   ├── dashboard/            # Dashboard and analytics
│   ├── editor/               # Rich text editor services
│   ├── files/                # File upload and management
│   ├── formulas/             # Formula engine
│   ├── index.ts              # Module exports
│   ├── modules/              # Cross-module relations
│   ├── permissions/          # Permission management
│   ├── search/               # Global search functionality
│   ├── second-brain/         # Second Brain modules
│   │   ├── content/          # Content management
│   │   ├── finance/          # Financial tracking
│   │   ├── goals/            # Goal management
│   │   ├── habits/           # Habit tracking
│   │   ├── index.ts          # Second Brain exports
│   │   ├── journal/          # Journaling system
│   │   ├── mood/             # Mood tracking
│   │   ├── notes/            # Note-taking system
│   │   ├── people/           # Contact management
│   │   └── tasks/            # Task management
│   ├── settings/             # User settings
│   ├── system/               # System features (notifications, analytics)
│   ├── users/                # User management
│   └── workspace/            # Workspace management
├── routes/                   # API route definitions
│   ├── index.ts              # Main route aggregator
│   └── swagger.route.ts      # Swagger documentation route
├── types/                    # TypeScript type definitions
│   ├── error.types.ts        # Error types
│   ├── express.d.ts          # Express extensions
│   ├── index.ts              # Type exports
│   └── socket.io.d.ts        # Socket.IO types
└── utils/                    # Utility functions
    ├── catch-async.ts        # Async error handling
    ├── email.utils.ts        # Email utilities
    ├── error.utils.ts        # Error utilities
    ├── id-generator.ts       # ID generation
    ├── index.ts              # Utility exports
    ├── mongoose-helpers.ts   # MongoDB helpers
    ├── response.utils.ts     # Response utilities
    └── validation-error-converter.ts # Validation helpers
```

### Module Structure

Each module follows a consistent structure:

```
module/
├── controllers/              # Request handlers
├── models/                   # Database models (Mongoose schemas)
├── routes/                   # Route definitions
├── services/                 # Business logic
├── types/                    # Module-specific types
├── utils/                    # Module-specific utilities
├── validators/               # Input validation schemas (Zod)
└── README.md                 # Module documentation (optional)
```

## API Documentation

### Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

#### Authentication Methods

- **Local Authentication**: Email/password registration and login
- **Google OAuth**: Sign in with Google account
- **Refresh Tokens**: Automatic token refresh for extended sessions

### API Endpoints

The API is organized into the following main modules:

#### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/google` - Google OAuth login

#### User Management (`/api/v1/users`)
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/settings` - Get user settings
- `PUT /api/v1/users/settings` - Update user settings

#### Database System (`/api/v1/databases`)
- `GET /api/v1/databases` - List databases
- `POST /api/v1/databases` - Create database
- `GET /api/v1/databases/:id` - Get database by ID
- `PUT /api/v1/databases/:id` - Update database
- `DELETE /api/v1/databases/:id` - Delete database

#### Task Management (`/api/v1/tasks`)
- `GET /api/v1/tasks` - List tasks
- `POST /api/v1/tasks` - Create task
- `GET /api/v1/tasks/:id` - Get task by ID
- `PUT /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task
- `POST /api/v1/tasks/:id/complete` - Complete task
- `POST /api/v1/tasks/:id/assign` - Assign task to users

#### Notes System (`/api/v1/notes`)
- `GET /api/v1/notes` - List notes
- `POST /api/v1/notes` - Create note
- `GET /api/v1/notes/:id` - Get note by ID
- `PUT /api/v1/notes/:id` - Update note
- `DELETE /api/v1/notes/:id` - Delete note

#### Projects & Goals (`/api/v1/projects`, `/api/v1/goals`)
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/goals` - List goals
- `POST /api/v1/goals` - Create goal

#### Calendar Integration (`/api/v1/calendars`)
- `GET /api/v1/calendars/events` - Get calendar events
- `POST /api/v1/calendars/events` - Create calendar event
- `PUT /api/v1/calendars/events/:id` - Update calendar event
- `DELETE /api/v1/calendars/events/:id` - Delete calendar event

#### Search (`/api/v1/search`)
- `GET /api/v1/search` - Global search across all content

#### System (`/api/v1/system`)
- `GET /api/v1/system/health` - Health check
- `GET /api/v1/system/info` - System information
- `GET /api/v1/dashboard/stats` - Dashboard statistics

### Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "pagination": { ... } // For paginated responses
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "status": "error"
  }
}
```

## Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Granular permissions system for workspaces and content
- Google OAuth 2.0 integration

### Data Protection
- Request/response encryption for sensitive data
- Password hashing with bcrypt
- Input validation with Zod schemas
- Rate limiting to prevent abuse

### Infrastructure Security
- Helmet.js for security headers
- CORS configuration
- Environment variable validation
- Secure file upload handling

## Configuration

### Rate Limiting
- **Global**: 100 requests per 15 minutes per IP
- **Authentication**:
  - Login: 10 attempts per 15 minutes
  - Register: 5 attempts per 15 minutes
  - Password Reset: 3 attempts per 15 minutes
- **API**: 60 requests per minute per user
- **OAuth**: 10 requests per 15 minutes

### File Upload
- **Max file size**: 50MB per file (configurable)
- **Allowed types**: All common formats (images, documents, videos, audio)
- **Storage**: AWS S3 with CDN integration (optional)
- **Security**: File type validation and virus scanning

## Development Workflow

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Comprehensive linting rules
- **Prettier**: Consistent code formatting
- **Husky**: Git hooks for pre-commit validation
- **Jest**: Unit and integration testing

### Git Workflow
1. Create feature branch from `main`
2. Make changes with proper commit messages
3. Run `yarn validate` before pushing
4. Create pull request with description
5. Code review and merge

### Testing
- Unit tests for individual functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Test coverage reporting

## Deployment

### Environment Variables
Set the following environment variables for production:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=<production-mongodb-uri>
JWT_SECRET=<secure-jwt-secret>
# ... other required variables
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build -d

# Or use the provided scripts
yarn docker:prod
```

### PM2 Deployment
```bash
# Build for production
yarn build

# Start with PM2
yarn start:prod

# Monitor processes
yarn monitor
```

## Contributing

We welcome contributions to improve the Second Brain Server! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/second-brain-server.git`
3. Install dependencies: `yarn install`
4. Set up environment: `cp .env.example .env`
5. Start development: `yarn dev`
6. Run tests: `yarn test`
7. Create a feature branch and make changes
8. Submit a pull request

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [API Docs](http://localhost:5000/docs) (when running locally)
- **Issues**: [GitHub Issues](https://github.com/meet-eaysin/second-brain-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/meet-eaysin/second-brain-server/discussions)
- **Email**: [eaysin.dev@gmail.com](mailto:eaysin.dev@gmail.com)

## Acknowledgments

Built with ❤️ by [Eaysin Arafat](https://github.com/meet-eaysin)

*"Empowering personal intelligence through connected digital experiences"*

---

<div align="center">

**🌟 Star this repo if you find it useful! 🌟**

**Happy Building! 🚀🧠✨**

</div>
