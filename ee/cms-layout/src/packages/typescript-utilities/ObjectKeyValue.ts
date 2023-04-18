export type ObjectKeyValue<T, K extends keyof T> = T extends { [P in K]: T[P] } ? T[K] : never
