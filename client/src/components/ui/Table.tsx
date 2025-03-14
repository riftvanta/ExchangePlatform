import React from 'react';
import JoyTable from '@mui/joy/Table';
import { getJoyProps } from '../../styles/compatibility';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';

// Define column type
export interface TableColumn<T> {
  header: React.ReactNode;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

// Define props interface
interface AppTableProps<T> {
  className?: string;
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  borderAxis?: 'both' | 'x' | 'y' | 'none';
  stripe?: 'odd' | 'even' | 'none';
  hoverRow?: boolean;
  stickyHeader?: boolean;
  loading?: boolean;
  caption?: React.ReactNode;
  keyExtractor?: (row: T, index: number) => string | number;
}

/**
 * A Joy UI based Table component for displaying tabular data
 * This component provides a standardized table with features like sorting and pagination
 */
export default function AppTable<T extends Record<string, any>>({
  className,
  columns,
  data,
  emptyMessage = 'No data available',
  size = 'md',
  borderAxis = 'both',
  stripe = 'odd',
  hoverRow = true,
  stickyHeader = false,
  loading = false,
  caption,
  keyExtractor,
  ...props
}: AppTableProps<T>) {
  // Get Joy UI props from the className
  const joyProps = getJoyProps(className);
  
  // Generate key for rows
  const getRowKey = (row: T, index: number): string | number => {
    if (keyExtractor) {
      return keyExtractor(row, index);
    }
    
    // Try to use 'id' if available
    if ('id' in row) {
      return row.id;
    }
    
    return index;
  };
  
  // Get cell content based on accessor
  const getCellContent = (row: T, column: TableColumn<T>): React.ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    
    return row[column.accessor as keyof T];
  };
  
  return (
    <Sheet
      variant="outlined"
      sx={{
        width: '100%',
        overflow: 'auto',
        borderRadius: 'sm',
      }}
    >
      <JoyTable
        borderAxis={borderAxis}
        stripe={stripe}
        hoverRow={hoverRow}
        stickyHeader={stickyHeader}
        size={size}
        {...joyProps}
        {...props}
      >
        {caption && (
          <caption>
            {typeof caption === 'string' ? (
              <Typography level="body-lg">{caption}</Typography>
            ) : (
              caption
            )}
          </caption>
        )}
        
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                style={{
                  width: column.width,
                  textAlign: column.align,
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '1rem' }}>
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '1rem' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={getRowKey(row, rowIndex)}>
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    style={{
                      textAlign: column.align,
                    }}
                  >
                    {getCellContent(row, column)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </JoyTable>
    </Sheet>
  );
} 