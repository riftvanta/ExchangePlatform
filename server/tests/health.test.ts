import request from 'supertest';
import * as appModule from '../index'; // Import the Express app

// Get the Express app from the imported module
const app = (appModule as any).default || appModule;

describe('Health Endpoint Tests', () => {
  it('should return status 200 and health information', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('message', 'Server is running');
    expect(response.body).toHaveProperty('timestamp');
  });
}); 