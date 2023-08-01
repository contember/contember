import { SemverString } from './types'

/**
 * Logs a deprecation warning if the assertion is `false`.
 * @internal
 *
 * @param removal - Version when the deprecated feature will be removed
 * @param condition - Condition under which the deprecation warning will be logged
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
export function deprecate(removal: SemverString, condition: boolean, deprecated: string, replacement: string | null): void {
	if (condition === true) {
		if (import.meta.env.DEV) {
			const shouldThrow = Boolean(import.meta.env.VITE_CONTEMBER_ADMIN_STRICT_DEPRECATIONS)

			if (shouldThrow) {
				throw new Error(`Support for ${deprecated} was planned to be removed in the ${removal} release.${replacement ? ` Replace it with ${replacement} instead.` : 'Remove it.'}`)
			} else {
				console.warn(`Use of ${deprecated} is deprecated and might be removed in the next release.${replacement ? ` Use ${replacement} instead.` : 'There is no replacement.'}`)
			}
		}
	}
}
