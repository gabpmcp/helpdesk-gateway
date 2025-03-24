import { Map, List } from 'immutable';

// Definición de tipos para estructuras inmutables
export type ImmutableMap<K = string, T = any> = Map<K, T>;
export type ImmutableList<T = any> = List<T>;

// Asegurarse de que TypeScript reconozca correctamente los métodos de Immutable.js
declare module 'immutable' {
  interface Map<K, V> {
    setIn(keyPath: Iterable<any>, value: any): Map<K, V>;
    getIn<T>(keyPath: Iterable<any>, defaultValue?: T): T;
  }
}
