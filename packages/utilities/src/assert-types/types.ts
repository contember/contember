export type Predicate<T, U extends T> = (value: T) => value is U
export type UnionOfPredicateTypes<T> = T extends Array<(value: any) => value is infer U> ? U : never
