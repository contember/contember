export type RequiredDeepPlainObject<T extends RequiredDeepPlainObject<Record<string, unknown>> = RequiredDeepPlainObject<Record<string, unknown>>, K extends keyof T & string = keyof T & string> = {
	[P in K]-?: T[P] extends Record<string, unknown> ? RequiredDeepPlainObject<T[P]> : T[P]
}
