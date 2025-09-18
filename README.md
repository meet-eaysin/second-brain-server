# Second Brain Server

<div align="center">

**The Second Brain Maqnagement Platform**

A comprehensive ecosystem for knowledge management, creativity, learning, and personal growth. Built with Node.js, Express.js, TypeScript, and MongoDB, this platform serves as your digital extension - connecting all aspects of your intellectual and creative life.

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

## Vision

Transform how you think, learn, create, and grow by providing an interconnected intelligence platform that amplifies your cognitive abilities across all domains of life.

## Current Status

**Version 1.0** - **Production Ready**

This is a fully functional personal intelligence platform with comprehensive modules for productivity, knowledge management, and life organization. All core features are implemented and tested.

## Implemented Features

### **Database System** (Core Foundation)
- **Notion-like Databases**: Flexible database creation with custom properties
- **Rich Property Types**: Text, Number, Select, Multi-select, Date, Checkbox, URL, Email, Phone, File, Relation
- **Advanced Views**: Table, Board, List, Calendar, Gallery views with filtering and sorting
- **Permissions System**: Granular sharing controls and workspace management
- **Rich Content**: Full rich text editing with blocks, mentions, and formatting

### **Task Management** (Productivity)
- **Comprehensive Task Tracking**: Priority levels, due dates, status management
- **Project Integration**: Link tasks to projects and goals
- **Checklist Support**: Sub-tasks and checklist items
- **Time Tracking**: Estimated hours and actual time spent
- **Advanced Filtering**: Filter by status, priority, assignee, and custom fields

### **Notes System** (Knowledge Management)
- **Rich Text Notes**: Full rich content editing with blocks and formatting
- **Auto-Tagging**: Intelligent content categorization
- **Word Count & Reading Time**: Automatic content metrics
- **Publishing System**: Public/private notes with comment support
- **Cross-Linking**: Connect notes with other content across modules

### **Project Management** (Organization)
- **Project Lifecycle**: From planning to completion tracking
- **Timeline Management**: Start dates, deadlines, and milestones
- **Resource Allocation**: Budget tracking and resource management
- **Team Collaboration**: Assign team members and track contributions
- **Progress Monitoring**: Visual progress tracking and reporting

### **Goal Tracking** (Achievement System)
- **SMART Goals**: Specific, Measurable, Achievable, Relevant, Time-bound
- **Progress Tracking**: Visual progress indicators and milestone tracking
- **Goal Categories**: Personal, professional, health, financial goals
- **Deadline Management**: Due date tracking and reminder system
- **Achievement Analytics**: Success rate and completion insights

### **People Management** (Relationship)
- **Contact Database**: Comprehensive contact information management
- **Relationship Tracking**: Interaction history and relationship strength
- **Professional Networks**: Career connections and networking
- **Communication History**: Track meetings, calls, and interactions
- **Contact Analytics**: Relationship insights and networking opportunities

### **Finance** (Financial)
- **Expense Management**: Categorized expense tracking and analysis
- **Budget Planning**: Budget creation and monitoring
- **Financial Goals**: Savings goals and investment tracking
- **Income Tracking**: Multiple income source management
- **Financial Analytics**: Spending patterns and financial health insights

### **Resource Management** (Knowledge Repository)
- **Resource Library**: Books, articles, videos, and reference materials
- **Categorization**: Organized by topics, types, and relevance
- **Rating System**: Rate and review resources
- **Progress Tracking**: Track reading/learning progress
- **Cross-Module Integration**: Link resources to projects, goals, and notes

### **PARA Method** (Organizational System)
- **Projects**: Outcome-focused work with deadlines
- **Areas**: Ongoing responsibilities to maintain
- **Resources**: Future reference materials
- **Archive**: Inactive items from other categories
- **Review System**: Regular review scheduling and tracking

### **Mood Tracking** (Wellness Intelligence)
- **Daily Mood Logging**: Track emotional states and patterns
- **Trigger Analysis**: Identify mood triggers and patterns
- **Wellness Integration**: Connect mood with activities and goals
- **Analytics Dashboard**: Mood trends and insights
- **Habit Correlation**: Link mood with daily habits and routines

### **Content Management** (Creation)
- **Content Pipeline**: From ideation to publication workflow
- **Rich Content Creation**: Advanced text editing with formatting
- **Publishing Workflow**: Draft, review, approval, and publishing stages
- **SEO Optimization**: Meta descriptions, keywords, and optimization
- **Analytics Tracking**: Content performance and engagement metrics

