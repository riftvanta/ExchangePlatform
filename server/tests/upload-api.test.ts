import request from 'supertest';
import express from 'express';
import session from 'express-session';
import router from '../routes';
import { isAuthenticated } from '../middleware/auth';
import { generatePresignedUrl } from '../s3';

// Mock S3 functionality
jest.mock('../s3', () => ({
  generatePresignedUrl: jest.fn(),
}));

// Set up a test Express app
const app = express();
app.use(express.json());

// Configure session middleware for testing
app.use(
  session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

// Mount the router
app.use('/api', router);

// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
  isAuthenticated: jest.fn((req, res, next) => {
    if (req.session.userId) {
      return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
  }),
}));

describe('Upload API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/upload/presigned-url', () => {
    it('should return 401 if user is not authenticated', async () => {
      const response = await request(app)
        .get('/api/upload/presigned-url')
        .query({ fileName: 'test.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Authentication required');
    });

    it('should return a presigned URL if user is authenticated', async () => {
      // Mock authentication
      (isAuthenticated as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.session.userId = 'test-user-id';
        next();
      });

      // Mock S3 presigned URL generation
      const mockPresignedUrl = 'https://example.com/upload/test-file';
      const mockFileKey = 'uploads/test-user-id/test-file-key';
      (generatePresignedUrl as jest.Mock).mockResolvedValueOnce({
        presignedUrl: mockPresignedUrl,
        fileKey: mockFileKey,
      });

      const response = await request(app)
        .get('/api/upload/presigned-url')
        .query({ fileName: 'test.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('presignedUrl', mockPresignedUrl);
      expect(response.body).toHaveProperty('fileKey', mockFileKey);
      expect(generatePresignedUrl).toHaveBeenCalledWith(
        expect.stringContaining('test-user-id'),
        'image/jpeg'
      );
    });

    it('should return 400 if fileName is missing', async () => {
      // Mock authentication
      (isAuthenticated as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.session.userId = 'test-user-id';
        next();
      });

      const response = await request(app)
        .get('/api/upload/presigned-url')
        .query({ contentType: 'image/jpeg' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'fileName and contentType are required');
    });

    it('should return 400 if contentType is missing', async () => {
      // Mock authentication
      (isAuthenticated as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.session.userId = 'test-user-id';
        next();
      });

      const response = await request(app)
        .get('/api/upload/presigned-url')
        .query({ fileName: 'test.jpg' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'fileName and contentType are required');
    });

    it('should handle errors from S3 service', async () => {
      // Mock authentication
      (isAuthenticated as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.session.userId = 'test-user-id';
        next();
      });

      // Mock S3 error
      (generatePresignedUrl as jest.Mock).mockRejectedValueOnce(
        new Error('S3 service error')
      );

      const response = await request(app)
        .get('/api/upload/presigned-url')
        .query({ fileName: 'test.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to generate upload URL');
    });
  });
}); 