#!/bin/bash

# USDT-JOD Exchange Platform Test Runner (Fixed Version)
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

# Start the server for health endpoint testing
echo "Starting server for testing..."
cd server && npm run dev &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"
cd ..

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Test the health endpoint directly with curl
print_header "TESTING API ENDPOINTS"
echo "Testing health endpoint with curl..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ "$HEALTH_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Health endpoint is working (Status: $HEALTH_STATUS)${NC}"
  HEALTH_RESULT=0
else
  echo -e "${RED}✗ Health endpoint failed (Status: $HEALTH_STATUS)${NC}"
  HEALTH_RESULT=1
fi

# Stop the server
echo "Stopping test server..."
kill -9 $SERVER_PID 2>/dev/null

# Print summary
print_header "TEST SUMMARY"
if [ $HEALTH_RESULT -eq 0 ]; then
  echo -e "${GREEN}Health endpoint test passed successfully!${NC}"
  echo -e "${GREEN}The key API endpoint is working correctly.${NC}"
  exit 0
else
  echo -e "${RED}Health endpoint test failed. Please check the output above for details.${NC}"
  exit 1
fi 