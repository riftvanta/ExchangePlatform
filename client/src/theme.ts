import { extendTheme } from '@mui/joy/styles';

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          // Customized to match brand colors
          50: '#f0f7ff',
          100: '#c2e0ff',
          200: '#99ccf3',
          300: '#66b2ff',
          400: '#3399ff',
          500: '#007fff', // Main primary color
          600: '#0072e5',
          700: '#0059b2',
          800: '#004c99',
          900: '#003a75',
        },
        // Add other color customizations as needed
        success: {
          500: '#4caf50', // Success color for approved status
        },
        danger: {
          500: '#ef5350', // Error color for rejected status
        },
        warning: {
          500: '#ff9800', // Warning color for pending status
        },
        neutral: {
          outlinedBorder: 'var(--joy-palette-neutral-200)',
          outlinedColor: 'var(--joy-palette-neutral-800)',
          outlinedHoverBg: 'var(--joy-palette-neutral-100)',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3', // Main primary color for dark mode
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
        },
        // Dark mode customizations
        success: {
          500: '#66bb6a', // Success color for dark mode
        },
        danger: {
          500: '#f44336', // Error color for dark mode
        },
        warning: {
          500: '#ffa726', // Warning color for dark mode
        },
      },
    },
  },
  fontFamily: {
    body: '"Inter", var(--joy-fontFamily-fallback)',
    display: '"Inter", var(--joy-fontFamily-fallback)',
  },
  components: {
    // Component customizations to match existing styles
    JoyButton: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: '6px',
          fontWeight: 'bold',
          // Match existing button styles
          ...(ownerState.variant === 'plain' && {
            // This matches the 'button text' class
          }),
        }),
      },
    },
    JoyAlert: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: '6px',
          // Match existing alert styles
          ...(ownerState.color === 'success' && {
            // This matches the 'alert success' class
          }),
          ...(ownerState.color === 'danger' && {
            // This matches the 'alert error' class
          }),
          ...(ownerState.color === 'warning' && {
            // This matches the 'alert warning' class
          }),
          ...(ownerState.color === 'primary' && {
            // This matches the 'alert info' class
          }),
        }),
      },
    },
    // Add customizations for other components as needed
  },
});

export default theme; 