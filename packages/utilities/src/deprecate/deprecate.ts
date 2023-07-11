import { SemverString } from './types'

/**
 * Logs a deprecation warning if the assertion is `false`.
 * @internal
 *
 * @param removal - Version when the deprecated feature will be removed
 * @param assertion - Condition that must be true to avoid the deprecation warning
 * @param deprecated - Name of the deprecated feature
 * @param replacement - Name of the feature that replaces the deprecated feature
 *
 * @example
 * ```ts
 * const { visible } = props
 * deprecate(visible !== 'default', '1.3.0', '"default"', '"hidden"')
 * // Logs: Use of "default" is deprecated and might be removed in the next release. Use "hidden" instead.
 * ```
 */
export function deprecate(removal: SemverString, assertion: boolean, deprecated: string, replacement: string): void {
	if (assertion === false) {
		if (import.meta.env.DEV) {
			const shouldThrow = Boolean(import.meta.env.VITE_CONTEMBER_ADMIN_STRICT_DEPRECATIONS)

			if (shouldThrow) {
				throw new Error(`Support for ${deprecated} was planned to be removed in the ${removal} release. Replace it with ${replacement} instead.`)
			} else {
				console.warn(`Use of ${deprecated} is deprecated and might be removed in the next release. Use ${replacement} instead.`)
			}
		}
	}
}
