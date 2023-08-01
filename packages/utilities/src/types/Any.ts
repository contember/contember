export type KeyofBase = keyof any;
export type AnyArray<Type = any> = Array<Type> | ReadonlyArray<Type>;
export type AnyRecord<T = any> = Record<KeyofBase, T>;
