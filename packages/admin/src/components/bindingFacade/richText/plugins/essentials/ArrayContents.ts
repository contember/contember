export type ArrayContents<A extends Array<unknown>> = A extends Array<infer C> ? C : never
