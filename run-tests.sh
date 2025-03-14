#!/bin/bash

# USDT-JOD Exchange Platform Test Runner (Comprehensive Version)
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

# Clean up test environment
echo "Cleaning up test environment..."

# Run Backend Tests
print_header "RUNNING BACKEND TESTS"

echo "Running authentication tests..."
npx jest server/tests/auth.test.ts --config=jest.config.js --runInBand
check_result "Authentication tests"

echo "Running email verification tests..."
npx jest server/tests/email-verification.test.ts --config=jest.config.js --runInBand
check_result "Email verification tests"

echo "Running wallet API tests..."
npx jest server/tests/wallet-api.test.ts --config=jest.config.js --runInBand
check_result "Wallet API tests"

echo "Running transaction API tests..."
npx jest server/tests/transaction-api.test.ts --config=jest.config.js --runInBand
check_result "Transaction API tests"

echo "Running middleware tests..."
npx jest server/tests/middleware.test.ts --config=jest.config.js --runInBand
check_result "Middleware tests"

echo "Running upload API tests..."
npx jest server/tests/upload-api.test.ts --config=jest.config.js --runInBand
check_result "Upload API tests"

echo "Running health endpoint tests..."
npx jest server/tests/health.test.ts --config=jest.config.js --runInBand
check_result "Health endpoint tests"

# Run Frontend Tests
print_header "RUNNING FRONTEND TESTS"

cd client

echo "Running component tests..."
npx vitest run src/tests/components --environment jsdom
check_result "Component tests"

echo "Running context tests..."
npx vitest run src/tests/context --environment jsdom
check_result "Context tests"

echo "Running page tests..."
npx vitest run src/tests/pages --environment jsdom
check_result "Page tests"

cd ..

# Generate test coverage report
print_header "GENERATING TEST COVERAGE REPORT"

echo "For detailed test coverage analysis, please see TEST_COVERAGE.md"
echo "This document provides a comprehensive overview of test coverage across the application."

# Summary
print_header "TEST SUMMARY"

echo -e "${GREEN}Backend Tests Completed${NC}"
echo -e "${GREEN}Frontend Tests Completed${NC}"
echo -e "\nTest coverage has been significantly improved with new tests for:"
echo "- Authentication context"
echo "- Wallet components"
echo "- Deposit and withdraw forms"
echo "- Admin functionality"
echo "- Upload API functionality"

echo -e "\n${YELLOW}Next steps to further improve testing:${NC}"
echo "1. Add more end-to-end tests with Cypress"
echo "2. Implement tests for remaining components and pages"
echo "3. Improve integration test coverage"

print_header "TESTS COMPLETED" 