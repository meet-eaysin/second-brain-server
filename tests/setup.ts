import 'tsconfig-paths/register';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.ENCRYPTION_SECRET = 'test-encryption-secret-key-for-testing';

// Mock console methods in test environment
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test timeout
jest.setTimeout(30000);

// Mock external services
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}));

jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://test-bucket.s3.amazonaws.com/test-file.jpg'
      })
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    })
  }))
}));

// Global test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        createTestUser: () => any;
        createTestDatabase: () => any;
        cleanupTestData: () => Promise<void>;
      };
    }
  }
}

// Test utilities
global.testUtils = {
  createTestUser: () => ({
    _id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  
  createTestDatabase: () => ({
    _id: 'test-database-id',
    name: 'Test Database',
    description: 'A test database',
    userId: 'test-user-id',
    properties: [],
    views: [],
    isPublic: false,
    sharedWith: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'test-user-id',
    lastEditedBy: 'test-user-id'
  }),
  
  cleanupTestData: async () => {
    // Cleanup logic for test data
    // This will be implemented based on your database setup
  }
};

// Setup and teardown hooks
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(async () => {
  // Cleanup after each test
  await global.testUtils.cleanupTestData();
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in test environment
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in test environment
});
