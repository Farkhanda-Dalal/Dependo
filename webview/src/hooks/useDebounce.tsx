import { useState, useEffect } from 'react';

/**
 * A custom hook that debounces a value.
 * @param value The value to debounce.
 * @param delay The delay in milliseconds (e.g., 300).
 * @returns The debounced value.
 */
export const useDebounce = <T,>(value: T, delay: number): T => {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes (or on unmount)
    // This cancels the previous timer and starts a new one
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // This effect re-runs only if the value or delay changes

  return debouncedValue;
};