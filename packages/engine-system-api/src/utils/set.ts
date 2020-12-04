export type ImmutableSet<V> = Omit<Set<V>, 'delete' | 'clear' | 'add'>
export const emptyImmutableSet: ImmutableSet<never> = new Set()
