/**
 * Extracts initials from a full name (first letter of each word)
 * @param name - Full name string
 * @returns Uppercase initials (max 2 characters)
 */
export const getInitialsFromName = (name: string): string => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
};