### **Calendar Integration** (Time Management)
- **Event Management**: Create and manage calendar events
- **Cross-Module Integration**: Link events to tasks, projects, and goals
- **Reminder System**: Event notifications and reminders
- **Time Blocking**: Schedule focused work sessions
- **Calendar Views**: Multiple calendar view options

### **Advanced Search** (Discovery Engine)
- **Global Search**: Search across all modules and content types
- **Semantic Search**: Intelligent content discovery
- **Filter System**: Advanced filtering by type, date, and properties
- **Search Analytics**: Track search patterns and popular content
- **Quick Access**: Fast navigation to frequently accessed items

### **Analytics & Insights** (Intelligence Layer)
- **Productivity Analytics**: Task completion rates and time tracking
- **Goal Progress**: Achievement rates and milestone tracking
- **Content Analytics**: Note creation, reading patterns, and engagement
- **Financial Insights**: Spending patterns and budget analysis
- **Wellness Tracking**: Mood patterns and health correlations

### **Security & Privacy** (Protection Layer)
- **Role-Based Access**: Admin, moderator, and user roles
- **Data Encryption**: Request/response encryption for sensitive data
- **Audit Trails**: Complete activity logging and monitoring
- **Permission System**: Granular sharing and access controls
- **Data Export**: Full data portability and backup options

### **System Features** (Infrastructure)
- **Notification System**: Email and in-app notifications
- **Activity Tracking**: Comprehensive user activity monitoring
- **Template System**: Reusable templates for all content types
- **Formula Engine**: Custom calculations and automated fields
- **Rich Editor**: Advanced content editing with collaboration features

## Module Integration Flows

### **Productivity Workflow**
Tasks → Projects → Goals → Analytics → Insights

### **Knowledge Management Flow**
Notes → Resources → PARA → Search → Cross-linking

### **Content Creation Pipeline**
Content → Notes → Resources → Publishing → Analytics

### **Personal Organization System**
PARA → Tasks → Projects → Goals → Review Cycles

### **Wellness & Life Tracking**
Mood → Goals → Habits → Analytics → Insights

