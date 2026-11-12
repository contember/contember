/** Strict type identity: `true` only when X and Y are mutually assignable with identical modifiers. */
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false

/** Compile-time assertion; the call only exists so the type argument is checked by `tsc`. */
export const assertType = <T extends true>(): void => {}
