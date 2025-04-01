/**
 * Functional programming utilities for frontend
 * Provides tools for functional composition and immutability
 */

/**
 * Functional composition (left to right)
 * @param fns - Functions to compose
 * @returns Composed function
 */
export const pipe = <T>(...fns: Array<(arg: T) => T>) => 
  (value: T): T => fns.reduce((acc, fn) => fn(acc), value);

/**
 * Functional composition (right to left)
 * @param fns - Functions to compose
 * @returns Composed function
 */
export const compose = <T>(...fns: Array<(arg: T) => T>) => 
  (value: T): T => fns.reduceRight((acc, fn) => fn(acc), value);

/**
 * Creates a curried version of a function
 * @param fn - Function to curry
 * @returns Curried function
 */
export const curry = <T extends any[], R>(fn: (...args: T) => R) => {
  return function curried(...args: any[]): any {
    if (args.length >= fn.length) {
      return fn(...args as T);
    }
    return (...nextArgs: any[]) => curried(...args, ...nextArgs);
  };
};

/**
 * Safely accesses a nested property in an object
 * @param obj - The object to access
 * @param path - The path to the property (dot notation)
 * @param defaultValue - Default value if property doesn't exist
 * @returns The property value or default value
 */
export const safeGet = <T>(obj: any, path: string, defaultValue: T): T => {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === undefined || result === null) {
        return defaultValue;
      }
      result = result[key];
    }
    
    return (result === undefined || result === null) ? defaultValue : result;
  } catch {
    return defaultValue;
  }
};

/**
 * Memoizes a function to cache its results
 * @param fn - Function to memoize
 * @returns Memoized function
 */
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
};

/**
 * Creates a debounced function
 * @param fn - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(fn: T, wait: number): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      fn(...args);
    }, wait);
  };
};
