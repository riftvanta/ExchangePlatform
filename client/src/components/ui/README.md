# Joy UI Component Library

This directory contains a collection of Joy UI components for the USDT-JOD Exchange Platform. These components are designed to provide a consistent look and feel across the application while ensuring accessibility and usability.

## Component Overview

### Core Components

These components serve as drop-in replacements for existing elements:

- **Button** - A Joy UI Button component with standardized styling and variants
- **Alert** - A Joy UI Alert component for displaying messages and notifications
- **Typography** - A Joy UI Typography component for consistent text styling
- **FormControl** - A Joy UI FormControl component for form fields with labels and error states
- **Input** - A Joy UI Input component for text input fields
- **Table** - A Joy UI Table component for displaying tabular data
- **Tabs** - A Joy UI Tabs component for tabbed interfaces

### Specialized Components

These components provide additional functionality:

- **DatePicker** - A Joy UI styled date picker component using MUI X Date Pickers
- **FileUpload** - A drag-and-drop file upload component with validation
- **Notification** - A toast notification system that integrates with react-toastify
- **Modal** - A dialog component for displaying content in a modal

## Usage

Import components from the UI component library:

```tsx
import { 
  Button, 
  Alert, 
  Typography, 
  FormControl, 
  Input,
  DatePicker,
  FileUpload,
  Notification,
  NotificationContainer
} from '../components/ui';
```

Then use them in your components:

```tsx
// Basic button
<Button>Click me</Button>

// Date picker with min/max constraints
<DatePicker
  label="Select Date"
  value={selectedDate}
  onChange={handleDateChange}
  minDate={new Date(2023, 0, 1)}
  maxDate={new Date(2025, 11, 31)}
  helperText="Date range: Jan 1, 2023 - Dec 31, 2025"
/>

// File upload with validation
<FileUpload
  label="Upload Files"
  accept=".jpg,.jpeg,.png,.pdf"
  maxSize={5 * 1024 * 1024} // 5MB
  onFileSelect={handleFileSelect}
  buttonText="Select Files"
  dropzoneText="or drop files here"
  helperText="Max file size: 5MB"
/>

// Show notifications
Notification.success('Operation completed successfully', 'Success');
Notification.error('Something went wrong', 'Error');
```

## Migration Strategy

To migrate existing components to Joy UI:

1. **Analyze existing component** - Understand the current functionality and styling
2. **Create Joy UI version** - Implement a new component using Joy UI components
3. **Maintain compatibility** - Ensure the new component supports the same props and event handlers
4. **Test in isolation** - Verify the component works as expected in the example page
5. **Integrate gradually** - Replace old components with new ones in specific pages first
6. **Validate and refine** - Get feedback and refine the components as needed

## Theming

The Joy UI theme is defined in `client/src/theme.ts`. It includes:

- Color palette with primary, neutral, danger, success, and warning colors
- Typography styles for various text levels
- Component-specific styling overrides
- Dark mode support

## Accessibility Features

These components are designed with accessibility in mind:

- Proper ARIA attributes for interactive elements
- Keyboard navigation support
- High contrast color options
- Focus indicators
- Screen reader friendly markup

## Examples

Visit these pages to see the components in action:

- `/joy-ui-examples` - Shows basic Joy UI components
- `/specialized-components` - Demonstrates specialized components like DatePicker and FileUpload 