// Mock modules for all tests
jest.mock('./shared/email');
jest.mock('./server/email', () => ({
  ...jest.requireActual('./server/email'),
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  createEmailVerificationToken: jest.fn().mockResolvedValue('test-token'),
  verifyEmail: jest.fn().mockImplementation(async (token) => {
    if (token === 'valid-token') {
      return { success: true, userId: 'test-user-id' };
    } else {
      throw new Error('Invalid or expired token');
    }
  }),
})); 