/**
 * Returns new type where all the properties are required
 * and previously optional properties will accept undefined.
 */
export type NonOptional<T> = {
	[P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>> ? T[P] : (T[P] | undefined);
}
