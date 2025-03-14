# Frontend Testing Strategy

This document outlines the frontend testing strategy for the USDT-JOD Exchange application.

## Overview

We use the following tools for frontend testing:

- **Vitest**: A Vite-native test runner that provides a fast and modern testing experience.
- **React Testing Library**: A testing utility for React that encourages good testing practices by focusing on how users interact with components.
- **Jest DOM**: Provides custom DOM element matchers for Jest/Vitest.
- **User Event**: Simulates user interactions for tests.

## Test Structure

Our frontend tests are organized into the following categories:

1. **Component Tests**: Test individual React components in isolation.
2. **Integration Tests**: Test interactions between multiple components.
3. **Utility Tests**: Test helper functions and hooks.

## Running Tests

To run all frontend tests:

```bash
cd client
npm test
```

To run tests in watch mode (for development):

```bash
cd client
npm run test:watch
```

To run tests with coverage:

```bash
cd client
npm run test:coverage
```

## Writing Tests

### Component Tests

Component tests should follow these guidelines:

1. Use React Testing Library to render components.
2. Focus on testing behavior, not implementation details.
3. Use queries that mimic how users interact with components (e.g., `getByRole`, `getByLabelText`).
4. Mock external dependencies using Vitest's mocking capabilities.

### Example Component Test

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import YourComponent from '../components/YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Your Component Title')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    render(<YourComponent />);
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: 'Click me' });
    
    await user.click(button);
    
    expect(screen.getByText('Button was clicked')).toBeInTheDocument();
  });
});
```

### Mocking Dependencies

For components that use hooks like `useMutation` or `useQuery`, you should mock these dependencies:

```tsx
// Mock the useQuery hook
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

// Inside your test
const { useQuery } = require('@tanstack/react-query');
useQuery.mockReturnValue({
  data: mockData,
  isLoading: false,
  isError: false,
});
```

## Testing Recipes

### Testing Forms

To test form submission:

1. Render the form component
2. Fill in form fields using `userEvent`
3. Submit the form
4. Assert that the correct function was called with the right arguments

### Testing API Interactions

For components that interact with APIs:

1. Mock the API calls using `vi.mock`
2. Provide test data for different states (loading, success, error)
3. Assert that the component renders correctly in each state

### Testing Authentication

For components that require authentication:

1. Mock the authentication context
2. Test both authenticated and unauthenticated states
3. Verify that protected routes redirect appropriately

## Test Coverage

We aim for at least 80% test coverage for the frontend codebase. This includes:

- Testing all critical user flows
- Testing edge cases and error handling
- Testing accessibility features

## Continuous Integration

All frontend tests are run as part of our CI pipeline using the `run-tests.sh` script in the project root. This ensures that tests pass before code is merged. 