# Marketing APP

A comprehensive Customer Relationship Management (Marketing App) server built with Node.js, Express.js, TypeScript, and MongoDB.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Data Encryption**: Request/response encryption for enhanced security
- **Rate Limiting**: API rate limiting to prevent abuse
- **File Storage**: Support for local and AWS S3 file storage
- **Email & SMS**: Integrated email and SMS services
- **Logging**: Comprehensive logging with Winston
- **Cron Jobs**: Scheduled tasks for automated operations
- **Docker Support**: Containerized deployment for development and production

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v22.15.1 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Docker](https://www.docker.com/) (for containerized development)
- [Docker Compose](https://docs.docker.com/compose/) (for multi-container setup)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB instance)

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/ToufiqurRahmanTamkin/marketing-server.git
cd marketing-server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory and configure the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Encryption
ENCRYPTION_SECRET=your-encryption-secret-key
DEBUG_ENCRYPTION=true

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=your-s3-bucket-name
AWS_REGION=us-east-1

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

## 🚀 Getting Started

### Development with Docker (Recommended)

1. **Start the development environment:**
```bash
npm run docker:dev:build
```

2. **View logs:**
```bash
npm run docker:logs
```

3. **Stop the services:**
```bash
npm run docker:down
```

### Local Development

1. **Start the development server:**
```bash
npm run dev
```

The server will start on `http://localhost:5000` with hot reloading enabled.

## 🐳 Docker Commands

### Development Environment
```bash
# Build and start development containers
npm run docker:dev:build

# Start existing containers
npm run docker:dev

# View real-time logs
npm run docker:logs

# Stop all services
npm run docker:down
```

### Production Environment
```bash
# Build and start production containers
npm run docker:prod:build

# Start production containers
npm run docker:prod
```

### Additional Docker Commands
```bash
# View running containers
docker ps

# View container logs
docker-compose logs -f

# Access container shell
docker exec -it <container-name> /bin/sh

# Clean up unused Docker resources
docker system prune
```

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload

# Building
npm run build           # Build TypeScript to JavaScript
npm start              # Start production server (requires build)

# Code Quality
npm run format         # Format code with Prettier
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues automatically

# Docker Development
npm run docker:dev            # Start development containers
npm run docker:dev:build      # Build and start development containers
npm run docker:prod           # Start production containers
npm run docker:prod:build     # Build and start production containers
npm run docker:down           # Stop all containers
npm run docker:logs           # View container logs
```

## 🏗️ Project Structure

```
src/
├── app.ts                    # Express app configuration
├── server.ts                 # Server entry point
├── config/                   # Configuration files
│   ├── db/                   # Database configuration
│   ├── encryption/           # Data encryption utilities
│   ├── logger/               # Logging configuration
│   ├── mailer/               # Email service configuration
│   ├── rateLimiter/          # Rate limiting configuration
│   ├── sms/                  # SMS service configuration
│   ├── storage/              # File storage configuration
│   └── cron/                 # Scheduled tasks
├── middlewares/              # Express middlewares
│   ├── auth.ts               # Authentication middleware
│   └── errorHandler.ts       # Error handling middleware
├── modules/                  # Feature modules
│   ├── organizations/        # Organization management
│   ├── users/                # User management
│   ├── contacts/             # Contact management
│   ├── departments/          # Department management
│   └── concerns/             # Concern/ticket management
├── routes/                   # API routes
├── types/                    # TypeScript type definitions
└── utils/                    # Utility functions
```

### Module Structure
Each module follows this structure:
```
module/
├── controllers/              # Request handlers
├── models/                   # Database models
├── routes/                   # Route definitions
├── services/                 # Business logic
└── validators/               # Input validation
```

## 🔐 API Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Role-based Access Control

- `super-admin`: Full system access
- `org-admin`: Organization-level admin access
- `user`: Standard user access

## 🔒 Data Encryption

The server supports automatic request/response encryption:

- **Development**: Encryption is disabled by default (set `DEBUG_ENCRYPTION=true` to enable)
- **Production**: Encryption is enabled by default

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

## 📚 API Endpoints

### Health Check
```
GET /api/health
```

### Organizations
```
GET    /api/organizations           # Get all organizations
POST   /api/organizations           # Create organization (Admin)
GET    /api/organizations/:id       # Get organization by ID
PUT    /api/organizations/:id       # Update organization (Admin)
DELETE /api/organizations/:id       # Delete organization (Super Admin)
GET    /api/organizations/search    # Search organizations
```

## 📊 Logging

The application uses Winston for logging:

- **Development**: Console output only
- **Production**: File-based logging with rotation
  - Application logs: `src/logs/app-YYYY-MM-DD.log`
  - Error logs: `src/logs/error-YYYY-MM-DD.log`

## ⏰ Cron Jobs

Scheduled tasks are managed in [`src/config/cron/organizations.model.ts`](src/config/cron/index.ts):

- **Daily Cleanup**: Runs at midnight UTC
- **Weekly Reports**: Runs Monday at 9 AM UTC
- **Data Sync**: Runs every 30 minutes

Cron jobs only run in production mode by default.

## 🔧 Configuration

### Rate Limiting
- **Global**: 100 requests per 15 minutes
- **Authentication**: 10 requests per 15 minutes
- **API**: 60 requests per minute

### File Upload
- **Max file size**: 5MB
- **Allowed types**: Images, documents (PDF, DOC, XLS, PPT, TXT)
- **Storage**: Local filesystem or AWS S3

## 🐛 Debugging

### Enable Debug Mode
```bash
# Enable encryption in development
DEBUG_ENCRYPTION=true npm run dev

# View detailed logs
npm run docker:logs
```

### Common Issues

1. **MongoDB Connection Error**
   - Check your `MONGO_URI` in `.env`
   - Ensure MongoDB Atlas IP whitelist includes your IP

2. **JWT Token Issues**
   - Verify `JWT_SECRET` is set
   - Check token expiration

3. **File Upload Issues**
   - Check file size limits
   - Verify AWS S3 credentials

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🚀 Deployment

### Production Deployment with Docker

1. **Build production image:**
```bash
npm run docker:prod:build
```

2. **Configure production environment variables**

3. **Deploy to your hosting platform**

### Manual Deployment

1. **Build the application:**
```bash
npm run build
```

2. **Start production server:**
```bash
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- Use TypeScript for type safety
- Follow ESLint rules (`npm run lint`)
- Format code with Prettier (`npm run format`)
- Write meaningful commit messages
- Add JSDoc comments for functions

## 📄 License

This project is licensed under the ISC License.

## 👥 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team

## 🔄 Version History

- **v1.0.0**: Initial release with basic CRM functionality

---

**Happy Coding! 🚀**
