/**
 * Resolves current or deprecated value. If both are defined, it will throw an error in development mode.
 *
 * @internal
 *
 * Errors are thrown only in development mode. In production mode, the deprecated value is returned.
 *
 * @param current - Current value that replaces deprecated value
 * @param deprecated - Deprecated value that will be removed in the next release
 * @param shouldThrow - Whether to throw an error if both current and deprecated are defined
 * @returns Deprecated value if it is defined, otherwise current value
 * @throws Error if both current and deprecated are defined
 *
 * @example
 * ```ts
 * const current = 'current'
 * const deprecated = 'deprecated'
 *
 * const value = currentOrDeprecated(current, deprecated)
 *
 * console.log(value) // 'deprecated'
 * ```
 *
 * @example
 * ```ts
 * const current = 'current'
 * const deprecated = undefined
 *
 * const value = currentOrDeprecated(current, deprecated)
 *
 * console.log(value) // 'current'
 * ```
 */
export function currentOrDeprecated<R, D>(current: R, deprecated: D, shouldThrow: boolean = false): R | D {
	if (deprecated !== undefined) {
		if (current !== undefined && import.meta.env.DEV) {
			console.error('Current value:', current)
			console.error('Deprecated value:', deprecated)

			if (shouldThrow) {
				throw new Error(`You are using deprecated together with current value which is mutually exclusive. Use only one of them.`)
			} else {
				console.error(`You are using deprecated together with current value which is mutually exclusive. Use only one of them.`)
			}
		}

		return deprecated
	} else {
		return current
	}
}
