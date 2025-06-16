// Simple utilities for handling letters in words for Scrabble tiles

/**
 * Process a word or phrase to convert to Scrabble tiles
 * @param wordOrPhrase The word or phrase to process
 * @returns false if input contains invalid characters, or an array of uppercase letters 
 * with '_SPACE_' markers for spaces between words
 */
export function convertToTiles(wordOrPhrase: string): string[][] | false {
  // Only allow A-Z letters (case insensitive) and spaces
  if (!/^[a-zA-Z\s]*$/.test(wordOrPhrase)) {
    return false;
  }
  
  // Convert to a single array of letters and space markers
  const result: string[] = [];
  
  for (const char of wordOrPhrase) {
    if (char === ' ') {
      // Skip consecutive spaces
      if (result.length > 0 && result[result.length - 1] !== '_SPACE_') {
        result.push('_SPACE_');
      }
    } else {
      // Convert to uppercase letter
      result.push(char.toUpperCase());
    }
  }
  
  // Return empty result for empty input
  if (result.length === 0) return false;
  
  // Return the result as a 2D array for compatibility with existing code
  return [result];
}
