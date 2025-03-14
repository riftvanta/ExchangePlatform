# Joy UI Implementation Guide

This guide explains how we've implemented Joy UI in our USDT-JOD Exchange Platform to create a consistent, modern, and accessible user interface.

## Overview

We've integrated Joy UI, a design system from Material UI, to enhance our application's visual design and user experience. The implementation includes:

1. **Theme Configuration**: Custom theme with our brand colors and styling preferences
2. **Component Library**: Reusable UI components that maintain compatibility with existing code
3. **Example Page**: A showcase of all available components and their variants

## Theme Configuration

The theme is configured in `client/src/theme.ts` and includes:

- Custom color palette with primary, neutral, and semantic colors
- Typography scale with consistent font sizes and weights
- Component style overrides for consistent appearance
- Light and dark mode support

## Component Library

We've created a set of reusable components that wrap Joy UI components while maintaining compatibility with our existing class-based styling:

### Core Components

- **Button**: `client/src/components/ui/Button.tsx`
  - Supports variants: solid, soft, outlined, plain
  - Supports colors: primary, neutral, danger, success, warning
  - Supports sizes: sm, md, lg
  - Loading state support

- **Alert**: `client/src/components/ui/Alert.tsx`
  - Supports colors: primary, neutral, danger, success, warning
  - Supports variants: solid, soft, outlined, plain
  - Dismissible option

- **Typography**: `client/src/components/ui/Typography.tsx`
  - Consistent text styling across the application
  - Supports all heading levels and body text sizes

- **FormControl**: `client/src/components/ui/FormControl.tsx`
  - Label, helper text, and error state support
  - Compatible with all form input components

- **Input**: `client/src/components/ui/Input.tsx`
  - Text input with consistent styling
  - Error state support
  - Size variants

### Specialized Components

- **Modal**: `client/src/components/ui/Modal.tsx`
  - Customizable modal dialog with header, body, and footer sections
  - Supports optional title and footer
  - Size variants: sm, md, lg
  - Customizable color and variant

- **Tabs**: `client/src/components/ui/Tabs.tsx`
  - Tab interface with content panels
  - Controlled and uncontrolled states
  - Supports orientation, color, variant, and size options
  - Disabled tab support

- **Table**: `client/src/components/ui/Table.tsx`
  - Data table with customizable columns
  - TypeScript support with generics for type-safe column definitions
  - Features: sticky header, hover effects, striped rows, loading state
  - Custom cell renderers with full TypeScript support

### Direct Re-exports

We also re-export several Joy UI components that don't require customization:

- Card, CardContent, CardActions
- Chip
- Grid
- CircularProgress
- Checkbox
- Box
- Sheet
- Divider
- AspectRatio

## Usage

### Importing Components

Import components from our UI library instead of directly from Joy UI:

```tsx
// ✅ Do this
import { Button, Typography, FormControl } from '../components/ui';

// ❌ Not this
import Button from '@mui/joy/Button';
```

### Example Usage

```tsx
<FormControl 
  label="Username" 
  error={Boolean(errors.username)}
  errorText={errors.username}
  helperText="Enter your username"
>
  <Input
    value={username}
    onChange={handleChange}
    placeholder="johndoe"
  />
</FormControl>

<Button 
  onClick={handleSubmit}
  loading={isSubmitting}
  color="primary"
>
  Submit
</Button>
```

### Modal Example

```tsx
const [open, setOpen] = useState(false);

return (
  <>
    <Button onClick={() => setOpen(true)}>Open Modal</Button>
    
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Modal Title"
      footer={
        <>
          <Button variant="plain" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </>
      }
    >
      <Typography>This is the modal content.</Typography>
    </Modal>
  </>
);
```

### Tabs Example

```tsx
const tabItems = [
  {
    label: 'Tab 1',
    value: 'tab1',
    content: <div>Content for Tab 1</div>
  },
  {
    label: 'Tab 2',
    value: 'tab2',
    content: <div>Content for Tab 2</div>
  }
];

return <Tabs tabs={tabItems} defaultValue="tab1" />;
```

### Table Example

```tsx
interface User {
  id: number;
  name: string;
  email: string;
}

const columns: TableColumn<User>[] = [
  { header: 'ID', accessor: 'id' },
  { header: 'Name', accessor: 'name' },
  { header: 'Email', accessor: 'email' },
  { 
    header: 'Actions', 
    accessor: (user) => (
      <Button size="sm" onClick={() => handleEdit(user.id)}>Edit</Button>
    )
  }
];

const users: User[] = [...];

return <Table columns={columns} data={users} />;
```

## Example Page

Visit the Joy UI Examples page at `/joy-ui-examples` to see all available components and their variants. This page serves as a living style guide for the application.

## Migration Strategy

We're gradually migrating existing components to use Joy UI. The approach is:

1. Create Joy UI versions of components
2. Test them in isolation
3. Replace existing components one by one
4. Ensure backward compatibility during transition

## Best Practices

- Use the provided components from our UI library
- Follow the established patterns for component props
- Maintain accessibility by using appropriate ARIA attributes
- Use the theme's spacing and color tokens for consistency
- Prefer the `sx` prop for custom styling rather than inline styles

## Resources

- [Joy UI Documentation](https://mui.com/joy-ui/getting-started/)
- [Material UI System](https://mui.com/system/getting-started/)
- [Joy UI GitHub Repository](https://github.com/mui/material-ui/tree/master/packages/mui-joy) 