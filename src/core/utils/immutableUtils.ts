import { Map, List, fromJS } from 'immutable';

/**
 * Utilidades para trabajar con estructuras inmutables
 * Estas funciones proporcionan una capa de abstracción sobre Immutable.js
 * para evitar problemas de tipado con TypeScript
 */

// Tipo para Map inmutable
export type ImmutableMap<T = any> = Map<string, T>;

// Tipo para List inmutable
export type ImmutableList<T = any> = List<T>;

// Crear un Map inmutable
export const createImmutableMap = <T = any>(data: Record<string, T> = {}): ImmutableMap<T> => 
  Map(data) as ImmutableMap<T>;

// Crear un List inmutable
export const createImmutableList = <T = any>(data: T[] = []): ImmutableList<T> => 
  List(data) as ImmutableList<T>;

// Obtener un valor de un Map inmutable con una ruta de acceso
export const getIn = <T>(map: ImmutableMap, path: string[], defaultValue?: T): T => {
  if (!map || !Map.isMap(map)) {
    return defaultValue as T;
  }
  return map.getIn(path, defaultValue);
};

// Establecer un valor en un Map inmutable con una ruta de acceso
export const setIn = <T>(map: ImmutableMap, path: string[], value: T): ImmutableMap => {
  if (!map || !Map.isMap(map)) {
    return createImmutableMap();
  }
  return map.setIn(path, value);
};

// Actualizar un valor en un Map inmutable con una función
export const updateIn = <T>(
  map: ImmutableMap, 
  path: string[], 
  updater: (value: T) => T
): ImmutableMap => {
  if (!map || !Map.isMap(map)) {
    return createImmutableMap();
  }
  return map.updateIn(path, updater);
};

// Convertir una estructura JS a inmutable
export const toImmutable = <T>(data: any): T => 
  fromJS(data) as T;

// Convertir una estructura inmutable a JS
export const toJS = <T>(immutableData: any): T => 
  immutableData && immutableData.toJS ? immutableData.toJS() : immutableData;

// Fusionar dos Maps inmutables
export const mergeDeep = (map1: ImmutableMap, map2: ImmutableMap): ImmutableMap => 
  map1.mergeDeep(map2);

// Añadir un elemento a un List inmutable
export const addToList = <T>(list: ImmutableList<T>, item: T): ImmutableList<T> => 
  list.push(item);

// Filtrar un List inmutable
export const filterList = <T>(list: ImmutableList<T>, predicate: (item: T) => boolean): ImmutableList<T> => 
  list.filter(predicate);

// Mapear un List inmutable
export const mapList = <T, U>(list: ImmutableList<T>, mapper: (item: T) => U): ImmutableList<U> => 
  list.map(mapper);

// Reducir un List inmutable
export const reduceList = <T, U>(
  list: ImmutableList<T>, 
  reducer: (acc: U, item: T) => U, 
  initial: U
): U => 
  list.reduce(reducer, initial);
