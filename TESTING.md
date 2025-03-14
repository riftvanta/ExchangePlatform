# USDT-JOD Exchange Platform Testing Guide

This document provides instructions on how to run tests for the USDT-JOD Exchange Platform.

## Prerequisites

- Node.js and npm installed
- PostgreSQL database running

## Quick Start

To run all tests automatically, use the provided test script:

```bash
./run-tests.sh
```

This script will:
1. Prepare the test environment
2. Run all backend tests
3. Run all frontend tests
4. Test critical API endpoints
5. Provide a summary of results

## Backend Testing

Backend tests use Jest and supertest to test API endpoints and business logic.

### Running Backend Tests

```bash
npm run test:backend
```

### Running Specific Backend Tests

```bash
npx jest server/tests/auth.test.ts --config=jest.config.js
npx jest server/tests/email-verification.test.ts --config=jest.config.js
```

### Backend Test Coverage

- **Authentication**: User registration, login, session management
- **Email Verification**: Email verification token creation and verification
- **Password Reset**: Password reset flow
- **Wallet Operations**: Creating wallets, checking balances
- **Transactions**: Deposits and withdrawals
- **Admin Functions**: Admin-only operations

## Frontend Testing

Frontend tests use Vitest and React Testing Library to test React components and integration.

### Running Frontend Tests

```bash
cd client
npm run test
```

### Running Tests with Coverage

```bash
cd client
npm run test:coverage
```

### Frontend Test Coverage

- **Component Tests**: Individual component rendering and functionality
- **Integration Tests**: Component interactions and API calls
- **Context Tests**: Global state management

## End-to-End Testing

E2E tests use Cypress to test complete user flows.

### Running E2E Tests

```bash
npm run test:e2e       # Opens Cypress UI
npm run test:e2e:headless  # Runs tests in headless mode
```

### E2E Test Coverage

- **User Registration Flow**: Complete signup, email verification
- **Login Flow**: Authentication and redirection
- **Dashboard Operations**: Wallet creation, deposits, withdrawals
- **Admin Operations**: Managing user transactions

## API Endpoint Testing

You can test individual API endpoints using curl:

```bash
# Health check
curl http://localhost:5000/api/health

# Login (replace with your credentials)
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

## Troubleshooting

If you encounter issues running tests:

1. Check if the server is already running: `lsof -i:5000`
2. Ensure the database is accessible
3. Verify environment variables are set correctly
4. Check log files for specific errors

## Adding New Tests

### Backend

Add new test files in the `server/tests` directory following the existing patterns.

### Frontend

Add new test files alongside the components or in `client/src/tests` with the `.test.tsx` extension.

### End-to-End

Add new test files in the `cypress/e2e` directory with the `.cy.ts` extension. 