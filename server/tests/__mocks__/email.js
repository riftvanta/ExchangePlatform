// Mock sendgrid functions
module.exports = {
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendTransactionNotificationEmail: jest.fn().mockResolvedValue(true),
}; 