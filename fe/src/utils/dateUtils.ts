/**
 * Format date consistently for both server and client
 * to avoid hydration mismatches
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Use a consistent format that works the same on server and client
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${month}/${day}/${year}`;
};

/**
 * Format date range consistently
 */
export const formatDateRange = (startDate?: string, endDate?: string): string => {
  if (!startDate && !endDate) return '';
  if (!startDate) return formatDate(endDate!);
  if (!endDate) return formatDate(startDate);
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};
