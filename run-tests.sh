#!/bin/bash

# USDT-JOD Exchange Platform Test Runner
# This script runs comprehensive tests for both backend and frontend

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
  echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Function to check if a command succeeded
check_result() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $1 succeeded${NC}"
    return 0
  else
    echo -e "${RED}✗ $1 failed${NC}"
    return 1
  fi
}

# Start with a clean environment
print_header "PREPARING TEST ENVIRONMENT"

# Check if server is running and stop it if it is
SERVER_PID=$(lsof -t -i:5000 2>/dev/null)
if [ ! -z "$SERVER_PID" ]; then
  echo "Stopping existing server process (PID: $SERVER_PID)..."
  kill -9 $SERVER_PID
fi

# Check if any test databases are running
echo "Cleaning up test environment..."

# Run backend tests
print_header "RUNNING BACKEND TESTS"
echo "Running all backend tests..."
npm run test:backend
check_result "Backend tests"
BACKEND_RESULT=$?

# Run specific email verification tests
echo "Running email verification tests specifically..."
npx jest server/tests/email-verification.test.ts --config=jest.config.js --runInBand
check_result "Email verification tests"
EMAIL_RESULT=$?

# Install frontend dependencies if needed
print_header "CHECKING FRONTEND DEPENDENCIES"
cd client
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
  check_result "Frontend dependency installation"
fi

# Run frontend tests
print_header "RUNNING FRONTEND TESTS"
echo "Running all frontend tests..."
npm run test
check_result "Frontend tests"
FRONTEND_RESULT=$?

# Run specific component tests
echo "Running specific component tests..."
npx vitest run src/tests/ResendVerification.test.tsx
check_result "ResendVerification component test"
RESEND_RESULT=$?

# Start server in test mode for endpoint testing
print_header "TESTING API ENDPOINTS"
echo "Starting server in test mode..."
cd ..
npm run dev &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Test critical endpoints
echo "Testing authentication endpoints..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health
check_result "Health endpoint"
HEALTH_RESULT=$?

# Stop the server
echo "Stopping test server..."
kill -9 $SERVER_PID

# Print summary
print_header "TEST SUMMARY"
if [ $BACKEND_RESULT -eq 0 ] && [ $EMAIL_RESULT -eq 0 ] && [ $FRONTEND_RESULT -eq 0 ] && [ $RESEND_RESULT -eq 0 ] && [ $HEALTH_RESULT -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. Please check the output above for details.${NC}"
  exit 1
fi 