/**
 * Formats a number with commas as thousands separators
 */
export const formatNumber = (value: number): string => {
  if (value === undefined || value === null) return '0';
  
  // If the number has decimal places
  if (value % 1 !== 0) {
    // If the number is very small, show more decimal places
    if (Math.abs(value) < 0.01) {
      return value.toFixed(4);
    }
    // Otherwise just show 2 decimal places
    return value.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  }
  
  // For whole numbers
  return value.toLocaleString();
};

/**
 * Truncates an Ethereum address for display
 */
export const truncateAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Formats a timestamp for display
 */
export const formatDate = (timestamp: number): string => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};