### **Financial Management Flow**
Finance → Goals → Projects → Analytics → Planning

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v22.15.1 or higher)
- [Yarn](https://yarnpkg.com/) (v4.9.2 or higher) - Package manager
- [Docker](https://www.docker.com/) (for containerized development)
- [Docker Compose](https://docs.docker.com/compose/) (for multi-container setup)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB instance)

## 🛠Installation

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
PORT=5000
MONGO_URI=mongodb+srv://eaysin-dev:VZbdsfasdfSV5vY@cluster0.uzmru.mongodb.net/second-brain?retryWrites=true&w=majority&appName=second-brain-server
JWT_SECRET=your_jwt_secret_key_here
ENCRYPTION_SECRET=your_encryption_secret_key_here
NODE_ENV=development
BASE_URL=http://localhost:5000

EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM=your-email@gmail.com

# AWS S3 for file storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-min-32-chars
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-min-32-chars

# Optional: Token expiry times
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Google OAuth 2.0 Configuration
GOOGLE_CLIENT_ID=569626893139-dfasdfasdfdfsdfa.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-dfasdfasdfasdf
GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/auth/google/callback

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

CLIENT_URL="http://localhost:5173"

# Calendar Module Configuration
# Get these from Google Cloud Console > APIs & Services > Credentials
GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id_here
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:5000/auth/google/callback

# Microsoft Outlook Integration
# Get these from Azure App Registration
OUTLOOK_CLIENT_ID=your_outlook_client_id_here
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret_here
OUTLOOK_REDIRECT_URI=http://localhost:5000/auth/outlook/callback

# Apple iCloud Calendar (CalDAV)
# Users will provide their own credentials
APPLE_CALDAV_SERVER=https://caldav.icloud.com
APPLE_CALDAV_PORT=443

# Calendar Sync Settings
CALENDAR_SYNC_ENABLED=true
CALENDAR_SYNC_INTERVAL=15
CALENDAR_DEFAULT_TIMEZONE=UTC
CALENDAR_MAX_SYNC_DAYS_PAST=30
CALENDAR_MAX_SYNC_DAYS_FUTURE=365

# Calendar Sync Behavior
CALENDAR_CONFLICT_RESOLUTION=remote
CALENDAR_MAX_RETRY_ATTEMPTS=3
CALENDAR_RETRY_DELAY=300000
CALENDAR_BATCH_SIZE=100

# Time-Related Module Sync
TIME_MODULE_SYNC_ENABLED=true
TIME_MODULE_SYNC_INTERVAL=30
TASK_CALENDAR_SYNC=true
PROJECT_CALENDAR_SYNC=true
HABIT_CALENDAR_SYNC=true
GOAL_CALENDAR_SYNC=true

# Calendar Event Defaults
DEFAULT_EVENT_DURATION=60
DEFAULT_REMINDER_MINUTES=15
DEFAULT_CALENDAR_COLOR=#3B82F6

# External Calendar Rate Limits
GOOGLE_API_RATE_LIMIT=100
OUTLOOK_API_RATE_LIMIT=100
CALDAV_API_RATE_LIMIT=50

# Calendar Webhook Settings (for real-time sync)
GOOGLE_WEBHOOK_URL=https://yourdomain.com/webhooks/google-calendar
OUTLOOK_WEBHOOK_URL=https://yourdomain.com/webhooks/outlook-calendar
WEBHOOK_SECRET=your_webhook_secret_here

# Calendar Storage Settings
CALENDAR_CACHE_TTL=300
CALENDAR_MAX_EVENTS_PER_SYNC=1000
CALENDAR_CLEANUP_INTERVAL=86400000

# Calendar Feature Flags
ENABLE_RECURRING_EVENTS=true
ENABLE_ATTENDEE_MANAGEMENT=true
ENABLE_CALENDAR_SHARING=true
ENABLE_EXTERNAL_SYNC=true
ENABLE_WEBHOOK_SYNC=true

# Calendar Notification Settings
CALENDAR_NOTIFICATION_ENABLED=true
CALENDAR_EMAIL_REMINDERS=true
CALENDAR_PUSH_REMINDERS=true
CALENDAR_SMS_REMINDERS=false

# Development Settings
CALENDAR_DEBUG_MODE=false
CALENDAR_LOG_LEVEL=info
CALENDAR_MOCK_EXTERNAL_APIS=false

# Generate keys using: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_EMAIL=mailto:admin@yourdomain.com

# Firebase Cloud Messaging (FCM)
# Get these from Firebase Console > Project Settings > Service Accounts
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_firebase_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Application URLs
APP_URL=http://localhost:3000
# WebSocket Configuration
SOCKET_IO_PATH=/socket.io
SOCKET_IO_CORS_ORIGIN=http://localhost:3000

# Notification Settings
NOTIFICATION_QUIET_HOURS_START=22:00
NOTIFICATION_QUIET_HOURS_END=08:00
NOTIFICATION_MAX_RETRIES=3
NOTIFICATION_RETRY_DELAY=300000

# Task Reminder Settings
REMINDER_CHECK_INTERVAL=300000
REMINDER_MAX_PER_TASK=10
REMINDER_CLEANUP_INTERVAL=86400000
```

## Getting Started

### Local Development

1. **Start the development server:**
```bash
yarn dev
```

The server will start on `http://localhost:5000` with hot reloading enabled.

2. **Access the API documentation:**
   - Swagger UI: `http://localhost:5000/api/v1/docs`
   - Health check: `http://localhost:5000/health`

## 🛠️ Development Setup & Commands

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

### Path Aliases & TypeScript

The project uses TypeScript path aliases for cleaner imports:

```typescript
// Instead of relative imports
import { createAppError } from '../../../utils/error.utils';

// Use path aliases
import { createAppError } from '@/utils/error.utils';
```

**Available aliases:**
- `@/*` → `src/*`
- `@/config/*` → `src/config/*`
- `@/modules/*` → `src/modules/*`
- `@/middlewares/*` → `src/middlewares/*`
- `@/utils/*` → `src/utils/*`
- `@/types/*` → `src/types/*`
- `@/routes/*` → `src/routes/*`
- `@/database/*` → `src/modules/database/*`
- `@/auth/*` → `src/modules/auth/*`
- `@/users/*` → `src/modules/users/*`
- `@/email/*` → `src/modules/email/*`

### Git Hooks & Quality Gates

The project uses **Husky** for git hooks to ensure code quality:

**Pre-commit Hook:**
- Runs `lint-staged` to lint and format staged files
- Performs TypeScript type checking

**Pre-push Hook:**
- Runs full validation (`yarn validate`)
- Ensures all tests pass before pushing

### VS Code Integration

The project includes comprehensive VS Code configuration:

**Debugging Configurations:**
- Debug Server with TypeScript support
- Debug Jest tests
- Debug current test file
- Attach to running process

**Recommended Extensions:**
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Jest
- Docker
- GitLens

## Project Architecture

### Current Implementation (v1.0)
```
src/
├── app.ts                    # Express app configuration
├── index.ts                  # Server entry point
├── config/                   # Configuration files
│   ├── db/                   # Database configuration
│   ├── default-config/       # Application configuration
│   ├── encryption/           # Data encryption utilities
│   ├── google/               # Google OAuth configuration
│   ├── jwt/                  # JWT token configuration
│   ├── logger/               # Logging configuration
│   ├── mailer/               # Email service configuration
│   ├── rate-limiter/         # Rate limiting configuration
│   ├── storage/              # File storage configuration
│   └── swagger/              # API documentation configuration
├── middlewares/              # Express middlewares
│   ├── auth.ts               # Authentication middleware
│   ├── error-handler.ts      # Error handling middleware
│   ├── not-found.ts          # 404 handler
│   ├── oauth.middleware.ts   # OAuth middleware
│   └── validation.ts         # Request validation middleware
├── modules/                  # Feature modules
│   ├── auth/                 # Authentication & authorization
│   ├── email/                # Email services
│   ├── permissions/          # Permission management system
│   ├── users/                # User management & profiles
│   └── second-brain/         # Complete second brain system
│       ├── database/         # Core database system (Notion-like)
│       ├── tasks/            # Task management
│       ├── notes/            # Note-taking system
│       ├── projects/         # Project management
│       ├── goals/            # Goal tracking
│       ├── people/           # Contact management
│       ├── finance/          # Financial tracking
│       ├── resources/        # Resource management
│       ├── para/             # PARA method implementation
│       ├── mood/             # Mood tracking
│       ├── content/          # Content management
│       ├── calendar/         # Calendar integration
│       ├── search/           # Advanced search
│       ├── system/           # System features (notifications, analytics)
│       ├── templates/        # Template system
│       ├── formulas/         # Formula engine
│       ├── editor/           # Rich text editor
│       ├── habits/           # Habit tracking
│       └── journal/          # Journaling system
├── routes/                   # API routes
│   ├── index.ts              # Main route aggregator
│   └── swagger.route.ts      # Swagger documentation route
├── types/                    # TypeScript type definitions
└── utils/                    # Utility functions
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
├── integrations/             # Third-party service connections
```

## API Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Methods

- **Local Authentication**: Email/password registration and login
- **Google OAuth**: Sign in with Google account
- **Refresh Tokens**: Automatic token refresh for extended sessions

### Role-based Access Control

## Data Encryption

The server supports automatic request/response encryption for sensitive data:

- **Development**: Encryption is disabled by default (set `DEBUG_ENCRYPTION=true` to enable)
- **Production**: Encryption is enabled by default for security

### Making Encrypted Requests
```javascript
// Request body should contain encrypted data
{
  "data": "encrypted-data-string"
}

// Response will be
{
  "data": "encrypted-response-string"
}
```

## Logging

The application uses Winston for comprehensive logging:

- **Development**: Console output with colored formatting
- **Production**: File-based logging with daily rotation
  - Application logs: `logs/app-YYYY-MM-DD.log`
  - Error logs: `logs/error-YYYY-MM-DD.log`
  - Combined logs: `logs/combined-YYYY-MM-DD.log`

### Log Levels
- `error`: Error messages and exceptions
- `warn`: Warning messages
- `info`: General information
- `verbose`: Detailed information
- `debug`: Debug information (development only)

## Configuration

### Rate Limiting
- **Global**: 100 requests per 15 minutes per IP
- **Authentication**:
  - Login: 10 attempts per 15 minutes
  - Register: 5 attempts per 15 minutes
  - Password Reset: 3 attempts per 15 minutes
- **API**: 60 requests per minute per user
- **OAuth**: 10 requests per 15 minutes
- 
## Configuration

### Rate Limiting
- **Global**: 100 requests per 15 minutes per IP
- **Authentication**:
  - Login: 10 attempts per 15 minutes
  - Register: 5 attempts per 15 minutes
  - Password Reset: 3 attempts per 15 minutes
- **API**: 60 requests per minute per user
- **OAuth**: 10 requests per 15 minutes

### Second Brain Features
- **Property Types**: Text, Number, Select, Multi-select, Date, Checkbox, URL, Email, Phone, File, Relation
- **View Types**: Table, Board, List, Calendar, Gallery views with advanced filtering and sorting
- **Permissions**: Public/private databases with granular sharing controls
- **Workspaces**: Hierarchical organization with team collaboration
- **AI Features**: Auto-tagging, content suggestions, semantic search

### File Upload & Storage
- **Max file size**: 50MB per file (configurable)
- **Allowed types**: All common formats (images, documents, videos, audio)
- **Storage**: AWS S3 with CDN integration
- **Security**: File type validation, virus scanning, encryption at rest
- **Organization**: Automatic categorization and tagging

## Debugging

### Enable Debug Mode
```bash
# Enable encryption in development
DEBUG_ENCRYPTION=true yarn dev

# View detailed logs
yarn docker:logs

# Enable verbose logging
NODE_ENV=development yarn dev
```

### Common Issues

2. **JWT Token Issues**
   - Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
   - Check token expiration times
   - Ensure tokens are properly formatted

## Testing

```bash
# Run tests (when implemented)
yarn test

# Run tests in watch mode
yarn test:watch

# Generate coverage report
yarn test:coverage

# Run specific test suites
yarn test:unit
yarn test:integration
```
### Deployment

1. **Build the application:**
```bash
yarn build
```

2. **Start production server:**
```bash
yarn start
```

### Environment-Specific Configurations

#### Development
- Debug logging enabled
- CORS allows all origins
- Encryption optional
- Hot reloading enabled

#### Production
- Error logging only
- Strict CORS policy
- Encryption enforced
- Performance optimizations

## Contributing

We welcome contributions to make this personal intelligence platform even better! Whether you're fixing bugs, adding features, improving documentation, or sharing ideas, your contributions are valued.

### Quick Start for Contributors

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/second-brain-server.git
   cd second-brain-server
   ```

2. **Set up development environment**
   ```bash
   yarn install
   cp .env.example .env  # Configure your environment
   yarn dev
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make your changes and test**
   ```bash
   yarn lint        # Check code quality
   yarn typecheck   # Verify TypeScript
   yarn test        # Run tests (when available)
   ```

5. **Commit and push**
   ```bash
   git commit -m 'feat: add amazing feature'
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**

### 📋 Contribution Guidelines

#### **Code Standards**
- **TypeScript First**: All new code must be in TypeScript with proper type definitions
- **ESLint Compliance**: Follow ESLint rules (`yarn lint` and `yarn lint:fix`)
- **Prettier Formatting**: Format code with Prettier (`yarn format`)
- **Zod Validation**: Use Zod schemas for all input validation
- **JSDoc Documentation**: Add comprehensive JSDoc comments for functions and classes

#### **Commit Message Format**
We use [Conventional Commits](https://www.conventionalcommits.org/):
```
type(scope): description

feat(tasks): add task priority filtering
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
refactor(database): optimize query performance
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

#### **Pull Request Process**
1. **Clear Description**: Explain what your PR does and why
2. **Link Issues**: Reference any related issues
3. **Screenshots**: Include screenshots for UI changes
4. **Testing**: Describe how you tested your changes
5. **Breaking Changes**: Clearly document any breaking changes

### Areas for Contribution

#### **High Priority**
- **Testing**: Unit tests, integration tests, and test coverage
- **Mobile API**: Optimize endpoints for mobile applications
- **AI Integration**: OpenAI/Anthropic integration for smart features
- **Performance**: Query optimization and caching strategies
- **Security**: Security audits and vulnerability fixes

#### **Feature Development**
- **Real-time Collaboration**: Live editing and collaboration features
- **Advanced Analytics**: Predictive insights and pattern recognition
- **Integrations**: Third-party service integrations (Zapier, Slack, etc.)
- **Mobile Apps**: React Native or Flutter mobile applications
- **UI/UX**: Frontend interface improvements

#### **Documentation & Community**
- **Documentation**: API documentation, tutorials, and guides
- **Video Tutorials**: Setup guides and feature demonstrations
- **Translations**: Internationalization and localization
- **Blog Posts**: Technical articles and use case studies
- **Design Assets**: Icons, logos, and marketing materials

### 🛠️ Development Workflow

#### **Setting Up Development Environment**
1. **Prerequisites**: Node.js 22+, Yarn 4+, MongoDB Atlas account
2. **Environment**: Copy `.env.example` to `.env` and configure
3. **Dependencies**: Run `yarn install`
4. **Database**: Set up MongoDB connection
5. **Development**: Start with `yarn dev`

#### **Code Quality Checks**
```bash
# Run all quality checks
yarn validate

# Individual checks
yarn typecheck    # TypeScript compilation
yarn lint         # ESLint checks
yarn lint:fix     # Auto-fix ESLint issues
yarn format       # Prettier formatting
yarn test         # Run tests
```

#### **Git Hooks**
The project uses Husky for git hooks:
- **Pre-commit**: Runs lint-staged (linting and formatting)
- **Pre-push**: Runs full validation (typecheck + lint + test)

### Bug Reports

When reporting bugs, please include:
- **Environment**: OS, Node.js version, browser (if applicable)
- **Steps to Reproduce**: Clear steps to reproduce the issue
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: Visual evidence if applicable
- **Logs**: Relevant error messages or logs

### Feature Requests

For feature requests, please provide:
- **Problem Statement**: What problem does this solve?
- **Proposed Solution**: How should it work?
- **Use Cases**: Who would benefit and how?
- **Alternatives**: Other solutions you've considered
- **Implementation Ideas**: Technical approach (if you have ideas)

### Recognition

Contributors will be recognized in:
- **README Contributors Section**: Listed as project contributors
- **Release Notes**: Credited for specific contributions
- **GitHub Discussions**: Featured in community highlights
- **Social Media**: Shared on project social media accounts

### Getting Help

- **GitHub Discussions**: Ask questions and discuss ideas
- **GitHub Issues**: Report bugs and request features
- **Email**: [eaysin.dev@gmail.com](mailto:eaysin.dev@gmail.com) for direct contact
- **Documentation**: Check existing docs and API reference

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- **Email**: [eaysin.dev@gmail.com](mailto:eaysin.dev@gmail.com)
- **Issues**: [GitHub Issues](https://github.com/meet-eaysin/second-brain-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/meet-eaysin/second-brain-server/discussions)
- **Documentation**: [API Docs](http://localhost:5000/api/v1/docs) (when running locally)

## Version History

### v1.0.0 - Complete Personal Intelligence Platform
**Released**: Current - **PRODUCTION READY**

## Acknowledgments

### Core Technologies
- [Express.js](https://expressjs.com/) - Fast, unopinionated web framework
- [MongoDB](https://www.mongodb.com/) - Flexible, document-based database
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript development
- [Node.js](https://nodejs.org/) - JavaScript runtime environment

### Key Libraries & Tools
- [Zod](https://zod.dev/) - TypeScript-first schema validation
- [Winston](https://github.com/winstonjs/winston) - Versatile logging library
- [Swagger](https://swagger.io/) - API documentation and testing
- [JWT](https://jwt.io/) - Secure authentication tokens
- [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) - Password hashing
- [Mongoose](https://mongoosejs.com/) - MongoDB object modeling

### Infrastructure & DevOps
- [AWS S3](https://aws.amazon.com/s3/) - Scalable file storage
- [MongoDB Atlas](https://www.mongodb.com/atlas) - Cloud database service

---

## Connect & Contribute

### **Creator**
**Eaysin Arafat** - Full Stack Developer & AI Enthusiast
- **GitHub**: [@meet-eaysin](https://github.com/meet-eaysin)
- **Email**: [eaysin.dev@gmail.com](mailto:eaysin.dev@gmail.com)
- **LinkedIn**: Connect for professional discussions
- **Twitter**: Follow for project updates

### **Community**
- **Star this repo** if you find it useful
- **Report issues** to help improve the platform
- **Suggest features** for future development
- **Fork and contribute** to the codebase
- **Share with others** who might benefit

### **Support the Project**
- Star the repository
- Share with your network
- Write about your experience
- Report bugs and suggest improvements
- Contribute code and documentation

</div>

---

<div align="center">

**Built with ❤️ and ☕ by [Eaysin Arafat](https://github.com/meet-eaysin)**

*"Amplifying human intelligence through connected digital experiences"*

### 🌟 **Star this repo if you find it useful!** 🌟

**Happy Building! 🚀🧠✨**

</div>
