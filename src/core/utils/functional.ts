import { Map, List, fromJS } from 'immutable';

/**
 * Representa un resultado que puede ser éxito o error
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly type: 'success';
  readonly value: T;
}

export interface Failure<E> {
  readonly type: 'failure';
  readonly error: E;
}

/**
 * Crea un resultado exitoso
 */
export const success = <T>(value: T): Success<T> => ({
  type: 'success',
  value
});

/**
 * Crea un resultado fallido
 */
export const failure = <E>(error: E): Failure<E> => ({
  type: 'failure',
  error
});

/**
 * Normaliza un error para tener una estructura consistente
 */
export const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } as Error;
  }
  
  return new Error(
    typeof error === 'string' 
      ? error 
      : 'Unknown error occurred'
  );
};

/**
 * Convierte una promesa en un Result
 */
export const promiseToResult = async <T>(promise: Promise<T>): Promise<Result<T, Error>> => {
  try {
    const value = await promise;
    return success(value);
  } catch (error) {
    return failure(normalizeError(error));
  }
};

/**
 * Aplica una función a un Result si es exitoso, de lo contrario pasa el error
 */
export const map = <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
  if (result.type === 'success') {
    return success(fn(result.value));
  }
  return result;
};

/**
 * Encadena dos operaciones que devuelven Result
 */
export const chain = <T, U, E>(
  result: Result<T, E>, 
  fn: (value: T) => Result<U, E>
): Result<U, E> => {
  if (result.type === 'success') {
    return fn(result.value);
  }
  return result;
};

/**
 * Aplica un efecto secundario a un Result y devuelve el mismo Result
 */
export const tap = <T, E>(
  result: Result<T, E>, 
  fn: (value: T) => void
): Result<T, E> => {
  if (result.type === 'success') {
    fn(result.value);
  }
  return result;
};

/**
 * Convierte un Result a un valor, usando un valor por defecto si es un error
 */
export const getOrElse = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  if (result.type === 'success') {
    return result.value;
  }
  return defaultValue;
};

/**
 * Convierte un Result a un valor, lanzando el error si es un error
 */
export const getOrThrow = <T, E extends Error>(result: Result<T, E>): T => {
  if (result.type === 'success') {
    return result.value;
  }
  throw result.error;
};

/**
 * Compone funciones de izquierda a derecha
 */
export const pipe = <T>(...fns: Array<(arg: T) => T>) => 
  (value: T): T => fns.reduce((acc, fn) => fn(acc), value);

/**
 * Compone funciones de derecha a izquierda
 */
export const compose = <T>(...fns: Array<(arg: T) => T>) => 
  (value: T): T => fns.reduceRight((acc, fn) => fn(acc), value);

/**
 * Currifica una función de dos argumentos
 */
export const curry = <T, U, V>(fn: (a: T, b: U) => V) => 
  (a: T) => (b: U): V => fn(a, b);

/**
 * Currifica una función de tres argumentos
 */
export const curry3 = <T, U, V, W>(fn: (a: T, b: U, c: V) => W) => 
  (a: T) => (b: U) => (c: V): W => fn(a, b, c);
