import 'immutable';

declare module 'immutable' {
  /**
   * Augment Immutable.js Map to include the Symbol.toStringTag
   * so it satisfies the built-in Map interface requirements in TypeScript.
   */
  export interface Map<K, V> {
    readonly [Symbol.toStringTag]: string;
  }
}
