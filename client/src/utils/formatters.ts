/**
 * Truncates a string (typically an address) to show only the beginning and ending characters
 * with an ellipsis in between.
 * 
 * @param address The string to truncate
 * @param startChars Number of characters to show at the beginning
 * @param endChars Number of characters to show at the end
 * @returns Truncated string with ellipsis
 */
export const truncateAddress = (address: string, startChars = 8, endChars = 6): string => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Formats a number as currency with the specified currency symbol
 * 
 * @param amount Number to format
 * @param currency Currency code or symbol
 * @param decimals Number of decimal places to show
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency = 'USD', decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

/**
 * Formats a number with thousands separators
 * 
 * @param number Number to format
 * @param decimals Number of decimal places to show
 * @returns Formatted number string
 */
export const formatNumber = (number: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}; 