export function setHasOneOf<T>(set: Set<T>, values: T[]): boolean {
  return values.some(value => set.has(value))
}
